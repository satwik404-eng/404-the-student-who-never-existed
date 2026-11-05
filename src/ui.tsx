import { usePrefs } from "./store";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, X } from "lucide-react";
export function Tag({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1>
        {title}
        <span className="lime">.</span>
      </h1>
      {description && <p>{description}</p>}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  closeLabel = "Close guide",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button,a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <div className="panel-top">
          <span className="eyebrow">{title}</span>
          <button
            className="icon-button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function External({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="button secondary"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={17} />
    </a>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="status-dot" /> ESTABLISHING ARCHIVE CONNECTION…
    </div>
  );
}

export function ElapsedClock({
  state,
}: {
  state: import("../shared/types").GameState;
}) {
  const enabled = usePrefs((x) => x.timer);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled || state.completedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [enabled, state.completedAt]);
  if (!enabled || !state.startedAt) return null;
  const seconds = Math.max(
    0,
    Math.floor(((state.completedAt || now) - state.startedAt) / 1000),
  );
  return (
    <span className="mono dim" aria-label="Investigation elapsed time">
      {String(Math.floor(seconds / 60)).padStart(2, "0")}:
      {String(seconds % 60).padStart(2, "0")}
    </span>
  );
}
