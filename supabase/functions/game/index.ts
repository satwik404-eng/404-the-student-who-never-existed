import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import {
  dispatch,
  GameError,
  type Store,
  type Document,
} from "../_shared/engine.ts";
import type { Ranking } from "../_shared/types.ts";
import { allowedOrigin, readGameRequest } from "../_shared/request.ts";
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
class PostgresStore implements Store {
  reads = new Map<string, Document | null>();
  writes = new Map<
    string,
    {
      key: string;
      value: unknown;
      owner: string | null;
      public: boolean;
      deleted?: boolean;
    }
  >();
  async get(key: string) {
    if (this.reads.has(key)) return this.reads.get(key)!;
    const { data, error } = await admin
      .from("game_documents")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    const doc = data
      ? {
          key: data.key,
          value: data.value,
          version: data.version,
          owner: data.owner_id,
          public: data.is_public,
        }
      : null;
    this.reads.set(key, doc);
    return doc;
  }
  put(key: string, value: unknown, owner: string | null, isPublic = false) {
    this.writes.set(key, { key, value, owner, public: isPublic });
  }
  remove(key: string) {
    this.writes.set(key, {
      key,
      value: {},
      owner: null,
      public: false,
      deleted: true,
    });
  }
  async listPublic() {
    const { data, error } = await admin.rpc("read_public_rankings");
    if (error) throw error;
    return (data || []) as Ranking[];
  }
  async listPlayerSaves(uid: string) {
    // UID comes from Auth.getUser, never from request fields. Capture versions
    // so concurrent first logins import an old browser save only once via CAS.
    const { data, error } = await admin
      .from("game_documents")
      .select("*")
      .eq("owner_id", uid)
      .like("key", "player:%")
      .limit(32);
    if (error) throw error;
    return (data || []).map((row) => {
      const doc = {
        key: row.key,
        value: row.value,
        version: row.version,
        owner: row.owner_id,
        public: row.is_public,
      };
      this.reads.set(doc.key, doc);
      return doc;
    });
  }
  async commit() {
    for (const key of this.writes.keys())
      if (!this.reads.has(key)) await this.get(key);
    if (!this.writes.size) return true;
    const expected = Object.fromEntries(
      [...this.reads].map(([key, v]) => [key, v?.version || 0]),
    );
    const { data, error } = await admin.rpc("commit_game_documents", {
      expected,
      writes: [...this.writes.values()],
    });
    if (error) throw error;
    return data === true;
  }
}
Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": allowedOrigin(
      req.headers.get("Origin"),
      Deno.env.get("ALLOWED_ORIGIN"),
    ),
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method !== "POST") throw new GameError("POST required.", 405);
    const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
    if (!token) throw new GameError("Authentication required.", 401);
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);
    if (authError || !user)
      throw new GameError("Authentication required.", 401);
    if (
      user.is_anonymous ||
      !user.identities?.some(
        (i) => i.provider === "google" || i.provider === "apple",
      )
    )
      throw new GameError("Sign in with Google or Apple to continue.", 403);
    const { data: allowed, error: budgetError } = await admin.rpc(
      "consume_game_budget",
      { actor: user.id },
    );
    if (budgetError) throw budgetError;
    if (!allowed) throw new GameError("Too many requests. Wait a minute.", 429);
    if (Number(req.headers.get("content-length") || 0) > 4096)
      throw new GameError("Request too large.", 413);
    const input = await readGameRequest(req);
    if (
      !input.browserId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        input.browserId,
      )
    )
      throw new GameError("A browser investigation identifier is required.");
    for (let attempt = 0; attempt < 5; attempt++) {
      const store = new PostgresStore();
      const result = await dispatch(store, user.id, input);
      if (await store.commit())
        return new Response(JSON.stringify(result), { headers: cors });
    }
    throw new GameError("The archive is busy. Please try again.", 409);
  } catch (e) {
    const error =
      e instanceof GameError
        ? e
        : new GameError("The archive connection failed.", 500);
    if (error.status === 500) console.error(e);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: cors,
    });
  }
});
