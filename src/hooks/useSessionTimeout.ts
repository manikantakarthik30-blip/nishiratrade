import { useEffect, useRef, useState, useCallback } from "react";

export function useSessionTimeout(timeoutMinutes = 30) {
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowWarning(false);
    timerRef.current = setTimeout(
      () => setShowWarning(true),
      timeoutMinutes * 60 * 1000,
    );
  }, [timeoutMinutes]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    const handler = () => {
      if (!showWarning) reset();
    };
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWarning]);

  return { showWarning, dismiss: reset };
}
