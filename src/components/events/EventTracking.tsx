"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/event-tracking";

/** Counts one anonymous detail-page view per visit. Renders nothing. */
export function TrackEventView({ eventId }: { eventId: string }) {
  useEffect(() => {
    trackEvent(eventId, "DETAIL_VIEW", { oncePerSession: true });
  }, [eventId]);
  return null;
}

/** External Register link that records a click before leaving. */
export function RegisterLink({
  eventId,
  href,
  className,
  children,
}: {
  eventId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(eventId, "REGISTER_CLICK")}
      className={className}
    >
      {children}
    </a>
  );
}
