import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimeout(onTimeout: () => void, timeoutMs = 15 * 60 * 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>( null as any);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onTimeout, timeoutMs);
  }, [onTimeout, timeoutMs]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timerRef.current);
    };
  }, [reset]);
}