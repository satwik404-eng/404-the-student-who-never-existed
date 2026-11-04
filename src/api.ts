import { supabase, supportedIdentity, browserSlot } from "./client";
import type { GameRequest, GameResponse } from "../shared/types";
export { supabase } from "./client";
let localSession: Promise<void> | null = null;
async function authenticate() {
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error)
      throw new Error(
        "Your sign-in session could not be read. Please sign in again.",
      );
    if (!supportedIdentity(data.session?.user || null))
      throw new Error("Sign in with Google or Apple to continue.");
    return;
  }
  // Serialize the very first cookie issuance. StrictMode and room joining can
  // otherwise race to create two different local development identities.
  if (!localSession)
    localSession = fetch("/api/game", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "state", browserId: browserSlot() }),
      signal: AbortSignal.timeout(15000),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Local archive unavailable.");
      })
      .catch((e) => {
        localSession = null;
        throw e;
      });
  await localSession;
}
export async function request(input: GameRequest): Promise<GameResponse> {
  await authenticate();
  input = { ...input, browserId: browserSlot() };
  if (supabase) {
    const { data, error } = await supabase.functions.invoke("game", {
      body: input,
    });
    if (error) {
      let message = "The archive request failed. Please try again.";
      try {
        const json = await error.context?.json();
        message = json?.error || message;
      } catch {
        /* Unexpected errors stay generic. */
      }
      throw new Error(message);
    }
    return data as GameResponse;
  }
  const response = await fetch("/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Archive connection failed.");
  return data;
}
export const backendName = supabase
  ? "SUPABASE / CONNECTED"
  : "LOCAL ARCHIVE / SQLITE";
