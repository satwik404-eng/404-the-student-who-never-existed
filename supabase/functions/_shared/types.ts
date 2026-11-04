export type Ending = "restore" | "expose";
export interface Mission {
  id: number;
  title: string;
  subtitle: string;
  type: string;
  brief: string;
  guide: string;
  evidence: string;
}
export interface Progress {
  attempts: number;
  hints: number;
  completedAt?: number;
}
export interface Player {
  id: string;
  nickname: string;
  onboarded?: boolean;
  startedAt: number;
  progress: Record<string, Progress>;
  fragments: string[];
  ending?: Ending;
  completedAt?: number;
  finalDeadline?: number;
  optIn: boolean;
  roomCodes?: string[];
  roomCreationTimes?: number[];
}
export interface GameState extends Player {
  score: number;
  rank: string;
  chapter: number;
  hintsUsed: number;
  recoveredHints: Record<string, string[]>;
}
export interface ArchiveRecord {
  id: string;
  name: string;
  enrolled: string;
  lastSeen: string;
  deleted: string | null;
}
export interface Member {
  id: string;
  nickname: string;
  role: "A" | "B";
  ready: boolean;
  seen: number;
}
export interface Chat {
  id: string;
  sender: string;
  text: string;
  at: number;
}
export interface Room {
  code: string;
  host: string;
  members: Member[];
  status: "waiting" | "active" | "solved" | "closed";
  messages: Chat[];
  createdAt: number;
}
export interface RoomView extends Room {
  clue: string;
  role: "A" | "B";
}
export interface Ranking {
  nickname: string;
  score: number;
  rank: string;
  seconds: number;
  ending: Ending;
}
export interface GameResponse {
  state?: GameState;
  message?: string;
  success?: boolean;
  hint?: string;
  records?: ArchiveRecord[];
  output?: string;
  cwd?: string;
  room?: RoomView;
  entries?: Ranking[];
}
export interface GameRequest {
  op: string;
  browserId?: string;
  mission?: number;
  answer?: string | string[];
  command?: string;
  cwd?: string;
  code?: string;
  text?: string;
  ending?: Ending;
  nickname?: string;
  optIn?: boolean;
}
