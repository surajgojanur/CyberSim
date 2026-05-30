import { getLeaderboard, scoreAnswer } from "./scoring.js";

const DEFAULT_ROUND_DURATION_MS = 45_000;

export function startRound(database, sessionId, durationMs = DEFAULT_ROUND_DURATION_MS, nowMs = Date.now()) {
  const session = database
    .prepare("SELECT id, state, question_set_id AS questionSetId FROM sessions WHERE id = ?")
    .get(sessionId);

  if (!session) {
    return { round: null, error: "Session not found" };
  }

  if (!["lobby", "reveal"].includes(session.state)) {
    if (session.state === "ended") {
      return { round: null, error: "This session has ended" };
    }
    return { round: null, error: "A round is already active" };
  }

  const questionSetId = getSessionQuestionSetId(database, session);
  if (!questionSetId) {
    return { round: null, error: "No question set is available" };
  }

  const question = database
    .prepare(
      `SELECT q.id, q.title, q.scenario
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

  if (!question) {
    return { round: null, error: "No unused questions are available" };
  }

  const sequence = database
    .prepare("SELECT COUNT(*) + 1 AS nextSequence FROM rounds WHERE session_id = ?")
    .get(sessionId).nextSequence;
  const locksAtMs = nowMs + durationMs;

  const create = database.transaction(() => {
    const result = database
      .prepare(
        `INSERT INTO rounds (
          session_id, question_id, sequence_number, state, started_at_ms, locks_at_ms
        )
        VALUES (?, ?, ?, 'question', ?, ?)`
      )
      .run(sessionId, question.id, sequence, nowMs, locksAtMs);

    database
      .prepare("UPDATE sessions SET state = 'question', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(sessionId);

    return result.lastInsertRowid;
  });

  const roundId = create();
  return { round: getRoundPayload(database, roundId), error: null };
}

export function lockRound(database, roundId, nowMs = Date.now()) {
  const round = database.prepare("SELECT * FROM rounds WHERE id = ?").get(roundId);
  if (!round) {
    return { round: null, error: "Round not found" };
  }

  if (round.state === "locked") {
    return { round: getLockedRoundPayload(database, roundId), error: null };
  }

  if (round.state !== "question") {
    return { round: null, error: "Round is already revealed" };
  }

  database.transaction(() => {
    database
      .prepare("UPDATE rounds SET state = 'locked', locked_at_ms = ? WHERE id = ?")
      .run(nowMs, roundId);
    database
      .prepare("UPDATE sessions SET state = 'locked', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(round.session_id);
  })();

  return { round: getLockedRoundPayload(database, roundId), error: null };
}

export function revealRound(database, roundId, nowMs = Date.now()) {
  const round = database
    .prepare(
      `SELECT id, session_id AS sessionId, question_id AS questionId, state,
              started_at_ms AS startedAtMs, locks_at_ms AS locksAtMs,
              revealed_at_ms AS revealedAtMs
       FROM rounds
       WHERE id = ?`
    )
    .get(roundId);

  if (!round) {
    return { reveal: null, error: "Round not found" };
  }

  if (round.state === "question") {
    return { reveal: null, error: "Round must be locked before reveal" };
  }

  if (round.state === "reveal") {
    return { reveal: getRevealPayload(database, roundId), error: null };
  }

  const evaluate = database.transaction(() => {
    const answers = database
      .prepare(
        `SELECT a.id, a.participant_id AS participantId, a.answer_option_id AS answerOptionId,
                a.time_taken_ms AS timeTakenMs, ao.is_correct AS isCorrect
         FROM answers a
         JOIN answer_options ao ON ao.id = a.answer_option_id
         WHERE a.round_id = ?`
      )
      .all(roundId);

    const durationMs = Math.max(1, round.locksAtMs - round.startedAtMs);

    for (const answer of answers) {
      const score = scoreAnswer({
        isCorrect: answer.isCorrect === 1,
        timeTakenMs: answer.timeTakenMs,
        durationMs
      });

      database
        .prepare("UPDATE answers SET is_correct = ?, score = ? WHERE id = ?")
        .run(answer.isCorrect, score, answer.id);
      database
        .prepare(
          `INSERT INTO participant_scores (session_id, participant_id, total_score)
           VALUES (?, ?, ?)
           ON CONFLICT(session_id, participant_id)
           DO UPDATE SET
             total_score = total_score + excluded.total_score,
             updated_at = CURRENT_TIMESTAMP`
        )
        .run(round.sessionId, answer.participantId, score);
    }

    database
      .prepare("UPDATE rounds SET state = 'reveal', revealed_at_ms = ? WHERE id = ?")
      .run(nowMs, roundId);
    database
      .prepare("UPDATE sessions SET state = 'reveal', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(round.sessionId);
  });

  evaluate();
  return { reveal: getRevealPayload(database, roundId), error: null };
}

export function submitAnswer(database, { participantId, socketToken, roundId, answerOptionId }, nowMs = Date.now()) {
  const participant = database
    .prepare(
      `SELECT id, session_id AS sessionId
       FROM participants
       WHERE id = ? AND reconnect_token = ? AND left_at IS NULL`
    )
    .get(participantId, socketToken);

  if (!participant) {
    return { answer: null, progress: null, error: "Participant session is not valid" };
  }

  const round = database
    .prepare(
      `SELECT id, session_id AS sessionId, question_id AS questionId, state, started_at_ms AS startedAtMs,
              locks_at_ms AS locksAtMs
       FROM rounds
       WHERE id = ?`
    )
    .get(roundId);

  if (!round || round.sessionId !== participant.sessionId) {
    return { answer: null, progress: null, error: "Round not found for this participant" };
  }

  const session = database.prepare("SELECT state FROM sessions WHERE id = ?").get(round.sessionId);
  if (session?.state === "ended") {
    return { answer: null, progress: null, error: "This session has ended" };
  }

  if (round.state !== "question") {
    return { answer: null, progress: null, error: "This round is locked" };
  }

  if (nowMs >= round.locksAtMs) {
    lockRound(database, round.id, nowMs);
    return { answer: null, progress: getAnswerProgress(database, round.id), error: "The timer has expired" };
  }

  const option = database
    .prepare("SELECT id FROM answer_options WHERE id = ? AND question_id = ?")
    .get(answerOptionId, round.questionId);

  if (!option) {
    return { answer: null, progress: null, error: "Answer option is not valid for this round" };
  }

  const timeTakenMs = Math.max(0, nowMs - round.startedAtMs);

  try {
    const result = database
      .prepare(
        `INSERT INTO answers (round_id, participant_id, answer_option_id, submitted_at_ms, time_taken_ms)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(round.id, participant.id, option.id, nowMs, timeTakenMs);

    return {
      answer: {
        id: result.lastInsertRowid,
        roundId: round.id,
        answerOptionId: option.id,
        submittedAtMs: nowMs,
        timeTakenMs
      },
      progress: getAnswerProgress(database, round.id),
      error: null
    };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return {
        answer: null,
        progress: getAnswerProgress(database, round.id),
        error: "You already submitted an answer for this round"
      };
    }
    throw error;
  }
}

