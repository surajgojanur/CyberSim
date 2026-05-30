import { getLeaderboard } from "./scoring.js";
import { getActiveRoundForSession, getSessionQuestionSetId, lockRound, revealRound } from "./rounds.js";

export function endSession(database, sessionId, nowMs = Date.now()) {
  const session = database
    .prepare("SELECT id, state FROM sessions WHERE id = ?")
    .get(sessionId);

  if (!session) {
    return { results: null, error: "Session not found" };
  }

  if (session.state === "ended") {
    return { results: getFinalResults(database, sessionId), error: null };
  }

  const activeRound = getActiveRoundForSession(database, sessionId);
  if (activeRound) {
    const { round: lockedRound, error } = lockRound(database, activeRound.roundId, nowMs);
    if (error) {
      return { results: null, error };
    }
    revealRound(database, lockedRound.roundId, nowMs);
  } else if (session.state === "locked") {
    const lockedRound = database
      .prepare(
        `SELECT id
         FROM rounds
         WHERE session_id = ? AND state = 'locked'
         ORDER BY id DESC
         LIMIT 1`
      )
      .get(sessionId);
    if (lockedRound) {
      revealRound(database, lockedRound.id, nowMs);
    }
  }

  database
    .prepare("UPDATE sessions SET state = 'ended', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(sessionId);

  return { results: getFinalResults(database, sessionId), error: null };
}

export function getFinalResults(database, sessionId) {
  const session = database
    .prepare(
      `SELECT id, title, join_code AS joinCode, state, created_at AS createdAt, updated_at AS updatedAt
       FROM sessions
       WHERE id = ?`
    )
    .get(sessionId);

  if (!session) {
    return null;
  }

  const totalRoundsPlayed = database
    .prepare("SELECT COUNT(*) AS count FROM rounds WHERE session_id = ? AND state IN ('reveal')")
    .get(sessionId).count;
  const leaderboard = getLeaderboard(database, sessionId).map((entry) => ({
    ...entry,
    correctCount: database
      .prepare(
        `SELECT COUNT(*) AS count
         FROM answers a
         JOIN rounds r ON r.id = a.round_id
         WHERE r.session_id = ? AND a.participant_id = ? AND a.is_correct = 1`
      )
      .get(sessionId, entry.participantId).count
  }));

  return {
    session,
    totalRoundsPlayed,
    leaderboard,
    rounds: getRoundSummaries(database, sessionId)
  };
}

export function getRoundSummaries(database, sessionId) {
  return database
    .prepare(
      `SELECT
         r.id AS roundId,
         r.sequence_number AS sequenceNumber,
         r.state,
         q.title AS questionTitle,
         q.explanation,
         ao.id AS correctAnswerId,
         ao.option_text AS correctAnswerText,
         (SELECT COUNT(*) FROM answers a WHERE a.round_id = r.id) AS answeredCount,
         (SELECT COUNT(*) FROM answers a WHERE a.round_id = r.id AND a.is_correct = 1) AS correctCount,
         (SELECT COUNT(*) FROM participants p WHERE p.session_id = r.session_id) AS totalParticipants
       FROM rounds r
       JOIN questions q ON q.id = r.question_id
       JOIN answer_options ao ON ao.question_id = q.id AND ao.is_correct = 1
       WHERE r.session_id = ? AND r.state = 'reveal'
       ORDER BY r.sequence_number ASC, r.id ASC`
    )
    .all(sessionId);
}

export function hasUnusedQuestions(database, sessionId) {
  const session = database
    .prepare("SELECT id, question_set_id AS questionSetId FROM sessions WHERE id = ?")
    .get(sessionId);
  const questionSetId = getSessionQuestionSetId(database, session);
  if (!questionSetId) {
    return false;
  }

  const row = database
    .prepare(
      `SELECT q.id
       FROM questions q
       JOIN question_set_questions qsq ON qsq.question_id = q.id
       WHERE q.id NOT IN (
         SELECT question_id FROM rounds WHERE session_id = ?
       )
       AND qsq.question_set_id = ?
       ORDER BY qsq.display_order ASC, q.id ASC
       LIMIT 1`
    )
    .get(sessionId, questionSetId);

  return Boolean(row);
}
