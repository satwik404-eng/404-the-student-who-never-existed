import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  FileCode2,
  FileText,
  FolderOpen,
  GripVertical,
  Lightbulb,
  LockKeyhole,
  Radio,
  Send,
  ShieldAlert,
} from "lucide-react";
import { missions } from "../shared/content";
import type { ArchiveRecord, TimelineCard } from "../shared/types";
import { request } from "./api";
import { sound, useGame } from "./store";
import { ElapsedClock, Loading, PageTitle, Tag } from "./ui";
import { formatTime } from "./Pages";

import {
  presentationScope,
  timelineInitialOrder,
  usePresentation,
} from "./presentation";
const ChapterIntro = lazy(() =>
  import("./Cinematics").then((m) => ({ default: m.ChapterIntro })),
);
const StoryTransition = lazy(() =>
  import("./Cinematics").then((m) => ({ default: m.StoryTransition })),
);

export function MissionPage() {
  const { id } = useParams();
  return <MissionContent key={id} number={Number(id)} />;
}
function MissionContent({ number }: { number: number }) {
  const s = useGame((x) => x.state)!;
  const act = useGame((x) => x.act);
  const navigate = useNavigate();
  const mission = missions[number - 1];
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<string[]>(timelineInitialOrder);
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const progress = s.progress[number];
  const done = !!progress?.completedAt;
  const fifthComplete = !!s.progress["5"]?.completedAt;
  const presentation = usePresentation();
  const [params, setParams] = useSearchParams();
  const [story, setStory] = useState(false);
  const scope = presentationScope(s);
  const [introOpen, setIntroOpen] = useState(
    () =>
      !done &&
      !(s.cinematicsSeen || []).includes(number) &&
      !(presentation.seen[scope] || []).includes(number),
  );
  const replayIntro = params.get("intro") === "replay";
  const markIntroSeen = presentation.markSeen;
  const showIntro =
    !!mission && number <= s.chapter && (introOpen || replayIntro);
  useEffect(() => {
    if (!showIntro || replayIntro) return;
    // Record first display on the account, but retain this mounted intro until
    // Continue/Skip. A refresh or another browser must not replay it implicitly.
    markIntroSeen(scope, number);
    void act({ op: "cinematic-seen", mission: number }).catch((e) =>
      setMessage(e.message),
    );
  }, [showIntro, replayIntro, act, scope, number, markIntroSeen]);
  function enterChapter() {
    setIntroOpen(false);
    presentation.markSeen(scope, number);
    if (params.has("intro")) {
      const next = new URLSearchParams(params);
      next.delete("intro");
      setParams(next, { replace: true });
    }
  }
  useEffect(() => {
    if (number !== 6 || !fifthComplete || done || showIntro) return;
    act({ op: "final-start" }).catch((e) => setMessage(e.message));
  }, [number, act, done, fifthComplete, showIntro]);
  useEffect(() => {
    if (number !== 6) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [number]);
  if (!mission) return <Navigate to="/investigation" replace />;
  if (number > s.chapter)
    return (
      <div className="workspace empty-state">
        <LockKeyhole size={40} />
        <h1>This partition is locked.</h1>
        <Link className="button" to={`/investigation/mission/${s.chapter}`}>
          RETURN TO ACTIVE CHAPTER
        </Link>
      </div>
    );
  const remaining = Math.max(
    0,
    Math.ceil(((s.finalDeadline || now) - now) / 1000),
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await act({
        op: "submit",
        mission: number,
        answer: number === 5 ? order : answer,
      });
      setMessage(result.message || "");
      if (result.success && !done) setStory(true);
      sound(result.success ? "success" : "error");
    } catch (e) {
      setMessage((e as Error).message);
      sound("error");
    } finally {
      setBusy(false);
    }
  }
  async function getHint() {
    setBusy(true);
    try {
      const result = await act({ op: "hint", mission: number });
      setHint(result.hint || "");
      sound();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function finish(ending: "restore" | "expose") {
    setBusy(true);
    try {
      await act({ op: "finish", ending });
      sound("success");
      navigate(`/endings/${ending}`);
    } catch (e) {
      setMessage((e as Error).message);
      setBusy(false);
    }
  }
  if (showIntro)
    return (
      <Suspense fallback={<Loading />}>
        <ChapterIntro chapter={number} onContinue={enterChapter} />
      </Suspense>
    );
  return (
    <div className="workspace mission-page">
      <div className="workspace-top">
        <Link className="back-link" to="/investigation">
          <ArrowLeft size={14} />
          RECOVERY DESKTOP
        </Link>
        <span className="eyebrow">
          CHAPTER {String(number).padStart(2, "0")} / 06
        </span>
        <ElapsedClock state={s} />
        <span className="mono lime">{s.score} XP</span>
      </div>
      <div className="mission-layout">
        <aside className="mission-sidebar">
          <span className="eyebrow">RECOVERY SEQUENCE</span>
          {missions.map((m) => (
            <div
              className={`mission-step ${m.id === number ? "selected" : ""}`}
              key={m.id}
            >
              {m.id <= s.chapter ? (
                <Link to={`/investigation/mission/${m.id}`}>
                  <span>
                    {s.progress[m.id]?.completedAt ? (
                      <Check size={15} />
                    ) : (
                      String(m.id).padStart(2, "0")
                    )}
                  </span>
                  {m.title}
                </Link>
              ) : (
                <span className="locked-step">
                  <span>0{m.id}</span>
                  CLASSIFIED
                  <LockKeyhole size={12} />
                </span>
              )}
            </div>
          ))}
          <Link className="sidebar-journal" to="/investigation/evidence">
            <FolderOpen size={17} />
            EVIDENCE JOURNAL
            <ArrowUpRight size={13} />
          </Link>
          <div className="sidebar-note">
            <Radio size={18} />
            <p>“Stay with the record. The record stayed with you.”</p>
            <span>— ECHO</span>
          </div>
        </aside>
        <div className="mission-content">
          <PageTitle
            eyebrow={mission.type}
            title={mission.title}
            description={mission.subtitle}
          />
          <div className="chapter-replay">
            <Link className="text-button" to={`?intro=replay`}>
              REPLAY CHAPTER INTRO <ArrowUpRight size={13} />
            </Link>
            <Link className="text-button" to="/investigation/suspects">
              OPEN SUSPECT BOARD <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="mission-brief">
            <span className="eyebrow">THE OBJECTIVE</span>
            <p>{mission.brief}</p>
          </div>
          {number === 6 && !done && (
            <div
              className={`firewall-countdown ${remaining < 30 ? "critical" : ""}`}
            >
              <ShieldAlert size={22} />
              <div>
                <b>ARCHIVIST IS CLOSING THE CONNECTION</b>
                <small>
                  Your evidence survives. The firewall window can be restarted.
                </small>
              </div>
              <strong>{formatTime(remaining)}</strong>
              {remaining === 0 && (
                <button
                  className="button secondary"
                  onClick={() =>
                    void act({ op: "final-start" }).catch((e) =>
                      setMessage(e.message),
                    )
                  }
                >
                  RETRY WINDOW
                </button>
              )}
            </div>
          )}
          {number === 6 && (
            <div className="final-system-voice">
              <span className="eyebrow">ARCHIVIST / INTEGRITY ENFORCEMENT</span>
              <p>“You are an inconsistency. I will correct you.”</p>
              <span className="eyebrow lime">ECHO / INDEPENDENT CHANNEL</span>
              <p>
                {s.narrative?.echo ||
                  "A name is not an error the system can correct."}
              </p>
            </div>
          )}
          <section className="mission-workspace panel">
            <div className="panel-top">
              <span className="eyebrow">
                <span className="status-dot" /> INVESTIGATION WORKSPACE
              </span>
              <span className="mono dim">{done ? "VERIFIED" : "LIVE"}</span>
            </div>
            {number === 1 && <SourceMirror />}
            {number === 2 && <Decoder />}
            {number === 3 && <Archive embedded />}
            {number === 4 && <Terminal />}
            {number === 5 && (
              <Timeline
                order={order}
                setOrder={setOrder}
                cards={s.narrative?.timeline || []}
              />
            )}{" "}
            {number === 6 && (
              <div className="final-evidence">
                <FingerprintCard redacted />
                <div>
                  <Tag tone="critical">ARCHIVIST / MESSAGE</Tag>
                  <h2>
                    “A record is only real
                    <br />
                    if I say it is.”
                  </h2>
                  <p>
                    ECHO: The checksum survived. Use the original identifier on
                    the recovered card. It is time to disagree.
                  </p>
                  <Link className="text-button" to="/investigation/evidence">
                    REOPEN YOUR EVIDENCE
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </section>
          {done ? (
            <div className="mission-success" role="status">
              <span className="verified-symbol">
                <Check size={24} />
              </span>
              <div>
                <span className="eyebrow">
                  EVIDENCE VERIFIED / {progress.attempts === 1 ? "125" : "100"}{" "}
                  XP AWARDED
                </span>
                <h2>
                  {number === 6
                    ? "The identity matches. Choose what survives."
                    : "The archive remembers."}
                </h2>
                <p>{missions[number - 1].evidence} added to your journal.</p>
              </div>
              <button className="text-button" onClick={() => setStory(true)}>
                REPLAY RECOVERY EVENT
              </button>
              {number < 6 && (
                <Link
                  className="button"
                  to={`/investigation/mission/${number + 1}`}
                >
                  NEXT CHAPTER
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          ) : (
            <form className="verification" onSubmit={submit}>
              <label className="field">
                {number === 5
                  ? "TIMELINE VERIFICATION"
                  : "RECOVERY VERIFICATION"}
                {number !== 5 && (
                  <input
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={100}
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={
                      number === 3
                        ? "Enter suspicious record ID"
                        : number === 4
                          ? "Enter the recovered phrase"
                          : number === 6
                            ? "Enter original student ID"
                            : "Enter recovered key or word"
                    }
                    aria-label="Mission answer"
                  />
                )}
              </label>
              <button
                className="button"
                disabled={busy || (number === 6 && remaining === 0)}
                type="submit"
              >
                {busy
                  ? "VERIFYING…"
                  : number === 5
                    ? "VERIFY TIMELINE"
                    : "VERIFY DISCOVERY"}
                <ArrowUpRight size={17} />
              </button>
            </form>
          )}
          {number === 6 && done && (
            <div className="ending-choice">
              <button disabled={busy} onClick={() => void finish("restore")}>
                <span className="eyebrow">CHOICE A / RESTORE</span>
                <h3>Give Aarya their name back.</h3>
                <p>Restore the identity. Keep the recovered evidence intact.</p>
                <ArrowUpRight size={20} />
              </button>
              <button disabled={busy} onClick={() => void finish("expose")}>
                <span className="eyebrow">CHOICE B / EXPOSE</span>
                <h3>Give the truth to everyone.</h3>
                <p>
                  Release the audit across the fictional university network.
                </p>
                <ArrowUpRight size={20} />
              </button>
            </div>
          )}
          {message && (
            <p role="status" className={done ? "feedback success" : "feedback"}>
              {message}
            </p>
          )}
          {!done && (
            <section className="hint-area">
              <div>
                <Lightbulb size={17} />
                <span>ECHO is still here.</span>
                <button
                  disabled={busy || (progress?.hints || 0) >= 3}
                  className="text-button"
                  onClick={() => void getHint()}
                >
                  {(progress?.hints || 0) >= 3
                    ? "ALL HINTS RECOVERED"
                    : `REQUEST HINT / −${[10, 20, 30][progress?.hints || 0]} XP`}
                  <ChevronRight size={15} />
                </button>
              </div>
              {hint && (
                <p className="haunted" role="status">
                  “{hint}”
                </p>
              )}
              {(progress?.hints || 0) > 0 && !hint && (
                <p className="haunted">
                  “{s.recoveredHints[String(number)]?.at(-1)}”
                </p>
              )}
            </section>
          )}
        </div>
      </div>
      {story && s.narrative?.events[String(number)] && (
        <Suspense fallback={<Loading />}>
          <StoryTransition
            chapter={number}
            event={s.narrative.events[String(number)]}
            onClose={() => setStory(false)}
            onNext={() => {
              setStory(false);
              if (number < 6) navigate(`/investigation/mission/${number + 1}`);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

function SourceMirror() {
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try {
      const response = await fetch("/");
      if (!response.ok) throw new Error("Unable to read the source.");
      setSource(await response.text());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="source-mirror">
      <FileCode2 size={36} />
      <h2>There is more beneath the page.</h2>
      <p>
        Open your browser’s page source or developer tools. Look for a comment
        Aarya left in the original HTML. On mobile, the mirror below shows the
        same source as safe, readable text.
      </p>
      <button className="button secondary" onClick={() => void load()}>
        <Eye size={16} />
        {source ? "REFRESH SOURCE MIRROR" : "OPEN SOURCE MIRROR"}
      </button>
      {source && (
        <pre
          className="source-code"
          tabIndex={0}
          aria-label="Original HTML source"
        >
          {source}
        </pre>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function decodeBase64(value: string) {
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.length > 4096 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)
  )
    throw new Error("That is not a valid Base64 transmission.");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(atob(trimmed), (c) => c.charCodeAt(0)),
    );
  } catch {
    throw new Error("The transmission is incomplete or not UTF-8 text.");
  }
}
function Decoder() {
  const signal = useGame((x) => x.state?.narrative?.signal) || "";
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  function decode(e: FormEvent) {
    e.preventDefault();
    try {
      setResult(decodeBase64(input));
      setError("");
      sound();
    } catch (e) {
      setError((e as Error).message);
      setResult("");
    }
  }
  return (
    <div className="decoder">
      <div className="signal-block">
        <span className="eyebrow">INTERCEPTED TRANSMISSION / BASE64</span>
        <p className="signal-text">{signal || "SIGNAL UNAVAILABLE"}</p>
        <span className="mono dim">SOURCE: ECHO / PARTITION UNKNOWN</span>
      </div>
      <form onSubmit={decode}>
        <label className="field">
          TRANSMISSION INPUT
          <textarea
            maxLength={4096}
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste the encoded transmission"
          />
        </label>
        <button
          type="button"
          className="text-button"
          disabled={!signal}
          onClick={() => setInput(signal)}
        >
          LOAD INTERCEPTED SIGNAL
        </button>
        <button type="submit" className="button secondary">
          DECODE SIGNAL
          <ArrowDown size={16} />
        </button>
      </form>
      {result && (
        <div className="decoded-result" role="status">
          <span className="eyebrow">RECOVERED TEXT</span>
          <strong>{result}</strong>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <details className="educational">
        <summary>Encoding is not encryption.</summary>
        <p>
          Base64 changes how bytes are represented so they can travel as
          printable text. Anyone can reverse it without a secret key. Encryption
          uses a cryptographic key to protect the content. Encoding is never a
          substitute for encryption.
        </p>
      </details>
    </div>
  );
}

export function Archive({ embedded = false }: { embedded?: boolean }) {
  const s = useGame((x) => x.state)!;
  const [records, setRecords] = useState<ArchiveRecord[] | null>(null);
  const [raw, setRaw] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const allowed = !!s.progress["2"]?.completedAt;
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    request({ op: "archive" })
      .then((r) => {
        if (live) {
          setRecords(r.records || []);
          setError("");
        }
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [allowed, revision]);
  const content = !allowed ? (
    <div className="empty-state">
      <LockKeyhole />
      <h2>Archive locked.</h2>
      <p>Decode the transmission in chapter 2 first.</p>
    </div>
  ) : (
    <div className="archive-browser">
      <div className="archive-toolbar">
        <span>
          <FolderOpen size={16} /> /students / recovered_records
        </span>
        <button className="text-button" onClick={() => setRaw(!raw)}>
          {raw ? "HUMAN VIEW" : "RAW JSON"}
          <FileCode2 size={15} />
        </button>
      </div>
      <p className="archive-rule">
        All timestamps are UTC. Under the archive’s rules, student activity must
        stop when a record is deleted.
      </p>
      {error ? (
        <div className="error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => setRevision((x) => x + 1)}
          >
            RETRY CONNECTION
          </button>
        </div>
      ) : !records ? (
        <Loading />
      ) : raw ? (
        <pre className="json-view" tabIndex={0}>
          {JSON.stringify({ timezone: "UTC", records }, null, 2)}
        </pre>
      ) : (
        <div className="record-list">
          {records.map((r) => (
            <article key={r.id} className="archive-record">
              <div>
                <FileText size={23} />
                <span className="mono">{r.id}</span>
                <Tag>{r.deleted ? "DELETED" : "ENROLLED"}</Tag>
              </div>
              <h3>{r.name}</h3>
              <dl>
                <div>
                  <dt>ENROLLED</dt>
                  <dd>{displayDate(r.enrolled)}</dd>
                </div>
                <div>
                  <dt>LAST ACTIVITY</dt>
                  <dd>{displayDate(r.lastSeen)}</dd>
                </div>
                <div>
                  <dt>DELETED</dt>
                  <dd>{r.deleted ? displayDate(r.deleted) : "—"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
  return embedded ? (
    content
  ) : (
    <div className="workspace">
      <Link className="back-link" to="/investigation">
        <ArrowLeft size={14} />
        RECOVERY DESKTOP
      </Link>
      <PageTitle
        eyebrow="READ ONLY / FICTIONAL RECORD SERVICE"
        title="Archive explorer"
        description="The timestamps use the same clock. One record is lying."
      />
      <section className="panel">{content}</section>
    </div>
  );
}
const displayDate = (date: string) =>
  `${date.slice(0, 10)} · ${date.slice(11, 19)} UTC`;

export function Terminal({ standalone = false }: { standalone?: boolean }) {
  const s = useGame((x) => x.state)!;
  const act = useGame((x) => x.act);
  const allowed = !!s.progress["3"]?.completedAt;
  const terminalKey = `404-terminal-v3:${presentationScope(s)}`;
  const [lines, setLines] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(terminalKey) || "[]");
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/");
  const [busy, setBusy] = useState(false);
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => {
    sessionStorage.setItem(terminalKey, JSON.stringify(lines.slice(-120)));
    output.current?.scrollTo(0, output.current.scrollHeight);
  }, [lines, terminalKey]);
  async function run(e: FormEvent) {
    e.preventDefault();
    const command = input.trim();
    if (!command || busy) return;
    setInput("");
    setCursor(-1);
    setHistory((x) => [...x, command]);
    if (command === "clear") {
      setLines([]);
      return;
    }
    if (command === "history") {
      setLines((x) => [
        ...x,
        `witness:${cwd}$ history`,
        ...history.map((c, i) => `${i + 1}  ${c}`),
      ]);
      return;
    }
    setBusy(true);
    try {
      const result = await act({ op: "terminal", command, cwd });
      setLines((x) => [
        ...x,
        `witness:${cwd}$ ${command}`,
        result.output || "",
      ]);
      setCwd(result.cwd || cwd);
      sound();
    } catch (e) {
      setLines((x) => [
        ...x,
        `witness:${cwd}$ ${command}`,
        `ERROR: ${(e as Error).message}`,
      ]);
    } finally {
      setBusy(false);
    }
  }
  const content = allowed ? (
    <div className="terminal">
      <div className="terminal-title">
        <span>
          <i />
          <i />
          <i />
        </span>
        <span>WITNESS@MERIDIAN — RESTRICTED SHELL</span>
        <Tag>{s.fragments.length}/3 FRAGMENTS</Tag>
      </div>
      <div
        className="terminal-output"
        ref={output}
        role="log"
        aria-label="Terminal output"
        tabIndex={0}
      >
        <p className="terminal-welcome">
          ECHO RECOVERY SHELL v0.4
          <br />
          This is a fictional filesystem. Nothing executes on your computer.
          <br />
          Type <b>help</b> to begin. Use <b>ls /</b> to find the five
          directories.
        </p>
        {lines.map((line, i) => (
          <pre
            key={i}
            className={line.startsWith("witness:") ? "command-line" : ""}
          >
            {line}
          </pre>
        ))}
      </div>
      <form className="terminal-input" onSubmit={run}>
        <label htmlFor={standalone ? "standalone-command" : "mission-command"}>
          witness:{cwd}$
        </label>
        <input
          id={standalone ? "standalone-command" : "mission-command"}
          aria-label="Terminal command"
          autoComplete="off"
          spellCheck={false}
          maxLength={300}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab" && input.trim()) {
              const parts = input.split(/\s+/);
              const prefix = parts.at(-1)!;
              const choices =
                parts.length === 1
                  ? [
                      "help",
                      "ls",
                      "pwd",
                      "cd",
                      "cat",
                      "grep",
                      "history",
                      "clear",
                      "whoami",
                    ]
                  : [
                      "/archive",
                      "/logs",
                      "/students",
                      "/system",
                      "/classified",
                      "/archive/backup.log",
                      "/logs/access.log",
                      "/classified/witness.log",
                      "/students/aarya.txt",
                      "/system/readme.txt",
                    ];
              const matches = choices.filter((x) => x.startsWith(prefix));
              if (matches.length) {
                e.preventDefault();
                parts[parts.length - 1] = matches[0];
                setInput(parts.join(" "));
              }
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const i =
                cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
              setCursor(i);
              setInput(history[i] || "");
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const i = cursor + 1;
              setCursor(i >= history.length ? -1 : i);
              setInput(history[i] || "");
            }
          }}
        />
        <button disabled={busy} aria-label="Run command" type="submit">
          <ChevronRight size={19} />
        </button>
      </form>
    </div>
  ) : (
    <div className="empty-state">
      <LockKeyhole />
      <h2>Shell access locked.</h2>
      <p>Find the corrupted record in chapter 3 first.</p>
    </div>
  );
  return standalone ? (
    <div className="workspace">
      <Link className="back-link" to="/investigation">
        <ArrowLeft size={14} />
        RECOVERY DESKTOP
      </Link>
      <PageTitle
        eyebrow="RESTRICTED SHELL / SIMULATED ENVIRONMENT"
        title="Ghost in the terminal"
        description="Somewhere in these directories, a witness left three words."
      />
      {content}
    </div>
  ) : (
    content
  );
}

function Timeline({
  order,
  setOrder,
  cards,
}: {
  order: string[];
  setOrder: (ids: string[]) => void;
  cards: TimelineCard[];
}) {
  const [announcement, setAnnouncement] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    setAnnouncement(`Event moved to position ${to + 1}.`);
    sound();
  }
  if (!cards.length)
    return (
      <p>
        The recovered timeline is awaiting the matching story server. Your
        verified progress is intact.
      </p>
    );
  return (
    <div className="timeline-workspace">
      <div className="timeline-date">
        <Clock3 size={15} />
        04 NOVEMBER 2026 / ALL TIMES UTC
      </div>
      <p>
        Rebuild the sequence. Drag cards or use the arrow buttons to order the
        night from earliest to latest.
      </p>
      <p role="status" className="mono lime">
        {announcement}
      </p>
      <ol className="timeline-cards">
        {order.map((id, index) => {
          const card = cards.find((c) => c.id === id)!;
          return (
            <li
              key={id}
              draggable
              onDragStart={() => setDragged(id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragged) move(order.indexOf(dragged), index);
                setDragged(null);
              }}
            >
              <span className="timeline-position">0{index + 1}</span>
              <GripVertical size={17} className="dim" />
              <div>
                <span className="timeline-time">{card.time} UTC</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
              <div className="timeline-controls">
                <button
                  type="button"
                  disabled={index === 0}
                  className="icon-button"
                  aria-label={`Move ${card.title} earlier`}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={index === order.length - 1}
                  className="icon-button"
                  aria-label={`Move ${card.title} later`}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
function FingerprintCard({ redacted = false }: { redacted?: boolean }) {
  const identity = useGame((x) => x.state?.narrative?.identity);
  return (
    <div className="student-card">
      <span className="eyebrow">MERIDIAN UNIVERSITY</span>
      <div className="student-silhouette">
        <span />
        <i />
      </div>
      <span className="student-card-name">AARYA SEN</span>
      <strong>
        {redacted
          ? "[ID REDACTED — CHECK EVIDENCE JOURNAL]"
          : identity?.id || "AWAITING RECORD"}
      </strong>
      <span className="eyebrow">ORIGINAL STUDENT ID</span>
      <Tag tone="critical">RECOVERED / DELETED</Tag>
    </div>
  );
}
export function Evidence() {
  const s = useGame((x) => x.state)!;
  const keys = [
    "identity",
    ...missions
      .filter((m) => s.progress[m.id]?.completedAt)
      .map((m) => String(m.id)),
  ];
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(() =>
    keys.includes(params.get("artifact") || "")
      ? params.get("artifact")!
      : "identity",
  );
  const evidenceDetails =
    s.narrative?.evidence ||
    Object.fromEntries(
      keys.map((k) => [
        k,
        {
          title:
            k === "identity"
              ? "Deleted identity"
              : missions[Number(k) - 1].evidence,
          label: "RECOVERED ARTIFACT",
          text: "This artifact is preserved. Expanded case details require the matching story server.",
        },
      ]),
    );
  const selectedEvidence =
    evidenceDetails[selected] || evidenceDetails.identity;
  return (
    <div className="workspace">
      <Link className="back-link" to="/investigation">
        <ArrowLeft size={14} />
        RECOVERY DESKTOP
      </Link>
      <PageTitle
        eyebrow={`${keys.length} ARTIFACTS / AUTO-SAVED`}
        title="What the silence left behind"
        description="Every recovered fragment is a witness. Keep them close."
      />
      <div className="evidence-layout">
        <div className="evidence-files panel">
          <div className="panel-top">
            <span className="eyebrow">RECOVERED FILES</span>
            <FolderOpen size={16} />
          </div>
          {keys.map((k, i) => (
            <button
              key={k}
              className={selected === k ? "selected" : ""}
              onClick={() => setSelected(k)}
            >
              <FileText size={19} />
              <span>
                <b>{evidenceDetails[k].title}</b>
                <small>ARTIFACT_0{i + 1}</small>
              </span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
        <article className="evidence-detail panel">
          <div className="panel-top">
            <Tag>INTEGRITY VERIFIED</Tag>
            <span className="mono dim">
              {selected === "identity" ? "00" : selected}
            </span>
          </div>
          {selected === "identity" && <FingerprintCard />}
          <span className="eyebrow">{selectedEvidence.label}</span>
          <h2>{selectedEvidence.title}</h2>
          <p>{selectedEvidence.text}</p>
          <div className="evidence-stamp">
            RECOVERED
            <br />
            <small>DO NOT ERASE</small>
          </div>
        </article>
      </div>
    </div>
  );
}

export function Echo() {
  const s = useGame((x) => x.state)!;
  const act = useGame((x) => x.act);
  const mission = missions[s.chapter - 1];
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([
    {
      from: "ECHO",
      text:
        s.narrative?.echo ||
        "The archive has a perfect memory. That is what it wants you to believe. I can help you look closer.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask(text: string) {
    if (busy) return;
    setBusy(true);
    setMessages((m) => [...m, { from: "YOU", text }].slice(-60));
    try {
      const result = await act({ op: "echo", text });
      setMessages((m) =>
        [...m, { from: "ECHO", text: result.output || mission.guide }].slice(
          -60,
        ),
      );
      sound();
    } catch (e) {
      setMessages((m) =>
        [...m, { from: "SYSTEM", text: (e as Error).message }].slice(-60),
      );
    } finally {
      setBusy(false);
    }
  }

  async function hint() {
    setBusy(true);
    try {
      const result = await act({ op: "hint", mission: s.chapter });
      setMessages((m) => [...m, { from: "ECHO", text: result.hint || "" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "SYSTEM", text: (e as Error).message },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="workspace narrow">
      <PageTitle
        eyebrow="RECOVERY CHANNEL / IDENTITY UNVERIFIED"
        title="Someone is listening"
        description="A voice in the archive. Helpful does not mean innocent."
      />
      <div className="echo-chat panel">
        <div className="panel-top">
          <span className="eyebrow">
            <span className="status-dot" /> ECHO / ONLINE
          </span>
          <Radio size={18} />
        </div>
        <div className="chat-log" role="log" aria-label="ECHO conversation">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-message ${m.from === "YOU" ? "self" : ""}`}
            >
              <span>{m.from}</span>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
        <div className="echo-suggestions">
          {[
            "What do I do next?",
            "Who is Aarya?",
            "Can I trust 0xNULL?",
            "Encoding vs encryption",
            "How does scoring work?",
          ].map((t) => (
            <button disabled={busy} key={t} onClick={() => void ask(t)}>
              {t}
            </button>
          ))}
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              void ask(input.trim());
              setInput("");
            }
          }}
        >
          <input
            aria-label="Message ECHO"
            maxLength={280}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ECHO a question…"
          />
          <button
            className="icon-button"
            aria-label="Send to ECHO"
            disabled={busy}
            type="submit"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      <div className="hint-area">
        <p>
          The field guide offers free direction. Optional hints are more
          specific, but never reveal a solution.
        </p>
        <button
          disabled={
            busy ||
            (s.progress[s.chapter]?.hints || 0) >= 3 ||
            !!s.progress[s.chapter]?.completedAt
          }
          className="button secondary"
          onClick={() => void hint()}
        >
          <Lightbulb size={16} />
          REQUEST HINT / −
          {[10, 20, 30][s.progress[s.chapter]?.hints || 0] || 30} XP
        </button>
      </div>
    </div>
  );
}
