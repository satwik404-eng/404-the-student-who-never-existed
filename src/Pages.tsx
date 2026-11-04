import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Code2,
  Download,
  Fingerprint,
  FolderOpen,
  Github,
  Globe2,
  Headphones,
  Play,
  Radio,
  Share2,
  Shield,
  Star,
  TerminalSquare,
  Users,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { ArchiveArtwork } from "./Artwork";
import { useGame, usePrefs, sound } from "./store";
import { backendName, request } from "./api";
import { supabase } from "./client";
import { bootLines, missions } from "../shared/content";
import type { Ranking } from "../shared/types";
import { External, Loading, PageTitle, Tag } from "./ui";

export function Landing({ onGuide }: { onGuide: () => void }) {
  const state = useGame((x) => x.state);
  const reduced = usePrefs((x) => x.reduced);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 24,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });
      gsap.from(".art-stage", { opacity: 0, duration: 1.6, delay: 0.2 });
    }, root);
    return () => ctx.revert();
  }, [reduced]);
  return (
    <div className="landing" ref={root}>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="status-dot" /> CASE FILE 404{" "}
            <span className="kicker-divider" /> MERIDIAN UNIVERSITY
          </div>
          <h1>
            <em>Someone</em>
            <br />
            erased a<br />
            <span className="blue-word">student.</span>
          </h1>
          <p className="hero-subtitle">THE STUDENT WHO NEVER EXISTED</p>
          <p className="hero-description">
            A missing name. A perfect system.
            <br />
            One record that refuses to stay deleted.
          </p>
          <div className="hero-cta">
            <Link className="button primary large" to="/boot">
              BEGIN INVESTIGATION
              <ArrowUpRight size={19} />
            </Link>
            <Link
              className="play-button"
              to="/boot"
              aria-label="Watch the opening transmission"
            >
              <span>
                <Play size={15} fill="currentColor" />
              </span>
              <span>
                WATCH THE
                <br />
                TRANSMISSION
              </span>
            </Link>
          </div>
          {!!state?.startedAt && (
            <Link className="continue-link" to="/investigation">
              Continue your investigation · Chapter {state.chapter}
              <ArrowRight size={14} />
            </Link>
          )}
          <div className="hero-facts">
            <div>
              <Clock3 size={17} />
              <span>
                25–40 MIN<span>ONE UNSETTLING NIGHT</span>
              </span>
            </div>
            <div>
              <Code2 size={17} />
              <span>
                06 CHAPTERS<span>EVERY CLUE MATTERS</span>
              </span>
            </div>
            <div>
              <Users size={17} />
              <span>
                01–02 PLAYERS<span>DON’T GO ALONE</span>
              </span>
            </div>
          </div>
        </div>
        <div className="art-stage">
          <div className="art-caption">
            <span className="crosshair">+</span> RECOVERING IDENTITY
            <br />
            <span className="dim">RECORD INTEGRITY: 0.04%</span>
          </div>
          <ArchiveArtwork />
          <div className="art-bottom-note">
            <span className="status-dot" /> LAST ACTIVITY: TOMORROW, 03:42 AM
          </div>
          <div className="vertical-label">
            UNAUTHORIZED MEMORY DETECTED — DO NOT DISCONNECT
          </div>
        </div>
        <div className="hero-index">
          001 — 006
          <br />
          <span>THE RECOVERY PROTOCOL</span>
        </div>
      </section>
      <div className="transmission-strip">
        <span className="transmission-label">
          <Radio size={16} /> INCOMING TRANSMISSION
        </span>
        <p>
          “If you’re reading this, they’ve already erased me.
          <span> Check the source.</span>”
        </p>
        <span className="transmission-origin">AARYA_SEN / UNKNOWN</span>
      </div>
      <section className="chapter-preview" aria-label="Investigation chapters">
        <div className="section-intro">
          <p className="eyebrow">SIX CHAPTERS. ONE MISSING IDENTITY.</p>
          <h2>
            Follow the <em>absence.</em>
          </h2>
          <button className="text-button" onClick={onGuide}>
            A field guide for the unknown
            <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="chapter-grid">
          {missions.map((m) => (
            <Link
              to={
                state?.startedAt && m.id <= state.chapter
                  ? `/investigation/mission/${m.id}`
                  : "/boot"
              }
              className="chapter-preview-item"
              key={m.id}
            >
              <span className="chapter-no">0{m.id}</span>
              <span>
                <b>{m.title}</b>
                <small>{m.type}</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="case-note">
        <div>
          <span className="eyebrow">A NOTE BEFORE YOU ENTER</span>
          <h2>
            The system says
            <br />
            they never existed.
            <br />
            <em>Do you believe it?</em>
          </h2>
        </div>
        <div>
          <p>
            Explore a university archive that is quietly rewriting its own
            history. Read between the logs. Decode a voice in the static. Put
            the pieces back together.
          </p>
          <p>
            All you need is a browser, your curiosity, and a willingness to look
            a little closer.
          </p>
          <button className="text-button" onClick={onGuide}>
            Open the field guide
            <ArrowUpRight size={16} />
          </button>
          <span className="fiction-note">
            <Shield size={14} />A fictional story. A real exercise in
            observation.
          </span>
        </div>
      </section>
      <footer className="site-footer">
        <span>404 / AN INTERACTIVE ARCHIVE MYSTERY</span>
        <span>
          CREATED BY SATWIK <span className="lime">↗</span>
        </span>
        <Link to="/settings">
          <Headphones size={13} /> Best experienced with headphones
        </Link>
      </footer>
      <a className="scroll-indicator" href="#main" aria-label="Back to the top">
        <ArrowDown size={14} />
      </a>
    </div>
  );
}

export function Boot() {
  const act = useGame((x) => x.act);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const reduced = usePrefs((x) => x.reduced);
  const busy = useRef(false);
  useEffect(() => {
    if (step < bootLines.length) {
      const timer = setTimeout(() => setStep((x) => x + 1), reduced ? 70 : 650);
      return () => clearTimeout(timer);
    }
  }, [step, reduced]);
  async function enter() {
    if (busy.current) return;
    busy.current = true;
    try {
      await act({ op: "start" });
      sound("success");
      navigate("/investigation");
    } catch (e) {
      setError((e as Error).message);
      busy.current = false;
    }
  }
  return (
    <section className="boot-page">
      <div className="boot-header">
        <Fingerprint size={28} />
        <span>MERIDIAN / RECOVERY CONSOLE</span>
        <button className="text-button" onClick={() => void enter()}>
          SKIP INTRO
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="boot-console">
        <p className="eyebrow">
          ESTABLISHING A CONNECTION TO SOMETHING THAT ISN’T THERE.
        </p>
        {bootLines.slice(0, step + 1).map((line, i) => (
          <p
            className={i === 3 || i === 4 ? "warning mono" : "mono"}
            key={line}
          >
            <span className="dim">
              [{`00:${(i * 7).toString().padStart(2, "0")}`}]
            </span>{" "}
            {line}
            <span className="boot-check">
              {i < 3 ? "OK" : i < 5 ? "ERR" : "…"}
            </span>
          </p>
        ))}
        {step >= bootLines.length && (
          <div className="boot-message">
            <Tag tone="critical">IDENTITY DELETED</Tag>
            <h1>
              “If you’re reading this,
              <br />
              they’ve already erased me.”
            </h1>
            <p>
              STUDENT ID: 2026-UNKNOWN
              <br />
              LAST ACTIVITY: TOMORROW, 03:42 AM
            </p>
            <p className="lime">Check the source.</p>
            <button className="button" onClick={() => void enter()}>
              ENTER THE ARCHIVE
              <ArrowUpRight size={17} />
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

export function Dashboard() {
  const s = useGame((x) => x.state)!;
  const mission = missions[s.chapter - 1];
  const completed = Object.values(s.progress).filter(
    (x) => x.completedAt,
  ).length;
  return (
    <div className="workspace dashboard">
      <div className="workspace-top">
        <span className="eyebrow">
          <span className="status-dot" /> {backendName}
        </span>
        <span className="mono dim">
          WITNESS / {s.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
      <div className="dashboard-intro">
        <PageTitle
          eyebrow="MERIDIAN UNIVERSITY / RECOVERY DESKTOP"
          title="The archive remembers"
          description="Some records were never meant to be found. You found one."
        />
        <div className="score-display">
          <span className="eyebrow">{s.rank}</span>
          <strong>
            {s.score}
            <small>XP</small>
          </strong>
        </div>
      </div>
      <div className="desktop-grid">
        <section className="active-mission panel">
          <div className="panel-top">
            <span className="eyebrow">ACTIVE INVESTIGATION</span>
            <Tag>CHAPTER 0{s.chapter}</Tag>
          </div>
          <div className="mission-hero">
            <span className="oversized-number">0{s.chapter}</span>
            <div>
              <span className="eyebrow lime">{mission.type}</span>
              <h2>{mission.title}</h2>
              <p>{mission.subtitle}</p>
              <Link
                className="button"
                to={`/investigation/mission/${s.chapter}`}
              >
                {completed === 6 ? "RETURN TO THE FIREWALL" : "OPEN CASE FILE"}
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${(completed / 6) * 100}%` }} />
          </div>
          <div className="progress-caption">
            <span>{completed} OF 6 CHAPTERS VERIFIED</span>
            <span>
              AUTOSAVED <Check size={12} />
            </span>
          </div>
        </section>
        <Link to="/investigation/echo" className="echo-card panel">
          <div className="panel-top">
            <span className="eyebrow">INCOMING / ECHO</span>
            <Radio size={16} />
          </div>
          <div className="echo-orb">
            <span />
            <span />
            <span />
          </div>
          <p>
            “
            {s.chapter === 1
              ? "I remember a name the archive does not. Will you look for it?"
              : s.chapter < 6
                ? "You found another piece. The silence is starting to sound like a confession."
                : "It knows you are here. Keep the evidence close."}
            ”
          </p>
          <span className="text-link">
            OPEN CHANNEL
            <ArrowUpRight size={14} />
          </span>
        </Link>
        <div className="desktop-tools">
          {[
            {
              to: "evidence",
              icon: FolderOpen,
              title: "Evidence journal",
              desc: `${completed + 1} recovered artifacts`,
              locked: false,
            },
            {
              to: "archive",
              icon: Globe2,
              title: "Archive explorer",
              desc:
                completed >= 2
                  ? "Fictional record service"
                  : "Unlocks in chapter 03",
              locked: completed < 2,
            },
            {
              to: "terminal",
              icon: TerminalSquare,
              title: "System terminal",
              desc:
                completed >= 3
                  ? "Restricted recovery shell"
                  : "Unlocks in chapter 04",
              locked: completed < 3,
            },
          ].map((t) =>
            t.locked ? (
              <div className="tool-card locked" key={t.to}>
                <t.icon size={24} />
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <Tag>LOCKED</Tag>
              </div>
            ) : (
              <Link
                key={t.to}
                className="tool-card"
                to={`/investigation/${t.to}`}
              >
                <t.icon size={24} />
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <ArrowUpRight size={17} />
              </Link>
            ),
          )}
        </div>
        <section className="chapter-list panel">
          <div className="panel-top">
            <span className="eyebrow">RECOVERY SEQUENCE</span>
            <span className="mono dim">
              {Math.round((completed / 6) * 100)}%
            </span>
          </div>
          {missions.map((m) => (
            <div className="chapter-row" key={m.id}>
              <span className={s.progress[m.id]?.completedAt ? "lime" : "dim"}>
                {s.progress[m.id]?.completedAt ? (
                  <Check size={17} />
                ) : (
                  String(m.id).padStart(2, "0")
                )}
              </span>
              {m.id <= s.chapter ? (
                <Link to={`/investigation/mission/${m.id}`}>
                  {m.title}
                  <ArrowUpRight size={14} />
                </Link>
              ) : (
                <span>{m.title}</span>
              )}
              <small>
                {s.progress[m.id]?.completedAt
                  ? "VERIFIED"
                  : m.id === s.chapter
                    ? "ACTIVE"
                    : "LOCKED"}
              </small>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const prefs = usePrefs();
  const state = useGame((x) => x.state);
  const act = useGame((x) => x.act);
  const [nickname, setNickname] = useState(state?.nickname || "");
  const [optIn, setOptIn] = useState(state?.optIn || false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await act({ op: "profile", nickname, optIn });
      setStatus("Profile and ranking preferences saved.");
    } catch (e) {
      setStatus((e as Error).message);
    }
    setBusy(false);
  }
  return (
    <div className="workspace narrow">
      <PageTitle
        eyebrow="PREFERENCES / YOUR CONNECTION"
        title="Make yourself comfortable"
        description="The archive is unsettling. The interface doesn’t have to be."
      />
      <section className="panel settings-panel">
        <label className="settings-row">
          <span>
            <b>Sound muted</b>
            <small>
              Original synthesized interface sounds. Audio starts after
              interaction.
            </small>
          </span>
          <input
            type="checkbox"
            checked={prefs.muted}
            onChange={(e) => prefs.set({ muted: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>
            <b>Interface volume</b>
            <small>{Math.round(prefs.volume * 100)}%</small>
          </span>
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={prefs.volume}
            onChange={(e) => prefs.set({ volume: Number(e.target.value) })}
          />
        </label>
        <label className="settings-row">
          <span>
            <b>Reduce motion</b>
            <small>
              Disable decorative movement and shorten the boot sequence.
            </small>
          </span>
          <input
            type="checkbox"
            checked={prefs.reduced}
            onChange={(e) => prefs.set({ reduced: e.target.checked })}
          />
        </label>
        <label className="settings-row">
          <span>
            <b>Show investigation timer</b>
            <small>
              The firewall countdown remains visible during the final challenge.
            </small>
          </span>
          <input
            type="checkbox"
            checked={prefs.timer}
            onChange={(e) => prefs.set({ timer: e.target.checked })}
          />
        </label>
      </section>
      <section className="panel settings-panel">
        <h2>Witness profile</h2>
        <label className="field">
          NICKNAME
          <input
            maxLength={32}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Anonymous witness"
          />
        </label>
        <label className="settings-row">
          <span>
            <b>Include my completion in rankings</b>
            <small>
              Off by default. Only nickname and game statistics become public.
            </small>
          </span>
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
          />
        </label>
        <button
          className="button"
          disabled={busy || !state}
          onClick={() => void save()}
        >
          {busy ? "SAVING…" : "SAVE PROFILE"}
          <Check size={16} />
        </button>
        <p role="status">{status}</p>
      </section>
      {supabase && (
        <button
          className="button secondary"
          onClick={() => {
            void supabase!.auth.signOut({ scope: "local" }).then(({error}) => {
              if(error){setStatus('Sign-out could not be completed. Please try again.');return;}
              useGame.getState().reset();
              navigate("/login");
            });
          }}
        >
          SIGN OUT OF THIS BROWSER
        </button>
      )}
      <div className="scoring-note">
        <Zap size={19} />
        <p>
          Each chapter awards 100 XP, plus 25 XP for a correct first submission.
          ECHO hints cost 10, 20, then 30 XP. Looking at the field guide is
          free.
        </p>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const [entries, setEntries] = useState<Ranking[] | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    request({ op: "leaderboard" })
      .then((r) => {
        if (live) {
          setEntries(r.entries || []);
          setError("");
        }
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [revision]);
  return (
    <div className="workspace">
      <PageTitle
        eyebrow="THE WITNESSES / VERIFIED COMPLETIONS"
        title="They remember"
        description="Real completed investigations. Public by choice. Scores verified by the archive."
      />
      <div className="ranking-summary">
        <span>
          <Star size={17} /> ARCHIVE MASTER ≥ 700 XP
        </span>
        <Link className="text-button" to="/settings">
          Manage ranking visibility
          <ArrowUpRight size={15} />
        </Link>
      </div>
      {error ? (
        <div className="empty-state">
          <p role="alert">{error}</p>
          <button className="button" onClick={() => setRevision((x) => x + 1)}>
            Reconnect
          </button>
        </div>
      ) : !entries ? (
        <Loading />
      ) : entries.length === 0 ? (
        <div className="empty-state panel">
          <Fingerprint size={45} />
          <h2>No witnesses on record. Yet.</h2>
          <p>Finish the investigation and opt in to add your name here.</p>
          <Link className="button" to="/boot">
            BECOME THE FIRST
            <ArrowUpRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="table-scroll panel">
          <table>
            <thead>
              <tr>
                <th>RANK</th>
                <th>WITNESS</th>
                <th>SCORE</th>
                <th>TIME</th>
                <th>ENDING</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={`${e.nickname}-${i}`}>
                  <td className="lime">{String(i + 1).padStart(2, "0")}</td>
                  <td>
                    {e.nickname}
                    <small>{e.rank}</small>
                  </td>
                  <td>{e.score} XP</td>
                  <td>{formatTime(e.seconds)}</td>
                  <td>
                    {e.ending === "restore"
                      ? "IDENTITY RESTORED"
                      : "ARCHIVIST EXPOSED"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export function EndingPage() {
  const { endingId } = useParams();
  const s = useGame((x) => x.state)!;
  const [message, setMessage] = useState("");
  if (!s.ending || !s.progress["6"]?.completedAt)
    return <Navigate to="/investigation" replace />;
  if (endingId !== s.ending)
    return <Navigate to={`/endings/${s.ending}`} replace />;
  const restored = s.ending === "restore";
  const seconds = Math.round(
    ((s.completedAt || s.startedAt) - s.startedAt) / 1000,
  );
  const result = `404 — THE STUDENT WHO NEVER EXISTED\n${restored ? "Identity restored" : "ARCHIVIST exposed"}\n${s.score} XP · ${s.rank}\n${formatTime(seconds)} · ${s.hintsUsed} hints\nCreated by Satwik / github.com/satwik404-eng`;
  function download() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#030407";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.strokeStyle = "#1558c9";
    for (let i = 0; i < 1200; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 630);
      ctx.stroke();
    }
    ctx.fillStyle = "#d4ff24";
    ctx.font = "bold 150px monospace";
    ctx.fillText("404", 70, 190);
    ctx.fillStyle = "#fff";
    ctx.font = "40px sans-serif";
    ctx.fillText(
      restored ? "AARYA SEN EXISTS." : "THE ARCHIVE CANNOT HIDE.",
      70,
      290,
    );
    ctx.font = "22px monospace";
    ctx.fillText(
      `${s.score} XP  /  ${s.rank}  /  ${formatTime(seconds)}`,
      70,
      365,
    );
    ctx.fillStyle = "#91a49a";
    ctx.fillText(`${s.hintsUsed} HINTS · CREATED BY SATWIK`, 70, 470);
    ctx.fillText("THE STUDENT WHO NEVER EXISTED", 70, 555);
    const a = document.createElement("a");
    a.download = "404-investigation-result.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    setMessage("Result card downloaded.");
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: "My 404 investigation", text: result });
      else {
        await navigator.clipboard.writeText(result);
        setMessage("Result copied. Share it with another witness.");
      }
    } catch {
      setMessage(
        "Sharing was cancelled or unavailable. You can download your card instead.",
      );
    }
  }
  const repo =
    import.meta.env.VITE_GITHUB_REPO || "https://github.com/satwik404-eng";
  const linkedin = import.meta.env.VITE_LINKEDIN_URL;
  return (
    <div className={`ending-page ${restored ? "restored" : "exposed"}`}>
      <div className="ending-symbol">
        {restored ? <Fingerprint size={70} /> : <Radio size={70} />}
      </div>
      <Tag>{restored ? "ENDING A / RESTORATION" : "ENDING B / DISCLOSURE"}</Tag>
      <h1>
        {restored ? (
          <>
            Aarya Sen
            <br />
            <em>exists.</em>
          </>
        ) : (
          <>
            The truth
            <br />
            <em>is out.</em>
          </>
        )}
      </h1>
      <p className="ending-prose">
        {restored
          ? "The name returns to the university register. The evidence stays intact. Somewhere in the archive, a recovery routine completes its final task."
          : "The fictional audit records reach every terminal in Meridian University. ARCHIVIST can erase a record. It cannot erase a thousand witnesses."}
      </p>
      <p className="echo-farewell">
        ECHO: “
        {restored
          ? "Thank you for remembering. I think I can rest now."
          : "You gave the truth somewhere to live. They will remember us."}
        ”
      </p>
      <div className="result-stats">
        <div>
          <span>SCORE</span>
          <b>{s.score} XP</b>
        </div>
        <div>
          <span>TIME</span>
          <b>{formatTime(seconds)}</b>
        </div>
        <div>
          <span>HINTS</span>
          <b>{s.hintsUsed}</b>
        </div>
        <div>
          <span>RANK</span>
          <b>{s.rank}</b>
        </div>
      </div>
      <div className="ending-actions">
        <button className="button" onClick={download}>
          <Download size={16} />
          DOWNLOAD RESULT CARD
        </button>
        <button className="button secondary" onClick={() => void share()}>
          <Share2 size={16} />
          SHARE RESULT
        </button>
      </div>
      <p role="status">{message}</p>
      <section className="credits panel">
        <p className="eyebrow">THE PERSON BEHIND THE ABSENCE</p>
        <h2>
          Created by <em>Satwik.</em>
        </h2>
        <p>
          Thank you for staying until the end. If this case stayed with you,
          follow my work, star the project on GitHub, and connect with me.
        </p>
        <div className="credits-links">
          <External href={repo}>
            <Star size={16} />
            STAR THE REPOSITORY
          </External>
          <External href="https://github.com/satwik404-eng">
            <Github size={16} />
            FOLLOW SATWIK
          </External>
          {linkedin ? (
            <External href={linkedin}>CONNECT ON LINKEDIN</External>
          ) : (
            <span className="linkedin-pending">
              LinkedIn connection link coming soon.
            </span>
          )}
        </div>
      </section>
      <div className="ending-actions">
        <Link className="text-button" to="/leaderboard">
          VIEW THE WITNESSES
          <ArrowUpRight size={16} />
        </Link>
        <Link className="text-button" to="/investigation/mission/6">
          EXPLORE THE OTHER ENDING
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <p className="fiction-note">
        All people, institutions, and events in this story are fictional.
      </p>
    </div>
  );
}
