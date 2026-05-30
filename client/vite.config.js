import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:4000",
      "/socket.io": {
        target: "ws://localhost:4000",
        ws: true
      }
    }
  }
});