export function getAnswerProgress(database, roundId) {
  const progress = database
    .prepare(
      `SELECT
         (SELECT COUNT(*)
          FROM participants p
          JOIN rounds r ON r.session_id = p.session_id
          JOIN answers a ON a.participant_id = p.id AND a.round_id = r.id
          WHERE r.id = ?
          AND p.left_at IS NULL
          AND (
            p.connected = 1
            OR EXISTS (
              SELECT 1 FROM answers existing
              WHERE existing.round_id = r.id AND existing.participant_id = p.id
            )
          )) AS answered,
         (SELECT COUNT(*)
          FROM participants p
          JOIN rounds r ON r.session_id = p.session_id
          WHERE r.id = ?
          AND p.left_at IS NULL
          AND (
            p.connected = 1
            OR EXISTS (
              SELECT 1 FROM answers existing
              WHERE existing.round_id = r.id AND existing.participant_id = p.id
            )
          )) AS total`
    )
    .get(roundId, roundId);

  return {
    ...progress,
    allAnswered: progress.total > 0 && progress.answered >= progress.total
  };
}

export function getRoundPayload(database, roundId) {
  const round = database
    .prepare(
      `SELECT r.id AS roundId, r.session_id AS sessionId, r.question_id AS questionId,
              r.sequence_number AS sequenceNumber, r.state, r.started_at_ms AS startedAtMs,
              r.locks_at_ms AS timerEndsAt, q.title, q.scenario
       FROM rounds r
       JOIN questions q ON q.id = r.question_id
       WHERE r.id = ?`
    )
    .get(roundId);

  if (!round) {
    return null;
  }

  const options = database
    .prepare(
      `SELECT id, option_text AS text
       FROM answer_options
       WHERE question_id = ?
       ORDER BY display_order ASC, id ASC`
    )
    .all(round.questionId);

  return {
    roundId: round.roundId,
    sessionId: round.sessionId,
    questionId: round.questionId,
    sequenceNumber: round.sequenceNumber,
    state: round.state,
    startedAtMs: round.startedAtMs,
    timerEndsAt: round.timerEndsAt,
    serverTime: Date.now(),
    question: {
      id: round.questionId,
      title: round.title,
      scenario: round.scenario,
      options
    }
  };
}

