// When an event's site-wide pop-up banner stops showing, in WAT (UTC+1, no DST).
// Dates are stored as UTC midnight of the chosen day; times as e.g. "10:00 AM WAT".

type BannerTiming = {
  date: Date | string;
  endDate: Date | string | null;
  time: string | null;
};

const HOUR = 60 * 60 * 1000;
const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

/** Minutes after midnight for "10:00 AM WAT"-style times, or null if it can't be read. */
function minutesOf(time: string | null): number | null {
  const m = time?.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\b/i);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 1 || h > 12 || min > 59) return null;
  return ((h % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + min;
}

/**
 * Single-day events: an hour after the start time. Multi-day events: the end
 * of the last day. Without a readable time, the end of the day.
 */
export function bannerEndsAt(e: BannerTiming): Date {
  const multiDay = !!e.endDate && dayKey(e.endDate) !== dayKey(e.date);
  const day = new Date(`${dayKey(multiDay ? e.endDate! : e.date)}T00:00:00Z`).getTime();
  // Midnight WAT is 23:00 UTC the day before.
  const midnightWAT = day - HOUR;
  const start = multiDay ? null : minutesOf(e.time);
  if (start === null) return new Date(midnightWAT + 24 * HOUR);
  return new Date(midnightWAT + start * 60 * 1000 + HOUR);
}

export function bannerShowing(e: BannerTiming, now = new Date()): boolean {
  return now < bannerEndsAt(e);
}

/** Today's date in WAT as stored (UTC midnight), for narrowing database queries. */
export function startOfTodayWAT(now = new Date()): Date {
  return new Date(`${new Date(now.getTime() + HOUR).toISOString().slice(0, 10)}T00:00:00Z`);
}
