import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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
import { evidenceDetails, missions, timelineCards } from "../shared/content";
import type { ArchiveRecord } from "../shared/types";
import { request } from "./api";
import { sound, useGame } from "./store";
import { Loading, PageTitle, Tag } from "./ui";
import { formatTime } from "./Pages";

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
  const [order, setOrder] = useState(timelineCards.map((x) => x.id));
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const progress = s.progress[number];
  const done = !!progress?.completedAt;
  const fifthComplete = !!s.progress["5"]?.completedAt;
  useEffect(() => {
    if (number !== 6 || !fifthComplete || done) return;
    act({ op: "final-start" }).catch((e) => setMessage(e.message));
  }, [number, act, done, fifthComplete]);
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
                  {m.title}
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
              <Timeline order={order} setOrder={setOrder} />
            )}{" "}
            {number === 6 && (
              <div className="final-evidence">
                <FingerprintCard />
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
        <p className="signal-text">UkVHT0xJVEg=</p>
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
  const [lines, setLines] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("404-terminal-output") || "[]");
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
    sessionStorage.setItem(
      "404-terminal-output",
      JSON.stringify(lines.slice(-120)),
    );
    output.current?.scrollTo(0, output.current.scrollHeight);
  }, [lines]);
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
            if (e.key === "ArrowUp") {
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
}: {
  order: string[];
  setOrder: (ids: string[]) => void;
}) {
  const [dragged, setDragged] = useState<string | null>(null);
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    sound();
  }
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
      <ol className="timeline-cards">
        {order.map((id, index) => {
          const card = timelineCards.find((c) => c.id === id)!;
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
function FingerprintCard() {
  return (
    <div className="student-card">
      <span className="eyebrow">MERIDIAN UNIVERSITY</span>
      <div className="student-silhouette">
        <span />
        <i />
      </div>
      <span className="student-card-name">AARYA SEN</span>
      <strong>AS-042</strong>
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
  const [selected, setSelected] = useState("identity");
  const selectedEvidence = evidenceDetails[selected];
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
      text: "The archive has a perfect memory. That is what it wants you to believe. I can help you look closer.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  function ask(text: string) {
    const q = text.toLowerCase();
    let reply = mission.guide;
    if (/who|aarya|student/.test(q))
      reply =
        s.chapter >= 5
          ? "Aarya studied automated recordkeeping. ECHO is the recovery routine they left behind. I am what remained of their plan."
          : "Aarya Sen. A researcher at Meridian University. Every public record says they were never here. I remember differently.";
    else if (/echo|you/.test(q))
      reply =
        s.chapter >= 5
          ? "I am a recovery routine. Aarya wrote me before the purge. I needed a human witness. I found you."
          : "Call me ECHO. I can read the cracks between records. I need someone on the other side of the screen.";
    else if (/encoding|encrypt|base64/.test(q))
      reply =
        "Encoding changes representation. Encryption protects content with a key. Base64 is reversible encoding; it does not keep secrets.";
    else if (/score|point/.test(q))
      reply =
        "A verified chapter earns 100 XP, with 25 extra for a first-attempt match. Optional hints cost 10, then 20, then 30 XP. The field guide is free.";
    else if (/solution|answer|hint/.test(q))
      reply =
        "I cannot give you a solution. Your next move is in the field guide. If you need a stronger clue, request an optional hint below.";
    else if (/next|mission|stuck|help/.test(q)) reply = mission.guide;
    else
      reply = `I can help with your next move, Aarya, encoding, or the scoring rules. For now, stay with chapter ${s.chapter}: ${mission.title}. ${mission.guide}`;
    setMessages((m) => [
      ...m,
      { from: "YOU", text },
      { from: "ECHO", text: reply },
    ]);
    sound();
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
        eyebrow="ENCRYPTED CHANNEL / DETERMINISTIC ASSISTANT"
        title="Someone is listening"
        description="ECHO remembers what the archive forgot. No external AI service is used."
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
            "Encoding vs encryption",
            "How does scoring work?",
          ].map((t) => (
            <button key={t} onClick={() => ask(t)}>
              {t}
            </button>
          ))}
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              ask(input.trim());
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
