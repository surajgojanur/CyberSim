import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { createParticipant } from "../src/participants.js";

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
