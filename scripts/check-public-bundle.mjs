import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { paidHints } from "../supabase/functions/_shared/hints.ts";
const root = resolve("dist/assets");
const assets = readdirSync(root)
  .filter((f) => f.endsWith(".js"))
  .map((f) => readFileSync(resolve(root, f), "utf8"))
  .join("\n");
const forbidden = [
  ...Object.values(paidHints).flat(),
  "Aarya hid a note somewhere the rendered page cannot show.",
  "Only deleted records can contradict a deletion timestamp.",
  "Each fragment carries a number. Arrange the three recovered words by those numbers.",
  "SUPABASE_SERVICE_ROLE_KEY",
  "fragment[01]: WE",
  "STAY WITH ME",
];
for (const text of forbidden)
  if (assets.includes(text))
    throw new Error(`Server-only content found in public bundle: ${text}`);
if (readdirSync(root).some((f) => f.endsWith(".map")))
  throw new Error("Public source maps found.");
console.log(
  "Public bundle boundary passed: no checked paid hints, terminal solutions, co-op solution, service-role references, or source maps.",
);
