import "dotenv/config";
import { existsSync, rmSync } from "node:fs";
import { config, validateConfig } from "../server/src/config.js";
import { openDatabase } from "../server/src/db.js";

validateConfig(config);

if (config.databasePath === ":memory:") {
  throw new Error("reset-demo requires a file-backed DATABASE_PATH");
}

if (existsSync(config.databasePath)) {
  rmSync(config.databasePath, { force: true });
  rmSync(`${config.databasePath}-shm`, { force: true });
  rmSync(`${config.databasePath}-wal`, { force: true });
}

const database = openDatabase(config.databasePath);
const questionCount = database.prepare("SELECT COUNT(*) AS count FROM questions").get().count;
const adminCount = database.prepare("SELECT COUNT(*) AS count FROM admins").get().count;
database.close();

console.log(`Reset demo database: ${config.databasePath}`);
console.log(`Seeded admins: ${adminCount}`);
console.log(`Seeded questions: ${questionCount}`);
