import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Apple, ArrowUpRight, Fingerprint, ShieldCheck } from "lucide-react";
import { supabase, supportedIdentity } from "./client";
import { useGame } from "./store";
import { Loading, PageTitle } from "./ui";
export const useIdentity = create<{
  ready: boolean;
  user: User | null;
  error: string;
}>(() => ({ ready: !supabase, user: null, error: "" }));
let initialized = false;
export function initializeIdentity() {
  if (initialized) return;
  initialized = true;
  if (!supabase) return;
  supabase.auth.onAuthStateChange((_event, session) => {
    useIdentity.setState({
      ready: true,
      user: supportedIdentity(session?.user || null) ? session!.user : null,
      error: "",
    });
  });
  void supabase.auth
    .getSession()
    .then(({ data, error }) =>
      useIdentity.setState({
        ready: true,
        user: supportedIdentity(data.session?.user || null)
          ? data.session!.user
          : null,
        error: error ? "Your sign-in session could not be read." : "",
      }),
    );
}
export function IdentityGate({
  children,
  requireName = true,
}: {
  children: ReactNode;
  requireName?: boolean;
}) {
  const identity = useIdentity();
  const game = useGame();
  if (!identity.ready) return <Loading />;
  if (supabase && !identity.user) return <Navigate to="/login" replace />;
  if (game.loading) return <Loading />;
  // Auth events can switch users in another tab without reloading this page.
  // Never render a prior actor's state while the replacement is being loaded.
  if (supabase && identity.user && game.state && game.state.id !== identity.user.id)
    return <Loading />;
  if (game.error)
    return (
      <div className="connection-error">
        <h1>The archive is unreachable.</h1>
        <p>{game.error}</p>
        <button className="button" onClick={() => void game.refresh()}>
          Reconnect
        </button>
      </div>
    );
  if (requireName && !game.state?.onboarded)
    return <Navigate to="/onboarding" replace />;
  return children;
}
export function Login() {
  const identity = useIdentity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<{
    google: boolean;
    apple: boolean;
  } | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((r) =>
        setProviders({
          google: !!r.external?.google,
          apple: !!r.external?.apple,
        }),
      )
      .catch(() =>
        setError("Sign-in is temporarily unavailable. Please try again."),
      );
    return () => controller.abort();
  }, []);
  async function signIn(provider: "google" | "apple") {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: provider === "google" ? "openid email profile" : undefined,
      },
    });
    if (error) {
      setError("Unable to open this sign-in method. Please try again later.");
      setBusy(false);
    }
  }
  if (identity.user) return <Navigate to="/onboarding" replace />;
  return (
    <div className="workspace login-layout">
      <div>
        <PageTitle
          eyebrow="WITNESS AUTHENTICATION / RECOVERY ACCESS"
          title="Every witness needs a name"
          description="Sign in with Google or Apple. Then choose the detective name the archive will remember."
        />
        <div className="login-art">
          <Fingerprint size={130} />
          <span>IDENTITY IS NOT A PERMISSION TO ERASE.</span>
        </div>
      </div>
      <section className="panel login-card">
        <ShieldCheck size={30} />
        <h2>Enter the archive.</h2>
        <p>
          Your investigation resumes in this browser. Your detective name is
          shown to your co-op partner and, only if you opt in, in the rankings.
        </p>
        <button
          className="button oauth-google"
          disabled={busy || !providers?.google}
          onClick={() => void signIn("google")}
        >
          <b>G</b>CONTINUE WITH GOOGLE
          <ArrowUpRight size={17} />
        </button>
        {providers?.apple && <button
          className="button secondary"
          disabled={busy || !providers?.apple}
          onClick={() => void signIn("apple")}
        >
          <Apple size={19} />
          CONTINUE WITH APPLE
          <ArrowUpRight size={17} />
        </button>}
        {supabase && providers && !providers.google && (
          <p className="signin-note">
            Unavailable sign-in methods are being prepared. Please check back
            soon.
          </p>
        )}
        {!supabase && (
          <div className="local-mode">
            <span className="eyebrow">LOCAL DEVELOPMENT BUILD</span>
            <Link className="text-button" to="/onboarding">
              OPEN LOCAL TEST SESSION
              <ArrowUpRight size={15} />
            </Link>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Link to="/privacy" className="text-button">
          PRIVACY &amp; YOUR SAVE
        </Link>
        <Link to="/" className="text-button">
          BACK TO THE CASE
        </Link>
      </section>
    </div>
  );
}
let callback: Promise<void> | null = null;
let callbackCode: string | null = null;
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(() =>
    new URLSearchParams(location.search).has("error")
      ? "Sign-in was cancelled or declined. Please try again."
      : "",
  );
  useEffect(() => {
    if (!supabase) {
      navigate("/login", { replace: true });
      return;
    }
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (params.has("error")) {
      window.history.replaceState({}, "", location.pathname);
      return;
    }
    if (!callback || (code && code !== callbackCode)) {
      callbackCode = code;
      callback = (async () => {
        if (code) {
          window.history.replaceState({}, "", location.pathname);
          const { error } = await supabase!.auth.exchangeCodeForSession(code);
          if (error)
            throw new Error(
              "Your sign-in link is invalid or expired. Please try again.",
            );
        }
        const { data } = await supabase!.auth.getSession();
        if (!supportedIdentity(data.session?.user || null))
          throw new Error("Use Google or Apple to sign in.");
        useIdentity.setState({ ready: true, user: data.session!.user });
        await useGame.getState().refresh();
      })().catch((e) => {
        callback = null;
        throw e;
      });
    }
    void callback
      .then(() => navigate("/onboarding", { replace: true }))
      .catch((e) => setError(e.message));
  }, [navigate]);
  return error ? (
    <div className="workspace empty-state">
      <h1>Sign-in interrupted.</h1>
      <p role="alert">{error}</p>
      <Link className="button" to="/login">
        TRY SIGNING IN AGAIN
      </Link>
    </div>
  ) : (
    <Loading />
  );
}
export function Onboarding() {
  const game = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (game.state?.onboarded)
    return (
      <Navigate
        to={game.state.startedAt ? "/investigation" : "/boot"}
        replace
      />
    );
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await game.act({ op: "profile", nickname: name, optIn: false });
      navigate("/boot", { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="workspace onboarding narrow">
      <PageTitle
        eyebrow="FIRST CONTACT / WITNESS REGISTRATION"
        title="What should ECHO call you?"
        description="Choose your detective name. Your progress saves automatically to this browser’s investigation slot."
      />
      <form className="panel login-card" onSubmit={save}>
        <label className="field">
          DETECTIVE NAME
          <input
            minLength={2}
            maxLength={32}
            required
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="A name the archive cannot erase"
          />
        </label>
        <p>
          2–32 characters. This can be a fictional name. Rankings stay private
          unless you opt in later.
        </p>
        <button className="button" disabled={busy} type="submit">
          REGISTER WITNESS
          <ArrowUpRight size={17} />
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
