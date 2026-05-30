import { create } from "zustand";

export const useSessionStore = create((set) => ({
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
      session: round
        ? { ...(useSessionStore.getState().session || {}), state: round.state }
        : useSessionStore.getState().session
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
  clearParticipant: () => {
    localStorage.removeItem("participant");
    set({
      participant: null,
      session: null,
      currentRound: null,
      answerLocked: false,
      mySubmittedAnswerId: null,
      revealData: null,
      leaderboard: [],
      finalResults: null,
      takeoverMessage: ""
    });
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
