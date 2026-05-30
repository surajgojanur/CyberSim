import test from "node:test";
import assert from "node:assert/strict";
import { getCorsOrigin, validateConfig } from "../src/config.js";

const validConfig = {
  nodeEnv: "development",
  serverHost: "0.0.0.0",
  port: 4000,
  clientOrigin: "http://localhost:5173",
  databasePath: ":memory:",
  authSecret: "dev-only-change-me",
  seededAdminUsername: "admin",
  seededAdminPassword: "admin123",
  serveClient: false,
  staticDir: "client/dist"
};

test("config validation accepts local development defaults", () => {
  assert.equal(validateConfig(validConfig), validConfig);
});

test("config validation rejects invalid ports", () => {
  assert.throws(
    () => validateConfig({ ...validConfig, port: NaN }),
    /PORT must be an integer/
  );
});

test("development CORS allows LAN browser origins", () => {
  assert.equal(getCorsOrigin(validConfig), true);
});

test("production CORS remains restricted to the configured origin", () => {
  assert.equal(
    getCorsOrigin({
      ...validConfig,
      nodeEnv: "production",
      clientOrigin: "https://cybersim.example"
    }),
    "https://cybersim.example"
  );
});

test("config validation rejects default auth secret in production", () => {
  assert.throws(
    () =>
      validateConfig({
        ...validConfig,
        nodeEnv: "production",
        clientOrigin: "https://cybersim.example",
        seededAdminPassword: "changed-password"
      }),
    /AUTH_SECRET must be set/
  );
});

test("config validation rejects localhost origins in production", () => {
  assert.throws(
    () =>
      validateConfig({
        ...validConfig,
        nodeEnv: "production",
        authSecret: "safe-production-secret",
        seededAdminPassword: "changed-password"
      }),
    /CLIENT_ORIGIN must not use localhost/
  );
});
