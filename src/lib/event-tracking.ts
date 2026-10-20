"use client";

import type { EventInteractionKind } from "@/lib/event-tracking-kinds";

const TRACK_URL = "/api/public/events/track";
const SEEN_PREFIX = "dfc_evt_seen:";

/**
 * Fire-and-forget engagement hit. Uses sendBeacon so clicks on links that
 * navigate away (Register) are still delivered. Views are counted once per
 * browser session per event so refreshes don't inflate them.
 */
export function trackEvent(eventId: string, kind: EventInteractionKind, { oncePerSession = false } = {}) {
  if (typeof window === "undefined") return;

  if (oncePerSession) {
    const key = `${SEEN_PREFIX}${kind}:${eventId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage unavailable: count it anyway
    }
  }

  const body = JSON.stringify({ eventId, kind });
  try {
    if (navigator.sendBeacon?.(TRACK_URL, body)) return;
  } catch {
    // fall through to fetch
  }
  fetch(TRACK_URL, { method: "POST", body, keepalive: true }).catch(() => {});
}
