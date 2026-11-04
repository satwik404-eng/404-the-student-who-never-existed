import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { missions } from "../shared/content";
describe("public module boundary", () => {
  it("keeps paid hints out of the public data objects and client imports", () => {
    expect(missions.every((m) => !("hints" in m))).toBe(true);
    for (const file of [
      "src/App.tsx",
      "src/Pages.tsx",
      "src/Investigation.tsx",
      "src/Multiplayer.tsx",
      "shared/content.ts",
    ])
      expect(readFileSync(file, "utf8")).not.toContain("_shared/hints");
  });
});
