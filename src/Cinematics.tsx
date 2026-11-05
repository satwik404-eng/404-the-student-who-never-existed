import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Radio,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { missions } from "../shared/content";
import type { StoryEvent } from "../shared/types";
import { chapterCovers } from "./presentation";
import { sound, usePrefs, useGame } from "./store";
import { Modal } from "./ui";

/** Original vector scenery: no external artwork, font or media request. */
export function ControlRoom({ alarm = false }: { alarm?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 1400 800"
      className={`control-room ${alarm ? "alarm" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-wall`} x2="0" y2="1">
          <stop stopColor="#060d1e" />
          <stop offset="1" stopColor="#020307" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={alarm ? "#e75a62" : "#1558c9"} stopOpacity=".42" />
          <stop offset="1" stopColor="#030407" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-screen`} x2="0" y2="1">
          <stop stopColor="#153e7d" />
          <stop offset="1" stopColor="#061123" />
        </linearGradient>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="24" />
        </filter>
      </defs>
      <rect width="1400" height="800" fill={`url(#${id}-wall)`} />
      <path
        d="M0 0L300 170H1100L1400 0M300 170V570L0 800M1100 170V570L1400 800M300 570H1100"
        fill="none"
        stroke="#182237"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={i}
          d={`M700 480L${i * 220 - 100} 800`}
          stroke="#12213a"
          opacity=".65"
        />
      ))}
      {[630, 680, 745].map((y) => (
        <path key={y} d={`M0 ${y}H1400`} stroke="#15223c" />
      ))}
      <ellipse cx="700" cy="390" rx="620" ry="360" fill={`url(#${id}-light)`} />
      <ellipse
        cx="680"
        cy="620"
        rx="310"
        ry="48"
        fill="#1558c9"
        opacity=".13"
        filter={`url(#${id}-blur)`}
      />
      {[80, 1160].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 150H${x + 150}V605H${x}Z`}
            fill="#050912"
            stroke="#16253d"
          />
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i}>
              <rect
                x={x + 14}
                y={172 + i * 39}
                width="122"
                height="29"
                rx="2"
                fill="#091324"
                stroke="#15233a"
              />
              <circle
                cx={x + 28}
                cy={186 + i * 39}
                r="2"
                fill={i % 3 === 0 ? "#d4ff24" : "#1558c9"}
              />
              <path d={`M${x + 54} ${186 + i * 39}h64`} stroke="#1b2a43" />
            </g>
          ))}
        </g>
      ))}
      <g className="monitor-bank">
        {[
          { x: 310, y: 232, w: 235, h: 160 },
          { x: 558, y: 207, w: 285, h: 190 },
          { x: 856, y: 232, w: 235, h: 160 },
        ].map((r, i) => (
          <g key={i}>
            <rect
              {...r}
              rx="8"
              fill="#02040a"
              stroke="#27344d"
              strokeWidth="3"
            />
            <rect
              x={r.x + 9}
              y={r.y + 9}
              width={r.w - 18}
              height={r.h - 20}
              fill={`url(#${id}-screen)`}
            />
            {Array.from({ length: 8 }, (_, j) => (
              <path
                key={j}
                d={`M${r.x + 24} ${r.y + 29 + j * 14}h${[80, 145, 102, 168][(j + i) % 4]}`}
                stroke={j === 3 ? "#b2d1ff" : "#2d5b92"}
                strokeWidth={j === 3 ? 3 : 2}
                opacity=".7"
              />
            ))}
            <path
              d={`M${r.x + r.w / 2} ${r.y + r.h}v30m-35 0h70`}
              stroke="#17263e"
              strokeWidth="5"
            />
          </g>
        ))}
        <path
          d="M275 446L1125 446L1180 495H220Z"
          fill="#10182b"
          stroke="#243555"
        />
        <path d="M260 495H1140V516H260Z" fill="#03050b" />
        <path d="M300 516V665M1100 516V665" stroke="#15223a" strokeWidth="17" />
        <path d="M610 458H812L830 481H590Z" fill="#070c16" stroke="#26406a" />
      </g>
      <g className="operator-shadow">
        <path
          d="M640 355C615 327 628 267 672 259C725 245 755 287 741 329L724 365Z"
          fill="#010205"
          stroke="#132647"
          strokeWidth="3"
        />
        <path
          d="M612 369Q680 328 744 366L796 514H561Z"
          fill="#010205"
          stroke="#0f1f36"
          strokeWidth="3"
        />
        <path
          d="M619 398L555 457L610 473M739 396L804 457L748 474"
          fill="#010205"
          stroke="#14233c"
          strokeWidth="18"
          strokeLinejoin="round"
        />
        <path
          d="M596 438Q680 415 764 438L785 594Q682 619 573 594Z"
          fill="#060810"
          stroke="#1a2337"
          strokeWidth="3"
        />
        <path d="M606 461Q680 445 752 461" fill="none" stroke="#121c2e" />
        <path
          d="M678 608V691M678 691L610 716M678 691L746 716"
          stroke="#10192c"
          strokeWidth="12"
        />
      </g>
      <path d="M369 171H1030" stroke="#4a75ba" strokeWidth="3" opacity=".6" />
      <rect
        width="1400"
        height="800"
        fill={`url(#${id}-light)`}
        opacity=".35"
      />
    </svg>
  );
}

