import { GameError } from "./engine.ts";
import type { GameRequest } from "./types.ts";

export async function readGameRequest(req: Request): Promise<GameRequest> {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new GameError("JSON required.", 415);
  if (Number(req.headers.get("content-length") || 0) > 4096)
    throw new GameError("Request too large.", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new GameError("Invalid JSON.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        throw new GameError("Request too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let input: unknown;
  try {
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new GameError("Invalid JSON.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new GameError("Invalid request.");
  return input as GameRequest;
}

export function allowedOrigin(origin: string | null, extra?: string) {
  const canonical = "https://project-404-archive.vercel.app";
  const origins = [canonical, "http://127.0.0.1:5173", "http://localhost:5173"];
  if (extra) {
    try {
      const parsed = new URL(extra);
      if (parsed.protocol === "https:" && parsed.origin === extra)
        origins.push(extra);
    } catch {
      /* Invalid configuration grants no origin. */
    }
  }
  return origin && origins.includes(origin) ? origin : canonical;
}
