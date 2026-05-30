import { useEffect, useMemo, useState } from "react";
import { socket } from "./socket";

export function useSocket() {
  return useMemo(() => socket, []);
}

export function useCountdown(timerEndsAt) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timerEndsAt) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [timerEndsAt]);

  return Math.max(0, Math.ceil(((timerEndsAt || now) - now) / 1000));
}
