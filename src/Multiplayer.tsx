import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  FileLock2,
  Link2,
  Radio,
  Send,
  Users,
  X,
} from "lucide-react";
import { request, supabase } from "./api";
import type { RoomView } from "../shared/types";
import { sound, useGame } from "./store";
import { Loading, PageTitle, Tag } from "./ui";

export function Multiplayer() {
  const { roomCode } = useParams();
  return <RoomPage key={roomCode || "landing"} roomCode={roomCode} />;
}
function RoomPage({ roomCode }: { roomCode?: string }) {
  const navigate = useNavigate();
  const state = useGame((x) => x.state);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [code, setCode] = useState("");
  const [chat, setChat] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const syncing = useRef(false);
  const [presence, setPresence] = useState<string[]>([]);
  useEffect(() => {
    if (!roomCode) return;
    let live = true;
    async function sync(join = false) {
      if (syncing.current) return;
      syncing.current = true;
      try {
        const r = await request({
          op: join ? "room-join" : "room-get",
          code: roomCode,
        });
        if (live) {
          setRoom(r.room || null);
          setError("");
          setConnected(true);
        }
      } catch (e) {
        if (live) {
          setError((e as Error).message);
          setConnected(false);
        }
      } finally {
        syncing.current = false;
      }
    }
    void sync(true);
    const timer = setInterval(() => void sync(), 4000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [roomCode]);
  useEffect(() => {
    if (!supabase || !room?.code || !state) return;
    const channel = supabase.channel(`room:${room.code}`, {
      config: { private: true, presence: { key: state.id } },
    });
    channel
      .on("presence", { event: "sync" }, () =>
        setPresence(Object.keys(channel.presenceState())),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_documents",
          filter: `key=eq.room:${room.code}`,
        },
        () => {
          if (syncing.current) return;
          syncing.current = true;
          request({ op: "room-get", code: room.code })
            .then((r) => r.room && setRoom(r.room))
            .catch((e) => setError(e.message))
            .finally(() => {
              syncing.current = false;
            });
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ witness: state.id });
      });
    return () => {
      void supabase!.removeChannel(channel);
    };
  }, [room?.code, state]);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const r = await request({ op: "room-create" });
      if (r.room) {
        setRoom(r.room);
        navigate(`/multiplayer/${r.room.code}`);
        sound();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function join(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await request({ op: "room-join", code: code.toUpperCase() });
      if (r.room) {
        setRoom(r.room);
        navigate(`/multiplayer/${r.room.code}`);
        sound();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(
    op: string,
    extra: { text?: string; answer?: string } = {},
  ) {
    setBusy(true);
    try {
      const r = await request({ op, code: roomCode, ...extra });
      if (r.room) setRoom(r.room);
      setError("");
      if (op === "room-chat") setChat("");
      if (op === "room-leave") navigate("/multiplayer");
      sound(r.success ? "success" : "click");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/multiplayer/${room?.code}`,
      );
      setStatus(
        "Invite link copied. Open it in another browser or send it to your partner.",
      );
    } catch {
      setStatus(
        `Room code: ${room?.code}. Your partner can enter it on the Co-op page.`,
      );
    }
  }
  if (!roomCode)
    return (
      <div className="workspace multiplayer-landing">
        <PageTitle
          eyebrow="COOPERATIVE INVESTIGATION / 02 WITNESSES"
          title="Don’t go alone"
          description="The archive split the truth in two. Neither of you can see the whole file."
        />
        <div className="coop-layout">
          <div className="split-art" aria-hidden="true">
            <div>
              <span>FILE A</span>
              <FileLock2 size={75} />
              <b>THE SEQUENCE</b>
            </div>
            <Link2 size={35} />
            <div>
              <span>FILE B</span>
              <FileLock2 size={75} />
              <b>THE WORDS</b>
            </div>
          </div>
          <section className="panel coop-entry">
            <Tag>THE SPLIT FILE</Tag>
            <h2>
              Two records.
              <br />
              One missing phrase.
            </h2>
            <p>
              Create a private room, invite a real partner, and compare your
              different clues. You’ll need to communicate to reconstruct the
              file.
            </p>
            <button
              className="button"
              disabled={busy || !state}
              onClick={() => void create()}
            >
              <Users size={17} />
              CREATE A ROOM
              <ArrowUpRight size={17} />
            </button>
            <div className="or-divider">OR JOIN A WITNESS</div>
            <form onSubmit={join}>
              <label className="field">
                SIX-CHARACTER ROOM CODE
                <input
                  required
                  pattern="[A-Fa-f0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="E.G. A3F092"
                />
              </label>
              <button
                className="button secondary"
                disabled={busy}
                type="submit"
              >
                JOIN ROOM
                <ArrowUpRight size={17} />
              </button>
            </form>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
        </div>
        <p className="coop-note">
          <Radio size={16} />
          Live rooms use the current backend. Local rooms require both browsers
          to reach this server; Supabase rooms work across devices. No partner
          is simulated.
        </p>
      </div>
    );
  return (
    <div className="workspace">
      <Link to="/multiplayer" className="back-link">
        <ArrowLeft size={14} />
        CO-OP ROOMS
      </Link>
      <div className="room-heading">
        <PageTitle eyebrow="PRIVATE RECOVERY CHANNEL" title="The split file" />
        <div className="room-code">
          <span className="eyebrow">ROOM CODE</span>
          <button onClick={() => void copy()} aria-label="Copy room invitation">
            {roomCode}
            <Copy size={16} />
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {status && <p role="status">{status}</p>}
      {!room ? (
        <>
          <Loading />
          <Link className="button secondary" to="/multiplayer">
            TRY ANOTHER ROOM
          </Link>
        </>
      ) : (
        <div className="room-layout">
          <section className="panel room-mission">
            <div className="panel-top">
              <span className="eyebrow">
                <span
                  className={connected ? "status-dot" : "status-dot offline"}
                />
                {connected ? "SYNCHRONIZED" : "RECONNECTING"}
              </span>
              <Tag>{room.status}</Tag>
            </div>
            <div className="room-members">
              {room.members.map((m) => (
                <div className="room-member" key={m.id}>
                  <span className="member-avatar">{m.role}</span>
                  <div>
                    <b>
                      {m.nickname}
                      {m.role === room.role ? " (you)" : ""}
                    </b>
                    <small>
                      {room.members.some(
                        (x) => x.role === room.role && x.seen - m.seen < 20000,
                      ) || presence.includes(m.id)
                        ? "CONNECTED"
                        : "DISCONNECTED — AWAITING RECONNECT"}
                    </small>
                  </div>
                  <span className={m.ready ? "lime" : "dim"}>
                    {m.ready ? <Check size={17} /> : "NOT READY"}
                  </span>
                </div>
              ))}
              {room.members.length === 1 && (
                <div className="room-member waiting">
                  <Users size={24} />
                  <p>
                    Waiting for a second witness…
                    <small>Share the room code or invitation link.</small>
                  </p>
                </div>
              )}
            </div>
            {room.status === "waiting" ? (
              <div className="room-ready">
                <p>
                  Each of you receives a different private clue once both
                  witnesses are ready.
                </p>
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() => void action("room-ready")}
                >
                  {room.members.find((m) => m.role === room.role)?.ready
                    ? "CANCEL READY"
                    : "I’M READY"}
                  <Check size={16} />
                </button>
                {room.role === "A" && room.members.length === 2 && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => void action("room-kick")}
                  >
                    REMOVE PARTNER
                  </button>
                )}
                {room.role === "A" && (
                  <button
                    className="button"
                    disabled={
                      busy ||
                      room.members.length < 2 ||
                      !room.members.every((m) => m.ready)
                    }
                    onClick={() => void action("room-start")}
                  >
                    START THE SPLIT FILE
                    <ArrowUpRight size={17} />
                  </button>
                )}
              </div>
            ) : room.status === "closed" ? (
              <div className="empty-state">
                <h2>This room has closed.</h2>
                <Link to="/multiplayer" className="button">
                  RETURN TO ROOMS
                </Link>
              </div>
            ) : (
              <div className="private-clue">
                <span className="eyebrow">
                  <FileLock2 size={15} />
                  PRIVATE EVIDENCE / WITNESS {room.role}
                </span>
                <h2>Your half of the truth.</h2>
                <p className="mono">{room.clue}</p>
                {room.status === "solved" ? (
                  <div className="coop-solved" role="status">
                    <Check size={28} />
                    <h3>The split file is whole.</h3>
                    <p>
                      Two witnesses remembered what one could not. Both of you
                      recovered the message.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action("room-submit", { answer });
                    }}
                  >
                    <label className="field">
                      RECONSTRUCTED PHRASE
                      <input
                        required
                        maxLength={80}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Compare your clues with your partner"
                      />
                    </label>
                    <button type="submit" disabled={busy} className="button">
                      RECONCILE FILE
                      <ArrowUpRight size={16} />
                    </button>
                  </form>
                )}
              </div>
            )}
            <button
              className="text-button leave-room"
              disabled={busy}
              onClick={() => void action("room-leave")}
            >
              <X size={14} />
              {room.role === "A" ? "CLOSE ROOM" : "LEAVE ROOM"}
            </button>
          </section>
          <section className="panel room-chat">
            <div className="panel-top">
              <span className="eyebrow">WITNESS CHANNEL</span>
              <Radio size={16} />
            </div>
            <div className="chat-log" role="log" aria-label="Co-op messages">
              {room.messages.length === 0 && (
                <p className="chat-empty">
                  A quiet channel. Start by introducing yourself.
                </p>
              )}
              {room.messages.map((m) => (
                <div key={m.id} className="chat-message">
                  <span>{m.sender}</span>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                if (chat.trim()) void action("room-chat", { text: chat });
              }}
            >
              <input
                aria-label="Message your partner"
                required
                maxLength={280}
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                placeholder="Tell your partner what you found…"
              />
              <button
                className="icon-button"
                type="submit"
                disabled={busy}
                aria-label="Send co-op message"
              >
                <Send size={17} />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
