import { z } from "zod";
import { requireAdmin } from "./auth.js";
import { getDb } from "./db.js";

const optionSchema = z.string().trim().min(1, "All answer options are required").max(300);

const questionSchema = z.object({
  title: z.string().trim().min(3, "Question title must be at least 3 characters").max(160),
  scenario: z.string().trim().min(10, "Scenario must be at least 10 characters").max(2000),
  options: z.array(optionSchema).length(4, "Exactly 4 answer options are required"),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1, "Explanation is required").max(2000),
  learningObjective: z.string().trim().min(1, "Learning objective is required").max(1000),
  recommendedBehavior: z.string().trim().min(1, "Recommended behavior is required").max(1000),
  category: z.string().trim().max(80).optional().default(""),
  difficulty: z.string().trim().max(40).optional().default("")
});

const createQuestionSetSchema = z.object({
  name: z.string().trim().min(3, "Question set name must be at least 3 characters").max(120),
  description: z.string().trim().max(500).optional().default(""),
  questions: z.array(questionSchema).min(1, "Add at least one question")
});

export function questionSetsRouter(app) {
  app.get("/api/question-sets", requireAdmin, (req, res) => {
    res.json({ questionSets: listQuestionSets(getDb(), req.admin.id) });
  });

  app.get("/api/question-sets/:id", requireAdmin, (req, res) => {
    const questionSet = getQuestionSet(getDb(), Number(req.params.id), req.admin.id);
    if (!questionSet) {
      return res.status(404).json({ error: "Question set not found" });
    }

    res.json({ questionSet });
  });

  app.post("/api/question-sets", requireAdmin, (req, res) => {
    const parsed = createQuestionSetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const questionSet = createQuestionSet(getDb(), req.admin.id, parsed.data);
    res.status(201).json({ questionSet });
  });
}

export function listQuestionSets(database, adminId) {
  return database
    .prepare(
      `SELECT
         qs.id,
         qs.name,
         qs.description,
         qs.is_default AS isDefault,
         qs.created_at AS createdAt,
         qs.updated_at AS updatedAt,
         COUNT(qsq.question_id) AS questionCount
       FROM question_sets qs
       LEFT JOIN question_set_questions qsq ON qsq.question_set_id = qs.id
       WHERE qs.admin_id = ? OR qs.is_default = 1
       GROUP BY qs.id
       ORDER BY qs.is_default DESC, lower(qs.name) ASC, qs.id ASC`
    )
    .all(adminId)
    .map((set) => ({ ...set, isDefault: set.isDefault === 1 }));
}

export function getQuestionSet(database, questionSetId, adminId) {
  const questionSet = database
    .prepare(
      `SELECT id, name, description, is_default AS isDefault, created_at AS createdAt,
              updated_at AS updatedAt
       FROM question_sets
       WHERE id = ? AND (admin_id = ? OR is_default = 1)`
    )
    .get(questionSetId, adminId);

  if (!questionSet) {
    return null;
  }

  const questions = database
    .prepare(
      `SELECT
         q.id,
         q.title,
         q.scenario,
         q.explanation,
         q.learning_objective AS learningObjective,
         q.recommended_behavior AS recommendedBehavior,
         q.category,
         q.difficulty
       FROM question_set_questions qsq
       JOIN questions q ON q.id = qsq.question_id
       WHERE qsq.question_set_id = ?
       ORDER BY qsq.display_order ASC, q.id ASC`
    )
    .all(questionSetId)
    .map((question) => ({
      ...question,
      options: database
        .prepare(
          `SELECT id, option_text AS text, is_correct AS isCorrect
           FROM answer_options
           WHERE question_id = ?
           ORDER BY display_order ASC, id ASC`
        )
        .all(question.id)
        .map((option) => ({ ...option, isCorrect: option.isCorrect === 1 }))
    }));

  return {
    ...questionSet,
    isDefault: questionSet.isDefault === 1,
    questionCount: questions.length,
    questions
  };
}

export function createQuestionSet(database, adminId, input) {
  const insertSet = database.prepare(
    `INSERT INTO question_sets (admin_id, name, description)
     VALUES (?, ?, ?)`
  );
  const insertQuestion = database.prepare(
    `INSERT INTO questions (
       title, scenario, explanation, learning_objective, recommended_behavior,
       category, difficulty, is_seed
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
  );
  const insertOption = database.prepare(
    `INSERT INTO answer_options (question_id, option_text, is_correct, display_order)
     VALUES (?, ?, ?, ?)`
  );
  const insertLink = database.prepare(
    `INSERT INTO question_set_questions (question_set_id, question_id, display_order)
     VALUES (?, ?, ?)`
  );

  const create = database.transaction(() => {
    const questionSetId = insertSet.run(adminId, input.name, input.description).lastInsertRowid;

    input.questions.forEach((question, questionIndex) => {
      const questionId = insertQuestion.run(
        question.title,
        question.scenario,
        question.explanation,
        question.learningObjective,
        question.recommendedBehavior,
        question.category || "",
        question.difficulty || ""
      ).lastInsertRowid;

      question.options.forEach((optionText, optionIndex) => {
        insertOption.run(
          questionId,
          optionText,
          optionIndex === question.correctOptionIndex ? 1 : 0,
          optionIndex + 1
        );
      });

      insertLink.run(questionSetId, questionId, questionIndex + 1);
    });

    return questionSetId;
  });

  return getQuestionSet(database, create(), adminId);
}

export function validateQuestionSetInput(input) {
  return createQuestionSetSchema.safeParse(input);
}

export function canUseQuestionSet(database, questionSetId, adminId) {
  if (!questionSetId) {
    return true;
  }

  const row = database
    .prepare(
      `SELECT
         qs.id,
         COUNT(qsq.question_id) AS questionCount
       FROM question_sets qs
       LEFT JOIN question_set_questions qsq ON qsq.question_set_id = qs.id
       WHERE qs.id = ? AND (qs.admin_id = ? OR qs.is_default = 1)
       GROUP BY qs.id`
    )
    .get(questionSetId, adminId);

  return Boolean(row && row.questionCount > 0);
}
