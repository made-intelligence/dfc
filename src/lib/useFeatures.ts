"use client";

import { useEffect, useState } from "react";

export interface Features {
  whatsapp: boolean;
}

/**
 * Which optional integrations are on (see /api/public/features). Everything
 * reads as off until loaded, and if the request fails, so a page never offers
 * something that may not work.
 */
export function useFeatures(): Features {
  const [features, setFeatures] = useState<Features>({ whatsapp: false });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/features")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setFeatures({ whatsapp: data.whatsapp === true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return features;
}
