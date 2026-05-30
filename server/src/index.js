import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { config, getCorsOrigin, validateConfig } from "./config.js";
import { createApp } from "./app.js";
import { configureSocket } from "./socket.js";

validateConfig(config);
const corsOrigin = getCorsOrigin(config);

const app = createApp({
  corsOrigin,
  serveClient: config.serveClient,
  staticDir: config.staticDir
});
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin
  }
});

configureSocket(io);

httpServer.listen(config.port, config.serverHost, () => {
  console.log(`CyberSim API listening on http://${config.serverHost}:${config.port}`);
  if (config.serveClient) {
    console.log(`Serving client build from ${config.staticDir}`);
  }
});
