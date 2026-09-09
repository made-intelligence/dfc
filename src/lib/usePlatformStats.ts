"use client";

import { useEffect, useState } from "react";

export interface PlatformStats {
  specialists: number;
  specialties: number;
  countries: number;
  members: number;
  hospitals: number;
  cases: number;
}

/**
 * Live platform counts for the public stats strips.
 *
 * Returns null until loaded (and if the request fails), so callers can render
 * nothing rather than a placeholder number that later jumps to the real one.
 */
export function usePlatformStats(): PlatformStats | null {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.specialists === "number") {
          setStats(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
