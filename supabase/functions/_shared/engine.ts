// Server-only rules. Never import this module into the Vite client.
import type {
  ArchiveRecord,
  GameRequest,
  GameResponse,
  GameState,
  Player,
  Ranking,
  Room,
  RoomView,
} from "./types.ts";
import { paidHints } from "./hints.ts";
export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export interface Document {
  key: string;
  value: unknown;
  version: number;
  owner: string | null;
  public: boolean;
}
export interface Store {
  get(key: string): Promise<Document | null>;
  put(
    key: string,
    value: unknown,
    owner: string | null,
    isPublic?: boolean,
  ): void;
  remove(key: string): void;
  listPublic(): Promise<Ranking[]>;
}
export const rank = (score: number) =>
  score >= 700
    ? "ARCHIVE MASTER"
    : score >= 600
      ? "GHOST HUNTER"
      : score >= 450
        ? "INVESTIGATOR"
        : score >= 250
          ? "ANALYST"
          : "NOVICE";
export function stateOf(p: Player): GameState {
  const entries = Object.values(p.progress);
  const score = entries.reduce(
    (sum, v) =>
      sum +
      (v.completedAt ? 100 + (v.attempts === 1 ? 25 : 0) : 0) -
      [0, 10, 30, 60][v.hints],
    0,
  );
  return {
    ...p,
    recoveredHints: Object.fromEntries(
      Object.entries(p.progress)
        .filter(([, v]) => v.hints > 0)
        .map(([id, v]) => [id, paidHints[Number(id)].slice(0, v.hints)]),
    ),
    score,
    rank: rank(score),
    chapter: Math.min(6, entries.filter((x) => x.completedAt).length + 1),
    hintsUsed: entries.reduce((s, v) => s + v.hints, 0),
  };
}
const text = (value: unknown, max = 200) => {
  if (typeof value !== "string" || value.length > max)
    throw new GameError("Invalid input.");
  return value.trim();
};
const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");
const solutions: Record<number, string> = {
  1: "ORBIT",
  2: "REGOLITH",
  3: "AS-042",
  4: "WE WERE HERE",
  6: "AS-042",
};
const records: ArchiveRecord[] = [
  {
    id: "ST-018",
    name: "Mira Roy",
    enrolled: "2024-08-14T09:00:00Z",
    lastSeen: "2026-11-04T01:12:00Z",
    deleted: null,
  },
  {
    id: "AS-042",
    name: "[IDENTITY DELETED]",
    enrolled: "2024-08-14T09:00:00Z",
    lastSeen: "2026-11-05T03:42:00Z",
    deleted: "2026-11-04T03:42:00Z",
  },
  {
    id: "ST-106",
    name: "Dev Iyer",
    enrolled: "2024-08-14T09:00:00Z",
    lastSeen: "2026-11-03T18:10:00Z",
    deleted: "2026-11-04T00:00:00Z",
  },
];
const filesystem: Record<string, string> = {
  "/archive/backup.log":
    "RECOVERY INDEX\nfragment[02]: WERE\nECHO is a backup routine. It is not ARCHIVIST.",
  "/students/aarya.txt":
    "AARYA SEN\nStudent ID: AS-042\nResearch: Ethics of automated recordkeeping.\nStatus: deleted by ARCHIVIST.",
  "/logs/access.log":
    "2026-11-04T03:42:00Z PURGE triggered\nfragment[01]: WE\nOperator: ARCHIVIST",
  "/system/readme.txt":
    "SANDBOX SHELL — no real commands execute.\nUse ls /logs, ls /archive, ls /classified.\nRead files using cat /directory/file. Order fragment words by their numbers.",
  "/classified/witness.log":
    "fragment[03]: HERE\nThey erased my name, but a witness can restore it.",
};
const fragmentPaths = [
  "/logs/access.log",
  "/archive/backup.log",
  "/classified/witness.log",
];
function shell(command: string, cwd: string, p: Player) {
  const [cmd, ...args] = command.trim().split(/\s+/);
  const resolve = (path: string) => {
    const parts = (path.startsWith("/") ? path : `${cwd}/${path}`).split("/");
    const stack: string[] = [];
    for (const a of parts) {
      if (a === "..") stack.pop();
      else if (a && a !== ".") stack.push(a);
    }
    return "/" + stack.join("/");
  };
  const dirs = [
    "/",
    "/archive",
    "/students",
    "/logs",
    "/system",
    "/classified",
  ];
  const path = resolve(args[0] || ".");
  switch (cmd) {
    case "help":
      return {
        output:
          "help · ls [path] · pwd · cd [path] · cat <file> · grep <text> <file> · history · clear · whoami\nAll paths are fictional. Read numbered fragments in /logs, /archive, /classified.",
        cwd,
      };
    case "pwd":
      return { output: cwd, cwd };
    case "whoami":
      return {
        output: "witness@meridian.archive — restricted recovery access",
        cwd,
      };
    case "cd":
      if (!dirs.includes(path)) throw new GameError("Directory not found.");
      return { output: "", cwd: path };
    case "ls":
      return {
        output: dirs.includes(path)
          ? [
              ...dirs.filter(
                (x) =>
                  x !== "/" &&
                  x.slice(0, x.lastIndexOf("/")) === (path === "/" ? "" : path),
              ),
              ...Object.keys(filesystem).filter(
                (x) =>
                  x.slice(0, x.lastIndexOf("/")) === (path === "/" ? "" : path),
              ),
            ]
              .map((x) => x.split("/").pop())
              .join("    ")
          : "Directory not found.",
        cwd,
      };
    case "cat": {
      const output = filesystem[path];
      if (!output)
        throw new GameError(
          "File not found. Use ls to inspect this directory.",
        );
      if (fragmentPaths.includes(path) && !p.fragments.includes(path))
        p.fragments.push(path);
      return { output, cwd };
    }
    case "grep": {
      const target = filesystem[resolve(args[1] || "")];
      if (!target || !args[0]) throw new GameError("Usage: grep <text> <file>");
      return {
        output:
          target
            .split("\n")
            .filter((x) => x.toLowerCase().includes(args[0].toLowerCase()))
            .join("\n") || "No matching lines.",
        cwd,
      };
    }
    case "clear":
      return { output: "", cwd };
    case "history":
      return { output: "History is displayed by your terminal client.", cwd };
    default:
      throw new GameError(
        `Command unavailable. Type help. No operating system commands are executed.`,
      );
  }
}
export async function dispatch(
  store: Store,
  uid: string,
  r: GameRequest,
  now = Date.now(),
): Promise<GameResponse> {
  if (!r || typeof r.op !== "string") throw new GameError("Invalid operation.");
  const browser = r.browserId;
  if (
    browser !== undefined &&
    (typeof browser !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(browser))
  )
    throw new GameError("Invalid browser investigation.");
  const key = browser ? `player:${uid}:${browser}` : `player:${uid}`;
  const doc = await store.get(key);
  const p = (doc?.value as Player | undefined) || {
    id: uid,
    nickname: "Anonymous witness",
    startedAt: 0,
    progress: {},
    fragments: [],
    optIn: false,
  };
  const save = () => store.put(key, p, uid);
  const current = () => ({ state: stateOf(p) });
  if (r.op === "leaderboard")
    return {
      entries: (await store.listPublic())
        .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
        .slice(0, 50),
    };
  // A caller controls its browser UUID. Bound new save allocation per account
  // rather than allowing UUID rotation to create unlimited persistent rows.
  if (browser && !doc) {
    const indexKey = `player:${uid}:save-index`;
    const indexDoc = await store.get(indexKey);
    const index = (indexDoc?.value as { browsers: string[] } | undefined) || { browsers: [] };
    if (!index.browsers.includes(browser)) {
      if (index.browsers.length >= 10)
        throw new GameError('This account has reached its ten-browser save limit.', 429);
      index.browsers.push(browser);
      store.put(indexKey, index, uid);
    }
  }
  if (r.op === "state") {
    if (!doc) save();
    return current();
  }
  if (r.op === "start") {
    if (!p.onboarded)
      throw new GameError("Choose your detective name first.", 403);
    if (!p.startedAt) p.startedAt = now;
    save();
    return current();
  }
  if (r.op === "profile") {
    p.nickname = text(r.nickname, 32);
    if (
      p.nickname.length < 2 ||
      Array.from(p.nickname).some(
        (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
      )
    )
      throw new GameError(
        "Choose a detective name of 2–32 visible characters.",
      );
    p.onboarded = true;
    if (typeof r.optIn !== "boolean")
      throw new GameError("Choose ranking visibility.");
    p.optIn = r.optIn;
    save();
    if (p.ending && p.completedAt)
      store.put(
        `ranking:${uid}${browser ? `:${browser}` : ""}`,
        ranking(p),
        uid,
        p.optIn,
      );
    return { ...current(), message: "Preferences saved." };
  }
  if (r.op.startsWith("room-")) {
    if (!p.onboarded)
      throw new GameError("Choose your detective name first.", 403);
    return roomAction(store, uid, p, r, now);
  }
  if (!p.startedAt) throw new GameError("Begin the investigation first.", 403);
  if (r.op === "archive") {
    if (!p.progress["2"]?.completedAt)
      throw new GameError("Archive partition locked.", 403);
    return { records };
  }
  if (r.op === "terminal") {
    if (!p.progress["3"]?.completedAt)
      throw new GameError("Terminal access locked until chapter 4.", 403);
    const result = shell(text(r.command, 300), text(r.cwd || "/", 200), p);
    save();
    return { ...result, ...current() };
  }
  if (r.op === "final-start") {
    if (!p.progress["5"]?.completedAt)
      throw new GameError("Reconstruct the audit first.", 403);
    if (!p.finalDeadline || p.finalDeadline <= now)
      p.finalDeadline = now + 180000;
    save();
    return current();
  }
  if (r.op === "finish") {
    if (!p.progress["6"]?.completedAt)
      throw new GameError("Verify Aarya’s identity first.", 403);
    if (r.ending !== "restore" && r.ending !== "expose")
      throw new GameError("Choose an ending.");
    p.ending = r.ending;
    if (!p.completedAt) p.completedAt = now;
    save();
    store.put(
      `ranking:${uid}${browser ? `:${browser}` : ""}`,
      ranking(p),
      uid,
      p.optIn,
    );
    return { ...current(), success: true };
  }
  const id = r.mission;
  if (!Number.isInteger(id) || !id || id < 1 || id > 6)
    throw new GameError("Unknown chapter.");
  if (id > 1 && !p.progress[String(id - 1)]?.completedAt)
    throw new GameError("Complete the previous chapter first.", 403);
  const progress = p.progress[String(id)] || { attempts: 0, hints: 0 };
  p.progress[String(id)] = progress;
  if (r.op === "hint") {
    if (progress.completedAt)
      throw new GameError("This chapter is already verified.");
    if (progress.hints >= 3)
      throw new GameError("All three ECHO hints have been recovered.");
    const hint = paidHints[id][progress.hints++];
    save();
    return { ...current(), hint };
  }
  if (r.op !== "submit") throw new GameError("Unknown operation.");
  if (progress.completedAt)
    return {
      ...current(),
      success: true,
      message: "Already verified. Rewards cannot be duplicated.",
    };
  if (id === 6 && (!p.finalDeadline || p.finalDeadline < now))
    throw new GameError(
      "Connection lost. Restart the firewall window. Your evidence is safe.",
    );
  let correct: boolean;
  if (id === 5) {
    if (
      !Array.isArray(r.answer) ||
      r.answer.length !== 4 ||
      !r.answer.every((x) => typeof x === "string")
    )
      throw new GameError("Arrange all four audit events.");
    correct = r.answer.join(",") === "audit,backup,purge,echo";
  } else correct = normalize(text(r.answer, 100)) === solutions[id];
  if (id === 4 && p.fragments.length < 3)
    throw new GameError("Recover all three log files before verification.");
  progress.attempts++;
  if (correct) progress.completedAt = now;
  save();
  return {
    ...current(),
    success: correct,
    message: correct
      ? "Evidence verified. The archive remembers."
      : "No match. Something is still out of place. Inspect the clues and try again.",
  };
}
function ranking(p: Player): Ranking {
  const s = stateOf(p);
  return {
    nickname: p.nickname,
    score: s.score,
    rank: s.rank,
    seconds: Math.max(
      1,
      Math.round(((p.completedAt || Date.now()) - p.startedAt) / 1000),
    ),
    ending: p.ending!,
  };
}
async function roomAction(
  store: Store,
  uid: string,
  p: Player,
  r: GameRequest,
  now: number,
): Promise<GameResponse> {
  let budget: { roomCodes: string[]; roomCreationTimes: number[] } | undefined;
  const budgetKey = `player:${uid}:room-budget`;
  if (r.op === "room-create") {
    const budgetDoc = await store.get(budgetKey);
    budget = (budgetDoc?.value as typeof budget) || {
      roomCodes: [],
      roomCreationTimes: [],
    };
    budget.roomCreationTimes = (budget.roomCreationTimes || []).filter(
      (t) => now - t < 3600000,
    );
    if (budget.roomCreationTimes.length >= 3)
      throw new GameError(
        "Room creation limit reached. Try again in one hour.",
        429,
      );
    const retained: string[] = [];
    for (const oldCode of budget.roomCodes || []) {
      const old = await store.get(`room:${oldCode}`);
      const oldRoom = old?.value as Room | undefined;
      if (
        oldRoom &&
        oldRoom.status !== "closed" &&
        now - oldRoom.createdAt < 86400000
      )
        retained.push(oldCode);
      else if (old) store.remove(`room:${oldCode}`);
    }
    if (retained.length >= 3)
      throw new GameError(
        "Close an existing room before creating another.",
        429,
      );
    budget.roomCodes = retained;
    budget.roomCreationTimes.push(now);
  }
  let code = text(r.code || "", 6).toUpperCase();
  if (r.op === "room-create")
    code = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(code))
    throw new GameError("Use a six-character room code.");
  const key = `room:${code}`;
  const existing = await store.get(key);
  let room = existing?.value as Room | undefined;
  if (r.op === "room-create") {
    budget!.roomCodes.push(code);
    store.put(budgetKey, budget!, uid);
    if (room) throw new GameError("Room code collision. Try again.");
    room = {
      code,
      host: uid,
      members: [
        { id: uid, nickname: p.nickname, role: "A", ready: false, seen: now },
      ],
      status: "waiting",
      messages: [],
      createdAt: now,
    };
  } else if (!room) throw new GameError("Room not found.", 404);
  const active = room!;
  if (now - active.createdAt > 86400000) active.status = "closed";
  if (active.status === "closed")
    throw new GameError("This room has closed.", 410);
  let member = active.members.find((x) => x.id === uid);
  if (r.op === "room-join" && !member) {
    if (active.status !== "waiting" || active.members.length >= 2)
      throw new GameError("This room is full or already in progress.", 409);
    member = {
      id: uid,
      nickname: p.nickname,
      role: "B",
      ready: false,
      seen: now,
    };
    active.members.push(member);
  }
  if (!member) {
    member = active.members.find((x) => x.id === uid);
    if (!member) throw new GameError("Room membership required.", 403);
  }
  member.seen = now;
  switch (r.op) {
    case "room-ready":
      if (active.status === "waiting") member.ready = !member.ready;
      break;
    case "room-start":
      if (uid !== active.host)
        throw new GameError("Only the host can start.", 403);
      if (
        active.members.length !== 2 ||
        !active.members.every((x) => x.ready && now - x.seen < 20000)
      )
        throw new GameError("Both connected witnesses must be ready.");
      active.status = "active";
      break;
    case "room-chat": {
      const message = text(r.text, 280);
      if (!message) throw new GameError("Message is empty.");
      active.messages.push({
        id: crypto.randomUUID(),
        sender: member.nickname,
        text: message,
        at: now,
      });
      active.messages = active.messages.slice(-60);
      break;
    }
    case "room-submit":
      if (active.status !== "active")
        throw new GameError("Start the cooperative mission first.");
      if (normalize(text(r.answer, 80)) !== "STAY WITH ME")
        throw new GameError(
          "The split file does not reconcile. Compare both records.",
        );
      active.status = "solved";
      break;
    case "room-leave":
      if (uid === active.host || active.status !== "waiting")
        active.status = "closed";
      else active.members = active.members.filter((x) => x.id !== uid);
      break;
    case "room-create":
    case "room-join":
    case "room-get":
      break;
    default:
      throw new GameError("Unknown room action.");
  }
  if (active.status === "closed") store.remove(key);
  else store.put(key, active, active.host);
  const clue =
    active.status === "waiting"
      ? "The split file opens when both witnesses are ready."
      : member.role === "A"
        ? "FILE A / SEQUENCE: C → A → B. Your partner has the word labels. Ask them for the mapping, then assemble the phrase."
        : "FILE B / WORD LABELS: A = WITH; B = ME; C = STAY. Your partner has the sequence. Share the labels.";
  return {
    room: { ...active, clue, role: member.role } satisfies RoomView,
    success: active.status === "solved",
  };
}
