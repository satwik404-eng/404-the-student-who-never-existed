import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PageTitle } from "./ui";
export function Privacy() {
  return (
    <div className="workspace narrow">
      <PageTitle
        eyebrow="PROJECT 404 / PRIVACY"
        title="Your name belongs to you"
        description="This game is fictional. Your sign-in and privacy choices are real."
      />
      <section className="panel login-card">
        <h2>What the game stores</h2>
        <p>
          Google or Apple authenticates you through Supabase. The game uses your
          account identifier and your chosen detective name. You do not enter a
          password into this website.
        </p>
        <p>
          Your investigation is saved under your account and a browser-specific
          identifier. Returning in the same browser resumes it. Clearing browser
          storage removes that browser’s ability to resume its save; another
          browser begins a separate investigation.
        </p>
        <p>
          Progress, evidence, hint usage, score, ending, and completion time are
          stored on the game server so that the browser cannot award itself
          arbitrary scores. The game does not publish your email address.
        </p>
        <h2>What other players see</h2>
        <p>
          Your co-op partner sees your detective name and messages sent to that
          room. Your private clue is delivered to your role. Rankings are
          private by default. If you opt in, the rankings show your detective
          name, score, rank, time, and ending.
        </p>
        <h2>Your choices</h2>
        <p>
          You can change your detective name and ranking visibility in Settings,
          and sign out of this browser. No advertising or analytics trackers are
          installed in this application.
        </p>
        <p>
          For a question about your game data, contact the creator through{" "}
          <a
            className="lime"
            href="https://github.com/satwik404-eng"
            target="_blank"
            rel="noopener noreferrer"
          >
            Satwik’s GitHub profile
          </a>
          . Google, Apple, Supabase, and Vercel also process data under their
          own service policies.
        </p>
        <Link className="text-button" to="/">
          RETURN TO THE PORTAL
          <ArrowUpRight size={16} />
        </Link>
      </section>
    </div>
  );
}
