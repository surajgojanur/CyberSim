import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { createParticipant } from "../src/participants.js";
import { endSession, getFinalResults, hasUnusedQuestions } from "../src/results.js";
import { lockRound, revealRound, startRound, submitAnswer } from "../src/rounds.js";

function createSession(database) {
  const admin = database.prepare("SELECT id FROM admins WHERE username = ?").get("admin");
  return database
    .prepare("INSERT INTO sessions (admin_id, title, join_code) VALUES (?, ?, ?)")
    .run(admin.id, "Results Test", `R${Math.random().toString(36).slice(2, 7).toUpperCase()}`).lastInsertRowid;
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

test("admin end session transitions session to ended", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");

  const { results, error } = endSession(database, sessionId);

  assert.equal(error, null);
  assert.equal(results.session.state, "ended");
  assert.equal(database.prepare("SELECT state FROM sessions WHERE id = ?").get(sessionId).state, "ended");
});

test("ended session rejects new round starts", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");
  endSession(database, sessionId);

  const { round, error } = startRound(database, sessionId);

  assert.equal(round, null);
  assert.equal(error, "This session has ended");
});

test("ended session rejects answer submissions", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);
  endSession(database, sessionId, 2_000);

  const result = submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId: correctOptionId(database, round.questionId)
    },
    3_000
  );

  assert.equal(result.answer, null);
  assert.equal(result.error, "This session has ended");
});

test("final results return persisted leaderboard ordering and correct counts", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const bravo = createParticipant(database, sessionId, "Bravo");
  const alpha = createParticipant(database, sessionId, "Alpha");
  const charlie = createParticipant(database, sessionId, "Charlie");
  const { round } = startRound(database, sessionId, 45_000, 1_000);

  for (const participant of [bravo.participant, alpha.participant]) {
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
  revealRound(database, round.roundId, 3_001);
  endSession(database, sessionId, 4_000);

  const results = getFinalResults(database, sessionId);

  assert.deepEqual(
    results.leaderboard.map((entry) => [entry.displayName, entry.correctCount]),
    [
      ["Alpha", 1],
      ["Bravo", 1],
      ["Charlie", 0]
    ]
  );
  assert.equal(results.totalRoundsPlayed, 1);
  assert.equal(results.rounds.length, 1);
});

test("manual early end still produces final results for an active round", () => {
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

  const { results } = endSession(database, sessionId, 3_000);

  assert.equal(results.session.state, "ended");
  assert.equal(results.totalRoundsPlayed, 1);
  assert.equal(results.leaderboard[0].displayName, "Analyst");
  assert.equal(results.leaderboard[0].correctCount, 1);
});

test("exhausting all rounds can end session cleanly", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");

  while (hasUnusedQuestions(database, sessionId)) {
    const { round } = startRound(database, sessionId, 45_000, 1_000);
    lockRound(database, round.roundId, 2_000);
    revealRound(database, round.roundId, 2_001);
  }

  assert.equal(hasUnusedQuestions(database, sessionId), false);
  const { results } = endSession(database, sessionId, 3_000);
  assert.equal(results.session.state, "ended");
  assert.equal(results.totalRoundsPlayed, 5);
});