export function getRevealPayload(database, roundId) {
  const round = database
    .prepare(
      `SELECT r.id AS roundId, r.session_id AS sessionId, r.question_id AS questionId,
              r.sequence_number AS sequenceNumber, r.state, r.revealed_at_ms AS revealedAtMs,
              q.title, q.scenario, q.explanation,
              q.learning_objective AS learningObjective,
              q.recommended_behavior AS recommendedBehavior
       FROM rounds r
       JOIN questions q ON q.id = r.question_id
       WHERE r.id = ?`
    )
    .get(roundId);

  if (!round) {
    return null;
  }

  const options = database
    .prepare(
      `SELECT id, option_text AS text
       FROM answer_options
       WHERE question_id = ?
       ORDER BY display_order ASC, id ASC`
    )
    .all(round.questionId);

  const correctAnswer = database
    .prepare("SELECT id FROM answer_options WHERE question_id = ? AND is_correct = 1")
    .get(round.questionId);
  const participantResults = database
    .prepare(
      `SELECT
         p.id AS participantId,
         p.display_name AS displayName,
         a.answer_option_id AS answerOptionId,
         COALESCE(a.is_correct, 0) AS isCorrect,
         COALESCE(a.score, 0) AS scoreDelta,
         COALESCE(ps.total_score, 0) AS totalScore
       FROM participants p
       LEFT JOIN answers a ON a.participant_id = p.id AND a.round_id = ?
       LEFT JOIN participant_scores ps
         ON ps.participant_id = p.id AND ps.session_id = p.session_id
       WHERE p.session_id = ?
       ORDER BY lower(p.display_name) ASC, p.id ASC`
    )
    .all(roundId, round.sessionId)
    .map((result) => ({
      ...result,
      isCorrect: result.isCorrect === 1
    }));

  return {
    roundId: round.roundId,
    sessionId: round.sessionId,
    questionId: round.questionId,
    sequenceNumber: round.sequenceNumber,
    state: "reveal",
    revealedAtMs: round.revealedAtMs,
    correctAnswerId: correctAnswer?.id || null,
    question: {
      id: round.questionId,
      title: round.title,
      scenario: round.scenario,
      explanation: round.explanation,
      learningObjective: round.learningObjective,
      recommendedBehavior: round.recommendedBehavior,
      options
    },
    participantResults,
    leaderboard: getLeaderboard(database, round.sessionId)
  };
}

export function getParticipantRevealPayload(reveal, participantId) {
  return {
    roundId: reveal.roundId,
    sessionId: reveal.sessionId,
    questionId: reveal.questionId,
    sequenceNumber: reveal.sequenceNumber,
    state: reveal.state,
    correctAnswerId: reveal.correctAnswerId,
    question: reveal.question,
    myResult:
      reveal.participantResults.find((result) => result.participantId === participantId) || {
        participantId,
        answerOptionId: null,
        isCorrect: false,
        scoreDelta: 0,
        totalScore: 0
      },
    leaderboard: reveal.leaderboard
  };
}

export function getLockedRoundPayload(database, roundId) {
  const round = database
    .prepare(
      `SELECT id AS roundId, session_id AS sessionId, state, locked_at_ms AS lockedAtMs
       FROM rounds
       WHERE id = ?`
    )
    .get(roundId);

  if (!round) {
    return null;
  }

  return {
    ...round,
    progress: getAnswerProgress(database, roundId)
  };
}

export function getActiveRoundForSession(database, sessionId) {
  const round = database
    .prepare(
      `SELECT id
       FROM rounds
       WHERE session_id = ? AND state = 'question'
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(sessionId);

  return round ? getRoundPayload(database, round.id) : null;
}

export function isRoundReadyToLock(database, roundId) {
  const progress = getAnswerProgress(database, roundId);
  return progress.allAnswered;
}

export function getSessionQuestionSetId(database, session) {
  if (session?.questionSetId) {
    return session.questionSetId;
  }

  return database
    .prepare("SELECT id FROM question_sets WHERE is_default = 1 ORDER BY id ASC LIMIT 1")
    .get()?.id;
}
