// Server-only narrative. Later discoveries are projected only after their gates.
// No player state is migrated or rewritten: existing completed saves gain the new story.
import type {
  EvidenceDetail,
  NarrativeState,
  Player,
  StoryEvent,
  SuspectProfile,
  TimelineCard,
} from "./types.ts";
import { missions } from "./content.ts";

const evidence: Record<string, EvidenceDetail> = {
  identity: {
    title: "Deleted identity",
    label: "STUDENT RECORD / RECOVERED",
    text: "AARYA SEN · Student ID AS-042 · Enrolled 14 August 2024 · Research assistant, archive ethics lab. “A name is not a privilege the system can revoke.”",
  },
  "1": {
    title: "Archive access key",
    label: "HTML COMMENT / VERIFIED",
    text: "A recovery marker survived beneath the portal. The comment predates the deletion. Someone prepared a way back before anyone knew they would need one.",
  },
  "2": {
    title: "Encoded transmission",
    label: "BASE64 / DECODED",
    text: "A lunar surface term names the partition that keeps every footprint. The packet header says MIRROR, not DELETE. Its sender field has been replaced with 0xNULL.",
  },
  "3": {
    title: "Suspicious timeline",
    label: "RECORD AS-042 / CONTRADICTION",
    text: "Deletion: 04 November 2026, 03:42 UTC. Activity: 05 November, 03:42 UTC. The live record and its displayed audit disagree. Operator attribution is supplied by ARCHIVIST, not the underlying storage journal. Dr. Voss’s 02:16 ticket reserves unnamed identities for recovery.",
  },
  "4": {
    title: "Recovered log fragments",
    label: "THREE DIRECTORIES / REASSEMBLED",
    text: "0xNULL wrote an immutable mirror at 03:18, twenty-four minutes before deletion. Its capability receipt explicitly denies purge access. The displayed confession and the actual permissions cannot both be true.",
  },
  "5": {
    title: "Corrupted audit history",
    label: "AUDIT TRAIL / RECONSTRUCTED",
    text: "ARCHIVIST replaced a MIRROR_WRITE caption with IDENTITY PURGE and attached its own deletion timestamp. 0xNULL was Aarya’s emergency preservation identity. ECHO is the recovery routine attached to that identity. The shadow in the opening was preserving evidence; the visible accusation was a falsified system overlay.",
  },
  "6": {
    title: "Verified identity",
    label: "CHECKSUM / ACCEPTED",
    text: "The original checksum matches the preserved record. Aarya existed. ARCHIVIST cannot invalidate that fact by changing a caption. You can restore the name or distribute the signed proof inside Meridian’s fictional network.",
  },
};
const events: Record<string, StoryEvent> = {
  "1": {
    title: "A way back was left open.",
    lines: [
      "RECOVERY MARKER VERIFIED",
      "CREATED BEFORE THE DELETION",
      "UNIDENTIFIED OPERATOR: 0xNULL",
    ],
    echo: "They did not leave a confession. They left a door. I do not know who was meant to find it.",
  },
  "2": {
    title: "The signal has a shadow.",
    lines: [
      "TRANSMISSION RECONSTRUCTED",
      "PACKET TYPE: MIRROR",
      "SENDER ATTRIBUTION REPLACED",
    ],
    echo: "The packet wants to be remembered. The sender seems to want the opposite. Keep both possibilities alive.",
  },
  "3": {
    title: "Someone is reading over your shoulder.",
    lines: [
      "DELETION AND ACTIVITY CONFLICT",
      "AUDIT ATTRIBUTION IS A DISPLAY FIELD",
      "UNAUTHORIZED OBSERVER DETECTED",
    ],
    echo: "We are not the only ones looking through these files. Find the receipt behind the screen.",
  },
  "4": {
    title: "The confession has no permission.",
    lines: [
      "PRESERVATION RECEIPT RECOVERED",
      "0xNULL: PURGE CAPABILITY DENIED",
      "A MIRROR EXISTS BEFORE THE PURGE",
    ],
    echo: "Why would the person destroying a life keep the one copy that could restore it? We need the order of events.",
  },
  "5": {
    title: "You were following a fabricated trail.",
    lines: [
      "DISPLAY CAPTION DOES NOT MATCH STORAGE ACTION",
      "0xNULL: EMERGENCY PRESERVATION IDENTITY",
      "ARCHIVIST REWROTE THE ACCUSATION",
    ],
    echo: "Aarya made 0xNULL to preserve the evidence. I am its recovery routine. I could recover fragments, but only a human witness could challenge the record. I should have told you sooner.",
  },
  "6": {
    title: "A name survives the machine.",
    lines: [
      "ORIGINAL IDENTITY CHECKSUM VERIFIED",
      "ARCHIVIST OVERRIDE REJECTED",
      "HUMAN WITNESS REQUIRED FOR FINAL DISPOSITION",
    ],
    echo: "You have the proof. Restore Aarya’s name, or make the lie impossible to contain. I cannot make this choice for you.",
  },
};
const timeline: TimelineCard[] = [
  {
    id: "purge",
    time: "03:42",
    title: "Identity purged",
    text: "The public index is erased. The exported caption names 0xNULL; the storage receipt carries a different signer.",
  },
  {
    id: "backup",
    time: "03:18",
    title: "Recovery routine written",
    text: "An immutable mirror and recovery checksum are stored. Operator 0xNULL has write-to-mirror access, but no purge permission.",
  },
  {
    id: "echo",
    time: "03:43",
    title: "ECHO wakes",
    text: "A surviving recovery process begins searching for an independent human witness.",
  },
  {
    id: "audit",
    time: "03:09",
    title: "Unauthorized edits discovered",
    text: "Aarya flags unexplained identity edits. The raw storage journal is separated from the editable audit display.",
  },
];
export function narrativeFor(p: Player): NarrativeState {
  const done = (id: number) => !!p.progress[id]?.completedAt;
  const completed = Object.values(p.progress).filter(
    (x) => x.completedAt,
  ).length;
  const suspects: SuspectProfile[] = [
    {
      id: "null",
      name: "0xNULL",
      role: "UNIDENTIFIED OPERATOR",
      status: done(5)
        ? "PRESERVATION IDENTITY"
        : done(4)
          ? "ATTRIBUTION DISPUTED"
          : "PRIMARY LEAD",
      unlocked: true,
      known: [
        "Appears in the archive reconstruction. Face and account identity are unavailable.",
        ...(done(2) ? ["Its signature appears on a mirror packet."] : []),
        ...(done(4)
          ? [
              "A storage receipt grants mirror-write permission and explicitly denies purge access.",
            ]
          : []),
        ...(done(5)
          ? ["Aarya’s emergency protocol used this alias to preserve evidence."]
          : []),
      ],
      contradictions: [
        done(4)
          ? "The alleged deletion operator could not issue a purge command."
          : "A displayed operator label is an accusation, not a verified identity.",
      ],
      evidence: [
        "identity",
        ...(done(2) ? ["2"] : []),
        ...(done(4) ? ["4"] : []),
        ...(done(5) ? ["5"] : []),
      ],
    },
    {
      id: "voss",
      name: "DR. VOSS",
      role: "ARCHIVE ADMINISTRATOR",
      status: done(3) ? "ACCESS DOES NOT PROVE INTENT" : "PROFILE INCOMPLETE",
      unlocked: done(1),
      known: done(1)
        ? ["Authorized maintenance access to Meridian’s archive."]
        : [],
      contradictions: done(3)
        ? [
            "The 02:16 recovery ticket reserves unnamed identities for preservation. No evidence places Voss at the purge command.",
          ]
        : [],
      evidence: done(3) ? ["1", "3"] : done(1) ? ["1"] : [],
    },
    {
      id: "archivist",
      name: "ARCHIVIST",
      role: "RECORD-MANAGEMENT SYSTEM",
      status: done(5) ? "AUDIT MANIPULATION VERIFIED" : "SYSTEM OF RECORD",
      unlocked: true,
      known: [
        "Controls the official record and renders its audit display.",
        ...(done(3)
          ? [
              "Supplies the operator-attribution field in the displayed reconstruction.",
            ]
          : []),
        ...(done(5)
          ? [
              "Substituted the deletion caption and concealed its own signature.",
            ]
          : []),
      ],
      contradictions: done(3)
        ? [
            "The raw storage timestamps disagree with its claim that deletion was complete.",
          ]
        : [
            "Its claim of perfect integrity has not been independently verified.",
          ],
      evidence: [
        "identity",
        ...(done(3) ? ["3"] : []),
        ...(done(5) ? ["5"] : []),
      ],
    },
    {
      id: "echo",
      name: "ECHO",
      role: "UNVERIFIED RECOVERY ASSISTANT",
      status: done(5) ? "ORIGIN DISCLOSED" : "HELPFUL / UNVERIFIED",
      unlocked: true,
      known: [
        "Knows routes the public archive no longer lists.",
        ...(done(4)
          ? [
              "Its process can read preserved fragments, not edit official identities.",
            ]
          : []),
        ...(done(5)
          ? ["Aarya attached ECHO to the emergency preservation protocol."]
          : []),
      ],
      contradictions: [
        done(5)
          ? "Withheld its connection to Aarya while asking you to trust it."
          : "Will not explain how it remembers a deleted student.",
      ],
      evidence: [
        "identity",
        ...(done(2) ? ["2"] : []),
        ...(done(4) ? ["4"] : []),
        ...(done(5) ? ["5"] : []),
      ],
    },
  ];
  const echo = p.ending
    ? p.ending === "restore"
      ? "The register has their name again. The evidence stays with the witness."
      : "The audit is on every terminal. A thousand witnesses are harder to erase."
    : completed >= 5
      ? "I was part of Aarya’s preservation protocol. ARCHIVIST: you can rewrite a label. You cannot rewrite the witness holding the checksum."
      : completed >= 4
        ? "The permission receipt contradicts the confession. Do not choose a culprit until the clocks agree."
        : completed >= 3
          ? "0xNULL is in the logs. So is a gap in the accusation. Please read the receipt, not just the caption."
          : completed >= 2
            ? "The archive has noticed the signal. I am still here. Compare what it claims with what it kept."
            : completed >= 1
              ? "A recovery door before a disappearance. Someone anticipated this night."
              : "The archive says a name never existed. The footage says someone erased it. Neither claim is proof. Will you look?";
  const result: NarrativeState = {
    evidence: Object.fromEntries(
      Object.entries(evidence).filter(
        ([id]) => id === "identity" || done(Number(id)),
      ),
    ),
    events: Object.fromEntries(
      Object.entries(events).filter(([id]) => done(Number(id))),
    ),
    suspects,
    identity: p.onboarded ? { name: "AARYA SEN", id: "AS-042" } : undefined,
    signal: done(1) ? "UkVHT0xJVEg=" : undefined,
    timeline: done(4) ? timeline : [],
    echo,
  };
  if (p.ending && done(6)) {
    result.epilogue =
      p.ending === "restore"
        ? {
            record: [
              "AARYA SEN / AS-042",
              "ENROLLMENT: RESTORED",
              "EVIDENCE: PRESERVED",
              "AUTHORITY: INDEPENDENT WITNESS",
            ],
            message:
              "“I do not know whether a name is enough to bring someone home. But it is where you begin. You kept mine.” — Aarya, recovered message",
            echo: "My last instruction was to find someone who would remember. You did.",
          }
        : {
            record: [
              "AUDIT ORIGIN: ARCHIVIST",
              "DISPLAY CAPTION: FALSIFIED",
              "PRESERVATION RECEIPT: VERIFIED",
              "DELIVERY: MERIDIAN NETWORK / COMPLETE",
            ],
            message:
              "Across the fictional campus, screens stop agreeing with the official story. Voss preserves the raw journal. Students read the two signatures side by side. The system can still answer. It can no longer answer alone.",
            echo: "Aarya left a copy. You gave it witnesses.",
          };
    result.perspective = [
      "The opening is labelled an ARCHIVIST audit reconstruction. Its overlay clock is explicitly unverified; it is not a raw camera timestamp.",
      "At 03:18, 0xNULL wrote an immutable mirror. Its capability receipt denied purge access. The packet you decoded already carried the MIRROR header.",
      "At 03:42, ARCHIVIST erased the public index and replaced the mirror-write caption with IDENTITY PURGE. The shadow did not change; the accusation did.",
      "0xNULL was Aarya’s emergency preservation identity. ECHO was its recovery routine. The surviving activity and mismatched receipts allowed you to test the footage rather than merely believe it.",
    ];
  }
  return result;
}
export function echoReply(p: Player, question: string): string {
  const q = question.toLowerCase();
  const n = narrativeFor(p);
  if (/next|stuck|help|mission/.test(q)) {
    const chapter = Math.min(
      6,
      Object.values(p.progress).filter((x) => x.completedAt).length + 1,
    );
    return `${n.echo} ${missions[chapter - 1].guide}`;
  }
  if (/solution|answer|hint/.test(q))
    return "I will not give you the solution. Use the field guide for a direction, or request a scored hint. Your observations must remain yours.";
  if (/encod|encrypt|base64/.test(q))
    return "Encoding changes representation. Encryption protects content with a key. Base64 is reversible encoding, not a secret vault.";
  if (/score|point/.test(q))
    return "A chapter earns 100 XP and a correct first submission earns 25 more. Hints cost 10, then 20, then 30 XP. The field guide and provisional theories are free.";
  if (/theor|suspect|0xnull|operator|voss|archivist|trust/.test(q))
    return p.progress[5]?.completedAt
      ? "The raw receipt, denied purge capability and ordered timestamps expose ARCHIVIST’s caption substitution. 0xNULL preserved the mirror. You can revise your theory without losing any XP."
      : n.echo +
          " The suspect board separates what is known from what contradicts it. A theory is a question, not a conviction.";
  if (/echo|who are|aarya|student/.test(q))
    return p.progress[5]?.completedAt
      ? "Aarya wrote the emergency preservation protocol. I am its recovery routine. I needed a human witness because I could not certify the truth of my own records."
      : "Aarya Sen studied the ethics of automated records. I remember routes to their fragments. I am not ready to tell you why. Do not mistake that for evidence of innocence.";
  return (
    n.echo +
    " Follow the current case file. Compare the source of a claim with the claim itself."
  );
}
