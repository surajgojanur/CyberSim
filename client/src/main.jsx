import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import { create } from "zustand";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const socket = io(API_URL, {
  autoConnect: true,
  transports: ["websocket"]
});

const useSessionStore = create((set) => ({
  adminToken: localStorage.getItem("adminToken") || "",
  admin: null,
  session: null,
  participants: [],
  participant: JSON.parse(localStorage.getItem("participant") || "null"),
  currentRound: null,
  answerProgress: { answered: 0, total: 0 },
  answerLocked: false,
  mySubmittedAnswerId: null,
  revealData: null,
  leaderboard: [],
  finalResults: null,
  takeoverMessage: "",
  setAdminSession: ({ token, admin }) => {
    localStorage.setItem("adminToken", token);
    set({ adminToken: token, admin });
  },
  setSession: (session) => set({ session }),
  setSessionPhase: (state) =>
    set({ session: { ...(useSessionStore.getState().session || {}), state } }),
  setParticipants: (participants) => set({ participants }),
  setCurrentRound: (round) =>
    set({
      currentRound: round,
      answerLocked: round?.state === "locked" ? true : false,
      mySubmittedAnswerId: null,
      revealData: null,
      leaderboard: [],
      session: round ? { ...(useSessionStore.getState().session || {}), state: round.state } : useSessionStore.getState().session
    }),
  setRoundLocked: (round) =>
    set({
      currentRound: round ? { ...(useSessionStore.getState().currentRound || {}), ...round, state: "locked" } : null,
      answerLocked: true,
      session: { ...(useSessionStore.getState().session || {}), state: "locked" }
    }),
  setRoundReveal: (revealData) =>
    set({
      currentRound: revealData,
      revealData,
      leaderboard: revealData.leaderboard || [],
      answerLocked: true,
      session: { ...(useSessionStore.getState().session || {}), state: "reveal" }
    }),
  setSessionEnded: (finalResults) =>
    set({
      finalResults,
      currentRound: null,
      revealData: null,
      leaderboard: finalResults?.leaderboard || [],
      answerLocked: true,
      session: finalResults?.session || { ...(useSessionStore.getState().session || {}), state: "ended" }
    }),
  setFinalResults: (finalResults) => set({ finalResults, leaderboard: finalResults?.leaderboard || [] }),
  restoreParticipantState: (state) => {
    localStorage.setItem("participant", JSON.stringify(state.participant));
    set({
      participant: state.participant,
      session: state.session,
      currentRound: state.currentRound || state.reveal || null,
      answerLocked: Boolean(state.answer?.submitted || state.currentRound?.state === "locked" || state.reveal),
      mySubmittedAnswerId: state.answer?.answerOptionId || state.reveal?.myResult?.answerOptionId || null,
      revealData: state.reveal || null,
      leaderboard: state.reveal?.leaderboard || state.finalResults?.leaderboard || [],
      finalResults: state.finalResults || null
    });
  },
  restoreAdminState: (state) =>
    set({
      session: state.session,
      participants: state.participants || [],
      currentRound: state.currentRound || state.reveal || null,
      answerProgress: state.answerProgress || { answered: 0, total: 0 },
      revealData: state.reveal || null,
      leaderboard: state.reveal?.leaderboard || state.finalResults?.leaderboard || [],
      finalResults: state.finalResults || null,
      answerLocked: state.session?.state === "locked" || state.session?.state === "reveal"
    }),
  setTakeoverMessage: (takeoverMessage) => set({ takeoverMessage }),
  setAnswerProgress: (answerProgress) => set({ answerProgress }),
  setMySubmittedAnswer: (answerOptionId) =>
    set({
      mySubmittedAnswerId: answerOptionId,
      answerLocked: true
    }),
  setParticipant: (participant) => {
    localStorage.setItem("participant", JSON.stringify(participant));
    set({ participant });
  },
  logout: () => {
    localStorage.removeItem("adminToken");
    set({
      adminToken: "",
      admin: null,
      session: null,
      participants: [],
      currentRound: null,
      revealData: null,
      finalResults: null,
      leaderboard: [],
      takeoverMessage: ""
    });
  }
}));

function useSocket() {
  return useMemo(() => socket, []);
}

