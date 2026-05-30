import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import {
  canUseQuestionSet,
  createQuestionSet,
  getQuestionSet,
  listQuestionSets,
  validateQuestionSetInput
} from "../src/questionSets.js";

function adminId(database) {
  return database.prepare("SELECT id FROM admins WHERE username = ?").get("admin").id;
}

function validQuestionSetInput() {
  return {
    name: "Incident Response Basics",
    description: "Short custom drills",
    questions: [
      {
        title: "Suspicious Login",
        scenario: "A user reports a login from an unfamiliar location in the identity portal.",
        options: ["Ignore it", "Approve it", "Investigate and report it", "Share the password"],
        correctOptionIndex: 2,
        explanation: "Unfamiliar login activity should be investigated and reported.",
        learningObjective: "Recognize suspicious authentication activity.",
        recommendedBehavior: "Report the alert and follow the account compromise workflow.",
        category: "Identity",
        difficulty: "Intro"
      }
    ]
  };
}

test("default starter question set is available", () => {
  const database = openDatabase(":memory:");

  const sets = listQuestionSets(database, adminId(database));
  const starter = sets.find((set) => set.isDefault);

  assert.equal(starter.name, "Starter Questions");
  assert.equal(starter.questionCount, 5);
  assert.equal(canUseQuestionSet(database, starter.id, adminId(database)), true);
});

test("custom question set creation persists questions and answer options", () => {
  const database = openDatabase(":memory:");

  const created = createQuestionSet(database, adminId(database), validQuestionSetInput());
  const loaded = getQuestionSet(database, created.id, adminId(database));

  assert.equal(loaded.name, "Incident Response Basics");
  assert.equal(loaded.questionCount, 1);
  assert.equal(loaded.questions[0].title, "Suspicious Login");
  assert.equal(loaded.questions[0].options.length, 4);
  assert.equal(loaded.questions[0].options.filter((option) => option.isCorrect).length, 1);
  assert.equal(loaded.questions[0].options[2].isCorrect, true);
});

test("malformed custom question sets are rejected by validation", () => {
  const parsed = validateQuestionSetInput({
    ...validQuestionSetInput(),
    questions: [
      {
        ...validQuestionSetInput().questions[0],
        options: ["Only one"],
        correctOptionIndex: 0
      }
    ]
  });

  assert.equal(parsed.success, false);
  assert.equal(parsed.error.issues[0].message, "Exactly 4 answer options are required");
});
