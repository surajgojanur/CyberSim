import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { config } from "./config.js";
import { getDb } from "./db.js";
import { verifyPassword } from "./passwords.js";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export function authRouter(app) {
  app.post("/api/auth/login", (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = getDb()
      .prepare("SELECT id, username, password_hash FROM admins WHERE username = ?")
      .get(parsed.data.username);

    if (!admin || !verifyPassword(parsed.data.password, admin.password_hash)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({
      token: issueAdminToken(admin.id),
      admin: { id: admin.id, username: admin.username }
    });
  });
}

export function requireAdmin(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const admin = verifyAdminToken(token);

  if (!admin) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.admin = admin;
  next();
}

export function issueAdminToken(adminId) {
  const nonce = randomBytes(12).toString("hex");
  const payload = `${adminId}.${Date.now() + 1000 * 60 * 60 * 12}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  const parts = token.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const [adminId, expiresAt, nonce, signature] = parts;
  const payload = `${adminId}.${expiresAt}.${nonce}`;
  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer) ||
    Number(expiresAt) < Date.now()
  ) {
    return null;
  }

  const admin = getDb()
    .prepare("SELECT id, username FROM admins WHERE id = ?")
    .get(Number(adminId));
  return admin || null;
}

function sign(payload) {
  return createHmac("sha256", config.authSecret).update(payload).digest("base64url");
}
