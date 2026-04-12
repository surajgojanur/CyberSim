import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password, encodedHash) {
  const [scheme, iterations, salt, hash] = encodedHash.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(
    password,
    salt,
    Number(iterations),
    KEY_LENGTH,
    DIGEST
  );
  const stored = Buffer.from(hash, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}
