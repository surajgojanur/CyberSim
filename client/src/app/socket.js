import { io } from "socket.io-client";

export const API_URL = trimTrailingSlash(import.meta.env.VITE_API_URL || "");
const SOCKET_URL = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || API_URL);

export const socket = io(SOCKET_URL || undefined, {
  autoConnect: true,
  transports: ["websocket"]
});

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
