export function createRoundTimerManager({ database, lockRound, onLock }) {
  const timers = new Map();

  function schedule(round) {
    clear(round.roundId);
    const delayMs = Math.max(0, round.timerEndsAt - Date.now());
    const timeout = setTimeout(() => {
      timers.delete(round.roundId);
      const { round: lockedRound } = lockRound(database, round.roundId);
      if (lockedRound) {
        onLock(lockedRound);
      }
    }, delayMs);

    if (typeof timeout.unref === "function") {
      timeout.unref();
    }
    timers.set(round.roundId, timeout);
  }

  function clear(roundId) {
    const existing = timers.get(roundId);
    if (existing) {
      clearTimeout(existing);
      timers.delete(roundId);
    }
  }

  return { schedule, clear };
}
