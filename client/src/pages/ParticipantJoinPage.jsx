import React, { useEffect, useState } from "react";
import { api } from "../app/api";
import { useSocket } from "../app/hooks";
import { useSessionStore } from "../app/store";
import { Button, Field, GlassPanel, HeroPanel, MessageBanner, StatusPill } from "../components/ui";

export function ParticipantJoinPage() {
  const socket = useSocket();
  const { setParticipant } = useSessionStore();
  const [form, setForm] = useState({ joinCode: "", displayName: "" });
  const [sessionPreview, setSessionPreview] = useState(null);
  const [error, setError] = useState("");

  async function validateCode() {
    setError("");
    setSessionPreview(null);
    if (form.joinCode.trim().length !== 6) return;
    try {
      const data = await api(`/api/join/${form.joinCode.trim().toUpperCase()}`);
      setSessionPreview(data.session);
    } catch (caught) {
      setError(caught.message);
    }
  }

  useEffect(() => {
    socket.on("join_ack", ({ participantId, socketToken, sessionState }) => {
      setParticipant({
        participantId,
        socketToken,
        session: sessionState,
        displayName: form.displayName
      });
      window.location.hash = "#/waiting";
    });
    socket.on("join_error", ({ message }) => setError(message));

    return () => {
      socket.off("join_ack");
      socket.off("join_error");
    };
  }, [form.displayName, setParticipant, socket]);

  function submit(event) {
    event.preventDefault();
    setError("");
    socket.emit("join_session", form);
  }

  return (
    <div className="grid flex-1 place-items-center py-6">
      <div className="w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <HeroPanel
            eyebrow="Participant access"
            title="Join the live cyber response drill."
            description="Enter the lobby with a session code, stay ready for real-time rounds, and receive immediate reveal and leaderboard feedback."
          >
            <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Fast join</p>
                <p className="mt-3 text-sm text-zinc-300">Code validation previews the active session before you commit.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Focused rounds</p>
                <p className="mt-3 text-sm text-zinc-300">Question, timer, and answer cards keep the task clear under pressure.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Live results</p>
                <p className="mt-3 text-sm text-zinc-300">Reveal screens and leaderboard shifts stay readable on any device.</p>
              </div>
            </div>
          </HeroPanel>

          <GlassPanel className="self-center">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Join session</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Enter lobby</h2>
            <p className="mt-3 text-zinc-400">Use the six-character join code from the admin display.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field
                label="Join code"
                value={form.joinCode}
                onBlur={validateCode}
                onChange={(joinCode) => setForm({ ...form, joinCode: joinCode.toUpperCase() })}
                placeholder="ABC123"
                inputClassName="text-center text-xl tracking-[0.35em] uppercase"
              />
              <Field
                label="Display name"
                value={form.displayName}
                onChange={(displayName) => setForm({ ...form, displayName })}
                placeholder="Your name"
              />
              {sessionPreview && (
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
                  <div className="flex items-center justify-between gap-3">
                    <span>Ready to join: {sessionPreview.title}</span>
                    <StatusPill tone="info">Validated</StatusPill>
                  </div>
                </div>
              )}
              {error && <MessageBanner>{error}</MessageBanner>}
              <Button className="w-full">Join lobby</Button>
            </form>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
