import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { createParticipant, setParticipantConnected } from "../src/participants.js";
import { createQuestionSet } from "../src/questionSets.js";
import { createRoundTimerManager } from "../src/roundTimers.js";
import {
  getAnswerProgress,
  getParticipantRevealPayload,
  getRevealPayload,
  isRoundReadyToLock,
  lockRound,
  revealRound,
  startRound,
  submitAnswer
} from "../src/rounds.js";

function createSession(database) {
  const admin = database.prepare("SELECT id FROM admins WHERE username = ?").get("admin");
  return database
    .prepare("INSERT INTO sessions (admin_id, title, join_code) VALUES (?, ?, ?)")
    .run(admin.id, "Round Test", `T${Math.random().toString(36).slice(2, 7).toUpperCase()}`).lastInsertRowid;
}

function firstOptionId(round) {
  return round.question.options[0].id;
}

function correctOptionId(database, questionId) {
  return database
    .prepare("SELECT id FROM answer_options WHERE question_id = ? AND is_correct = 1")
    .get(questionId).id;
}

function wrongOptionId(database, questionId) {
  return database
    .prepare("SELECT id FROM answer_options WHERE question_id = ? AND is_correct = 0 ORDER BY id ASC")
    .get(questionId).id;
}

test("round_start payload does not expose correct answer fields", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");

  const { round, error } = startRound(database, sessionId, 45_000, 1_000);

  assert.equal(error, null);
  const serialized = JSON.stringify(round);
  assert.equal(serialized.includes("is_correct"), false);
  assert.equal(serialized.includes("isCorrect"), false);
  assert.equal(serialized.includes("correctAnswerId"), false);
  assert.equal(serialized.includes("explanation"), false);
});

test("reveal is rejected before a round is locked", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  const result = revealRound(database, round.roundId, 2_000);

  assert.equal(result.reveal, null);
  assert.equal(result.error, "Round must be locked before reveal");
});

test("participant cannot submit twice for the same round", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  const first = submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: firstOptionId(round)
    },
    2_000
  );
  const second = submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: firstOptionId(round)
    },
    3_000
  );

  assert.equal(first.error, null);
  assert.equal(second.answer, null);
  assert.equal(second.error, "You already submitted an answer for this round");
});

test("participant cannot submit after a round is locked", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);
  lockRound(database, round.roundId, 2_000);

  const result = submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: firstOptionId(round)
    },
    3_000
  );

  assert.equal(result.answer, null);
  assert.equal(result.error, "This round is locked");
});

test("answer progress increments when answers are submitted", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const first = createParticipant(database, sessionId, "Analyst");
  const second = createParticipant(database, sessionId, "Operator");
  setParticipantConnected(database, first.participant.id, true);
  setParticipantConnected(database, second.participant.id, true);
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  submitAnswer(
    database,
    {
      participantId: first.participant.id,
      socketToken: first.participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: firstOptionId(round)
    },
    2_000
  );

  assert.deepEqual(getAnswerProgress(database, round.roundId), {
    answered: 1,
    total: 2,
    allAnswered: false
  });
});

test("timer manager locks a round when the timer expires", async () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 10, Date.now());

  const locked = await new Promise((resolve) => {
    const timers = createRoundTimerManager({
      database,
      lockRound,
      onLock: resolve
    });
    timers.schedule(round);
  });

  assert.equal(locked.state, "locked");
  assert.deepEqual(locked.progress, { answered: 0, total: 0, allAnswered: false });
});

test("correct answers receive positive score and wrong or unanswered receive zero", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const correct = createParticipant(database, sessionId, "Correct");
  const wrong = createParticipant(database, sessionId, "Wrong");
  createParticipant(database, sessionId, "Unanswered");
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  submitAnswer(
    database,
    {
      participantId: correct.participant.id,
      socketToken: correct.participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: correctOptionId(database, round.questionId)
    },
    2_000
  );
  submitAnswer(
    database,
    {
      participantId: wrong.participant.id,
      socketToken: wrong.participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: wrongOptionId(database, round.questionId)
    },
    2_000
  );
  lockRound(database, round.roundId, 3_000);
  const { reveal, error } = revealRound(database, round.roundId, 3_001);

  assert.equal(error, null);
  const correctResult = reveal.participantResults.find((result) => result.displayName === "Correct");
  const wrongResult = reveal.participantResults.find((result) => result.displayName === "Wrong");
  const unansweredResult = reveal.participantResults.find((result) => result.displayName === "Unanswered");
  assert.equal(correctResult.isCorrect, true);
  assert.equal(correctResult.scoreDelta > 0, true);
  assert.equal(wrongResult.isCorrect, false);
  assert.equal(wrongResult.scoreDelta, 0);
  assert.equal(unansweredResult.isCorrect, false);
  assert.equal(unansweredResult.scoreDelta, 0);
});

