"use client";

import { useEffect, useState } from "react";

/**
 * Like useState, but the value is mirrored to sessionStorage so it survives a
 * page refresh within the same tab session (and clears when the tab closes).
 *
 * Intended for in-progress, not-yet-saved UI state — multi-step wizard position,
 * draft form fields — where a refresh shouldn't throw the user back to square one
 * but the value also shouldn't linger forever (use the provider + Supabase for
 * anything that needs true cross-device persistence).
 *
 * Reads sessionStorage during lazy initialization (guarded for SSR, where
 * `window` is undefined and `initial` is used). As a "use client" component the
 * first client render uses the same stored value, so there's no flash-back.
 */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      /* corrupt entry — fall back to initial */
    }
    return initial;
  });

  // Persist on change.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full / blocked — non-fatal */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/** Remove a session-state draft (call when the flow completes). */
export function clearSessionState(...keys: string[]) {
  try {
    for (const key of keys) window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