function useCountdown(timerEndsAt) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timerEndsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [timerEndsAt]);

  return Math.max(0, Math.ceil(((timerEndsAt || now) - now) / 1000));
}

function api(path, options = {}) {
  return fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Request failed");
    }
    return payload;
  });
}

function App() {
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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
          <a href="#/admin" className="text-xl font-semibold tracking-wide">
            CyberSim
          </a>
          <nav className="flex gap-3 text-sm text-zinc-300">
            <a className="hover:text-white" href="#/admin">
              Admin
            </a>
            <a className="hover:text-white" href="#/join">
              Join
            </a>
          </nav>
        </header>
        {takeoverMessage && (
          <div className="mb-6 rounded border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-100">
            {takeoverMessage}. This tab is now read-only.
          </div>
        )}
        {page}
      </div>
    </main>
  );
}

function AdminLoginPage() {
  const { adminToken, setAdminSession } = useSessionStore();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminToken) window.location.hash = "#/admin/create";
  }, [adminToken]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: form });
      setAdminSession(data);
      window.location.hash = "#/admin/create";
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <section className="max-w-md">
      <p className="mb-2 text-sm uppercase text-emerald-300">Admin console</p>
      <h1 className="mb-6 text-3xl font-semibold">Launch a live training session</h1>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
        />
        {error && <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button className="rounded bg-emerald-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-emerald-300">
          Log in
        </button>
      </form>
    </section>
  );
}

function AdminCreateSessionPage() {
  const { adminToken, setSession, logout } = useSessionStore();
  const [title, setTitle] = useState("Cybersecurity Basics");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminToken) window.location.hash = "#/admin";
  }, [adminToken]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/sessions", {
        method: "POST",
        token: adminToken,
        body: { title }
      });
      setSession(data.session);
      window.location.hash = `#/admin/lobby/${data.session.id}`;
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <section className="max-w-xl">
      <p className="mb-2 text-sm uppercase text-emerald-300">Session setup</p>
      <h1 className="mb-6 text-3xl font-semibold">Name the live drill</h1>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Session title" value={title} onChange={setTitle} />
        {error && <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
        <div className="flex gap-3">
          <button className="rounded bg-emerald-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-emerald-300">
            Create lobby
          </button>
          <button type="button" onClick={logout} className="rounded border border-zinc-700 px-4 py-2 text-zinc-200">
            Log out
          </button>
        </div>
      </form>
    </section>
  );
}

