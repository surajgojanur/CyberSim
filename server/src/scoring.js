const BASE_CORRECT_SCORE = 1000;
const MAX_SPEED_BONUS = 500;

export function scoreAnswer({ isCorrect, timeTakenMs, durationMs }) {
  if (!isCorrect) {
    return 0;
  }

  const safeDuration = Math.max(1, durationMs);
  const remainingRatio = Math.max(0, Math.min(1, (safeDuration - timeTakenMs) / safeDuration));
  return BASE_CORRECT_SCORE + Math.round(MAX_SPEED_BONUS * remainingRatio);
}

export function getLeaderboard(database, sessionId) {
  return database
    .prepare(
      `SELECT
         p.id AS participantId,
         p.display_name AS displayName,
         COALESCE(ps.total_score, 0) AS totalScore
       FROM participants p
       LEFT JOIN participant_scores ps
         ON ps.participant_id = p.id AND ps.session_id = p.session_id
       WHERE p.session_id = ?
       ORDER BY totalScore DESC, lower(p.display_name) ASC, p.id ASC`
    )
    .all(sessionId)
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}
