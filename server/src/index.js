import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { config, validateConfig } from "./config.js";
import { createApp } from "./app.js";
import { configureSocket } from "./socket.js";

validateConfig(config);

const app = createApp({
  clientOrigin: config.clientOrigin,
  serveClient: config.serveClient,
  staticDir: config.staticDir
});
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.clientOrigin
  }
});

configureSocket(io);

httpServer.listen(config.port, () => {
  console.log(`CyberSim API listening on http://localhost:${config.port}`);
  if (config.serveClient) {
    console.log(`Serving client build from ${config.staticDir}`);
  }
});