const fullTimes = [0, 9000, 24000, 31000, 46000];
const previewTimes = [0, 3000, 8000, 11000, 15000];
export function sceneAt(elapsed: number, times = fullTimes) {
  return times.reduce((scene, t, i) => (elapsed >= t ? i : scene), 0);
}
export function PurgeCinematic({
  onIntercept,
  preview = false,
  commentary,
  busy = false,
  error = "",
}: {
  onIntercept: () => void;
  preview?: boolean;
  commentary?: string[];
  busy?: boolean;
  error?: string;
}) {
  const reduced = usePrefs((x) => x.reduced);
  const identity = useGame((x) => x.state?.narrative?.identity);
  const muted = usePrefs((x) => x.muted);
  const volume = usePrefs((x) => x.volume);
  const [elapsed, setElapsed] = useState(0);
  const [manualScene, setManualScene] = useState(0);
  const [recovered, setRecovered] = useState(false);
  const root = useRef<HTMLElement>(null);
  const times = preview ? previewTimes : fullTimes;
  const scene = reduced ? manualScene : sceneAt(elapsed, times);
  useEffect(() => {
    if (muted || volume === 0) return;
    let context: AudioContext | undefined;
    try {
      context = new AudioContext();
      const gain = context.createGain();
      gain.gain.value = volume * 0.025;
      gain.connect(context.destination);
      for (const frequency of [48, 49.5]) {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start();
      }
      void context.resume().catch(() => undefined);
    } catch {
      /* Optional audio must never block the story. */
    }
    return () => {
      if (context) void context.close().catch(() => undefined);
    };
  }, [muted, volume]);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => {
      if (!document.hidden)
        setElapsed((t) => Math.min(t + 250, preview ? 18000 : 52000));
    }, 250);
    return () => clearInterval(timer);
  }, [reduced, preview]);
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cinema-copy",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      );
      gsap.to(".control-room", {
        scale: scene === 1 ? 1.19 : 1.05,
        x: scene === 1 ? "-3%" : "0%",
        duration: 9,
        ease: "sine.inOut",
      });
    }, root);
    sound(scene === 2 ? "error" : "click");
    return () => ctx.revert();
  }, [scene, reduced]);
  const fraction = (elapsed - times[1]) / (times[2] - times[1]);
  const progress = reduced
    ? 100
    : scene === 1
      ? fraction < 0.23
        ? 12
        : fraction < 0.46
          ? 36
          : fraction < 0.7
            ? 78
            : 100
      : 100;
  const next = () => {
    if (reduced) setManualScene((s) => Math.min(4, s + 1));
    else setElapsed(times[Math.min(4, scene + 1)]);
  };
  const replay = () => {
    setElapsed(0);
    setManualScene(0);
  };
  return (
    <section
      ref={root}
      className={`purge-cinematic scene-${scene} ${preview ? "cinema-preview" : ""}`}
      aria-label="The Purge cinematic"
    >
      <div className="cinema-letterbox top" />
      <ControlRoom alarm={scene === 2} />
      <div className="cinema-vignette" />
      <div className="cinema-grain" />
      <header className="cinema-toolbar">
        <span className="mono">
          404 / THE PURGE{" "}
          <small>{preview ? "INTERCEPT PREVIEW" : "SECURITY ARCHIVE"}</small>
        </span>
        <button className="text-button" disabled={busy} onClick={onIntercept}>
          {preview ? "CLOSE PREVIEW" : "SKIP INTRO"} <ArrowUpRight size={15} />
        </button>
      </header>
      <div className="cinema-timecode">
        <span className="status-dot" /> ARCHIVIST AUDIT RECONSTRUCTION{" "}
        <span>OVERLAY TIMECODE / UNVERIFIED</span>
      </div>
      <div className="cinema-copy" key={scene} aria-live="polite">
        {scene === 0 && (
          <>
            <p className="eyebrow">SECURITY ARCHIVE / 02:17 AM</p>
            <h1>
              Meridian
              <br />
              <em>University.</em>
            </h1>
            <p className="cinema-hook">
              Every disappearance begins
              <br />
              with someone looking away.
            </p>
            <span className="cinema-coordinate">
              CAM_04 / OPERATOR ID UNAVAILABLE
            </span>
          </>
        )}
        {scene === 1 && (
          <div className="purge-console">
            <p className="eyebrow warning">SYSTEM ACCESS DETECTED</p>
            <h2>
              One name.
              <br />
              <em>Then nothing.</em>
            </h2>
            <dl>
              <div>
                <dt>OPERATOR</dt>
                <dd>0xNULL</dd>
              </div>
              <div>
                <dt>ACCESS LEVEL</dt>
                <dd>UNKNOWN</dd>
              </div>
              <div>
                <dt>TARGET RECORD</dt>
                <dd>{identity?.id || "[REDACTED]"}</dd>
              </div>
              <div>
                <dt>SUBJECT</dt>
                <dd>AARYA SEN</dd>
              </div>
              <div>
                <dt>STATUS</dt>
                <dd>{progress === 100 ? "DELETED" : "ACTIVE"}</dd>
              </div>
            </dl>
            <div className="purge-operation">
              EXECUTING IDENTITY PURGE <b>{progress}%</b>
              <div>
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            {progress === 100 && (
              <p className="critical-text">IDENTITY RECORD REMOVED</p>
            )}
            <small className="mono dim">
              RENDERED ACTION LABEL / RAW RECEIPT UNAVAILABLE
            </small>
          </div>
        )}
        {scene === 2 && (
          <div className="interruption">
            <ShieldAlert size={40} />
            <p className="eyebrow">WARNING / INTEGRITY EVENT</p>
            <h2>
              Something
              <br />
              <em>survived.</em>
            </h2>
            <p>UNRECOGNIZED RECOVERY PROCESS DETECTED</p>
            <p>ARCHIVE INTEGRITY COMPROMISED</p>
            <p className="lime">TRANSMISSION INTERCEPTED</p>
          </div>
        )}
        {scene === 3 && (
          <div className="aarya-transmission">
            <p className="eyebrow">
              <Radio size={16} /> UNKNOWN FREQUENCY / RECOVERED TEXT
            </p>
            <h2>
              “If you’re reading this,
              <br />
              they’ve already <em>erased me.</em>”
            </h2>
            <p>
              “But the person you’re looking for
              <br />
              may not be who you think.”
            </p>
            <div className="mono dim">
              STUDENT ID: 2026-UNKNOWN
              <br />
              STATUS: DELETED
              <br />
              LAST ACTIVITY: TOMORROW, 03:42 AM
            </div>
            <strong>Check the source.</strong>
          </div>
        )}
        {scene === 4 && (
          <div className="intercept-transmission">
            <span className="signal-eye" />
            <p className="eyebrow">
              INITIALIZING ARCHIVE… / RECOVERY CHANNEL OPEN
            </p>
            <h2>
              Be the
              <br />
              <em>witness.</em>
            </h2>
            <p>
              A signal is waiting on the other side.
              <br />
              It needs someone the system cannot edit.
            </p>
            <button
              className="button large"
              disabled={busy}
              onClick={onIntercept}
            >
              {busy
                ? "CONNECTING…"
                : preview
                  ? "RETURN TO THE CASE"
                  : "INTERCEPT TRANSMISSION"}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="cinema-error" role="alert">
          {error}
        </p>
      )}
      <footer className="cinema-controls">
        <div className="scene-segments" aria-label={`Scene ${scene + 1} of 5`}>
          {times.map((_, i) => (
            <span key={i} className={i <= scene ? "active" : ""} />
          ))}
        </div>
        <span className="mono dim">0{scene + 1} / 05</span>
        <button className="text-button" onClick={scene < 4 ? next : replay}>
          {scene < 4 ? "NEXT SCENE" : "REPLAY CINEMATIC"}{" "}
          {scene < 4 ? <ArrowRight size={14} /> : <RotateCcw size={14} />}
        </button>
      </footer>
      {commentary && (
        <div className="perspective-toggle">
          <button
            className="text-button"
            aria-expanded={recovered}
            onClick={() => setRecovered(!recovered)}
          >
            {recovered ? "HIDE" : "SHOW"} RECOVERED PERSPECTIVE
          </button>
          {recovered && (
            <p role="status">
              {commentary[Math.min(scene, commentary.length - 1)]}
            </p>
          )}
        </div>
      )}
      <div className="cinema-letterbox bottom" />
    </section>
  );
}

