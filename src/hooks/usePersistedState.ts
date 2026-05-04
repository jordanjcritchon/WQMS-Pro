import { useState, useEffect, useCallback } from "react";

export function usePersistedState<T>(key: string, seed: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored) as T;
    } catch { /* corrupted — fall through to seed */ }
    return seed;
  });

  const setState = useCallback((v: T | ((prev: T) => T)) => {
    setStateRaw(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {
        console.warn("WQMS storage full:", e);
      }
      return next;
    });
  }, [key]);

  return [state, setState];
}
