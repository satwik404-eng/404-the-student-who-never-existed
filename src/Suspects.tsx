import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileText,
  Fingerprint,
  LockKeyhole,
  Radio,
  ScanFace,
  Shield,
  UserRound,
} from "lucide-react";
import type { SuspectId } from "../shared/types";
import { useGame } from "./store";
import { presentationScope, usePresentation } from "./presentation";
import { PageTitle } from "./ui";

const icons = {
  null: ScanFace,
  voss: UserRound,
  archivist: Shield,
  echo: Radio,
};
export default function Suspects() {
  const s = useGame((x) => x.state)!;
  const board = s.narrative;
  const presentation = usePresentation();
  const scope = presentationScope(s);
  const theories = presentation.theories[scope] || [];
  const [selected, setSelected] = useState<SuspectId>("null");
  const [theory, setTheory] = useState<SuspectId>(
    theories.at(-1)?.suspect || "null",
  );
  const [status, setStatus] = useState("");
  const suspect = board?.suspects.find((x) => x.id === selected);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!board?.suspects.some((x) => x.id === theory && x.unlocked)) return;
    presentation.theorize(scope, {
      suspect: theory,
      chapter: s.chapter,
      evidence: Object.keys(board.evidence),
    });
    setStatus(
      theories.length
        ? "Theory revised. ECHO: “Changing your mind is part of examining the evidence. Keep the contradiction that changed it.”"
        : "Provisional theory recorded. ECHO: “Keep asking what would prove you wrong.”",
    );
  }
  return (
    <div className="workspace suspect-board">
      <Link className="back-link" to="/investigation">
        <ArrowLeft size={14} />
        RECOVERY DESKTOP
      </Link>
      <PageTitle
        eyebrow="WORKING THEORIES / NO CONVICTIONS"
        title="Who erased Aarya?"
        description="Four leads. One missing name. Separate the accusation from the evidence."
      />
      {!board ? (
        <div className="panel empty-state">
          <h2>Case files are awaiting synchronization.</h2>
          <p>
            Your saved investigation is intact. This story update requires the
            matching game server.
          </p>
        </div>
      ) : (
        <>
          <div
            className="suspect-profiles"
            role="group"
            aria-label="Suspect profiles"
          >
            {board.suspects.map((profile) => {
              const Icon = icons[profile.id];
              return (
                <button
                  key={profile.id}
                  disabled={!profile.unlocked}
                  aria-pressed={selected === profile.id}
                  className={`suspect-profile ${selected === profile.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelected(profile.id);
                    setStatus("");
                  }}
                >
                  <span className={`suspect-portrait portrait-${profile.id}`}>
                    {profile.unlocked && profile.id === "null" ? (
                      <span className="profile-hood">
                        <i />
                      </span>
                    ) : profile.unlocked ? (
                      <Icon size={64} />
                    ) : (
                      <LockKeyhole size={35} />
                    )}
                    <span className="portrait-scan" />
                  </span>
                  <small>
                    {profile.unlocked
                      ? profile.role
                      : "CLASSIFIED / FOLLOW THE EVIDENCE"}
                  </small>
                  <h2>
                    {profile.unlocked ? profile.name : "[SEALED PROFILE]"}
                  </h2>
                  <span className="suspect-status">
                    {profile.unlocked
                      ? profile.status
                      : "UNLOCKS AFTER FIRST TRACE"}
                  </span>
                </button>
              );
            })}
          </div>
          {suspect?.unlocked && (
            <section
              className="suspect-dossier panel"
              aria-label={`${suspect.name} case file`}
            >
              <div className="dossier-head">
                <div>
                  <p className="eyebrow">PERSON OF INTEREST / {suspect.role}</p>
                  <h2>{suspect.name}</h2>
                </div>
                <Fingerprint size={40} />
              </div>
              <div className="dossier-columns">
                <div>
                  <h3>What we know</h3>
                  <ul>
                    {suspect.known.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>What does not fit</h3>
                  <ul>
                    {suspect.contradictions.length ? (
                      suspect.contradictions.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))
                    ) : (
                      <li>
                        Not enough independent evidence. Keep the question open.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="evidence-connections">
                <p className="eyebrow">
                  CONNECT RECOVERED EVIDENCE / SAVED IN THIS BROWSER
                </p>
                {suspect.evidence.map((id) => {
                  const artifact = board.evidence[id];
                  if (!artifact) return null;
                  const linked =
                    presentation.links[scope]?.[selected]?.includes(id) ||
                    false;
                  return (
                    <div className="evidence-connection" key={id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={linked}
                          onChange={() =>
                            presentation.connect(scope, selected, id)
                          }
                        />
                        <FileText size={16} />
                        {artifact.title}
                        {linked && <Check size={14} />}
                      </label>
                      <Link
                        to={`/investigation/evidence?artifact=${id}`}
                        aria-label={`Inspect ${artifact.title}`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <section className="theory-panel">
            <div>
              <span className="eyebrow">AN ASSUMPTION IS NOT A VERDICT</span>
              <h2>
                Who do you think
                <br />
                <em>erased Aarya?</em>
              </h2>
              <p>
                Theories are provisional. Revising one never costs XP or changes
                a puzzle outcome.
              </p>
            </div>
            <form onSubmit={submit}>
              <label className="field">
                CURRENT THEORY
                <select
                  value={theory}
                  onChange={(e) => setTheory(e.target.value as SuspectId)}
                >
                  {board.suspects.map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                      disabled={!profile.unlocked}
                    >
                      {profile.unlocked ? profile.name : "Sealed profile"}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button" type="submit">
                {theories.length ? "REVISE THEORY" : "RECORD THEORY"}
                <ArrowUpRight size={16} />
              </button>
              <p role="status">{status}</p>
            </form>
          </section>
          {theories.length > 0 && (
            <section className="theory-history">
              <p className="eyebrow">
                YOUR CHANGING HYPOTHESIS / BROWSER NOTES
              </p>
              <ol>
                {theories.map((t, i) => (
                  <li key={`${t.at}-${i}`}>
                    <span>
                      0{i + 1} / CHAPTER {t.chapter}
                    </span>
                    <b>
                      {board.suspects.find((x) => x.id === t.suspect)?.name}
                    </b>
                    <small>
                      {t.evidence.length} recovered artifacts available
                    </small>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  );
}
