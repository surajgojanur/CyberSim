import cors from "cors";
import express from "express";
import { join } from "node:path";
import { authRouter } from "./auth.js";
import { questionSetsRouter } from "./questionSets.js";
import { sessionsRouter } from "./sessions.js";

export function createApp({ corsOrigin, serveClient = false, staticDir = "" }) {
  const app = express();

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  authRouter(app);
  questionSetsRouter(app);
  sessionsRouter(app);

  if (serveClient) {
    app.use(express.static(staticDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(join(staticDir, "index.html"));
    });
  }

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
