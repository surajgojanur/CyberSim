import { randomBytes } from "node:crypto";

export function listParticipants(database, sessionId) {
  return database
    .prepare(
      `SELECT id, display_name AS displayName, connected, created_at AS createdAt, last_seen_at AS lastSeenAt
              , left_at AS leftAt
       FROM participants
       WHERE session_id = ?
       ORDER BY created_at ASC, id ASC`
    )
    .all(sessionId)
    .map((participant) => ({
      ...participant,
      connected: participant.connected === 1,
      status: participant.leftAt ? "left" : participant.connected === 1 ? "connected" : "disconnected"
    }));
}

export function createParticipant(database, sessionId, displayName) {
  const reconnectToken = randomBytes(24).toString("base64url");

  try {
    const result = database
      .prepare(
        `INSERT INTO participants (session_id, display_name, reconnect_token, last_seen_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .run(sessionId, displayName, reconnectToken);

    return {
      participant: {
        id: result.lastInsertRowid,
        sessionId,
        displayName,
        reconnectToken
      },
      error: null
    };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { participant: null, error: "That display name is already taken for this session" };
    }
    throw error;
  }
}

export function getParticipantByToken(database, socketToken) {
  return database
    .prepare(
      `SELECT id, session_id AS sessionId, display_name AS displayName, reconnect_token AS reconnectToken
       FROM participants
       WHERE reconnect_token = ? AND left_at IS NULL`
    )
    .get(socketToken);
}

export function setParticipantConnected(database, participantId, connected) {
  database
    .prepare(
      `UPDATE participants
       SET connected = ?, last_seen_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(connected ? 1 : 0, participantId);
}

export function setParticipantLeft(database, participantId) {
  database
    .prepare(
      `UPDATE participants
       SET connected = 0, left_at = CURRENT_TIMESTAMP, last_seen_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(participantId);
}
