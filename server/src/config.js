import { fileURLToPath } from "node:url";

const defaultDatabasePath = fileURLToPath(new URL("../data/cybersim.db", import.meta.url));
const defaultStaticDir = fileURLToPath(new URL("../../client/dist", import.meta.url));

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT || "4000"),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  databasePath: process.env.DATABASE_PATH || defaultDatabasePath,
  authSecret: process.env.AUTH_SECRET || "dev-only-change-me",
  seededAdminUsername: process.env.SEED_ADMIN_USERNAME || "admin",
  seededAdminPassword: process.env.SEED_ADMIN_PASSWORD || "admin123",
  serveClient: parseBoolean(process.env.SERVE_CLIENT, process.env.NODE_ENV === "production"),
  staticDir: process.env.STATIC_DIR || defaultStaticDir
};

export function validateConfig(nextConfig = config) {
  const errors = [];

  if (!Number.isInteger(nextConfig.port) || nextConfig.port < 1 || nextConfig.port > 65_535) {
    errors.push("PORT must be an integer between 1 and 65535");
  }

  if (!nextConfig.clientOrigin) {
    errors.push("CLIENT_ORIGIN is required");
  } else {
    try {
      new URL(nextConfig.clientOrigin);
    } catch {
      errors.push("CLIENT_ORIGIN must be a valid URL");
    }
  }

  if (!nextConfig.databasePath) {
    errors.push("DATABASE_PATH is required");
  }

  if (!nextConfig.authSecret) {
    errors.push("AUTH_SECRET is required");
  }

  if (nextConfig.nodeEnv === "production" && nextConfig.authSecret === "dev-only-change-me") {
    errors.push("AUTH_SECRET must be set to a non-default value in production");
  }

  if (nextConfig.nodeEnv === "production" && nextConfig.seededAdminPassword === "admin123") {
    errors.push("SEED_ADMIN_PASSWORD must be changed in production");
  }

  if (nextConfig.nodeEnv === "production" && nextConfig.clientOrigin.includes("localhost")) {
    errors.push("CLIENT_ORIGIN must not use localhost in production");
  }

  if (!nextConfig.seededAdminUsername) {
    errors.push("SEED_ADMIN_USERNAME is required");
  }

  if (!nextConfig.seededAdminPassword) {
    errors.push("SEED_ADMIN_PASSWORD is required");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid CyberSim configuration:\n- ${errors.join("\n- ")}`);
  }

  return nextConfig;
}

function parsePort(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}
