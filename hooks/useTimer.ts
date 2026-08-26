import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTimerParams {
  durationSec: number;
  /** Timer only counts while this is true; flipping it false pauses in place. */
  running: boolean;
  onExpire?: () => void;
}

/**
 * Countdown driven by a wall-clock deadline rather than by decrementing a
 * counter each tick — a stalled JS thread (navigation, a heavy render) would
 * otherwise silently make the timer run long.
 *
 * The time still owed is written back on every tick, so pausing needs no
 * separate bookkeeping: resuming just re-derives a deadline from whatever is
 * left. `durationSec` is a dependency of the ticking effect so that handing
 * the hook a new duration always re-arms it cleanly.
 *
 * Sound effects for the final 10s and the expiry alarm (PRD §4.9) are Day 5
 * work; `secondsLeft` and `isUrgent` are the hooks they will attach to.
 */
export function useTimer({ durationSec, running, onExpire }: UseTimerParams) {
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const remainingMsRef = useRef(durationSec * 1000);
  const expiredRef = useRef(false);

  // Keep the callback in a ref so restarting isn't tied to its identity.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const reset = useCallback(() => {
    remainingMsRef.current = durationSec * 1000;
    expiredRef.current = false;
    setSecondsLeft(durationSec);
  }, [durationSec]);

  // Declared before the ticking effect so a duration change re-arms the
  // remaining time before the new deadline is computed from it.
  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!running || expiredRef.current) return;

    const deadline = Date.now() + remainingMsRef.current;

    const tick = () => {
      const msLeft = Math.max(0, deadline - Date.now());
      remainingMsRef.current = msLeft;
      setSecondsLeft(Math.ceil(msLeft / 1000));
      if (msLeft <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [running, durationSec]);

  return {
    secondsLeft,
    isUrgent: secondsLeft <= 10 && secondsLeft > 0,
    isExpired: secondsLeft <= 0,
    reset,
  };
}
