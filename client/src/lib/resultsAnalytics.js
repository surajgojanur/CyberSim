export function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function normalizeResults(rawResults = {}) {
  const leaderboard = Array.isArray(rawResults.leaderboard)
    ? rawResults.leaderboard
        .map((entry, index) => ({
          participantId: entry.participantId,
          displayName: entry.displayName || `Participant ${index + 1}`,
          rank: safeNumber(entry.rank, index + 1),
          totalScore: safeNumber(entry.totalScore, 0),
          correctCount: Number.isFinite(Number(entry.correctCount)) ? Number(entry.correctCount) : null
        }))
        .sort((a, b) => a.rank - b.rank)
    : [];

  const participantResults = Array.isArray(rawResults.participantResults)
    ? rawResults.participantResults.map((entry) => ({
        participantId: entry.participantId,
        displayName: entry.displayName,
        answerOptionId: entry.answerOptionId ?? null,
        isCorrect: typeof entry.isCorrect === "boolean" ? entry.isCorrect : null,
        scoreDelta: safeNumber(entry.scoreDelta, 0),
        totalScore: safeNumber(entry.totalScore, 0)
      }))
    : [];

  const rounds = Array.isArray(rawResults.rounds)
    ? rawResults.rounds.map((round) => ({
        roundId: round.roundId,
        answeredCount: safeNumber(round.answeredCount, 0),
        correctCount: safeNumber(round.correctCount, 0),
        totalParticipants: safeNumber(round.totalParticipants, 0)
      }))
    : [];

  return {
    raw: rawResults,
    session: rawResults.session || null,
    myResult: rawResults.myResult || null,
    leaderboard,
    participantResults,
    rounds,
    totalRoundsPlayed: safeNumber(rawResults.totalRoundsPlayed, rounds.length)
  };
}

export function getTopParticipants(results, limit = 10) {
  return normalizeResults(results).leaderboard.slice(0, limit);
}

export function getAverageScore(results) {
  const leaderboard = normalizeResults(results).leaderboard;
  if (!leaderboard.length) return null;
  return Math.round(leaderboard.reduce((sum, entry) => sum + entry.totalScore, 0) / leaderboard.length);
}

export function getHighestScore(results) {
  const leaderboard = normalizeResults(results).leaderboard;
  if (!leaderboard.length) return null;
  return Math.max(...leaderboard.map((entry) => entry.totalScore));
}

export function getScoreGap(results) {
  const [first, second] = normalizeResults(results).leaderboard;
  if (!first || !second) return null;
  return Math.max(0, first.totalScore - second.totalScore);
}

export function getScoreBuckets(results, bucketSize = 500) {
  const scores = normalizeResults(results).leaderboard.map((entry) => entry.totalScore);
  if (!scores.length) return [];

  const maxScore = Math.max(...scores, 0);
  const bucketCount = Math.max(1, Math.floor(maxScore / bucketSize) + 1);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const min = index * bucketSize;
    const max = min + bucketSize - 1;
    return {
      min,
      max,
      label: `${min}-${max}`,
      participants: 0
    };
  });

  for (const score of scores) {
    const index = Math.min(buckets.length - 1, Math.floor(score / bucketSize));
    buckets[index].participants += 1;
  }

  return buckets.filter((bucket) => bucket.participants > 0);
}

export function getCorrectRate(results) {
  const normalized = normalizeResults(results);

  if (normalized.participantResults.length) {
    const answered = normalized.participantResults.filter((entry) => entry.answerOptionId !== null).length;
    if (!answered) return null;
    const correct = normalized.participantResults.filter((entry) => entry.answerOptionId !== null && entry.isCorrect === true).length;
    return {
      correct,
      answered,
      total: normalized.participantResults.length,
      percentage: Math.round((correct / answered) * 100)
    };
  }

  if (normalized.rounds.length) {
    const answered = normalized.rounds.reduce((sum, round) => sum + round.answeredCount, 0);
    if (!answered) return null;
    const correct = normalized.rounds.reduce((sum, round) => sum + round.correctCount, 0);
    const total = normalized.rounds.reduce((sum, round) => sum + round.totalParticipants, 0);
    return {
      correct,
      answered,
      total,
      percentage: Math.round((correct / answered) * 100)
    };
  }

  return null;
}

export function getAnsweredSummary(results) {
  const normalized = normalizeResults(results);

  if (normalized.participantResults.length) {
    return {
      answered: normalized.participantResults.filter((entry) => entry.answerOptionId !== null).length,
      total: normalized.participantResults.length
    };
  }

  if (normalized.rounds.length) {
    return {
      answered: normalized.rounds.reduce((sum, round) => sum + round.answeredCount, 0),
      total: normalized.rounds.reduce((sum, round) => sum + round.totalParticipants, 0)
    };
  }

  return null;
}