export function TransmissionTeaser({ onClose }: { onClose: () => void }) {
  return (
    <section
      className="transmission-teaser"
      aria-label="Public transmission teaser"
    >
      <ChapterArtwork chapter={2} />
      <p className="eyebrow">UNIDENTIFIED SIGNAL / MERIDIAN UNIVERSITY</p>
      <h2>
        “They’ve already
        <br />
        <em>erased me.</em>”
      </h2>
      <p>
        A name is missing from the register.
        <br />A transmission refuses to disappear.
      </p>
      <p className="mono dim">
        STUDENT ID: 2026-UNKNOWN
        <br />
        LAST ACTIVITY: TOMORROW, 03:42 AM
      </p>
      <Link className="button" to="/boot">
        SIGN IN TO INTERCEPT <ArrowUpRight size={16} />
      </Link>
      <button className="text-button" onClick={onClose}>
        RETURN TO THE CASE <ArrowRight size={14} />
      </button>
    </section>
  );
}

export function ChapterArtwork({ chapter }: { chapter: number }) {
  return (
    <div className={`chapter-art chapter-art-${chapter}`} aria-hidden="true">
      <div className="chapter-art-grid" />
      {chapter === 1 && (
        <div className="source-sheets">
          {[
            "<archive>",
            "<!-- a trace remains -->",
            '<identity status="missing">',
            "</archive>",
          ].map((s, i) => (
            <div key={s}>
              <span>0{i + 1}</span>
              {s}
            </div>
          ))}
          <b>&lt;/&gt;</b>
        </div>
      )}
      {chapter === 2 && (
        <div className="wave-art">
          <svg viewBox="0 0 800 350">
            <path
              d="M0 175H80L100 160L120 190L145 175H175L200 80L220 275L245 105L270 245L300 30L330 320L360 70L385 240L410 120L440 215L470 155L500 175H550L570 165L590 185L615 175H800"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path d="M0 175H800" stroke="currentColor" opacity=".15" />
          </svg>
          <span>UNIDENTIFIED / STILL TRANSMITTING</span>
        </div>
      )}
      {chapter === 3 && (
        <div className="floating-records">
          {[
            "ENROLLMENT / VERIFIED",
            "LAST ACTIVITY / TOMORROW",
            "AUDIT CLOCK / CONFLICT",
          ].map((s, i) => (
            <div key={s}>
              <span>MERIDIAN / RECORD_0{i + 1}</span>
              <b>{s}</b>
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
      )}
      {chapter === 4 && (
        <div className="operator-art">
          <div className="hood-head" />
          <div className="hood-body" />
          <span>
            OPERATOR: <b>0xNULL</b>
          </span>
          <small>ATTRIBUTION UNVERIFIED</small>
        </div>
      )}
      {chapter === 5 && (
        <div className="connection-art">
          <svg viewBox="0 0 800 400">
            <path
              d="M130 100L395 190L650 80M395 190L610 320M130 100L170 320L610 320M170 320L650 80"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              strokeDasharray="5 8"
            />
          </svg>
          {["THE FOOTAGE", "THE RECEIPT", "THE CAPABILITY", "THE WITNESS"].map(
            (s, i) => (
              <span className={`clue-node node-${i}`} key={s}>
                {s}
              </span>
            ),
          )}
        </div>
      )}
      {chapter === 6 && (
        <div className="core-art">
          <div />
          <div />
          <div />
          <span>A</span>
          <small>ARCHIVIST / OVERRIDE ACTIVE</small>
        </div>
      )}
    </div>
  );
}
export function ChapterIntro({
  chapter,
  onContinue,
}: {
  chapter: number;
  onContinue: () => void;
}) {
  const cover = chapterCovers[chapter - 1];
  const root = useRef<HTMLElement>(null);
  const reduced = usePrefs((x) => x.reduced);
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(".chapter-intro-copy > *", {
        y: 25,
        opacity: 0,
        stagger: 0.1,
        duration: 0.85,
        ease: "power3.out",
      });
    }, root);
    sound(chapter === 6 ? "error" : "click");
    return () => ctx.revert();
  }, [reduced, chapter]);
  return (
    <section
      className={`chapter-intro chapter-theme-${chapter}`}
      ref={root}
      aria-label={`Chapter ${chapter} introduction`}
    >
      <ChapterArtwork chapter={chapter} />
      <div className="chapter-intro-top">
        <span className="eyebrow">RECOVERY SEQUENCE / {cover.theme}</span>
        <button className="text-button" onClick={onContinue}>
          SKIP CHAPTER INTRO <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="chapter-intro-copy">
        <span className="chapter-intro-number">0{chapter}</span>
        <p className="eyebrow">{cover.cue}</p>
        <h1>{missions[chapter - 1].title}</h1>
        <p>{cover.hook}</p>
        <button className="button" onClick={onContinue}>
          ENTER CHAPTER {String(chapter).padStart(2, "0")}{" "}
          <ArrowRight size={17} />
        </button>
      </div>
      <span className="intro-footer mono">
        MERIDIAN UNIVERSITY / INDEPENDENT RECOVERY / 0{chapter}—06
      </span>
    </section>
  );
}
export function StoryTransition({
  chapter,
  event,
  onClose,
  onNext,
}: {
  chapter: number;
  event: StoryEvent;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <Modal
      title="RECOVERY EVENT / EVIDENCE VERIFIED"
      closeLabel="Skip story event"
      onClose={onClose}
    >
      <div className={`story-event chapter-theme-${chapter}`}>
        <p className="eyebrow lime">
          {missions[chapter - 1].evidence} / RECOVERED
        </p>
        <h2>{event.title}</h2>
        <ol>
          {event.lines.map((line, i) => (
            <li key={line}>
              <span>0{i + 1}</span>
              {line}
            </li>
          ))}
        </ol>
        <blockquote>
          <span>ECHO / INCOMING</span>“{event.echo}”
        </blockquote>
        <p className="dim">
          Progress and original XP have already been saved. This transmission
          awards nothing extra.
        </p>
        <button className="button" onClick={onNext}>
          {chapter < 6 ? "CONTINUE TO NEXT CASE" : "CHOOSE WHAT SURVIVES"}
          <ArrowRight size={17} />
        </button>
        <button className="text-button" onClick={onClose}>
          RETURN TO VERIFIED EVIDENCE
        </button>
      </div>
    </Modal>
  );
}
