import { describe, expect, it } from "vitest";
import {
  allowedOrigin,
  readGameRequest,
} from "../supabase/functions/_shared/request";
const req = (body: string, type = "application/json") =>
  new Request("https://game.test", {
    method: "POST",
    headers: { "Content-Type": type },
    body,
  });
describe("bounded API request parsing", () => {
  it("accepts a bounded JSON object", async () => {
    expect(await readGameRequest(req('{"op":"state"}'))).toEqual({
      op: "state",
    });
  });
  it("rejects null, arrays, malformed JSON and wrong content types", async () => {
    for (const body of ["null", "[]", "{"])
      await expect(readGameRequest(req(body))).rejects.toThrow();
    await expect(readGameRequest(req("{}", "text/plain"))).rejects.toThrow(
      "JSON required",
    );
  });
  it("caps streaming bodies by bytes without trusting Content-Length", async () => {
    await expect(
      readGameRequest(
        req(JSON.stringify({ op: "state", text: "x".repeat(5000) })),
      ),
    ).rejects.toThrow("too large");
    await expect(
      readGameRequest(req(JSON.stringify({ text: "界".repeat(2000) }))),
    ).rejects.toThrow("too large");
  });
});

it("uses exact allowed CORS origins and never echoes wildcard or an attacker origin", () => {
  const canonical = "https://project-404-archive.vercel.app";
  expect(allowedOrigin("http://127.0.0.1:5173")).toBe("http://127.0.0.1:5173");
  for (const origin of [
    null,
    "null",
    "*",
    "https://evil.example",
    "https://project-404-archive.vercel.app.evil.example",
  ])
    expect(allowedOrigin(origin, "*")).toBe(canonical);
  expect(
    allowedOrigin("https://preview.example", "https://preview.example"),
  ).toBe("https://preview.example");
});
