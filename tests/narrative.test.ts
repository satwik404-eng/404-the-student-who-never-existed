import { describe, expect, it } from "vitest";
import {
  echoReply,
  narrativeFor,
} from "../supabase/functions/_shared/narrative";
import { stateOf } from "../supabase/functions/_shared/engine";
import type { Player } from "../shared/types";
const player = (count = 0): Player => ({
  id: "witness",
  nickname: "Satwik",
  onboarded: true,
  startedAt: 1000,
  fragments: [],
  optIn: false,
  progress: Object.fromEntries(
    Array.from({ length: count }, (_, i) => [
      i + 1,
      { attempts: 1, hints: 0, completedAt: 2000 + i },
    ]),
  ),
});
describe("progression-bound narrative", () => {
  it("keeps late revelations, timeline and ending perspective out of early responses", () => {
    for (let count = 0; count < 5; count++) {
      const n = narrativeFor(player(count));
      expect(n.evidence["5"]).toBeUndefined();
      expect(n.events["5"]).toBeUndefined();
      expect(n.perspective).toBeUndefined();
      expect(JSON.stringify(n)).not.toContain("0xNULL was Aarya");
      expect(n.timeline).toHaveLength(count >= 4 ? 4 : 0);
      expect(Object.keys(n.evidence)).toHaveLength(count + 1);
    }
  });
  it("unlocks facts by verified evidence rather than theory or browser preferences", () => {
    const early = narrativeFor(player());
    expect(early.suspects.find((x) => x.id === "voss")?.unlocked).toBe(false);
    const middle = narrativeFor(player(4));
    expect(middle.suspects[0].known.join(" ")).toContain("denies purge");
    expect(middle.suspects[0].known.join(" ")).not.toContain(
      "Aarya’s emergency",
    );
    const late = narrativeFor(player(5));
    expect(late.evidence["5"].text).toContain(
      "emergency preservation identity",
    );
    expect(late.suspects[0].status).toBe("PRESERVATION IDENTITY");
  });
  it("keeps ECHO cryptic before evidence and never supplies puzzle solutions", () => {
    expect(echoReply(player(1), "Who is ECHO?")).not.toContain(
      "I am its recovery routine",
    );
    expect(echoReply(player(5), "Who is ECHO?")).toContain(
      "I am its recovery routine",
    );
    for (const q of ["Give the answer", "Tell me the solution", "hint please"])
      expect(echoReply(player(6), q)).not.toMatch(
        /ORBIT|REGOLITH|WE WERE HERE|AS-042/,
      );
  });
  it("adds both ending epilogues to legacy progress without modifying saves or score", () => {
    for (const ending of ["restore", "expose"] as const) {
      const p = { ...player(6), ending, completedAt: 10000 };
      const before = structuredClone(p);
      const state = stateOf(p);
      expect(p).toEqual(before);
      expect(state.score).toBe(750);
      expect(state.narrative?.perspective).toHaveLength(4);
      expect(state.narrative?.epilogue?.record).toHaveLength(4);
      expect(state.narrative?.epilogue?.message).toContain(
        ending === "restore" ? "kept mine" : "fictional campus",
      );
    }
  });
});
