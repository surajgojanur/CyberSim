import Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { config } from "./config.js";
import { hashPassword } from "./passwords.js";

let db;

export function getDb() {
  if (!db) {
    db = openDatabase(config.databasePath);
  }
  return db;
}

export function openDatabase(databasePath) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  migrate(database);
  seedAdmin(database);
  return database;
}

export function migrate(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      join_code TEXT NOT NULL UNIQUE,
      state TEXT NOT NULL DEFAULT 'lobby'
        CHECK (state IN ('lobby', 'question', 'locked', 'reveal', 'ended')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      display_name TEXT NOT NULL,
      reconnect_token TEXT NOT NULL UNIQUE,
      connected INTEGER NOT NULL DEFAULT 0 CHECK (connected IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      learning_objective TEXT NOT NULL DEFAULT '',
      recommended_behavior TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS answer_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
      display_order INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      sequence_number INTEGER NOT NULL,
      state TEXT NOT NULL DEFAULT 'question' CHECK (state IN ('question', 'locked', 'reveal')),
      started_at_ms INTEGER NOT NULL,
      locks_at_ms INTEGER NOT NULL,
      locked_at_ms INTEGER,
      revealed_at_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      answer_option_id INTEGER NOT NULL,
      submitted_at_ms INTEGER NOT NULL,
      time_taken_ms INTEGER NOT NULL,
      is_correct INTEGER CHECK (is_correct IN (0, 1)),
      score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (answer_option_id) REFERENCES answer_options(id) ON DELETE RESTRICT,
      UNIQUE (round_id, participant_id)
    );

    CREATE TABLE IF NOT EXISTS participant_scores (
      session_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      total_score INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (session_id, participant_id),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_name
      ON participants(session_id, lower(display_name));
    CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON sessions(join_code);
    CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);
    CREATE INDEX IF NOT EXISTS idx_answer_options_question ON answer_options(question_id);
    CREATE INDEX IF NOT EXISTS idx_rounds_session ON rounds(session_id);
    CREATE INDEX IF NOT EXISTS idx_answers_round ON answers(round_id);
  `);
  migrateExistingPhase3(database);
  seedQuestions(database);
}

function migrateExistingPhase3(database) {
  migrateRoundsRevealState(database);
  addColumnIfMissing(database, "questions", "explanation", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(database, "questions", "learning_objective", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(database, "questions", "recommended_behavior", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(database, "rounds", "revealed_at_ms", "INTEGER");
  addColumnIfMissing(database, "answers", "is_correct", "INTEGER CHECK (is_correct IN (0, 1))");
  addColumnIfMissing(database, "answers", "score", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(database, "participants", "connected", "INTEGER NOT NULL DEFAULT 0 CHECK (connected IN (0, 1))");
}

function migrateRoundsRevealState(database) {
  const table = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'rounds'")
    .get();

  if (!table?.sql || table.sql.includes("'reveal'")) {
    return;
  }

  database.pragma("foreign_keys = OFF");
  database.transaction(() => {
    database.exec(`
      CREATE TABLE rounds_phase3 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        sequence_number INTEGER NOT NULL,
        state TEXT NOT NULL DEFAULT 'question' CHECK (state IN ('question', 'locked', 'reveal')),
        started_at_ms INTEGER NOT NULL,
        locks_at_ms INTEGER NOT NULL,
        locked_at_ms INTEGER,
        revealed_at_ms INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT
      );

      INSERT INTO rounds_phase3 (
        id, session_id, question_id, sequence_number, state, started_at_ms,
        locks_at_ms, locked_at_ms, created_at
      )
      SELECT
        id, session_id, question_id, sequence_number, state, started_at_ms,
        locks_at_ms, locked_at_ms, created_at
      FROM rounds;

      DROP TABLE rounds;
      ALTER TABLE rounds_phase3 RENAME TO rounds;
    `);
  })();
  database.pragma("foreign_keys = ON");
}

function addColumnIfMissing(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((entry) => entry.name === column)) {
    return;
  }
  database.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}

export function seedAdmin(database) {
  const existing = database
    .prepare("SELECT id FROM admins WHERE username = ?")
    .get(config.seededAdminUsername);

  if (existing) {
    return;
  }

  database
    .prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)")
    .run(config.seededAdminUsername, hashPassword(config.seededAdminPassword));
}

export function seedQuestions(database) {
  const existing = database.prepare("SELECT COUNT(*) AS count FROM questions").get();
  if (existing.count > 0) {
    return;
  }

  const questions = [
    {
      title: "Suspicious Invoice",
      scenario:
        "A finance employee receives an invoice attachment from a vendor email address with one extra letter in the domain. The message urges payment before end of day. What is the best first action?",
      explanation:
        "The changed domain and urgency are phishing indicators. Reporting preserves evidence and lets the security team block similar messages.",
      learningObjective: "Recognize sender spoofing and urgency cues in phishing attempts.",
      recommendedBehavior: "Do not open the attachment or reply. Report the message through the approved channel.",
      options: [
        ["Open the invoice to inspect the details", 0],
        ["Forward it to personal email for checking later", 0],
        ["Report it through the phishing reporting channel", 1],
        ["Reply asking the sender to confirm the bank details", 0]
      ]
    },
    {
      title: "Unexpected MFA Prompt",
      scenario:
        "A user gets repeated MFA push prompts while not trying to sign in. What should they do?",
      explanation:
        "Unexpected MFA prompts often mean an attacker has the password and is trying to get approval. Denying and reporting helps contain the account risk.",
      learningObjective: "Identify MFA fatigue attacks.",
      recommendedBehavior: "Deny unexpected prompts, report them, and change credentials through the approved workflow.",
      options: [
        ["Approve one prompt to stop the notifications", 0],
        ["Deny the prompts and report possible account compromise", 1],
        ["Ignore the prompts until they stop", 0],
        ["Disable MFA temporarily", 0]
      ]
    },
    {
      title: "Shared Admin Password",
      scenario:
        "Two operators are using the same administrator password for a production dashboard. What is the most appropriate control?",
      explanation:
        "Shared administrator credentials remove accountability and make least-privilege enforcement difficult. Named accounts are easier to audit and revoke.",
      learningObjective: "Apply least privilege and accountability to privileged access.",
      recommendedBehavior: "Use named admin accounts with role-appropriate permissions and MFA.",
      options: [
        ["Rotate the shared password monthly", 0],
        ["Create named admin accounts with least privilege", 1],
        ["Store the shared password in a team chat pin", 0],
        ["Use a shorter password that is easier to type", 0]
      ]
    },
    {
      title: "Lost Work Laptop",
      scenario:
        "An employee reports that a work laptop was left in a taxi. The laptop may have cached access tokens. What should happen first?",
      explanation:
        "Revoking active sessions limits token misuse while the lost device is tracked and handled through incident response.",
      learningObjective: "Prioritize containment after device loss.",
      recommendedBehavior: "Report the lost device immediately and revoke active sessions or device trust.",
      options: [
        ["Wait to see if the taxi company returns it", 0],
        ["Revoke active sessions and report the lost device", 1],
        ["Ask the employee to change only their desktop wallpaper", 0],
        ["Delete the employee account immediately", 0]
      ]
    },
    {
      title: "Public Cloud Storage",
      scenario:
        "A storage bucket containing internal logs is accidentally made public. What is the best immediate response?",
      explanation:
        "Removing public access stops further exposure. Incident review then determines what was accessed and what notifications or controls are needed.",
      learningObjective: "Contain accidental public cloud exposure quickly.",
      recommendedBehavior: "Remove public permissions first, preserve evidence, and start the incident review process.",
      options: [
        ["Remove public access and start incident review", 1],
        ["Rename the bucket and leave permissions unchanged", 0],
        ["Post the link internally so everyone can help check it", 0],
        ["Wait for the next scheduled audit", 0]
      ]
    }
  ];

  const insertQuestion = database.prepare(
    `INSERT INTO questions (title, scenario, explanation, learning_objective, recommended_behavior)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertOption = database.prepare(
    `INSERT INTO answer_options (question_id, option_text, is_correct, display_order)
     VALUES (?, ?, ?, ?)`
  );

  const insertAll = database.transaction(() => {
    for (const question of questions) {
      const questionId = insertQuestion
        .run(
          question.title,
          question.scenario,
          question.explanation,
          question.learningObjective,
          question.recommendedBehavior
        )
        .lastInsertRowid;
      question.options.forEach(([text, isCorrect], index) => {
        insertOption.run(questionId, text, isCorrect, index + 1);
      });
    }
  });

  insertAll();
}
