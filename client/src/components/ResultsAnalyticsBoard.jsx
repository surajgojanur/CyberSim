import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BarChart3, Crown, Gauge, Medal, Sigma, Sparkles, Trophy, Users } from "lucide-react";
import { EmptyState, GlassCard, ProgressBar, StatCard, StatusBadge } from "./ui";
import {
  getAnsweredSummary,
  getAverageScore,
  getCorrectRate,
  getHighestScore,
  getScoreBuckets,
  getScoreGap,
  getTopParticipants,
  normalizeResults
} from "../lib/resultsAnalytics";

const chartColors = {
  cyan: "#67e8f9",
  violet: "#a78bfa",
  emerald: "#6ee7b7",
  amber: "#fcd34d",
  muted: "#94a3b8",
  grid: "rgba(148, 163, 184, 0.16)"
};

export function ResultsAnalyticsBoard({
  results,
  title = "Results analytics",
  description = "Charts and summaries derived from server-published result data.",
  variant = "full",
  currentParticipantId = null
}) {
  const normalized = normalizeResults(results);
  const topParticipants = getTopParticipants(results, variant === "mini" ? 8 : 10);
  const scoreBuckets = getScoreBuckets(results);
  const highestScore = getHighestScore(results);
  const averageScore = getAverageScore(results);
  const correctRate = getCorrectRate(results);
  const answeredSummary = getAnsweredSummary(results);
  const scoreGap = getScoreGap(results);
  const compact = variant === "mini";
  const hasResults = normalized.leaderboard.length > 0;

  if (!hasResults && !normalized.participantResults.length) {
    return (
      <GlassCard aria-label={title}>
        <EmptyState
          icon={BarChart3}
          title="No analytics available"
          description="Result analytics will appear after the server publishes reveal or final-results data."
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard aria-label={title} className={compact ? "p-4 sm:p-5" : ""}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
            {compact ? "Reveal analytics" : "Cyber Drill Final Report"}
          </p>
          <h2 className={compact ? "mt-2 text-2xl font-semibold text-white" : "mt-2 text-3xl font-semibold text-white"}>
            {title}
          </h2>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>}
        </div>
        <StatusBadge tone="success">Server-published</StatusBadge>
      </div>

      <div className={`grid gap-4 ${compact ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-5"}`}>
        <StatCard label="Participants" value={normalized.leaderboard.length} hint="Ranked entries" icon={Users} />
        {highestScore !== null && <StatCard label="Highest score" value={highestScore} accent="amber" icon={Trophy} />}
        {averageScore !== null && <StatCard label="Average score" value={averageScore} accent="emerald" icon={Sigma} />}
        {answeredSummary && (
          <StatCard
            label="Answered"
            value={`${answeredSummary.answered}/${answeredSummary.total}`}
            hint="Only when payload includes counts"
            accent="violet"
            icon={Gauge}
          />
        )}
        {correctRate && (
          <StatCard
            label="Correct rate"
            value={`${correctRate.percentage}%`}
            hint={`${correctRate.correct}/${correctRate.answered} answered`}
            accent="cyan"
            icon={Sparkles}
          />
        )}
      </div>

      {!compact && topParticipants.length > 0 && (
        <section className="mt-6" aria-label="Top three podium">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Podium</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Top operators</h3>
            </div>
            <StatusBadge tone="info">Top {Math.min(3, topParticipants.length)}</StatusBadge>
          </div>
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            {topParticipants.slice(0, 3).map((entry) => (
              <PodiumCard key={entry.participantId} entry={entry} maxScore={highestScore || 1} currentParticipantId={currentParticipantId} />
            ))}
          </div>
        </section>
      )}

      <div className={`mt-6 grid gap-6 ${compact ? "" : "xl:grid-cols-[1.15fr_0.85fr]"}`}>
        <ChartPanel
          title="Leaderboard score bars"
          note={`Showing top ${topParticipants.length} of ${normalized.leaderboard.length} ranked participants.`}
          empty={!topParticipants.length}
        >
          <LeaderboardBarChart data={topParticipants} compact={compact} />
        </ChartPanel>

        {!compact && (
          <ChartPanel
            title="Score distribution"
            note="Buckets are created from backend score values only."
            empty={!scoreBuckets.length}
          >
            <ScoreDistributionChart data={scoreBuckets} />
          </ChartPanel>
        )}
      </div>

      <PerformanceInsights
        className="mt-6"
        highest={topParticipants[0]}
        lowest={normalized.leaderboard.at(-1)}
        averageScore={averageScore}
        scoreGap={scoreGap}
        scoreBuckets={scoreBuckets}
        myResult={normalized.myResult}
        participantResults={normalized.participantResults}
        compact={compact}
      />
    </GlassCard>
  );
}

export function RevealAnalyticsMiniBoard({ reveal, currentParticipantId = null }) {
  if (!reveal) return null;

  return (
    <ResultsAnalyticsBoard
      results={reveal}
      title="Reveal telemetry"
      description="Round-level analytics are visible only after the reveal payload arrives."
      variant="mini"
      currentParticipantId={currentParticipantId}
    />
  );
}

function ChartPanel({ title, note, children, empty }) {
  return (
    <section
      className="min-w-0 rounded-[26px] border border-cyan-300/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      aria-label={title}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {note && <p className="mt-1 text-sm text-zinc-400">{note}</p>}
      </div>
      {empty ? (
        <EmptyState icon={BarChart3} title="No chart data" description="This chart needs server-published scores." />
      ) : (
        children
      )}
    </section>
  );
}

