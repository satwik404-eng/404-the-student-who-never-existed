import { beforeEach, describe, expect, it } from "vitest";
import {
  dispatch,
  GameError,
  rank,
  type Document,
  type Store,
} from "../supabase/functions/_shared/engine";
import type { GameRequest, GameResponse, Ranking } from "../shared/types";
class TestStore implements Store {
  docs = new Map<string, Document>();
  async get(key: string) {
    return structuredClone(this.docs.get(key) || null);
  }
  put(key: string, value: unknown, owner: string | null, isPublic = false) {
    this.docs.set(key, {
      key,
      value: structuredClone(value),
      owner,
      public: isPublic,
      version: 1,
    });
  }
  remove(key: string) {
    this.docs.delete(key);
  }
  async listPublic() {
    return [...this.docs.values()]
      .filter((x) => x.public)
      .map((x) => x.value as Ranking);
  }
}
let db: TestStore;
let now: number;
async function call(input: GameRequest, uid = "alice"): Promise<GameResponse> {
  if (input.op === "start")
    await call(
      {
        op: "profile",
        nickname: "Test Detective",
        optIn: false,
        browserId: input.browserId,
      },
      uid,
    );
  const tx = new TestStore();
  tx.docs = structuredClone(db.docs);
  const result = await dispatch(tx, uid, input, now);
  db.docs = tx.docs;
  return result;
}
async function through(chapter: number) {
  await call({ op: "start" });
  for (let m = 1; m <= chapter; m++) {
    if (m === 4) {
      for (const file of [
        "/logs/access.log",
        "/archive/backup.log",
        "/classified/witness.log",
      ])
        await call({ op: "terminal", command: `cat ${file}` });
    }
    if (m === 6) await call({ op: "final-start" });
    await call({
      op: "submit",
      mission: m,
      answer:
        m === 5
          ? ["audit", "backup", "purge", "echo"]
          : ["", "ORBIT", "REGOLITH", "AS-042", "WE WERE HERE", "", "AS-042"][
              m
            ],
    });
  }
}
beforeEach(() => {
  db = new TestStore();
  now = 1000000;
});
describe("trusted single-player progression", () => {
  it("creates an anonymous profile without granting progress", async () => {
    const r = await call({ op: "state" });
    expect(r.state?.score).toBe(0);
    expect(r.state?.startedAt).toBe(0);
    expect(r.state?.optIn).toBe(false);
  });
  it("requires a started session and previous chapters", async () => {
    await expect(
      call({ op: "submit", mission: 1, answer: "ORBIT" }),
    ).rejects.toThrow("Begin");
    await call({ op: "start" });
    await expect(
      call({ op: "submit", mission: 3, answer: "AS-042" }),
    ).rejects.toThrow("previous");
  });
  it("normalizes text answers and awards exactly once", async () => {
    await call({ op: "start" });
    expect(
      (await call({ op: "submit", mission: 1, answer: " orbit " })).state
        ?.score,
    ).toBe(125);
    expect(
      (await call({ op: "submit", mission: 1, answer: "ORBIT" })).state?.score,
    ).toBe(125);
  });
  it("does not grant first-attempt bonus after a failed answer", async () => {
    await call({ op: "start" });
    expect(
      (await call({ op: "submit", mission: 1, answer: "wrong" })).success,
    ).toBe(false);
    expect(
      (await call({ op: "submit", mission: 1, answer: "ORBIT" })).state?.score,
    ).toBe(100);
  });
  it("charges incremental hints with a hard cap and never gives the solution", async () => {
    await call({ op: "start" });
    for (const score of [-10, -30, -60]) {
      const r = await call({ op: "hint", mission: 1 });
      expect(r.state?.score).toBe(score);
      expect(r.hint).not.toContain("ORBIT");
    }
    await expect(call({ op: "hint", mission: 1 })).rejects.toThrow("three");
    expect(
      (await call({ op: "submit", mission: 1, answer: "ORBIT" })).state?.score,
    ).toBe(65);
  });
  it("returns archive records only after the transmission", async () => {
    await expect(call({ op: "archive" })).rejects.toThrow();
    await through(2);
    const r = await call({ op: "archive" });
    expect(r.records).toHaveLength(3);
    const anomalous = r.records!.filter(
      (x) => x.deleted && x.lastSeen > x.deleted,
    );
    expect(anomalous.map((x) => x.id)).toEqual(["AS-042"]);
  });
  it("validates the terminal phrase only after reading the three files", async () => {
    await through(3);
    await expect(
      call({ op: "submit", mission: 4, answer: "WE WERE HERE" }),
    ).rejects.toThrow("all three");
    await call({ op: "terminal", command: "cat /logs/access.log" });
    expect((await call({ op: "state" })).state?.fragments).toHaveLength(1);
    await call({ op: "terminal", command: "cat /logs/access.log" });
    expect((await call({ op: "state" })).state?.fragments).toHaveLength(1);
  });
  it("implements safe ls/cd/cat/grep/pwd/whoami and rejects real commands", async () => {
    await through(3);
    expect((await call({ op: "terminal", command: "ls /" })).output).toContain(
      "classified",
    );
    expect((await call({ op: "terminal", command: "cd /logs" })).cwd).toBe(
      "/logs",
    );
    expect(
      (await call({ op: "terminal", command: "pwd", cwd: "/logs" })).output,
    ).toBe("/logs");
    expect(
      (await call({ op: "terminal", command: "cat access.log", cwd: "/logs" }))
        .output,
    ).toContain("fragment[01]");
    expect(
      (await call({ op: "terminal", command: "grep PURGE /logs/access.log" }))
        .output,
    ).toContain("PURGE");
    expect(
      (await call({ op: "terminal", command: "whoami" })).output,
    ).toContain("witness@");
    await expect(
      call({ op: "terminal", command: "curl https://example.com" }),
    ).rejects.toThrow("unavailable");
    await expect(
      call({ op: "terminal", command: "cat /etc/passwd" }),
    ).rejects.toThrow("File not found");
  });
  it("requires an exact four-event timeline", async () => {
    await through(4);
    expect(
      (
        await call({
          op: "submit",
          mission: 5,
          answer: ["purge", "backup", "echo", "audit"],
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await call({
          op: "submit",
          mission: 5,
          answer: ["audit", "backup", "purge", "echo"],
        })
      ).success,
    ).toBe(true);
  });
  it("expires the firewall and allows a retry without losing evidence", async () => {
    await through(5);
    await call({ op: "final-start" });
    now += 180001;
    await expect(
      call({ op: "submit", mission: 6, answer: "AS-042" }),
    ).rejects.toThrow("Connection lost");
    expect(
      Object.values((await call({ op: "state" })).state!.progress).filter(
        (x) => x.completedAt,
      ),
    ).toHaveLength(5);
    await call({ op: "final-start" });
    expect(
      (await call({ op: "submit", mission: 6, answer: "AS-042" })).success,
    ).toBe(true);
  });
  it("reaches both distinct endings with no duplicate score", async () => {
    await through(6);
    expect((await call({ op: "finish", ending: "restore" })).state?.score).toBe(
      750,
    );
    expect((await call({ op: "finish", ending: "expose" })).state?.ending).toBe(
      "expose",
    );
    expect((await call({ op: "state" })).state?.score).toBe(750);
  });
  it("publishes only opted-in completed records, with derived scores", async () => {
    await through(6);
    await call({ op: "finish", ending: "restore" });
    expect((await call({ op: "leaderboard" })).entries).toEqual([]);
    await call({ op: "profile", nickname: "A Witness", optIn: true });
    expect((await call({ op: "leaderboard" })).entries?.[0].score).toBe(750);
    await call({ op: "profile", nickname: "A Witness", optIn: false });
    expect((await call({ op: "leaderboard" })).entries).toEqual([]);
  });
  it("isolates players even when another player has completed the game", async () => {
    await through(6);
    const bob = await call({ op: "state" }, "bob");
    expect(bob.state?.chapter).toBe(1);
    expect(bob.state?.fragments).toEqual([]);
    expect(bob.state?.score).toBe(0);
  });
  it("rejects oversized and malformed inputs", async () => {
    await call({ op: "start" });
    await expect(
      call({ op: "submit", mission: 1, answer: "x".repeat(101) }),
    ).rejects.toBeInstanceOf(GameError);
    await expect(
      call({ op: "submit", mission: 1, answer: ["ORBIT"] }),
    ).rejects.toThrow("Invalid input");
    await expect(
      call({ op: "profile", nickname: "x".repeat(33), optIn: true }),
    ).rejects.toThrow();
  });
  it("assigns every documented rank", () => {
    expect([0, 250, 450, 600, 700].map(rank)).toEqual([
      "NOVICE",
      "ANALYST",
      "INVESTIGATOR",
      "GHOST HUNTER",
      "ARCHIVE MASTER",
    ]);
  });
});
describe("two real witnesses / The Split File", () => {
  async function room() {
    await call({ op: "profile", nickname: "Alice", optIn: false });
    await call({ op: "profile", nickname: "Bob", optIn: false }, "bob");
    const r = await call({ op: "room-create" });
    return r.room!.code;
  }
  it("requires actual membership before disclosing room state", async () => {
    const code = await room();
    await expect(call({ op: "room-get", code }, "bob")).rejects.toThrow(
      "membership",
    );
    await expect(
      call({ op: "room-submit", code, answer: "STAY WITH ME" }, "bob"),
    ).rejects.toThrow("membership");
  });
  it("rejects invalid/full rooms and idempotently reconnects a member", async () => {
    const code = await room();
    await expect(
      call({ op: "room-join", code: "WRONG!" }, "bob"),
    ).rejects.toThrow("six-character");
    await call({ op: "room-join", code }, "bob");
    expect(
      (await call({ op: "room-join", code }, "bob")).room?.members,
    ).toHaveLength(2);
    await call({ op: "profile", nickname: "Carol", optIn: false }, "carol");
    await expect(call({ op: "room-join", code }, "carol")).rejects.toThrow(
      "full",
    );
  });
  it("requires readiness, restricts the host, and gives separate clues", async () => {
    const code = await room();
    await call({ op: "room-join", code }, "bob");
    await expect(call({ op: "room-start", code })).rejects.toThrow("ready");
    await call({ op: "room-ready", code });
    await call({ op: "room-ready", code }, "bob");
    await expect(call({ op: "room-start", code }, "bob")).rejects.toThrow(
      "host",
    );
    const a = await call({ op: "room-start", code });
    const b = await call({ op: "room-get", code }, "bob");
    expect(a.room?.clue).toContain("C → A → B");
    expect(a.room?.clue).not.toContain("A = WITH");
    expect(b.room?.clue).toContain("A = WITH");
    expect(b.room?.clue).not.toContain("C → A → B");
  });
  it("syncs chat and completion without accepting arbitrary answers", async () => {
    const code = await room();
    await call({ op: "room-join", code }, "bob");
    await call({ op: "room-ready", code });
    await call({ op: "room-ready", code }, "bob");
    await call({ op: "room-start", code });
    await call({ op: "room-chat", code, text: "I have the sequence." });
    expect(
      (await call({ op: "room-get", code }, "bob")).room?.messages[0].text,
    ).toBe("I have the sequence.");
    await expect(
      call({ op: "room-submit", code, answer: "wrong" }, "bob"),
    ).rejects.toThrow("does not reconcile");
    await call({ op: "room-submit", code, answer: "stay with me" }, "bob");
    expect((await call({ op: "room-get", code })).room?.status).toBe("solved");
  });
  it("reclaims the room when the host leaves", async () => {
    const code = await room();
    await call({ op: "room-join", code }, "bob");
    await call({ op: "room-leave", code });
    await expect(call({ op: "room-get", code }, "bob")).rejects.toThrow(
      "not found",
    );
    expect(db.docs.has(`room:${code}`)).toBe(false);
  });
  it("caps creation at three per hour and reclaims expired owned rooms", async () => {
    await call({ op: "profile", nickname: "Alice", optIn: false });
    const codes: string[] = [];
    for (let i = 0; i < 3; i++)
      codes.push((await call({ op: "room-create" })).room!.code);
    await expect(call({ op: "room-create" })).rejects.toThrow("creation limit");
    expect(
      [...db.docs.keys()].filter((k) => k.startsWith("room:")),
    ).toHaveLength(3);
    now += 3600001;
    await expect(call({ op: "room-create" })).rejects.toThrow(
      "Close an existing",
    );
    now += 86400000;
    await call({ op: "room-create" });
    expect(
      [...db.docs.keys()].filter((k) => k.startsWith("room:")),
    ).toHaveLength(1);
    expect(codes.every((c) => !db.docs.has(`room:${c}`))).toBe(true);
  });
});
describe("paid-hint confidentiality", () => {
  it("reveals only purchased hints, restores them on refresh and isolates users", async () => {
    await call({ op: "start" });
    expect((await call({ op: "state" })).state?.recoveredHints).toEqual({});
    const purchased = await call({ op: "hint", mission: 1 });
    expect(purchased.state?.recoveredHints["1"]).toEqual([purchased.hint]);
    expect(
      (await call({ op: "state" })).state?.recoveredHints["1"],
    ).toHaveLength(1);
    expect((await call({ op: "state" }, "bob")).state?.recoveredHints).toEqual(
      {},
    );
    await expect(call({ op: "hint", mission: 2 })).rejects.toThrow("previous");
  });
});

describe("detective onboarding and browser-specific saves", () => {
  it("requires a detective name before the first investigation", async () => {
    await expect(
      dispatch(new TestStore(), "new-user", { op: "start" }, now),
    ).rejects.toThrow("detective name");
  });
  it("gives the same account independent investigation slots in separate browsers", async () => {
    const a = "11111111-1111-4111-8111-111111111111",
      b = "22222222-2222-4222-8222-222222222222";
    await call({ op: "start", browserId: a });
    await call({ op: "submit", mission: 1, answer: "ORBIT", browserId: a });
    expect((await call({ op: "state", browserId: a })).state?.score).toBe(125);
    expect((await call({ op: "state", browserId: b })).state?.score).toBe(0);
    expect(
      (await call({ op: "state", browserId: b })).state?.onboarded,
    ).toBeUndefined();
  });
  it("shares creation quotas across browser slots rather than trusting a new browser identifier", async () => {
    const a = "11111111-1111-4111-8111-111111111111",
      b = "22222222-2222-4222-8222-222222222222";
    for (const browserId of [a, b])
      await call({ op: "profile", nickname: "Alice", optIn: false, browserId });
    for (let i = 0; i < 3; i++) await call({ op: "room-create", browserId: a });
    await expect(call({ op: "room-create", browserId: b })).rejects.toThrow(
      "creation limit",
    );
  });
});
