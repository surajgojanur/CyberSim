import React, { lazy, Suspense, useEffect, useState } from "react";
import { Lock, Play, Radio, ShieldCheck, StopCircle, Trophy, Users } from "lucide-react";
import { api } from "../app/api";
import { useCountdown, useSocket } from "../app/hooks";
import { useSessionStore } from "../app/store";
import { answerText, phaseDescription } from "../app/utils";
import {
  AnswerProgress,
  Button,
  CountdownRing,
  GlassPanel,
  HeroPanel,
  JoinCodeDisplay,
  Leaderboard,
  MessageBanner,
  MetricCard,
  ParticipantGrid,
  PhaseHero,
  StatusPill,
  SummaryList
} from "../components/ui";

const RevealAnalyticsMiniBoard = lazy(() =>
  import("../components/ResultsAnalyticsBoard").then((module) => ({ default: module.RevealAnalyticsMiniBoard }))
);

export function AdminLobbyPage({ sessionId }) {
  const socket = useSocket();
  const {
    adminToken,
    session,
    participants,
    currentRound,
    answerProgress,
    revealData,
    leaderboard,
    takeoverMessage,
    setSession,
    setSessionPhase,
    setParticipants,
    setCurrentRound,
    setRoundLocked,
    setRoundReveal,
    setSessionEnded,
    restoreAdminState,
    setTakeoverMessage,
    setAnswerProgress
  } = useSessionStore();
  const [error, setError] = useState("");
  const remainingSeconds = useCountdown(currentRound?.timerEndsAt);

  useEffect(() => {
    if (!adminToken) {
      window.location.hash = "#/admin";
      return;
    }

    api(`/api/sessions/${sessionId}`, { token: adminToken })
      .then((data) => {
        setSession(data.session);
        setParticipants(data.participants);
        socket.emit("admin_subscribe", { token: adminToken, sessionId: Number(sessionId) });
      })
      .catch((caught) => setError(caught.message));

    socket.on("participant_list", ({ participants: nextParticipants }) => setParticipants(nextParticipants));
    socket.on("admin_state", (state) => {
      restoreAdminState(state);
      if (state.finalResults) {
        window.location.hash = `#/admin/results/${state.session.id}`;
      }
    });
    socket.on("round_start", (round) => {
      setError("");
      setCurrentRound(round);
    });
    socket.on("answer_progress", (progress) => setAnswerProgress(progress));
    socket.on("round_locked", (round) => setRoundLocked(round));
    socket.on("round_reveal", (reveal) => setRoundReveal(reveal));
    socket.on("session_ended", ({ results }) => {
      setError("");
      setSessionEnded(results);
      window.location.hash = `#/admin/results/${results.session.id}`;
    });
    socket.on("session_state", ({ state }) => setSessionPhase(state));
    socket.on("session_taken_over", ({ message }) => setTakeoverMessage(message));
    socket.on("socket_error", ({ message }) => setError(message));

    return () => {
      socket.off("participant_list");
      socket.off("admin_state");
      socket.off("round_start");
      socket.off("answer_progress");
      socket.off("round_locked");
      socket.off("round_reveal");
      socket.off("session_ended");
      socket.off("session_state");
      socket.off("session_taken_over");
      socket.off("socket_error");
    };
  }, [
    adminToken,
    sessionId,
    restoreAdminState,
    setAnswerProgress,
    setCurrentRound,
    setParticipants,
    setRoundLocked,
    setRoundReveal,
    setSession,
    setSessionEnded,
    setSessionPhase,
    setTakeoverMessage,
    socket
  ]);

  function startRound() {
    if (takeoverMessage) return;
    setError("");
    socket.emit("admin_start_round", {
      token: adminToken,
      sessionId: Number(sessionId)
    });
  }

  function forceLock() {
    if (takeoverMessage) return;
    setError("");
    socket.emit("admin_force_lock", {
      token: adminToken,
      sessionId: Number(sessionId)
    });
  }

  function endSession() {
    if (takeoverMessage) return;
    setError("");
    socket.emit("admin_end_session", {
      token: adminToken,
      sessionId: Number(sessionId)
    });
  }

  const participantResults =
    revealData?.participantResults?.map((result) => ({
      key: String(result.participantId),
      label: result.displayName,
      meta: result.answerOptionId ? (result.isCorrect ? "Answered correctly" : "Answered incorrectly") : "No answer submitted",
      value: `+${result.scoreDelta}`,
      toneClass: result.isCorrect ? "text-emerald-300" : "text-zinc-400"
    })) || [];

  return (
    <div className="grid gap-6">
      <HeroPanel
        eyebrow="Admin lobby"
        title={session?.title || "Loading session"}
        description="Manage participants, start each scenario, and monitor live response progress without losing visibility."
      >
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Participants" value={participants.length} hint="Currently registered in session" icon={Users} />
            <MetricCard
              label="Connected"
              value={participants.filter((participant) => participant.status === "connected").length}
              hint="Live sockets attached"
              accent="emerald"
              icon={ShieldCheck}
            />
            <MetricCard
              label="Phase"
              value={(currentRound?.state || session?.state || "lobby").toUpperCase()}
              hint="Current lifecycle state"
              accent="violet"
              icon={Radio}
            />
          </div>
          <JoinCodeDisplay joinCode={session?.joinCode} />
        </div>
      </HeroPanel>

      {error && <MessageBanner>{error}</MessageBanner>}

      <PhaseHero
        phase={currentRound?.state || session?.state || "lobby"}
        description={phaseDescription(currentRound, answerProgress, remainingSeconds)}
        timerSlot={currentRound?.state === "question" ? <CountdownRing remainingSeconds={remainingSeconds} /> : null}
        actionSlot={
          <>
            <Button
              icon={Play}
              onClick={startRound}
              disabled={Boolean(takeoverMessage) || currentRound?.state === "question" || currentRound?.state === "locked" || participants.length === 0}
            >
              {currentRound?.state === "reveal" ? "Start next scenario" : "Start round"}
            </Button>
            <Button
              icon={Trophy}
              tone="secondary"
              onClick={forceLock}
              disabled={Boolean(takeoverMessage) || currentRound?.state !== "question" || !answerProgress.allAnswered}
            >
              Reveal early
            </Button>
            <Button
              icon={Lock}
              tone="ghost"
              onClick={forceLock}
              disabled={Boolean(takeoverMessage) || currentRound?.state !== "question"}
            >
              Force lock
            </Button>
            <Button
              icon={StopCircle}
              tone="danger"
              onClick={endSession}
              disabled={Boolean(takeoverMessage) || session?.state === "ended"}
            >
              End session
            </Button>
          </>
        }
      />

      {currentRound?.question && (
        <GlassPanel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Current scenario</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{currentRound.question.title}</h2>
              <p className="mt-4 text-base leading-7 text-zinc-300">{currentRound.question.scenario}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Round</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-100">{currentRound.sequenceNumber}</p>
            </div>
          </div>

          {(currentRound.state === "question" || currentRound.state === "locked") && (
            <AnswerProgress className="mt-6" answered={answerProgress.answered} total={answerProgress.total} />
          )}

          {revealData && (
            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Reveal analysis</p>
                <p className="mt-4 text-zinc-300">{revealData.question.explanation}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusPill tone="success">
                    Correct answer: {answerText(revealData.question.options, revealData.correctAnswerId)}
                  </StatusPill>
                  {revealData.question.recommendedBehavior && (
                    <StatusPill tone="info">{revealData.question.recommendedBehavior}</StatusPill>
                  )}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Response summary</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Answered" value={answerProgress.answered} accent="emerald" icon={ShieldCheck} />
                  <MetricCard label="Eligible" value={answerProgress.total} icon={Users} />
                  <MetricCard
                    label="Correct"
                    value={revealData.participantResults?.filter((result) => result.isCorrect).length || 0}
                    accent="violet"
                    icon={Trophy}
                  />
                </div>
              </div>
            </div>
          )}
        </GlassPanel>
      )}

      {revealData && (
        <Suspense fallback={null}>
          <RevealAnalyticsMiniBoard reveal={revealData} />
        </Suspense>
      )}

      {revealData && (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <GlassPanel>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Leaderboard</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Standings after reveal</h2>
              </div>
              <StatusPill tone="info">Live update</StatusPill>
            </div>
            <Leaderboard leaderboard={leaderboard} />
          </GlassPanel>
          <GlassPanel>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Answer summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Participant outcomes</h2>
            </div>
            <SummaryList items={participantResults} />
          </GlassPanel>
        </div>
      )}

      <GlassPanel>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Roster</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Participants</h2>
          </div>
          <StatusPill tone="muted">{participants.length} total</StatusPill>
        </div>
        <ParticipantGrid participants={participants} />
      </GlassPanel>
    </div>
  );
}
