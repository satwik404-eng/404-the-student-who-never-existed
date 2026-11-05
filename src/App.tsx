import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Fingerprint,
  Menu,
  Settings2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useGame, usePrefs, sound } from "./store";
import { missions } from "../shared/content";
import {
  Landing,
  Boot,
  Dashboard,
  Settings,
  Leaderboard,
  EndingPage,
} from "./Pages";
import {
  MissionPage,
  Evidence,
  Terminal,
  Archive,
  Echo,
} from "./Investigation";
import { Multiplayer } from "./Multiplayer";
import { Privacy } from "./Privacy";
import {
  IdentityGate,
  Login,
  AuthCallback,
  Onboarding,
  initializeIdentity,
  useIdentity,
} from "./Auth";
import { supabase } from "./client";
import { Loading, Modal } from "./ui";
const Suspects = lazy(() => import("./Suspects"));
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal">
        <h1>Connection interrupted.</h1>
        <p>Your saved evidence is safe on the server.</p>
        <button className="button" onClick={() => location.reload()}>
          Reconnect
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function App() {
  const [guide, setGuide] = useState(false);
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const prefs = usePrefs();
  const game = useGame();
  const identity = useIdentity();
  const activeActor = useRef<string | null>(null);
  const closeGuide = useCallback(() => setGuide(false), []);
  useEffect(() => {
    initializeIdentity();
  }, []);
  useEffect(() => {
    if (!identity.ready) return;
    const actor = supabase ? identity.user?.id : "local";
    if (activeActor.current === (actor || null)) return;
    activeActor.current = actor || null;
    useGame.getState().reset();
    if (actor) void useGame.getState().refresh();
  }, [identity.ready, identity.user]);
  useEffect(() => {
    document.documentElement.dataset.reduced = String(prefs.reduced);
  }, [prefs.reduced]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const missionNumber = Number(
    location.pathname.match(/mission\/(\d+)/)?.[1] || game.state?.chapter || 1,
  );
  const mission = missions[missionNumber - 1] || missions[0];
  const protectedPage = (children: ReactNode) => (
    <IdentityGate>
      {game.loading ? (
        <Loading />
      ) : game.error ? (
        <div className="connection-error">
          <h1>The archive is unreachable.</h1>
          <p>{game.error}</p>
          <button className="button" onClick={() => void game.refresh()}>
            Reconnect
          </button>
        </div>
      ) : game.state?.startedAt ? (
        children
      ) : (
        <Navigate to="/" replace />
      )}
    </IdentityGate>
  );
  return (
    <ErrorBoundary>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="app">
        <header className="site-header">
          <Link to="/" className="brand" aria-label="Project 404 home">
            <span className="brand-mark">
              <Fingerprint size={22} />
            </span>
            <span>
              404<span className="brand-sub">AN ARCHIVE MYSTERY</span>
            </span>
          </Link>
          <nav
            onClick={() => setMenu(false)}
            aria-label="Main navigation"
            className={menu ? "main-nav open" : "main-nav"}
          >
            <NavLink to="/investigation">The case</NavLink>
            <button onClick={() => setGuide(true)}>How to play</button>
            <NavLink to="/multiplayer">Co-op mode</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={prefs.muted ? "Enable sound" : "Mute sound"}
              onClick={() => {
                prefs.set({ muted: !prefs.muted });
                if (prefs.muted) sound();
              }}
            >
              {prefs.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <Link className="icon-button" to="/settings" aria-label="Settings">
              <Settings2 size={18} />
            </Link>
            <Link
              className="portal-link"
              to={game.state?.startedAt ? "/investigation" : "/boot"}
            >
              ACCESS PORTAL
              <ArrowUpRight size={14} />
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-label={menu ? "Close navigation" : "Open navigation"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route
              path="/"
              element={<Landing onGuide={() => setGuide(true)} />}
            />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/onboarding"
              element={
                <IdentityGate requireName={false}>
                  <Onboarding />
                </IdentityGate>
              }
            />
            <Route
              path="/boot"
              element={
                <IdentityGate>
                  <Boot />
                </IdentityGate>
              }
            />
            <Route
              path="/investigation"
              element={protectedPage(<Dashboard />)}
            />
            <Route
              path="/investigation/mission/:id"
              element={protectedPage(<MissionPage />)}
            />
            <Route
              path="/investigation/suspects"
              element={protectedPage(
                <Suspense fallback={<Loading />}>
                  <Suspects />
                </Suspense>,
              )}
            />
            <Route
              path="/investigation/evidence"
              element={protectedPage(<Evidence />)}
            />
            <Route
              path="/investigation/terminal"
              element={protectedPage(<Terminal standalone />)}
            />
            <Route
              path="/investigation/archive"
              element={protectedPage(<Archive />)}
            />
            <Route
              path="/investigation/echo"
              element={protectedPage(<Echo />)}
            />
            <Route
              path="/multiplayer"
              element={
                <IdentityGate>
                  <Multiplayer />
                </IdentityGate>
              }
            />
            <Route
              path="/multiplayer/:roomCode"
              element={
                <IdentityGate>
                  <Multiplayer />
                </IdentityGate>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <IdentityGate>
                  <Leaderboard />
                </IdentityGate>
              }
            />
            <Route
              path="/endings/:endingId"
              element={protectedPage(<EndingPage />)}
            />
            <Route
              path="/settings"
              element={
                <IdentityGate>
                  <Settings />
                </IdentityGate>
              }
            />
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>Record not found.</h1>
                  <Link className="button" to="/">
                    Return to the portal
                    <ChevronRight size={16} />
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
        <button
          className="guide-trigger"
          onClick={() => {
            sound();
            setGuide(true);
          }}
        >
          <BookOpen size={16} />
          <span>FIELD GUIDE</span>
          <span className="guide-shortcut">?</span>
        </button>
        {guide && (
          <Modal title="ECHO / FIELD GUIDE" onClose={closeGuide}>
            <div className="guide-heading">
              <span className="status-dot" />
              <span>SOMEONE IS STILL LISTENING.</span>
            </div>
            <h2>You are the witness.</h2>
            <p>
              This is a fictional mystery in six chapters. Inspect the portal,
              recover evidence, and verify each discovery. Your progress is
              saved automatically. No real systems are accessed.
            </p>
            <div className="guide-current">
              <span className="eyebrow">
                YOUR NEXT MOVE / CHAPTER{" "}
                {mission.id.toString().padStart(2, "0")}
              </span>
              <h3>{mission.title}</h3>
              <p className="haunted">“{mission.guide}”</p>
            </div>
            <div className="guide-steps">
              <p>
                <b>01 / Investigate</b>Read each mission and use its workspace.
                Every answer can be found in the fictional clues.
              </p>
              <p>
                <b>02 / Remember</b>Verified evidence stays in your journal. The
                terminal and archive open as the story progresses.
              </p>
              <p>
                <b>03 / Ask ECHO</b>This guide is always free. Optional ECHO
                hints cost 10, 20, then 30 XP. No hint gives a solution.
              </p>
              <p>
                <b>04 / Decide</b>The final chapter has a retryable timer and
                two endings. Your collected evidence survives a timeout.
              </p>
            </div>
            <button className="button" onClick={closeGuide}>
              Return to the investigation
              <ArrowUpRight size={17} />
            </button>
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  );
}
