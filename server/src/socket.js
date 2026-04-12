import { z } from "zod";
import { verifyAdminToken } from "./auth.js";
import { getDb } from "./db.js";
import { isValidJoinCode, normalizeJoinCode } from "./joinCodes.js";
import {
  createParticipant,
  getParticipantByToken,
  listParticipants,
  setParticipantConnected
} from "./participants.js";
import { recoverActiveRounds } from "./recovery.js";
import { endSession, hasUnusedQuestions } from "./results.js";
import { createRoundTimerManager } from "./roundTimers.js";
import {
  getActiveRoundForSession,
  getParticipantRevealPayload,
  lockRound,
  revealRound,
  startRound,
  submitAnswer
} from "./rounds.js";
import { getSessionByJoinCode } from "./sessions.js";
import { getAdminState, getParticipantState } from "./state.js";

const joinSchema = z.object({
  joinCode: z.string().transform(normalizeJoinCode).refine(isValidJoinCode, {
    message: "Join code must be 6 characters"
  }),
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(40)
});

const adminSubscribeSchema = z.object({
  token: z.string().min(1, "Admin token is required"),
  sessionId: z.number().int().positive()
});

const adminRoundSchema = adminSubscribeSchema.extend({
  durationMs: z.number().int().min(5_000).max(180_000).optional()
});

const submitAnswerSchema = z.object({
  participantId: z.number().int().positive(),
  socketToken: z.string().min(1, "Participant token is required"),
  roundId: z.number().int().positive(),
  answerOptionId: z.number().int().positive()
});

const rejoinSchema = z.object({
  socketToken: z.string().min(1, "Participant token is required")
});