function AdminLobbyPage({ sessionId }) {
  const socket = useSocket();
  const {
    adminToken,
    session,
    participants,
    currentRound,
    answerProgress,
    revealData,
    leaderboard,
    takeoverMessage,
    setSession,
    setSessionPhase,
    setParticipants,
    setCurrentRound,
    setRoundLocked,
    setRoundReveal,
    setSessionEnded,
    restoreAdminState,
    setTakeoverMessage,
    setAnswerProgress
  } = useSessionStore();
  const [error, setError] = useState("");
  const remainingSeconds = useCountdown(currentRound?.timerEndsAt);

  useEffect(() => {
    if (!adminToken) {
      window.location.hash = "#/admin";
      return;
    }

    api(`/api/sessions/${sessionId}`, { token: adminToken })
      .then((data) => {
        setSession(data.session);
        setParticipants(data.participants);
        socket.emit("admin_subscribe", { token: adminToken, sessionId: Number(sessionId) });
      })
      .catch((caught) => setError(caught.message));

    socket.on("participant_list", ({ participants: nextParticipants }) => setParticipants(nextParticipants));
    socket.on("admin_state", (state) => {
      restoreAdminState(state);
      if (state.finalResults) {
        window.location.hash = `#/admin/results/${state.session.id}`;
      }
    });
    socket.on("round_start", (round) => {
      setError("");
      setCurrentRound(round);
    });
    socket.on("answer_progress", (progress) => setAnswerProgress(progress));
    socket.on("round_locked", (round) => setRoundLocked(round));
    socket.on("round_reveal", (reveal) => setRoundReveal(reveal));
    socket.on("session_ended", ({ results }) => {
      setError("");
      setSessionEnded(results);
      window.location.hash = `#/admin/results/${results.session.id}`;
    });
    socket.on("session_state", ({ state }) => setSessionPhase(state));
    socket.on("session_taken_over", ({ message }) => setTakeoverMessage(message));
    socket.on("socket_error", ({ message }) => setError(message));

    return () => {
      socket.off("participant_list");
      socket.off("admin_state");
      socket.off("round_start");
      socket.off("answer_progress");
      socket.off("round_locked");
      socket.off("round_reveal");
      socket.off("session_ended");
      socket.off("session_state");
      socket.off("session_taken_over");
      socket.off("socket_error");
    };
  }, [
    adminToken,
    sessionId,
    setAnswerProgress,
    setCurrentRound,
    setParticipants,
    setRoundReveal,
    setRoundLocked,
    setSessionEnded,
    setSession,
    setSessionPhase,
    restoreAdminState,
    setTakeoverMessage,
    socket
  ]);

  function startRound() {
    if (takeoverMessage) return;
    setError("");
    socket.emit("admin_start_round", {
      token: adminToken,
      sessionId: Number(sessionId)
    });
  }

  function forceLock() {
    if (takeoverMessage) return;
    setError("");
    socket.emit("admin_force_lock", {
      token: adminToken,
      sessionId: Number(sessionId)
    });
  }

  function endSession() {
    if (takeoverMessage) return;
    setError("");
    socket.emit("admin_end_session", {
      token: adminToken,
      sessionId: Number(sessionId)
    });
  }

  return (
    <section>
      <p className="mb-2 text-sm uppercase text-emerald-300">Admin lobby</p>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{session?.title || "Loading session"}</h1>
          <p className="mt-2 text-zinc-400">Share this code when participants are ready to join.</p>
        </div>
        <div className="rounded border border-emerald-400 px-5 py-3 text-center">
          <p className="text-xs uppercase text-zinc-400">Join code</p>
          <p className="text-3xl font-bold tracking-widest text-emerald-300">{session?.joinCode || "------"}</p>
        </div>
      </div>
      {error && <p className="mb-4 rounded bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
      <div className="mb-6 rounded border border-zinc-800 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase text-zinc-500">Session phase</p>
            <h2 className="text-2xl font-semibold capitalize">{currentRound?.state || session?.state || "lobby"}</h2>
            {currentRound?.state === "question" && (
              <p className="mt-1 text-zinc-400">
              {answerProgress.answered} of {answerProgress.total} answered · {remainingSeconds}s left
              </p>
            )}
            {currentRound?.state === "locked" && (
              <p className="mt-1 text-zinc-400">
                Locked · evaluating {answerProgress.answered} of {answerProgress.total} responses
              </p>
            )}
            {currentRound?.state === "reveal" && (
              <p className="mt-1 text-zinc-400">Reveal · correct answer and leaderboard are now visible</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={startRound}
              disabled={Boolean(takeoverMessage) || currentRound?.state === "question" || currentRound?.state === "locked" || participants.length === 0}
              className="rounded bg-emerald-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {currentRound?.state === "reveal" ? "Start next scenario" : "Start round"}
            </button>
            <button
              onClick={forceLock}
              disabled={Boolean(takeoverMessage) || currentRound?.state !== "question"}
              className="rounded border border-zinc-700 px-4 py-2 text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-600"
            >
              Force lock
            </button>
            <button
              onClick={endSession}
              disabled={Boolean(takeoverMessage) || session?.state === "ended"}
              className="rounded border border-zinc-700 px-4 py-2 text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-600"
            >
              End session
            </button>
          </div>
        </div>
      </div>
      {currentRound?.question && (
        <div className="mb-6 rounded border border-zinc-800 p-4">
          <p className="text-sm uppercase text-zinc-500">Current scenario</p>
          <h2 className="mt-1 text-xl font-semibold">{currentRound.question.title}</h2>
          <p className="mt-2 text-zinc-400">{currentRound.question.scenario}</p>
          {revealData && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-sm uppercase text-zinc-500">Reveal</p>
              <p className="mt-2 text-zinc-300">{revealData.question.explanation}</p>
              <p className="mt-3 text-sm text-emerald-300">
                Correct answer: {answerText(revealData.question.options, revealData.correctAnswerId)}
              </p>
            </div>
          )}
        </div>
      )}
      {revealData && (
        <div className="mb-6 rounded border border-zinc-800 p-4">
          <h2 className="mb-3 text-xl font-semibold">Leaderboard</h2>
          <Leaderboard leaderboard={leaderboard} />
        </div>
      )}
      {revealData?.participantResults && (
        <div className="mb-6 rounded border border-zinc-800 p-4">
          <h2 className="mb-3 text-xl font-semibold">Answer summary</h2>
          <ul className="divide-y divide-zinc-800">
            {revealData.participantResults.map((result) => (
              <li key={result.participantId} className="flex items-center justify-between py-3">
                <span>{result.displayName}</span>
                <span className={result.isCorrect ? "text-emerald-300" : "text-zinc-500"}>
                  {result.answerOptionId ? (result.isCorrect ? "Correct" : "Incorrect") : "Unanswered"} · +
                  {result.scoreDelta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded border border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">Participants ({participants.length})</h2>
        </div>
        <ul className="divide-y divide-zinc-800">
          {participants.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between px-4 py-3">
              <span>{participant.displayName}</span>
              <span className={participant.connected ? "text-sm text-emerald-300" : "text-sm text-zinc-500"}>
                {participant.connected ? "Connected" : "Disconnected"}
              </span>
            </li>
          ))}
          {participants.length === 0 && <li className="px-4 py-6 text-zinc-500">No participants yet.</li>}
        </ul>
      </div>
    </section>
  );
}

function ParticipantJoinPage() {
  const socket = useSocket();
  const { setParticipant } = useSessionStore();
  const [form, setForm] = useState({ joinCode: "", displayName: "" });
  const [sessionPreview, setSessionPreview] = useState(null);
  const [error, setError] = useState("");

  async function validateCode() {
    setError("");
    setSessionPreview(null);
    if (form.joinCode.trim().length !== 6) return;
    try {
      const data = await api(`/api/join/${form.joinCode.trim().toUpperCase()}`);
      setSessionPreview(data.session);
    } catch (caught) {
      setError(caught.message);
    }
  }

  useEffect(() => {
    socket.on("join_ack", ({ participantId, socketToken, sessionState }) => {
      setParticipant({
        participantId,
        socketToken,
        session: sessionState,
        displayName: form.displayName
      });
      window.location.hash = "#/waiting";
    });
    socket.on("join_error", ({ message }) => setError(message));

    return () => {
      socket.off("join_ack");
      socket.off("join_error");
    };
  }, [form.displayName, setParticipant, socket]);

  function submit(event) {
    event.preventDefault();
    setError("");
    socket.emit("join_session", form);
  }

  return (
    <section className="max-w-md">
      <p className="mb-2 text-sm uppercase text-emerald-300">Participant view</p>
      <h1 className="mb-6 text-3xl font-semibold">Join a live drill</h1>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Join code"
          value={form.joinCode}
          onBlur={validateCode}
          onChange={(joinCode) => setForm({ ...form, joinCode: joinCode.toUpperCase() })}
        />
        <Field
          label="Display name"
          value={form.displayName}
          onChange={(displayName) => setForm({ ...form, displayName })}
        />
        {sessionPreview && (
          <p className="rounded border border-zinc-800 px-3 py-2 text-sm text-zinc-300">
            Ready to join: {sessionPreview.title}
          </p>
        )}
        {error && <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button className="rounded bg-emerald-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-emerald-300">
          Join lobby
        </button>
      </form>
    </section>
  );
}

function ParticipantWaitingRoomPage() {
  const socket = useSocket();
  const {
    participant,
    currentRound,
    answerLocked,
    mySubmittedAnswerId,
    takeoverMessage,
    setCurrentRound,
    setRoundLocked,
    setRoundReveal,
    setSessionEnded,
    setMySubmittedAnswer
  } = useSessionStore();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [error, setError] = useState("");
  const remainingSeconds = useCountdown(currentRound?.timerEndsAt);

  useEffect(() => {
    socket.on("round_start", (round) => {
      setError("");
      setSelectedOptionId(null);
      setCurrentRound(round);
    });
    socket.on("round_locked", (round) => setRoundLocked(round));
    socket.on("round_reveal", (reveal) => setRoundReveal(reveal));
    socket.on("session_ended", ({ results }) => {
      setError("");
      setSessionEnded(results);
      window.location.hash = `#/results/${results.session.id}`;
    });
    socket.on("answer_ack", ({ answerOptionId }) => {
      setError("");
      setMySubmittedAnswer(answerOptionId);
    });
    socket.on("answer_error", ({ message }) => setError(message));

    return () => {
      socket.off("round_start");
      socket.off("round_locked");
      socket.off("round_reveal");
      socket.off("session_ended");
      socket.off("answer_ack");
      socket.off("answer_error");
    };
  }, [setCurrentRound, setMySubmittedAnswer, setRoundLocked, setRoundReveal, setSessionEnded, socket]);

  if (!participant) {
    return (
      <section>
        <h1 className="text-3xl font-semibold">No active join</h1>
        <a className="mt-4 inline-block text-emerald-300" href="#/join">
          Enter a join code
        </a>
      </section>
    );
  }

  function submitAnswer(event) {
    event.preventDefault();
    setError("");
    if (takeoverMessage) {
      setError("This session was opened in another tab");
      return;
    }
    if (!selectedOptionId || !currentRound) {
      setError("Choose an answer before submitting");
      return;
    }

    socket.emit("submit_answer", {
      participantId: participant.participantId,
      socketToken: participant.socketToken,
      roundId: currentRound.roundId,
      answerOptionId: selectedOptionId
    });
  }

  if (currentRound?.question) {
    const locked = Boolean(takeoverMessage) || answerLocked || currentRound.state === "locked" || remainingSeconds === 0;
    const reveal = currentRound.state === "reveal" ? currentRound : null;

    return (
      <section className="max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase text-emerald-300">Round {currentRound.sequenceNumber}</p>
            <h1 className="text-3xl font-semibold">{currentRound.question.title}</h1>
          </div>
          <div className="rounded border border-zinc-800 px-4 py-2 text-center">
            <p className="text-xs uppercase text-zinc-500">Time left</p>
            <p className="text-2xl font-semibold text-emerald-300">{remainingSeconds}s</p>
          </div>
        </div>
        <p className="mb-6 text-lg text-zinc-300">{currentRound.question.scenario}</p>
        <form onSubmit={submitAnswer} className="space-y-3">
          {currentRound.question.options.map((option) => (
            <label
              key={option.id}
              className={`block rounded border px-4 py-3 ${
                reveal?.correctAnswerId === option.id
                  ? "border-emerald-400 bg-emerald-950 text-emerald-100"
                  : selectedOptionId === option.id
                  ? "border-emerald-400 bg-zinc-900"
                  : "border-zinc-800 bg-transparent"
              } ${locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="answer"
                value={option.id}
                checked={selectedOptionId === option.id}
                disabled={locked}
                onChange={() => setSelectedOptionId(option.id)}
                className="mr-3"
              />
              {option.text}
              {reveal?.correctAnswerId === option.id && (
                <span className="ml-3 text-sm font-semibold text-emerald-300">Correct</span>
              )}
            </label>
          ))}
          {error && <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
          {mySubmittedAnswerId && (
            <p className="rounded border border-zinc-800 px-3 py-2 text-sm text-zinc-300">
              Answer submitted. You cannot change it now.
            </p>
          )}
          {currentRound.state === "locked" && (
            <p className="rounded border border-zinc-800 px-3 py-2 text-sm text-zinc-300">
              Round locked. The server is evaluating responses.
            </p>
          )}
          {reveal && (
            <div className="space-y-4 rounded border border-zinc-800 p-4">
              <div>
                <p className="text-sm uppercase text-zinc-500">Your result</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">
                  +{reveal.myResult?.scoreDelta || 0} points
                </p>
                <p className="mt-1 text-zinc-400">
                  {reveal.myResult?.isCorrect ? "Correct answer" : "No points this round"}
                </p>
              </div>
              <div>
                <p className="text-sm uppercase text-zinc-500">Why it matters</p>
                <p className="mt-2 text-zinc-300">{reveal.question.explanation}</p>
                {reveal.question.learningObjective && (
                  <p className="mt-3 text-sm text-zinc-400">{reveal.question.learningObjective}</p>
                )}
                {reveal.question.recommendedBehavior && (
                  <p className="mt-2 text-sm text-emerald-300">{reveal.question.recommendedBehavior}</p>
                )}
              </div>
              <div>
                <h2 className="mb-3 text-xl font-semibold">Leaderboard</h2>
                <Leaderboard leaderboard={reveal.leaderboard || []} />
              </div>
            </div>
          )}
          <button
            disabled={locked || !selectedOptionId}
            className="rounded bg-emerald-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            Submit answer
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="max-w-xl">
      <p className="mb-2 text-sm uppercase text-emerald-300">Participant waiting room</p>
      <h1 className="mb-4 text-3xl font-semibold">{participant.session.title}</h1>
      <p className="text-lg text-zinc-300">You are in the lobby as {participant.displayName}.</p>
      <p className="mt-3 text-zinc-500">Wait here until the admin starts the next scenario.</p>
    </section>
  );
}

function answerText(options = [], answerId) {
  return options.find((option) => option.id === answerId)?.text || "Not available";
}

function ResultsPage({ sessionId, mode }) {
  const { participant, finalResults, setFinalResults } = useSessionStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api(`/api/sessions/${sessionId}/results`)
      .then(({ results }) => setFinalResults(results))
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));
  }, [sessionId, setFinalResults]);

  if (loading && !finalResults) {
    return <p className="text-zinc-400">Loading final results.</p>;
  }

  if (error && !finalResults) {
    return <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>;
  }

  const results = finalResults;
  const myEntry = results?.leaderboard?.find(
    (entry) => entry.participantId === participant?.participantId
  );

  return (
    <section>
      <p className="mb-2 text-sm uppercase text-emerald-300">Session complete</p>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{results?.session?.title || "Session ended"}</h1>
        <p className="mt-2 text-zinc-400">
          Final results are loaded from persisted server data · {results?.totalRoundsPlayed || 0} rounds played
        </p>
      </div>
      {mode === "participant" && (
        <div className="mb-6 rounded border border-zinc-800 p-4">
          <p className="text-sm uppercase text-zinc-500">Your standing</p>
          {myEntry ? (
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              <ResultMetric label="Rank" value={`#${myEntry.rank}`} />
              <ResultMetric label="Score" value={myEntry.totalScore} />
              <ResultMetric label="Correct" value={myEntry.correctCount} />
            </div>
          ) : (
            <p className="mt-2 text-zinc-400">Your participant record was not found in these results.</p>
          )}
        </div>
      )}
      <div className="mb-6 rounded border border-zinc-800 p-4">
        <h2 className="mb-3 text-xl font-semibold">Final leaderboard</h2>
        <Leaderboard leaderboard={results?.leaderboard || []} />
      </div>
      {mode === "admin" && (
        <div className="rounded border border-zinc-800 p-4">
          <h2 className="mb-3 text-xl font-semibold">Round summaries</h2>
          <RoundSummaries rounds={results?.rounds || []} />
        </div>
      )}
    </section>
  );
}

function ResultMetric({ label, value }) {
  return (
    <div className="rounded border border-zinc-800 p-3">
      <p className="text-sm uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-emerald-300">{value}</p>
    </div>
  );
}

function RoundSummaries({ rounds }) {
  if (!rounds.length) {
    return <p className="text-zinc-500">No revealed rounds were played.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-800">
      {rounds.map((round) => (
        <li key={round.roundId} className="py-4">
          <p className="text-sm uppercase text-zinc-500">Round {round.sequenceNumber}</p>
          <h3 className="mt-1 font-semibold">{round.questionTitle}</h3>
          <p className="mt-2 text-sm text-emerald-300">Correct answer: {round.correctAnswerText}</p>
          <p className="mt-2 text-sm text-zinc-400">
            {round.correctCount} correct · {round.answeredCount} answered · {round.totalParticipants} participants
          </p>
        </li>
      ))}
    </ul>
  );
}

function Leaderboard({ leaderboard }) {
  if (!leaderboard.length) {
    return <p className="text-zinc-500">No leaderboard entries yet.</p>;
  }

  return (
    <ol className="divide-y divide-zinc-800">
      {leaderboard.map((entry) => (
        <li key={entry.participantId} className="flex items-center justify-between py-3">
          <span>
            {entry.rank}. {entry.displayName}
          </span>
          <span className="font-semibold text-emerald-300">{entry.totalScore}</span>
        </li>
      ))}
    </ol>
  );
}

function Field({ label, value, onChange, type = "text", onBlur }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-zinc-300">{label}</span>
      <input
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-400"
      />
    </label>
  );
}

createRoot(document.getElementById("root")).render(<App />);
