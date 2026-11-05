import { publicRankingQuery } from "./rankings.ts";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import {
  dispatch,
  GameError,
  type Store,
  type Document,
} from "../supabase/functions/_shared/engine.ts";
import type { Ranking, GameRequest } from "../shared/types.ts";
const dataDir = process.env.DATA_DIR || ".data";
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(resolve(dataDir, "archive.sqlite"));
db.exec(
  "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS documents(key TEXT PRIMARY KEY,value TEXT NOT NULL,owner TEXT,public INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 1); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,uid TEXT NOT NULL,expires INTEGER NOT NULL);",
);
const rate = new Map<string, { at: number; count: number }>();
function limit(key: string, max: number) {
  const now = Date.now();
  const value = rate.get(key);
  if (value && now - value.at < 60000) {
    if (++value.count > max)
      throw new GameError(
        "Too many requests. Wait a minute before trying again.",
        429,
      );
  } else rate.set(key, { at: now, count: 1 });
  if (rate.size > 10000)
    for (const [k, v] of rate) if (now - v.at > 60000) rate.delete(k);
}
class SQLiteStore implements Store {
  writes = new Map<
    string,
    { value: unknown; owner: string | null; public: boolean } | null
  >();
  async get(key: string) {
    const r = db.prepare("SELECT * FROM documents WHERE key=?").get(key) as
      | {
          key: string;
          value: string;
          owner: string;
          public: number;
          version: number;
        }
      | undefined;
    return r
      ? ({ ...r, value: JSON.parse(r.value), public: !!r.public } as Document)
      : null;
  }
  put(key: string, value: unknown, owner: string | null, isPublic = false) {
    this.writes.set(key, { value, owner, public: isPublic });
  }
  remove(key: string) {
    this.writes.set(key, null);
  }
  async listPublic() {
    return (db.prepare(publicRankingQuery).all() as { value: string }[]).map(
      (x) => JSON.parse(x.value) as Ranking,
    );
  }
  async listPlayerSaves(uid: string) {
    const rows = db
      .prepare(
        "SELECT * FROM documents WHERE owner=? AND key LIKE 'player:%' LIMIT 32",
      )
      .all(uid) as {
      key: string;
      value: string;
      owner: string;
      public: number;
      version: number;
    }[];
    return rows.map(
      (r) =>
        ({ ...r, value: JSON.parse(r.value), public: !!r.public }) as Document,
    );
  }
  commit() {
    for (const [key, v] of this.writes) {
      if (v && key === `ranking:${v.owner}`)
        db.prepare(
          "UPDATE documents SET public=0,version=version+1 WHERE owner=? AND key LIKE ?",
        ).run(v.owner, `${key}:%`);

      if (!v) {
        db.prepare("DELETE FROM documents WHERE key=?").run(key);
        continue;
      }
      db.prepare(
        "INSERT INTO documents(key,value,owner,public) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,owner=excluded.owner,public=excluded.public,version=documents.version+1",
      ).run(key, JSON.stringify(v.value), v.owner, +v.public);
    }
  }
}
let queue = Promise.resolve();
const server = createServer(async (req, res) => {
  const port = Number(process.env.PORT || 3001);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true,"backend":"sqlite"}');
      return;
    }
    if (req.url === "/api/game") {
      if (req.method !== "POST") throw new GameError("POST required.", 405);
      const origin = req.headers.origin;
      const allowed = [
        `http://127.0.0.1:5173`,
        `http://localhost:5173`,
        `http://127.0.0.1:${port}`,
        `http://localhost:${port}`,
      ];
      if (origin && !allowed.includes(origin))
        throw new GameError("Origin denied.", 403);
      if (!req.headers["content-type"]?.startsWith("application/json"))
        throw new GameError("JSON required.", 415);
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) throw new GameError("Request too large.", 413);
      }
      let input: GameRequest;
      try {
        input = JSON.parse(body);
      } catch {
        throw new GameError("Invalid JSON.");
      }
      const cookie = req.headers.cookie?.match(
        /(?:^|; )archive_session=([a-f0-9]{64})(?:;|$)/,
      )?.[1];
      const token = cookie
        ? createHash("sha256").update(cookie).digest("hex")
        : "";
      let session = db
        .prepare("SELECT uid FROM sessions WHERE token=? AND expires>?")
        .get(token, Date.now()) as { uid: string } | undefined;
      if (!session) {
        limit(`new:${req.socket.remoteAddress}`, 30);
        const raw = randomBytes(32).toString("hex");
        session = { uid: crypto.randomUUID() };
        db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
          createHash("sha256").update(raw).digest("hex"),
          session.uid,
          Date.now() + 30 * 86400000,
        );
        res.setHeader(
          "Set-Cookie",
          `archive_session=${raw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`,
        );
      }
      limit(session.uid, 240);
      const uid = session.uid;
      const task = queue.then(async () => {
        db.exec("BEGIN IMMEDIATE");
        try {
          const store = new SQLiteStore();
          const result = await dispatch(store, uid, input);
          store.commit();
          db.exec("COMMIT");
          return result;
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      });
      queue = task.then(
        () => undefined,
        () => undefined,
      );
      const result = await task;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }
    if (req.method !== "GET") throw new GameError("Not found.", 404);
    const base = resolve("dist");
    let path = resolve(
      base,
      "." + decodeURIComponent((req.url || "/").split("?")[0]),
    );
    if (path !== base && !path.startsWith(base + sep))
      throw new GameError("Not found.", 404);
    if (!existsSync(path) || !extname(path)) path = resolve(base, "index.html");
    if (!existsSync(path))
      throw new GameError("Run npm run dev or build the frontend first.", 404);
    const mime: Record<string, string> = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
    };
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
    });
    res.end(readFileSync(path));
  } catch (e) {
    const error =
      e instanceof GameError
        ? e
        : new GameError("The archive connection failed.", 500);
    if (error.status === 500) console.error(e);
    res.writeHead(error.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
});
server.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
  console.log(`Archive server: http://127.0.0.1:${process.env.PORT || 3001}`),
);
