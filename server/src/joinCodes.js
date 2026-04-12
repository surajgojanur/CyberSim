const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6, random = Math.random) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeJoinCode(code) {
  return String(code || "").trim().toUpperCase();
}

export function isValidJoinCode(code) {
  return /^[A-Z2-9]{6}$/.test(code);
}
