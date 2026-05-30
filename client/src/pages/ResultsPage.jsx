import React, { lazy, Suspense, useEffect, useState } from "react";
import { api } from "../app/api";
import { useSessionStore } from "../app/store";
import { Button, GlassPanel, HeroPanel, Leaderboard, LoadingState, MessageBanner, MetricCard, StatusPill } from "../components/ui";

const ResultsAnalyticsBoard = lazy(() =>
  import("../components/ResultsAnalyticsBoard").then((module) => ({ default: module.ResultsAnalyticsBoard }))
);

export function ResultsPage({ sessionId, mode }) {
  const { participant, finalResults, setFinalResults } = useSessionStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api(`/api/sessions/${sessionId}/results`)
      .then(({ results }) => setFinalResults(results))
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));
  }, [sessionId, setFinalResults]);

  if (loading && !finalResults) {
    return <LoadingState title="Loading final results" description="Reading persisted session results from the server." />;
  }

  if (error && !finalResults) {
    return <MessageBanner>{error}</MessageBanner>;
  }

  const results = finalResults;
  const myEntry = results?.leaderboard?.find((entry) => entry.participantId === participant?.participantId);

  return (
    <div className="grid gap-6">
      <HeroPanel
        eyebrow="Cyber Drill Final Report"
        title={results?.session?.title || "Session ended"}
        description={`Persisted final results from the server. ${results?.totalRoundsPlayed || 0} rounds played.`}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <StatusPill tone="success">Finalized</StatusPill>
          <StatusPill tone="info">{results?.leaderboard?.length || 0} ranked</StatusPill>
          <StatusPill tone="muted">{results?.totalRoundsPlayed || 0} rounds</StatusPill>
        </div>
      </HeroPanel>

      <Suspense fallback={<LoadingState title="Loading analytics" description="Preparing final result charts." />}>
        <ResultsAnalyticsBoard
          results={results}
          title="Final analytics board"
          description="Score charts, podium, and performance insights built from the persisted final-results payload."
          currentParticipantId={participant?.participantId}
        />
      </Suspense>

      {mode === "participant" && (
        <GlassPanel>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Your standing</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Personal summary</h2>
            </div>
            <Button tone="secondary" onClick={() => (window.location.hash = "#/join")}>
              Join another session
            </Button>
          </div>
          {myEntry ? (
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Rank" value={`#${myEntry.rank}`} accent="violet" />
              <MetricCard label="Score" value={myEntry.totalScore} accent="cyan" />
              <MetricCard label="Correct" value={myEntry.correctCount} accent="emerald" />
            </div>
          ) : (
            <p className="text-zinc-400">Your participant record was not found in these results.</p>
          )}
        </GlassPanel>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <GlassPanel>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Final leaderboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">End-of-session rankings</h2>
          </div>
          <Leaderboard leaderboard={results?.leaderboard || []} currentParticipantId={participant?.participantId} />
        </GlassPanel>

        {mode === "admin" ? (
          <GlassPanel>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Round summaries</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Per-round outcomes</h2>
            </div>
            <RoundSummaries rounds={results?.rounds || []} />
          </GlassPanel>
        ) : (
          <GlassPanel>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Completion status</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Session summary</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="Rounds played" value={results?.totalRoundsPlayed || 0} accent="violet" />
              <MetricCard label="Participants ranked" value={results?.leaderboard?.length || 0} accent="amber" />
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}

function RoundSummaries({ rounds }) {
  if (!rounds.length) {
    return <p className="text-zinc-500">No revealed rounds were played.</p>;
  }

  return (
    <ul className="grid gap-3">
      {rounds.map((round, index) => (
        <li
          key={round.roundId}
          className="animate-enter rounded-[22px] border border-white/10 bg-black/10 px-4 py-4"
          style={{ animationDelay: `${index * 35}ms` }}
        >
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Round {round.sequenceNumber}</p>
          <h3 className="mt-3 font-semibold text-white">{round.questionTitle}</h3>
          <p className="mt-3 text-sm text-cyan-100">Correct answer: {round.correctAnswerText}</p>
          <p className="mt-2 text-sm text-zinc-400">
            {round.correctCount} correct · {round.answeredCount} answered · {round.totalParticipants} participants
          </p>
        </li>
      ))}
    </ul>
  );
}