function LeaderboardBarChart({ data, compact }) {
  const chartData = data.map((entry) => ({
    name: entry.displayName,
    score: entry.totalScore,
    rank: entry.rank
  }));

  return (
    <div className="h-[300px] min-w-0 w-full" aria-label="Leaderboard bar chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 18, left: compact ? 8 : 22, bottom: 8 }}>
          <CartesianGrid stroke={chartColors.grid} horizontal={false} />
          <XAxis type="number" stroke={chartColors.muted} tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            width={compact ? 96 : 132}
            stroke={chartColors.muted}
            tick={{ fill: chartColors.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip labelSuffix="score" />} cursor={{ fill: "rgba(103, 232, 249, 0.06)" }} />
          <Bar dataKey="score" fill={chartColors.cyan} radius={[0, 10, 10, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreDistributionChart({ data }) {
  return (
    <div className="h-[300px] min-w-0 w-full" aria-label="Score distribution chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={data} margin={{ top: 8, right: 14, left: -12, bottom: 8 }}>
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis dataKey="label" stroke={chartColors.muted} tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} stroke={chartColors.muted} tick={{ fill: chartColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip labelSuffix="participants" />} cursor={{ fill: "rgba(167, 139, 250, 0.08)" }} />
          <Bar dataKey="participants" fill={chartColors.violet} radius={[10, 10, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload, label, labelSuffix }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.4)]">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-sm text-cyan-100">
        {item.value} {labelSuffix}
      </p>
    </div>
  );
}

function PodiumCard({ entry, maxScore, currentParticipantId }) {
  const isCurrent = entry.participantId === currentParticipantId;
  const isWinner = entry.rank === 1;
  const Icon = isWinner ? Crown : Medal;
  const tone = isWinner ? "amber" : entry.rank === 2 ? "cyan" : "violet";

  return (
    <article className={`score-podium rounded-[26px] border p-5 ${podiumBorderClass(entry.rank)} ${podiumHeightClass(entry.rank)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Rank {entry.rank}</p>
          <h4 className="mt-3 truncate text-xl font-semibold text-white">{entry.displayName}</h4>
          {isCurrent && <StatusBadge tone="info">You</StatusBadge>}
        </div>
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-100">
          <Icon className={`h-6 w-6 ${isWinner ? "text-amber-200" : ""}`} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-8 text-4xl font-semibold text-cyan-100">{entry.totalScore}</p>
      {entry.correctCount !== null && <p className="mt-2 text-sm text-zinc-400">{entry.correctCount} correct answers</p>}
      <ProgressBar className="mt-5" value={entry.totalScore || 0} max={maxScore} tone={tone} ariaLabel={`${entry.displayName} final score`} />
    </article>
  );
}

function PerformanceInsights({ highest, lowest, averageScore, scoreGap, scoreBuckets, myResult, participantResults, compact, className = "" }) {
  const insights = [];

  if (highest) {
    insights.push({
      title: "Highest scorer",
      value: highest.displayName,
      detail: `${highest.totalScore} points`,
      tone: "amber"
    });
  }

  if (myResult) {
    insights.push({
      title: "Your round delta",
      value: `+${myResult.scoreDelta || 0}`,
      detail: myResult.isCorrect ? "Correct this round" : "No points this round",
      tone: myResult.isCorrect ? "emerald" : "amber"
    });
  } else if (participantResults.length) {
    const bestDelta = participantResults.reduce((best, entry) => (entry.scoreDelta > best.scoreDelta ? entry : best), participantResults[0]);
    insights.push({
      title: "Top round delta",
      value: bestDelta.displayName || "Participant",
      detail: `+${bestDelta.scoreDelta || 0} points this reveal`,
      tone: "emerald"
    });
  }

  if (scoreGap !== null) {
    insights.push({
      title: "Close competition",
      value: `${scoreGap} point gap`,
      detail: scoreGap <= 250 ? "Ranks 1 and 2 are tightly grouped" : "Current lead is clear",
      tone: scoreGap <= 250 ? "cyan" : "violet"
    });
  }

  if (!compact && highest && lowest && averageScore !== null) {
    insights.push({
      title: "Training spread",
      value: `${lowest.totalScore}-${highest.totalScore}`,
      detail: `Average score ${averageScore}; ${scoreBuckets.length} occupied score bands`,
      tone: "violet"
    });
  }

  if (!insights.length) return null;

  return (
    <section className={className} aria-label="Performance insights">
      <div className={`grid gap-4 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
        {insights.map((insight) => (
          <div key={insight.title} className={`rounded-[24px] border bg-black/15 p-4 ${insightClass(insight.tone)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">{insight.title}</p>
            <p className="mt-3 break-words text-xl font-semibold text-white">{insight.value}</p>
            <p className="mt-2 text-sm leading-5 text-zinc-400">{insight.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function podiumHeightClass(rank) {
  if (rank === 1) return "md:min-h-[224px]";
  if (rank === 2) return "md:min-h-[198px]";
  return "md:min-h-[176px]";
}

function podiumBorderClass(rank) {
  if (rank === 1) return "border-amber-300/30";
  if (rank === 2) return "border-cyan-300/25";
  return "border-violet-300/25";
}

function insightClass(tone) {
  if (tone === "amber") return "border-amber-300/20";
  if (tone === "emerald") return "border-emerald-300/20";
  if (tone === "violet") return "border-violet-300/20";
  return "border-cyan-300/20";
}
