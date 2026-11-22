import { useEffect, useRef } from "react";

// Calls `callback` every `ms` milliseconds while `enabled` is true.
// Used to check the API again for new order statuses (no WebSockets in v1).
export function useInterval(callback, ms, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => saved.current(), ms);
    return () => clearInterval(timer);
  }, [ms, enabled]);
}
