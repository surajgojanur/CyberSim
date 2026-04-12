import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { createParticipant } from "../src/participants.js";
import { recoverActiveRounds } from "../src/recovery.js";
import { endSession } from "../src/results.js";
import { lockRound, revealRound, startRound, submitAnswer } from "../src/rounds.js";
import { getParticipantState } from "../src/state.js";

function createSession(database) {
  const admin = database.prepare("SELECT id FROM admins WHERE username = ?").get("admin");
  return database
    .prepare("INSERT INTO sessions (admin_id, title, join_code) VALUES (?, ?, ?)")
    .run(admin.id, "State Test", `S${Math.random().toString(36).slice(2, 7).toUpperCase()}`).lastInsertRowid;
}

function correctOptionId(database, questionId) {
  return database
    .prepare("SELECT id FROM answer_options WHERE question_id = ? AND is_correct = 1")
    .get(questionId).id;
}

test("participant reconnect during question restores safe state", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  startRound(database, sessionId, 45_000, 1_000);

  const state = getParticipantState(database, participant.id);
  const serialized = JSON.stringify(state);

  assert.equal(state.session.state, "question");
  assert.equal(Boolean(state.currentRound.question.options.length), true);
  assert.equal(serialized.includes("correctAnswerId"), false);
  assert.equal(serialized.includes("explanation"), false);
  assert.equal(serialized.includes("participantResults"), false);
});

test("participant reconnect after submitting restores submitted locked UI state", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);
  const answerOptionId = correctOptionId(database, round.questionId);
  submitAnswer(
    database,
    {
      participantId: participant.id,
      socketToken: participant.reconnectToken,
      roundId: round.roundId,
      answerOptionId
    },
    2_000
  );

  const state = getParticipantState(database, participant.id);

  assert.equal(state.answer.submitted, true);
  assert.equal(state.answer.answerOptionId, answerOptionId);
});

test("participant reconnect during reveal gets reveal data", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);
  lockRound(database, round.roundId, 2_000);
  revealRound(database, round.roundId, 2_001);

  const state = getParticipantState(database, participant.id);

  assert.equal(state.session.state, "reveal");
  assert.equal(state.reveal.state, "reveal");
  assert.equal(Boolean(state.reveal.correctAnswerId), true);
  assert.equal(Boolean(state.reveal.question.explanation), true);
  assert.equal("participantResults" in state.reveal, false);
});

test("participant reconnect after session end gets final results", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  const { participant } = createParticipant(database, sessionId, "Analyst");
  endSession(database, sessionId);

  const state = getParticipantState(database, participant.id);

  assert.equal(state.session.state, "ended");
  assert.equal(state.finalResults.session.state, "ended");
});

test("restart recovery schedules future active timers", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, Date.now());
  const scheduled = [];

  recoverActiveRounds(database, { schedule: (nextRound) => scheduled.push(nextRound) });

  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].roundId, round.roundId);
});

test("restart recovery locks and reveals expired active rounds", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 1, Date.now() - 10_000);

  recoverActiveRounds(database, { schedule: () => assert.fail("expired round should not schedule") });

  const recovered = database.prepare("SELECT state FROM rounds WHERE id = ?").get(round.roundId);
  assert.equal(recovered.state, "reveal");
  assert.equal(database.prepare("SELECT state FROM sessions WHERE id = ?").get(sessionId).state, "reveal");
});

test("restart recovery reveals locked rounds", () => {
  const database = openDatabase(":memory:");
  const sessionId = createSession(database);
  createParticipant(database, sessionId, "Analyst");
  const { round } = startRound(database, sessionId, 45_000, 1_000);
  lockRound(database, round.roundId, 2_000);

  recoverActiveRounds(database, { schedule: () => assert.fail("locked round should not schedule") });

  const recovered = database.prepare("SELECT state FROM rounds WHERE id = ?").get(round.roundId);
  assert.equal(recovered.state, "reveal");
});