test("leaderboard is sorted by score desc then display name asc", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const bravo = createParticipant(database, sessionId, "Bravo");
  const alpha = createParticipant(database, sessionId, "Alpha");
  const charlie = createParticipant(database, sessionId, "Charlie");
  const { round } = startRound(database, sessionId, 45_000, 1_000);
  const correctAnswer = correctOptionId(database, round.questionId);

  for (const participant of [bravo.participant, alpha.participant]) {
    submitAnswer(
      database,
      {
        participantId: participant.id,
        socketToken: participant.reconnectToken,
        roundId: round.roundId,
        answerOptionId: correctAnswer
      },
      2_000
    );
  }
  submitAnswer(
    database,
    {
      participantId: charlie.participant.id,
      socketToken: charlie.participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: wrongOptionId(database, round.questionId)
    },
    2_000
  );
  lockRound(database, round.roundId, 3_000);
  const { reveal } = revealRound(database, round.roundId, 3_001);

  assert.deepEqual(
    reveal.leaderboard.map((entry) => entry.displayName),
    ["Alpha", "Bravo", "Charlie"]
  );
});

test("force lock path can evaluate and reveal exactly once", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: correctOptionId(database, round.questionId)
    },
    2_000
  );
  lockRound(database, round.roundId, 2_500);
  const first = revealRound(database, round.roundId, 2_501);
  const second = revealRound(database, round.roundId, 2_600);

  assert.equal(first.reveal.state, "reveal");
  assert.equal(second.reveal.state, "reveal");
  assert.equal(first.reveal.participantResults[0].scoreDelta, second.reveal.participantResults[0].scoreDelta);
  assert.equal(first.reveal.leaderboard[0].totalScore, second.reveal.leaderboard[0].totalScore);
});

test("explanation appears only in reveal payload", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  assert.equal(JSON.stringify(round).includes("explanation"), false);
  submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: correctOptionId(database, round.questionId)
    },
    2_000
  );
  lockRound(database, round.roundId, 3_000);
  const { reveal } = revealRound(database, round.roundId, 3_001);
  const participantReveal = getParticipantRevealPayload(reveal, participant.id);

  assert.equal(Boolean(reveal.question.explanation), true);
  assert.equal(Boolean(participantReveal.question.explanation), true);
  assert.equal(getRevealPayload(database, round.roundId).correctAnswerId, reveal.correctAnswerId);
});

test("all-answered condition uses connected eligible participants", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const first = createParticipant(database, sessionId, "Connected");
  const second = createParticipant(database, sessionId, "Disconnected");
  setParticipantConnected(database, first.participant.id, true);
  setParticipantConnected(database, second.participant.id, false);
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  submitAnswer(
    database,
    {
      participantId: first.participant.id,
      socketToken: first.participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: firstOptionId(round)
    },
    2_000
  );

  assert.deepEqual(getAnswerProgress(database, round.roundId), {
    answered: 1,
    total: 1,
    allAnswered: true
  });
  assert.equal(isRoundReadyToLock(database, round.roundId), true);
});

test("early lock after all answered still requires reveal before next round", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  setParticipantConnected(database, participant.id, true);
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: correctOptionId(database, round.questionId)
    },
    2_000
  );

  assert.equal(isRoundReadyToLock(database, round.roundId), true);
  const locked = lockRound(database, round.roundId, 2_500);
  const blocked = startRound(database, sessionId, 45_000, 2_600);
  const revealed = revealRound(database, round.roundId, 2_700);
  const next = startRound(database, sessionId, 45_000, 2_800);

  assert.equal(locked.error, null);
  assert.equal(blocked.round, null);
  assert.equal(blocked.error, "A round is already active");
  assert.equal(revealed.reveal.state, "reveal");
  assert.equal(next.error, null);
  assert.equal(next.round.sequenceNumber, 2);
});

test("session uses selected custom question set", () => {
  const database = openDatabase(":memory:");
  const admin = database.prepare("SELECT id FROM admins WHERE username = ?").get("admin");
  const customSet = createQuestionSet(database, admin.id, {
    name: "Custom Set",
    description: "",
    questions: [
      {
        title: "Custom Phishing Drill",
        scenario: "A custom scenario asks the participant to choose the safest action.",
        options: ["Ignore it", "Report it", "Forward it", "Approve it"],
        correctOptionIndex: 1,
        explanation: "Reporting routes the message to security.",
        learningObjective: "Practice reporting suspicious messages.",
        recommendedBehavior: "Use the approved reporting channel.",
        category: "Phishing",
        difficulty: "Intro"
      }
    ]
  });
  const sessionId = database
    .prepare("INSERT INTO sessions (admin_id, question_set_id, title, join_code) VALUES (?, ?, ?, ?)")
    .run(admin.id, customSet.id, "Custom Round", "CUST01").lastInsertRowid;

  const { round, error } = startRound(database, sessionId, 45_000, 1_000);

  assert.equal(error, null);
  assert.equal(round.question.title, "Custom Phishing Drill");
  assert.equal(JSON.stringify(round).includes("correctAnswerId"), false);
});
