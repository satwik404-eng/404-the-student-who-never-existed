import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameState, SuspectId } from "../shared/types";
import { browserSlot } from "./client";

export const chapterCovers = [
  {
    theme: "DISCOVERY",
    hook: "Every system has a surface. Every surface hides something.",
    cue: "A COMMENT SURVIVED THE PURGE",
  },
  {
    theme: "UNCERTAINTY",
    hook: "The dead don’t transmit messages. Or do they?",
    cue: "A VOICE INSIDE THE INTERFERENCE",
  },
  {
    theme: "SUSPICION",
    hook: "The archive remembers an event that hasn’t happened yet.",
    cue: "ONE CLOCK. TWO INCOMPATIBLE STORIES.",
  },
  {
    theme: "PURSUIT",
    hook: "Someone accessed the system before you. Someone knew you would come.",
    cue: "FOLLOW THE OPERATOR’S SHADOW",
  },
  {
    theme: "REVELATION",
    hook: "The evidence points to one suspect. The truth points elsewhere.",
    cue: "A CAPTION IS NOT A CONFESSION",
  },
  {
    theme: "CONFRONTATION",
    hook: "You were never investigating a disappearance. You were investigating a cover-up.",
    cue: "THE SYSTEM HAS NOTICED THE WITNESS",
  },
] as const;
export const timelineInitialOrder = ["purge", "backup", "echo", "audit"];
export interface Theory {
  suspect: SuspectId;
  chapter: number;
  at: number;
  evidence: string[];
}
interface Presentation {
  seen: Record<string, number[]>;
  theories: Record<string, Theory[]>;
  links: Record<string, Record<string, string[]>>;
  markSeen: (scope: string, chapter: number) => void;
  theorize: (scope: string, theory: Omit<Theory, "at">) => void;
  connect: (scope: string, suspect: SuspectId, evidence: string) => void;
}
// Presentation-only data. It never grants progress, evidence or XP.
export const usePresentation = create<Presentation>()(
  persist(
    (set) => ({
      seen: {},
      theories: {},
      links: {},
      markSeen: (scope, chapter) =>
        set((s) => ({
          seen: {
            ...s.seen,
            [scope]: [...new Set([...(s.seen[scope] || []), chapter])],
          },
        })),
      theorize: (scope, theory) =>
        set((s) => ({
          theories: {
            ...s.theories,
            [scope]: [
              ...(s.theories[scope] || []),
              { ...theory, at: Date.now() },
            ].slice(-12),
          },
        })),
      connect: (scope, suspect, evidence) =>
        set((s) => {
          const prior = s.links[scope]?.[suspect] || [];
          return {
            links: {
              ...s.links,
              [scope]: {
                ...s.links[scope],
                [suspect]: prior.includes(evidence)
                  ? prior.filter((x) => x !== evidence)
                  : [...prior, evidence],
              },
            },
          };
        }),
    }),
    {
      name: "404-presentation-v3",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
export function presentationScope(s: GameState) {
  return `${s.id}:${browserSlot()}:${s.startedAt}`;
}
export function chapterVisible(s: GameState | null, chapter: number) {
  return chapter <= 2 || (!!s && chapter <= s.chapter);
}
