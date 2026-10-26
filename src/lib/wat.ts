/**
 * West Africa Time (WAT, UTC+1, no daylight saving) is DFC's single clock.
 *
 * Doctor schedules, slots and appointment times are all WAT wall-clock times,
 * whoever is looking at them and wherever they are. Every time shown to a user
 * carries the "WAT" label so a doctor in London or Houston knows which clock
 * it is.
 *
 * Storage: `Appointment.appointmentDate` is the appointment's calendar day as
 * an instant at WAT midnight (23:00 UTC the day before); `startTime` /
 * `endTime` are "HH:MM" WAT. Older rows stored the booking browser's local
 * midnight; `ymdOfStoredDate` reads both correctly.
 *
 * Safe on both server and client.
 */

export const WAT_LABEL = "WAT";
export const WAT_LONG_LABEL = "West Africa Time (GMT+1)";
const WAT_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The instant at WAT midnight starting a YYYY-MM-DD day. */
export function watMidnight(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+01:00`);
}

/** ISO string of WAT midnight for a YYYY-MM-DD day (the stored appointmentDate form). */
export function watMidnightIso(ymd: string): string {
  return watMidnight(ymd).toISOString();
}

/** The instant of an HH:MM WAT time on a YYYY-MM-DD day. */
export function watInstant(ymd: string, hhmm: string): Date {
  return new Date(`${ymd}T${hhmm}:00+01:00`);
}

/**
 * Calendar day (YYYY-MM-DD) of a stored appointmentDate. Midnight in any zone
 * within ±12h of UTC, shifted forward 12h, lands mid-day on the same date.
 */
export function ymdOfStoredDate(d: string | Date): string {
  return new Date(new Date(d).getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Today's date and the current time, on the WAT clock. */
export function watNow(now: Date = new Date()): { ymd: string; hhmm: string } {
  const wat = new Date(now.getTime() + WAT_OFFSET_MS).toISOString();
  return { ymd: wat.slice(0, 10), hhmm: wat.slice(11, 16) };
}

/** The [start, end) instants of a WAT calendar day, for "today" queries. */
export function watDayRange(ymd: string): { gte: Date; lt: Date } {
  const start = watMidnight(ymd);
  return { gte: start, lt: new Date(start.getTime() + DAY_MS) };
}

/**
 * A stored appointmentDate as a readable date, e.g. "Tue, 21 Oct 2026".
 * Formats the calendar day itself, so it reads the same in every time zone.
 */
export function formatApptDate(
  d: string | Date,
  style: "short" | "long" = "short"
): string {
  const midday = new Date(`${ymdOfStoredDate(d)}T12:00:00Z`);
  return midday.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    ...(style === "long"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
  });
}

/** "14:00 – 14:30 WAT" */
export function formatWatRange(startTime: string, endTime?: string): string {
  return endTime ? `${startTime} – ${endTime} ${WAT_LABEL}` : `${startTime} ${WAT_LABEL}`;
}

/** An instant shown on the WAT clock, e.g. "Tue, 21 Oct 2026, 14:00 WAT". */
export function formatInstantWat(d: string | Date): string {
  const s = new Date(d).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${s} ${WAT_LABEL}`;
}
