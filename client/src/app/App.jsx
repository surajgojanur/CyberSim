import React, { useEffect, useState } from "react";
import { useSocket } from "./hooks";
import { useSessionStore } from "./store";
import { AppShell } from "../components/ui";
import { AdminCreateSessionPage } from "../pages/AdminCreateSessionPage";
import { AdminLobbyPage } from "../pages/AdminLobbyPage";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { ParticipantJoinPage } from "../pages/ParticipantJoinPage";
import { ParticipantWaitingRoomPage } from "../pages/ParticipantWaitingRoomPage";
import { ResultsPage } from "../pages/ResultsPage";

export function App() {
  const [route, setRoute] = useState(window.location.hash || "#/admin");
  const socket = useSocket();
  const { participant, takeoverMessage, restoreParticipantState, setTakeoverMessage } = useSessionStore();

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/admin");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!participant?.socketToken) {
      return;
    }

    if (!window.location.hash || window.location.hash === "#/admin") {
      window.location.hash = "#/waiting";
    }

    socket.emit("rejoin_session", { socketToken: participant.socketToken });
    socket.on("session_restored", (state) => {
      restoreParticipantState(state);
      if (state.finalResults) {
        window.location.hash = `#/results/${state.session.id}`;
      } else if (!window.location.hash.startsWith("#/results")) {
        window.location.hash = "#/waiting";
      }
    });
    socket.on("session_taken_over", ({ message }) => setTakeoverMessage(message));

    return () => {
      socket.off("session_restored");
      socket.off("session_taken_over");
    };
  }, [participant?.socketToken, restoreParticipantState, setTakeoverMessage, socket]);

  let page = <AdminLoginPage />;
  if (route.startsWith("#/admin/create")) page = <AdminCreateSessionPage />;
  if (route.startsWith("#/admin/lobby/")) page = <AdminLobbyPage sessionId={route.split("/").at(-1)} />;
  if (route.startsWith("#/admin/results/")) page = <ResultsPage sessionId={route.split("/").at(-1)} mode="admin" />;
  if (route.startsWith("#/join")) page = <ParticipantJoinPage />;
  if (route.startsWith("#/waiting")) page = <ParticipantWaitingRoomPage />;
  if (route.startsWith("#/results/")) page = <ResultsPage sessionId={route.split("/").at(-1)} mode="participant" />;

  return <AppShell takeoverMessage={takeoverMessage}>{page}</AppShell>;
}