export function configureSocket(io) {
  const participantSockets = new Map();
  const adminSockets = new Map();

  function takeParticipantSocket(participantId, socket) {
    const oldSocketId = participantSockets.get(participantId);
    if (oldSocketId && oldSocketId !== socket.id) {
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      oldSocket?.emit("session_taken_over", {
        message: "This session was opened in another tab"
      });
      oldSocket?.disconnect(true);
    }

    participantSockets.set(participantId, socket.id);
    socket.data.participantId = participantId;
  }

  function takeAdminSocket(sessionId, adminId, socket) {
    const key = adminKey(sessionId, adminId);
    const oldSocketId = adminSockets.get(key);
    if (oldSocketId && oldSocketId !== socket.id) {
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      oldSocket?.emit("session_taken_over", {
        message: "This admin session was opened in another tab"
      });
      oldSocket?.disconnect(true);
    }

    adminSockets.set(key, socket.id);
    socket.data.adminKey = key;
  }

  function emitParticipantList(sessionId) {
    io.to(adminRoom(sessionId)).emit("participant_list", {
      participants: listParticipants(getDb(), sessionId)
    });
  }

  function emitSessionEnded(results) {
    io.to(sessionRoom(results.session.id)).emit("session_ended", { results });
    io.to(adminRoom(results.session.id)).emit("session_ended", { results });
  }

  function emitReveal(reveal) {
    io.to(adminRoom(reveal.sessionId)).emit("round_reveal", reveal);
    for (const result of reveal.participantResults) {
      io.to(participantRoom(result.participantId)).emit(
        "round_reveal",
        getParticipantRevealPayload(reveal, result.participantId)
      );
    }
  }

  function emitLockedThenReveal(lockedRound) {
    io.to(sessionRoom(lockedRound.sessionId)).emit("round_locked", lockedRound);
    io.to(adminRoom(lockedRound.sessionId)).emit("round_locked", lockedRound);
    io.to(adminRoom(lockedRound.sessionId)).emit("answer_progress", lockedRound.progress);

    const { reveal, error } = revealRound(getDb(), lockedRound.roundId);
    if (!error && reveal) {
      emitReveal(reveal);
    }
  }

  const timers = createRoundTimerManager({
    database: getDb(),
    lockRound,
    onLock: (lockedRound) => {
      emitLockedThenReveal(lockedRound);
    }
  });

  recoverActiveRounds(getDb(), timers);

  io.on("connection", (socket) => {
    socket.on("admin_subscribe", (payload) => {
      const parsed = adminSubscribeSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit("socket_error", { message: parsed.error.issues[0].message });
      }

      const admin = verifyAdminToken(parsed.data.token);
      if (!admin) {
        return socket.emit("socket_error", { message: "Authentication required" });
      }

      const session = getDb()
        .prepare("SELECT id, state FROM sessions WHERE id = ? AND admin_id = ?")
        .get(parsed.data.sessionId, admin.id);

      if (!session) {
        return socket.emit("socket_error", { message: "Session not found" });
      }

      takeAdminSocket(parsed.data.sessionId, admin.id, socket);
      socket.join(adminRoom(parsed.data.sessionId));
      const state = getAdminState(getDb(), parsed.data.sessionId);
      socket.emit("admin_state", state);
      if (state?.finalResults) {
        socket.emit("session_ended", { results: state.finalResults });
      }
    });

    socket.on("join_session", (payload) => {
      const parsed = joinSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit("join_error", { message: parsed.error.issues[0].message });
      }

      const session = getSessionByJoinCode(getDb(), parsed.data.joinCode);
      if (!session) {
        return socket.emit("join_error", { message: "No session found for that join code" });
      }

      if (session.state !== "lobby") {
        return socket.emit("join_error", { message: "This session is not accepting joins" });
      }

      const { participant, error } = createParticipant(
        getDb(),
        session.id,
        parsed.data.displayName
      );

      if (error) {
        return socket.emit("join_error", { message: error });
      }

      takeParticipantSocket(participant.id, socket);
      setParticipantConnected(getDb(), participant.id, true);
      socket.join(sessionRoom(session.id));
      socket.join(participantRoom(participant.id));
      socket.emit("join_ack", {
        participantId: participant.id,
        socketToken: participant.reconnectToken,
        sessionState: session
      });

      io.to(adminRoom(session.id)).emit("participant_joined", {
        participant: {
          id: participant.id,
          displayName: participant.displayName
        }
      });
      emitParticipantList(session.id);
    });

    socket.on("rejoin_session", (payload) => {
      const parsed = rejoinSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit("rejoin_error", { message: parsed.error.issues[0].message });
      }

      const participant = getParticipantByToken(getDb(), parsed.data.socketToken);
      if (!participant) {
        return socket.emit("rejoin_error", { message: "Participant session is not valid" });
      }

      takeParticipantSocket(participant.id, socket);
      setParticipantConnected(getDb(), participant.id, true);
      socket.join(sessionRoom(participant.sessionId));
      socket.join(participantRoom(participant.id));
      socket.emit("session_restored", getParticipantState(getDb(), participant.id));
      emitParticipantList(participant.sessionId);
    });

    socket.on("admin_start_round", (payload) => {
      const parsed = adminRoundSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit("socket_error", { message: parsed.error.issues[0].message });
      }

      const admin = verifyAdminToken(parsed.data.token);
      if (!admin) {
        return socket.emit("socket_error", { message: "Authentication required" });
      }

      const session = getDb()
        .prepare("SELECT id, state FROM sessions WHERE id = ? AND admin_id = ?")
        .get(parsed.data.sessionId, admin.id);

      if (!session) {
        return socket.emit("socket_error", { message: "Session not found" });
      }

      if (session.state === "ended") {
        return socket.emit("socket_error", { message: "This session has ended" });
      }

      if (!hasUnusedQuestions(getDb(), parsed.data.sessionId)) {
        const { results } = endSession(getDb(), parsed.data.sessionId);
        emitSessionEnded(results);
        return;
      }

      const { round, error } = startRound(
        getDb(),
        parsed.data.sessionId,
        parsed.data.durationMs
      );

      if (error) {
        return socket.emit("socket_error", { message: error });
      }

      timers.schedule(round);
      io.to(sessionRoom(round.sessionId)).emit("round_start", round);
      io.to(adminRoom(round.sessionId)).emit("round_start", round);
      io.to(adminRoom(round.sessionId)).emit("answer_progress", {
        answered: 0,
        total: listParticipants(getDb(), round.sessionId).length
      });
    });

    socket.on("submit_answer", (payload) => {
      const parsed = submitAnswerSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit("answer_error", { message: parsed.error.issues[0].message });
      }

      const { answer, progress, error } = submitAnswer(getDb(), parsed.data);

      if (error) {
        if (error === "The timer has expired") {
          const lockedRound = getDb()
            .prepare("SELECT session_id AS sessionId FROM rounds WHERE id = ?")
            .get(parsed.data.roundId);
          if (lockedRound) {
            timers.clear(parsed.data.roundId);
            emitLockedThenReveal({
              roundId: parsed.data.roundId,
              sessionId: lockedRound.sessionId,
              state: "locked",
              progress
            });
          }
        }
        return socket.emit("answer_error", { message: error, progress });
      }

      const round = getDb()
        .prepare("SELECT session_id AS sessionId FROM rounds WHERE id = ?")
        .get(answer.roundId);

      socket.emit("answer_ack", answer);
      io.to(adminRoom(round.sessionId)).emit("answer_progress", progress);
    });

    socket.on("admin_force_lock", (payload) => {
      const parsed = adminSubscribeSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit("socket_error", { message: parsed.error.issues[0].message });
      }

      const admin = verifyAdminToken(parsed.data.token);
      if (!admin) {
        return socket.emit("socket_error", { message: "Authentication required" });
      }

      const session = getDb()
        .prepare("SELECT id FROM sessions WHERE id = ? AND admin_id = ?")
        .get(parsed.data.sessionId, admin.id);

      if (!session) {
        return socket.emit("socket_error", { message: "Session not found" });
      }

      const activeRound = getActiveRoundForSession(getDb(), parsed.data.sessionId);
      if (!activeRound) {
        return socket.emit("socket_error", { message: "No active round to lock" });
      }

      timers.clear(activeRound.roundId);
      const { round: lockedRound } = lockRound(getDb(), activeRound.roundId);
      emitLockedThenReveal(lockedRound);
    });

    socket.on("admin_end_session", (payload) => {
      const parsed = adminSubscribeSchema.safeParse(payload);
      if (!parsed.success) {
        return socket.emit("socket_error", { message: parsed.error.issues[0].message });
      }

      const admin = verifyAdminToken(parsed.data.token);
      if (!admin) {
        return socket.emit("socket_error", { message: "Authentication required" });
      }

      const session = getDb()
        .prepare("SELECT id FROM sessions WHERE id = ? AND admin_id = ?")
        .get(parsed.data.sessionId, admin.id);

      if (!session) {
        return socket.emit("socket_error", { message: "Session not found" });
      }

      const activeRound = getActiveRoundForSession(getDb(), parsed.data.sessionId);
      if (activeRound) {
        timers.clear(activeRound.roundId);
      }

      const { results, error } = endSession(getDb(), parsed.data.sessionId);
      if (error) {
        return socket.emit("socket_error", { message: error });
      }

      emitSessionEnded(results);
    });

    socket.on("disconnect", () => {
      if (socket.data.participantId && participantSockets.get(socket.data.participantId) === socket.id) {
        participantSockets.delete(socket.data.participantId);
        setParticipantConnected(getDb(), socket.data.participantId, false);
        const participant = getDb()
          .prepare("SELECT session_id AS sessionId FROM participants WHERE id = ?")
          .get(socket.data.participantId);
        if (participant) {
          emitParticipantList(participant.sessionId);
        }
      }

      if (socket.data.adminKey && adminSockets.get(socket.data.adminKey) === socket.id) {
        adminSockets.delete(socket.data.adminKey);
      }
    });
  });
}

export function adminRoom(sessionId) {
  return `admin:${sessionId}`;
}

export function sessionRoom(sessionId) {
  return `session:${sessionId}`;
}

export function participantRoom(participantId) {
  return `participant:${participantId}`;
}

function adminKey(sessionId, adminId) {
  return `${sessionId}:${adminId}`;
}
