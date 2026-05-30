import { getFinalResults } from "./results.js";
import {
  getActiveRoundForSession,
  getAnswerProgress,
  getLockedRoundPayload,
  getParticipantRevealPayload,
  getRoundPayload,
  getRevealPayload
} from "./rounds.js";
import { listParticipants } from "./participants.js";

export function getParticipantState(database, participantId) {
  const participant = database
    .prepare(
      `SELECT p.id, p.session_id AS sessionId, p.display_name AS displayName,
              p.reconnect_token AS reconnectToken, s.title AS sessionTitle, s.state AS sessionState
       FROM participants p
       JOIN sessions s ON s.id = p.session_id
       WHERE p.id = ?`
    )
    .get(participantId);

  if (!participant) {
    return null;
  }

  const base = {
    role: "participant",
    participant: {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      displayName: participant.displayName,
      session: {
        id: participant.sessionId,
        title: participant.sessionTitle,
        state: participant.sessionState
      }
    },
    session: {
      id: participant.sessionId,
      title: participant.sessionTitle,
      state: participant.sessionState
    }
  };

  if (participant.sessionState === "ended") {
    return {
      ...base,
      finalResults: getFinalResults(database, participant.sessionId)
    };
  }

  if (participant.sessionState === "question") {
    const round = getActiveRoundForSession(database, participant.sessionId);
    return {
      ...base,
      currentRound: round,
      answer: getParticipantAnswer(database, participant.id, round?.roundId)
    };
  }

  if (participant.sessionState === "locked") {
    const round = getLatestRoundByState(database, participant.sessionId, "locked");
    const lockedRound = round ? getLockedRoundPayload(database, round.id) : null;
    const safeRound = lockedRound ? getQuestionRoundForLocked(database, lockedRound.roundId) : null;
    const { progress: _progress, ...lockedRoundWithoutProgress } = lockedRound || {};
    return {
      ...base,
      currentRound: safeRound ? { ...safeRound, ...lockedRoundWithoutProgress, state: "locked" } : lockedRoundWithoutProgress,
      answer: getParticipantAnswer(database, participant.id, round?.id)
    };
  }

  if (participant.sessionState === "reveal") {
    const round = getLatestRoundByState(database, participant.sessionId, "reveal");
    const reveal = round ? getRevealPayload(database, round.id) : null;
    return {
      ...base,
      reveal: reveal ? getParticipantRevealPayload(reveal, participant.id) : null
    };
  }

  return base;
}

export function getAdminState(database, sessionId) {
  const session = database
    .prepare(
      `SELECT id, title, join_code AS joinCode, state, question_set_id AS questionSetId,
              created_at AS createdAt
       FROM sessions
       WHERE id = ?`
    )
    .get(sessionId);

  if (!session) {
    return null;
  }

  const state = {
    role: "admin",
    session,
    participants: listParticipants(database, sessionId)
  };

  if (session.state === "ended") {
    return { ...state, finalResults: getFinalResults(database, sessionId) };
  }

  if (session.state === "question") {
    const round = getActiveRoundForSession(database, sessionId);
    return {
      ...state,
      currentRound: round,
      answerProgress: round ? getAnswerProgress(database, round.roundId) : { answered: 0, total: 0 }
    };
  }

  if (session.state === "locked") {
    const round = getLatestRoundByState(database, sessionId, "locked");
    return {
      ...state,
      currentRound: round ? getLockedRoundPayload(database, round.id) : null,
      answerProgress: round ? getAnswerProgress(database, round.id) : { answered: 0, total: 0 }
    };
  }

  if (session.state === "reveal") {
    const round = getLatestRoundByState(database, sessionId, "reveal");
    return {
      ...state,
      reveal: round ? getRevealPayload(database, round.id) : null
    };
  }

  return state;
}

function getParticipantAnswer(database, participantId, roundId) {
  if (!roundId) {
    return null;
  }

  const answer = database
    .prepare(
      `SELECT answer_option_id AS answerOptionId, submitted_at_ms AS submittedAtMs
       FROM answers
       WHERE participant_id = ? AND round_id = ?`
    )
    .get(participantId, roundId);

  return answer ? { ...answer, submitted: true } : { submitted: false };
}

function getLatestRoundByState(database, sessionId, state) {
  return database
    .prepare(
      `SELECT id
       FROM rounds
       WHERE session_id = ? AND state = ?
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(sessionId, state);
}

function getQuestionRoundForLocked(database, roundId) {
  return getRoundPayload(database, roundId);
}
