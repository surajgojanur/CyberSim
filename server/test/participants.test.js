import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import {
  createParticipant,
  getParticipantByToken,
  listParticipants,
  setParticipantConnected,
  setParticipantLeft
} from "../src/participants.js";

test("duplicate participant display names are rejected within a session", () => {
  const database = openDatabase(":memory:");
  const adminId = database
    .prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)")
    .run("test-admin", "unused").lastInsertRowid;
  const sessionId = database
    .prepare("INSERT INTO sessions (admin_id, title, join_code) VALUES (?, ?, ?)")
    .run(adminId, "Test Session", "ABC123").lastInsertRowid;

  const first = createParticipant(database, sessionId, "Analyst");
  const second = createParticipant(database, sessionId, "analyst");

  assert.equal(first.error, null);
  assert.equal(second.participant, null);
  assert.equal(second.error, "That display name is already taken for this session");
});

test("participant presence status reflects disconnect, rejoin, and explicit leave", () => {
  const database = openDatabase(":memory:");
  const adminId = database.prepare("SELECT id FROM admins WHERE username = ?").get("admin").id;
  const sessionId = database
    .prepare("INSERT INTO sessions (admin_id, title, join_code) VALUES (?, ?, ?)")
    .run(adminId, "Presence Test", "PRS123").lastInsertRowid;
  const { participant } = createParticipant(database, sessionId, "Analyst");

  setParticipantConnected(database, participant.id, true);
  assert.equal(listParticipants(database, sessionId)[0].status, "connected");

  setParticipantConnected(database, participant.id, false);
  assert.equal(listParticipants(database, sessionId)[0].status, "disconnected");

  setParticipantConnected(database, participant.id, true);
  assert.equal(listParticipants(database, sessionId)[0].status, "connected");

  setParticipantLeft(database, participant.id);
  const left = listParticipants(database, sessionId)[0];
  assert.equal(left.status, "left");
  assert.equal(left.connected, false);
  assert.equal(getParticipantByToken(database, participant.reconnectToken), undefined);
});
