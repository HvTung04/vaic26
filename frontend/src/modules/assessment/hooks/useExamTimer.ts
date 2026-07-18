import { useCallback, useEffect, useState } from 'react';

export function useExamTimer(durationSeconds: number, isActive: boolean = true) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (durationSeconds > 0) setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isActive || isPaused || remainingSeconds <= 0) return;
    const id = setInterval(() => {
      setRemainingSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused, remainingSeconds <= 0]);

  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  return {
    remainingSeconds,
    isPaused,
    togglePause,
    isExpired: durationSeconds > 0 && remainingSeconds <= 0,
  };
}
