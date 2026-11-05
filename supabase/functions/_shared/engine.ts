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
import { narrativeFor, echoReply } from "./narrative.ts";
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
  listPlayerSaves?(uid: string): Promise<Document[]>;
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
    narrative: narrativeFor(p),
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
const validateNickname = (value: unknown) => {
  if (typeof value !== "string" || /[\p{Cc}\p{Cf}]/u.test(value))
    throw new GameError("Choose a detective name of 2–32 visible characters.");
  const name = text(value.normalize("NFKC"), 64);
  if (
    name.length < 2 ||
    name.length > 32 ||
    /[\p{Mn}\p{Me}]{2,}/u.test(name) ||
    !/^[\p{L}\p{N}\p{P}\p{Zs}\p{Mn}\p{Mc}]{2,32}$/u.test(name)
  )
    throw new GameError("Choose a detective name of 2–32 visible characters.");
  return name;
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
  {
    id: "ST-204",
    name: "Rhea Das",
    enrolled: "2024-08-14T09:00:00Z",
    lastSeen: "2026-11-04T02:48:00Z",
    deleted: null,
  },
  {
    id: "ST-231",
    name: "Kabir Ali",
    enrolled: "2023-08-12T09:00:00Z",
    lastSeen: "2026-11-03T19:00:00Z",
    deleted: "2026-11-04T03:10:00Z",
  },
  {
    id: "ST-278",
    name: "Noor Shah",
    enrolled: "2025-08-13T09:00:00Z",
    lastSeen: "2026-11-04T03:40:00Z",
    deleted: null,
  },
];
const filesystem: Record<string, string> = {
  "/archive/backup.log":
    "2026-11-04T03:18:00Z MIRROR_WRITE\nfragment[02]: WERE\nOperator: 0xNULL\nCapability receipt: MIRROR_WRITE allowed / PURGE denied\nRetention: immutable. Do not trust an editable caption over this receipt.",
  "/students/aarya.txt":
    "AARYA SEN\nStudent ID: AS-042\nResearch: Ethics of automated recordkeeping.\nStatus: deleted / audit attribution disputed.",
  "/logs/access.log":
    "2026-11-04T03:42:00Z PURGE displayed\nfragment[01]: WE\nDisplayed operator: 0xNULL\nAttribution source: ARCHIVIST audit reconstruction\nRaw action signer: [redacted by index]\nDisplay labels are not storage receipts.",
  "/system/readme.txt":
    "SANDBOX SHELL — no real commands execute.\nUse ls /logs, ls /archive, ls /classified.\nRead files using cat /directory/file. Order fragment words by their numbers.",
  "/classified/witness.log":
    "fragment[03]: HERE\nThey erased my name, but a witness can restore it.\n02:16 VOSS / recovery ticket: unnamed aliases preserve mirrors; purge capability prohibited.\nThe silhouette and the caption are different kinds of evidence.",
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
  const path = resolve(
    (cmd === "ls" ? args.filter((a) => !a.startsWith("-")) : args)[0] || ".",
  );
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
      if (!args.length) throw new GameError("Usage: cat <file> [file ...]");
      const paths = args.map(resolve);
      const outputs = paths.map((file) => {
        if (!filesystem[file])
          throw new GameError(
            "File not found. Use ls to inspect this directory.",
          );
        return filesystem[file];
      });
      for (const file of paths)
        if (fragmentPaths.includes(file) && !p.fragments.includes(file))
          p.fragments.push(file);
      return { output: outputs.join("\n\n"), cwd };
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
  if (r.op === "leaderboard")
    return {
      entries: (await store.listPublic())
        .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
        .slice(0, 50),
    };
  const browser = r.browserId;
  if (
    browser !== undefined &&
    (typeof browser !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        browser,
      ))
  )
    throw new GameError("Invalid browser investigation.");
  // The verified account owns one resumable investigation across browsers.
  // Browser identifiers remain accepted for older clients and presentation notes.
  const key = `player:${uid}`;
  const doc = await store.get(key);
  let p = (doc?.value as Player | undefined) || {
    id: uid,
    nickname: "Anonymous witness",
    startedAt: 0,
    progress: {},
    fragments: [],
    optIn: false,
  };
  if (p.saveVersion !== 2) {
    const prior = (await store.listPlayerSaves?.(uid)) || (doc ? [doc] : []);
    const candidates = prior.filter((d) => {
      const v = d.value as Player;
      const suffix = d.key.slice(key.length + 1);
      return (
        d.owner === uid &&
        (d.key === key ||
          (d.key.startsWith(key + ":") &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
              suffix,
            ))) &&
        v.id === uid &&
        typeof v.startedAt === "number" &&
        v.progress &&
        typeof v.progress === "object"
      );
    });
    const completed = (d: Document) =>
      Object.values((d.value as Player).progress).filter((x) => x.completedAt)
        .length;
    const activity = (d: Document) =>
      Math.max(
        (d.value as Player).startedAt,
        ...Object.values((d.value as Player).progress).map(
          (x) => x.completedAt || 0,
        ),
      );
    candidates.sort(
      (a, b) =>
        completed(b) - completed(a) ||
        activity(b) - activity(a) ||
        Number(!!(b.value as Player).onboarded) -
          Number(!!(a.value as Player).onboarded) ||
        a.key.localeCompare(b.key),
    );
    if (candidates[0]) {
      p = structuredClone(candidates[0].value as Player);
      p.rankingKey = `ranking:${uid}`;
    }
    // Preserve the furthest trusted save as a whole: do not combine bonuses,
    // attempts, hint counts or completion times from different investigations.
    const reached = p.startedAt
      ? Math.min(
          6,
          Object.values(p.progress).filter((x) => x.completedAt).length + 1,
        )
      : 0;
    p.cinematicsSeen = [
      ...new Set([
        ...(p.cinematicsSeen || []),
        ...Array.from({ length: reached }, (_, i) => i + 1),
      ]),
    ];
    p.saveVersion = 2;
    try {
      p.nickname = validateNickname(p.nickname);
    } catch {
      p.nickname = "Witness";
      p.onboarded = false;
      p.optIn = false;
    }
    store.put(key, p, uid);
    store.put(
      `ranking:${uid}`,
      p.ending && p.completedAt ? ranking(p) : { suppressed: true },
      uid,
      !!p.ending && !!p.completedAt && p.optIn,
    );
  }
  try {
    const name = validateNickname(p.nickname);
    if (name !== p.nickname) {
      p.nickname = name;
      store.put(key, p, uid);
      if (p.ending) store.put(`ranking:${uid}`, ranking(p), uid, p.optIn);
    }
  } catch {
    p.nickname = "Witness";
    p.onboarded = false;
    p.optIn = false;
    store.put(key, p, uid);
    store.put(`ranking:${uid}`, { suppressed: true }, uid, false);
  }
  if (p.startedAt && !p.onboarded && !["state", "profile"].includes(r.op))
    throw new GameError("Choose your detective name first.", 403);
  const save = () => store.put(key, p, uid);
  const current = () => ({ state: stateOf(p) });
  const rankingKey = `ranking:${uid}`;
  p.rankingKey = rankingKey;
  if (r.op === "leaderboard")
    return {
      entries: (await store.listPublic())
        .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
        .slice(0, 50),
    };
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
    p.nickname = validateNickname(r.nickname);
    p.onboarded = true;
    if (typeof r.optIn !== "boolean")
      throw new GameError("Choose ranking visibility.");
    p.optIn = r.optIn;
    save();
    store.put(
      rankingKey,
      p.ending && p.completedAt ? ranking(p) : { suppressed: true },
      uid,
      !!p.ending && !!p.completedAt && p.optIn,
    );
    return { ...current(), message: "Preferences saved." };
  }
  if (r.op.startsWith("room-")) {
    if (!p.onboarded)
      throw new GameError("Choose your detective name first.", 403);
    return roomAction(store, uid, p, r, now);
  }
  if (!p.startedAt) throw new GameError("Begin the investigation first.", 403);
  if (r.op === "cinematic-seen") {
    const id = r.mission;
    if (
      !Number.isInteger(id) ||
      !id ||
      id < 1 ||
      id > 6 ||
      (id > 1 && !p.progress[id - 1]?.completedAt)
    )
      throw new GameError("Chapter introduction is locked.", 403);
    p.cinematicsSeen = [...new Set([...(p.cinematicsSeen || []), id])];
    save();
    return current();
  }
  if (r.op === "echo") return { output: echoReply(p, text(r.text, 280)) };
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
    store.put(rankingKey, ranking(p), uid, p.optIn);
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
  const shouldWrite = r.op !== "room-get" || now - member.seen >= 15000;
  if (shouldWrite) member.seen = now;
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
    case "room-kick":
      if (uid !== active.host || active.status !== "waiting")
        throw new GameError("Only the host can remove a waiting partner.", 403);
      active.members = active.members.filter((x) => x.role === "A");
      member.ready = false;
      break;
    case "room-leave":
      if (
        uid === active.host &&
        active.status === "waiting" &&
        active.messages.length === 0
      ) {
        const saved = await store.get(budgetKey);
        const quotas = saved?.value as
          | { roomCodes: string[]; roomCreationTimes: number[] }
          | undefined;
        if (quotas) {
          const index = quotas.roomCreationTimes.indexOf(active.createdAt);
          if (index >= 0) quotas.roomCreationTimes.splice(index, 1);
          quotas.roomCodes = quotas.roomCodes.filter((c) => c !== code);
          store.put(budgetKey, quotas, uid);
        }
      }
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
  else if (shouldWrite) store.put(key, active, active.host);
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
