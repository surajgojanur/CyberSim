import { io } from "socket.io-client";
import assert from "node:assert/strict";

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:4000";
const username = process.env.SMOKE_ADMIN_USERNAME || process.env.SEED_ADMIN_USERNAME || "admin";
const password = process.env.SMOKE_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "admin123";

const once = (socket, event) => new Promise((resolve) => socket.once(event, resolve));

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${payload.error || "Request failed"}`);
  }
  return payload;
}

async function main() {
  const health = await request("/api/health");
  assert.equal(health.ok, true);

  const login = await request("/api/auth/login", {
    method: "POST",
    body: { username, password }
  });
  const created = await request("/api/sessions", {
    method: "POST",
    token: login.token,
    body: { title: `Smoke Test ${Date.now()}` }
  });
  const joinLookup = await request(`/api/join/${created.session.joinCode}`);
  assert.equal(joinLookup.session.id, created.session.id);

  const admin = io(baseUrl, { transports: ["websocket"] });
  const participant = io(baseUrl, { transports: ["websocket"] });

  try {
    await Promise.all([once(admin, "connect"), once(participant, "connect")]);

    admin.emit("admin_subscribe", {
      token: login.token,
      sessionId: created.session.id
    });
    await once(admin, "admin_state");

    participant.emit("join_session", {
      joinCode: created.session.joinCode,
      displayName: "Smoke Analyst"
    });
    const joinAck = await once(participant, "join_ack");

    admin.emit("admin_start_round", {
      token: login.token,
      sessionId: created.session.id,
      durationMs: 5_000
    });
    const round = await once(participant, "round_start");
    assert.equal(JSON.stringify(round).includes("correctAnswerId"), false);
    assert.equal(JSON.stringify(round).includes("explanation"), false);

    participant.emit("submit_answer", {
      participantId: joinAck.participantId,
      socketToken: joinAck.socketToken,
      roundId: round.roundId,
      answerOptionId: round.question.options[0].id
    });
    await once(participant, "answer_ack");

    const revealPromise = once(participant, "round_reveal");
    admin.emit("admin_force_lock", {
      token: login.token,
      sessionId: created.session.id
    });
    const reveal = await revealPromise;
    assert.equal(reveal.state, "reveal");
    assert.ok("correctAnswerId" in reveal);

    const endedPromise = once(participant, "session_ended");
    admin.emit("admin_end_session", {
      token: login.token,
      sessionId: created.session.id
    });
    const ended = await endedPromise;
    assert.equal(ended.results.session.state, "ended");

    const results = await request(`/api/sessions/${created.session.id}/results`);
    assert.equal(results.results.session.state, "ended");
    assert.equal(results.results.leaderboard.length, 1);

    console.log("CyberSim smoke test passed");
  } finally {
    admin.close();
    participant.close();
  }
}

main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
