import { z } from "zod";
import { getDb } from "./db.js";
import { generateJoinCode, isValidJoinCode, normalizeJoinCode } from "./joinCodes.js";
import { listParticipants } from "./participants.js";
import { requireAdmin } from "./auth.js";
import { getFinalResults } from "./results.js";
import { canUseQuestionSet } from "./questionSets.js";

const createSessionSchema = z.object({
  title: z.string().trim().min(3, "Session title must be at least 3 characters").max(120),
  questionSetId: z.number().int().positive().optional().nullable()
});

export function sessionsRouter(app) {
  app.post("/api/sessions", requireAdmin, (req, res) => {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    if (!canUseQuestionSet(getDb(), parsed.data.questionSetId, req.admin.id)) {
      return res.status(400).json({ error: "Select a valid question set with at least one question" });
    }

    const session = createSession(
      getDb(),
      req.admin.id,
      parsed.data.title,
      parsed.data.questionSetId || null
    );
    res.status(201).json({ session });
  });

  app.get("/api/sessions/:id", requireAdmin, (req, res) => {
    const session = getDb()
      .prepare(
        `SELECT id, title, join_code AS joinCode, state, question_set_id AS questionSetId,
                created_at AS createdAt
         FROM sessions
         WHERE id = ? AND admin_id = ?`
      )
      .get(Number(req.params.id), req.admin.id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      session,
      participants: listParticipants(getDb(), session.id)
    });
  });

  app.get("/api/sessions/:id/results", (req, res) => {
    const results = getFinalResults(getDb(), Number(req.params.id));
    if (!results) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (results.session.state !== "ended") {
      return res.status(409).json({ error: "Session has not ended yet" });
    }

    res.json({ results });
  });

  app.get("/api/join/:code", (req, res) => {
    const joinCode = normalizeJoinCode(req.params.code);
    if (!isValidJoinCode(joinCode)) {
      return res.status(400).json({ error: "Join code must be 6 characters" });
    }

    const session = getSessionByJoinCode(getDb(), joinCode);
    if (!session) {
      return res.status(404).json({ error: "No session found for that join code" });
    }

    res.json({ session });
  });
}

export function createSession(database, adminId, title, questionSetId = null) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = generateJoinCode();

    try {
      const result = database
        .prepare(
          "INSERT INTO sessions (admin_id, question_set_id, title, join_code) VALUES (?, ?, ?, ?)"
        )
        .run(adminId, questionSetId, title, joinCode);
      return {
        id: result.lastInsertRowid,
        title,
        joinCode,
        questionSetId,
        state: "lobby"
      };
    } catch (error) {
      if (error.code !== "SQLITE_CONSTRAINT_UNIQUE") {
        throw error;
      }
    }
  }

  throw new Error("Unable to generate a unique join code");
}

export function getSessionByJoinCode(database, joinCode) {
  return database
    .prepare(
      `SELECT id, title, join_code AS joinCode, state, question_set_id AS questionSetId,
              created_at AS createdAt
       FROM sessions
       WHERE join_code = ?`
    )
    .get(joinCode);
}
