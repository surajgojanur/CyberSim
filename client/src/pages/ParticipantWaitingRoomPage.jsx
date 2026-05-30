import React, { lazy, Suspense, useEffect, useState } from "react";
import { DoorOpen, Lock, Radio, Send, ShieldCheck, Trophy } from "lucide-react";
import { useCountdown, useSocket } from "../app/hooks";
import { useSessionStore } from "../app/store";
import { cn } from "../app/utils";
import {
  Button,
  CountdownRing,
  GlassPanel,
  HeroPanel,
  Leaderboard,
  MessageBanner,
  MetricCard,
  OptionCard,
  RevealBurst,
  StatusPill
} from "../components/ui";

const RevealAnalyticsMiniBoard = lazy(() =>
  import("../components/ResultsAnalyticsBoard").then((module) => ({ default: module.RevealAnalyticsMiniBoard }))
);

export function ParticipantWaitingRoomPage() {
  const socket = useSocket();
  const {
    participant,
    currentRound,
    answerLocked,
    mySubmittedAnswerId,
    takeoverMessage,
    clearParticipant,
    setCurrentRound,
    setRoundLocked,
    setRoundReveal,
    setSessionEnded,
    setMySubmittedAnswer
  } = useSessionStore();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [error, setError] = useState("");
  const remainingSeconds = useCountdown(currentRound?.timerEndsAt);

  useEffect(() => {
    socket.on("round_start", (round) => {
      setError("");
      setSelectedOptionId(null);
      setCurrentRound(round);
    });
    socket.on("round_locked", (round) => setRoundLocked(round));
    socket.on("round_reveal", (reveal) => setRoundReveal(reveal));
    socket.on("session_ended", ({ results }) => {
      setError("");
      setSessionEnded(results);
      window.location.hash = `#/results/${results.session.id}`;
    });
    socket.on("answer_ack", ({ answerOptionId }) => {
      setError("");
      setMySubmittedAnswer(answerOptionId);
    });
    socket.on("answer_error", ({ message }) => setError(message));
    socket.on("participant_left_session", () => {
      clearParticipant();
      window.location.hash = "#/join";
    });

    return () => {
      socket.off("round_start");
      socket.off("round_locked");
      socket.off("round_reveal");
      socket.off("session_ended");
      socket.off("answer_ack");
      socket.off("answer_error");
      socket.off("participant_left_session");
    };
  }, [clearParticipant, setCurrentRound, setMySubmittedAnswer, setRoundLocked, setRoundReveal, setSessionEnded, socket]);

  if (!participant) {
    return (
      <HeroPanel
        eyebrow="Participant session"
        title="No active join found."
        description="Reconnect with a valid join code to enter the waiting room."
      >
        <div className="mt-6">
          <Button onClick={() => (window.location.hash = "#/join")}>Enter a join code</Button>
        </div>
      </HeroPanel>
    );
  }

  function submitAnswer(event) {
    event.preventDefault();
    setError("");
    if (takeoverMessage) {
      setError("This session was opened in another tab");
      return;
    }
    if (!selectedOptionId || !currentRound) {
      setError("Choose an answer before submitting");
      return;
    }

    socket.emit("submit_answer", {
      participantId: participant.participantId,
      socketToken: participant.socketToken,
      roundId: currentRound.roundId,
      answerOptionId: selectedOptionId
    });
  }

  function leaveSession() {
    if (!participant?.socketToken) return;
    socket.emit("participant_leave_session", { socketToken: participant.socketToken });
    clearParticipant();
    window.location.hash = "#/join";
  }

  if (currentRound?.question) {
    const locked = Boolean(takeoverMessage) || answerLocked || currentRound.state === "locked" || remainingSeconds === 0;
    const reveal = currentRound.state === "reveal" ? currentRound : null;
    const totalSeconds = Math.max(1, Math.ceil(((currentRound.timerEndsAt || 0) - (currentRound.startedAtMs || 0)) / 1000) || 45);

    return (
      <div className="grid gap-6">
        <HeroPanel
          eyebrow={`Round ${currentRound.sequenceNumber}`}
          title={currentRound.question.title}
          description={currentRound.question.scenario}
        >
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              <StatusPill tone={locked ? "warning" : "info"} icon={locked ? Lock : Radio}>
                {locked ? "Locked" : "Live question"}
              </StatusPill>
              {mySubmittedAnswerId && <StatusPill tone="success" icon={ShieldCheck}>Answer submitted</StatusPill>}
              {reveal && <StatusPill tone="success" icon={Trophy}>Reveal active</StatusPill>}
            </div>
            <CountdownRing remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} />
          </div>
        </HeroPanel>

        <form onSubmit={submitAnswer} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <GlassPanel>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Choose response</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Answer options</h2>
              </div>
              <StatusPill tone="muted">{currentRound.question.options.length} options</StatusPill>
            </div>
            <div className="grid gap-4">
              {currentRound.question.options.map((option, index) => (
                <OptionCard
                  key={option.id}
                  checked={selectedOptionId === option.id || mySubmittedAnswerId === option.id}
                  disabled={locked}
                  label={String.fromCharCode(65 + index)}
                  value={option.text}
                  isCorrect={reveal?.correctAnswerId === option.id}
                  isIncorrectReveal={Boolean(reveal && reveal.correctAnswerId !== option.id && mySubmittedAnswerId === option.id)}
                  onChange={() => setSelectedOptionId(option.id)}
                />
              ))}
            </div>
            {error && <MessageBanner className="mt-4">{error}</MessageBanner>}
            {mySubmittedAnswerId && (
              <MessageBanner tone="muted" className="mt-4">
                Answer submitted. You cannot change it now.
              </MessageBanner>
            )}
            {currentRound.state === "locked" && (
              <MessageBanner tone="muted" className="mt-4">
                Round locked. The server is evaluating responses.
              </MessageBanner>
            )}
            <div className="mt-6">
              <Button icon={Send} disabled={locked || !selectedOptionId}>Submit answer</Button>
            </div>
          </GlassPanel>

          <div className="grid gap-6">
            <GlassPanel>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard label="Round" value={currentRound.sequenceNumber} hint="Current scenario index" icon={Radio} />
                <MetricCard
                  label="Status"
                  value={locked ? "LOCKED" : "OPEN"}
                  hint={locked ? "Selections are frozen" : "Submit before the timer ends"}
                  accent={locked ? "amber" : "cyan"}
                  icon={locked ? Lock : ShieldCheck}
                />
              </div>
            </GlassPanel>

            {reveal ? (
              <>
                <GlassPanel className="reveal-panel">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Round reveal</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Result summary</h2>
                  <div className="mt-5">
                    <RevealBurst correct={Boolean(reveal.myResult?.isCorrect)} />
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <MetricCard
                      label="Score delta"
                      value={`+${reveal.myResult?.scoreDelta || 0}`}
                      hint={reveal.myResult?.isCorrect ? "Correct answer" : "No points this round"}
                      accent="emerald"
                      icon={Trophy}
                    />
                    <MetricCard
                      label="Outcome"
                      value={reveal.myResult?.isCorrect ? "CORRECT" : "MISS"}
                      hint="Scored from persisted reveal data"
                      accent={reveal.myResult?.isCorrect ? "emerald" : "amber"}
                      icon={ShieldCheck}
                    />
                  </div>
                  <div className="mt-6 rounded-[22px] border border-white/10 bg-black/10 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Why it matters</p>
                    <p className="mt-3 leading-7 text-zinc-300">{reveal.question.explanation}</p>
                    {reveal.question.learningObjective && (
                      <p className="mt-4 text-sm text-zinc-400">{reveal.question.learningObjective}</p>
                    )}
                    {reveal.question.recommendedBehavior && (
                      <p className="mt-3 text-sm font-medium text-cyan-200">{reveal.question.recommendedBehavior}</p>
                    )}
                  </div>
                  <div className="mt-6">
                    <p className="mb-4 text-xs uppercase tracking-[0.3em] text-zinc-500">Leaderboard</p>
                    <Leaderboard leaderboard={reveal.leaderboard || []} currentParticipantId={participant.participantId} />
                  </div>
                </GlassPanel>
                <Suspense fallback={null}>
                  <RevealAnalyticsMiniBoard reveal={reveal} currentParticipantId={participant.participantId} />
                </Suspense>
              </>
            ) : (
              <GlassPanel className={cn("min-h-[240px] justify-center", currentRound.state === "locked" && "reveal-panel")}>
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="loader-ring" />
                  <p className="mt-6 text-lg font-medium text-white">
                    {currentRound.state === "locked" ? "Evaluating responses" : "Awaiting reveal"}
                  </p>
                  <p className="mt-3 max-w-sm text-zinc-400">
                    {currentRound.state === "locked"
                      ? "Answers are locked. Results and scoring will appear here as soon as the server finishes evaluation."
                      : "Choose carefully and submit before the timer expires."}
                  </p>
                </div>
              </GlassPanel>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <HeroPanel
        eyebrow="Participant waiting room"
        title={participant.session.title}
        description={`You are in the lobby as ${participant.displayName}. Stay ready for the next scenario.`}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <StatusPill tone="info">Connected</StatusPill>
          <StatusPill tone="muted">Waiting for admin start</StatusPill>
        </div>
      </HeroPanel>

      <GlassPanel className="max-w-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Session status</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Standing by</h2>
            <p className="mt-3 text-zinc-400">Wait here until the admin starts the next round. This view will update automatically.</p>
          </div>
          <Button tone="secondary" icon={DoorOpen} onClick={leaveSession}>
            Leave session
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
