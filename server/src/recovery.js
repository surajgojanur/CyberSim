import { lockRound, revealRound } from "./rounds.js";

export function recoverActiveRounds(database, timers, onRecoveredReveal = () => {}) {
  const nowMs = Date.now();
  const activeRounds = database
    .prepare(
      `SELECT id AS roundId, session_id AS sessionId, locks_at_ms AS timerEndsAt
       FROM rounds
       WHERE state = 'question'`
    )
    .all();

  for (const round of activeRounds) {
    if (round.timerEndsAt > nowMs) {
      timers.schedule(round);
      continue;
    }

    const { round: lockedRound } = lockRound(database, round.roundId, nowMs);
    if (lockedRound) {
      const { reveal } = revealRound(database, lockedRound.roundId, nowMs);
      if (reveal) {
        onRecoveredReveal(reveal);
      }
    }
  }

  const lockedRounds = database
    .prepare(
      `SELECT id AS roundId
       FROM rounds
       WHERE state = 'locked'`
    )
    .all();

  for (const round of lockedRounds) {
    const { reveal } = revealRound(database, round.roundId, nowMs);
    if (reveal) {
      onRecoveredReveal(reveal);
    }
  }
}
