import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameRequest, GameResponse, GameState } from "../shared/types";
import { request } from "./api";
let identityEpoch = 0;
interface GameStore {
  state: GameState | null;
  loading: boolean;
  error: string;
  reset: () => void;
  refresh: () => Promise<void>;
  act: (r: GameRequest) => Promise<GameResponse>;
}
export const useGame = create<GameStore>((set) => ({
  state: null,
  loading: true,
  error: "",
  reset: () => {
    identityEpoch++;
    set({ state: null, loading: false, error: "" });
  },
  refresh: async () => {
    const epoch = identityEpoch;
    set({ loading: true, error: "" });
    try {
      const result = await request({ op: "state" });
      if (epoch === identityEpoch) set({ state: result.state, loading: false });
    } catch (e) {
      if (epoch === identityEpoch)
        set({ error: (e as Error).message, loading: false });
    }
  },
  act: async (r) => {
    const epoch = identityEpoch;
    const result = await request(r);
    if (result.state && epoch === identityEpoch) set({ state: result.state });
    return result;
  },
}));
interface Prefs {
  muted: boolean;
  volume: number;
  reduced: boolean;
  timer: boolean;
  set: (p: Partial<Omit<Prefs, "set">>) => void;
}
export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      muted: true,
      volume: 0.25,
      reduced:
        typeof matchMedia !== "undefined" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches,
      timer: true,
      set: (p) => set(p),
    }),
    { name: "404-preferences" },
  ),
);
export function sound(kind: "click" | "success" | "error" = "click") {
  const p = usePrefs.getState();
  if (p.muted || p.volume === 0) return;
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    gain.connect(ctx.destination);
    osc.connect(gain);
    osc.frequency.setValueAtTime(
      kind === "success" ? 620 : kind === "error" ? 120 : 340,
      ctx.currentTime,
    );
    osc.frequency.exponentialRampToValueAtTime(
      kind === "success" ? 930 : 90,
      ctx.currentTime + 0.15,
    );
    gain.gain.setValueAtTime(p.volume * 0.13, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.21);
    osc.onended = () => void ctx.close();
  } catch {
    /* Audio is optional and only starts after a user gesture. */
  }
}
