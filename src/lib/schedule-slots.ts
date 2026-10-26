// Slot generation shared by the booking wizard and the booking APIs, so the
// times a patient is offered are the times the server will accept.

export interface ScheduleBlock {
  dayOfWeek?: number;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  slotDuration: number;
  bufferTime?: number;
  scheduleType: string;
  maxBookingsPerSlot?: number;
  /** false = a one-off block that applies only to dates in validFrom..validUntil. */
  isRecurring?: boolean;
  validFrom?: string | Date | null; // YYYY-MM-DD (or a Date at UTC midnight)
  validUntil?: string | Date | null;
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && bStart < aEnd;

/** YYYY-MM-DD for a stored date (UTC midnight) or a date string. */
export const toYmd = (d: string | Date) =>
  typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);

/** YYYY-MM-DD of a local calendar day, for the browser. */
export const localYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Weekday (0 = Sunday) of a YYYY-MM-DD date. */
export const weekdayOfYmd = (ymd: string) => new Date(`${ymd}T00:00:00Z`).getUTCDay();

/**
 * The blocks that apply on one calendar day. Weekly blocks apply on their
 * weekday (within validFrom/validUntil when set); one-off blocks apply on
 * every date from validFrom to validUntil (or just validFrom).
 */
export function blocksForDate<T extends ScheduleBlock>(blocks: T[], ymd: string): T[] {
  const weekday = weekdayOfYmd(ymd);
  return blocks.filter((b) => {
    const from = b.validFrom ? toYmd(b.validFrom) : null;
    const until = b.validUntil ? toYmd(b.validUntil) : from;
    if (b.isRecurring === false) {
      return !!from && ymd >= from && ymd <= (until || from);
    }
    if (b.dayOfWeek !== weekday) return false;
    if (from && ymd < from) return false;
    if (b.validUntil && ymd > toYmd(b.validUntil)) return false;
    return true;
  });
}

/**
 * Bookable slots for one day's blocks: each AVAILABLE block is cut into slots
 * of slotDuration separated by bufferTime; a slot must end by the block's end,
 * must not touch any non-AVAILABLE block, and is full once the booked ranges
 * overlapping it reach the block's maxBookingsPerSlot.
 */
export function generateDaySlots(blocks: ScheduleBlock[], booked: Slot[] = []): Slot[] {
  const unavailable = blocks
    .filter((b) => b.scheduleType !== "AVAILABLE")
    .map((b) => [toMinutes(b.startTime), toMinutes(b.endTime)] as const);
  const bookedRanges = booked.map((b) => [toMinutes(b.startTime), toMinutes(b.endTime)] as const);

  const slots = new Map<string, Slot>();
  for (const block of blocks) {
    if (block.scheduleType !== "AVAILABLE") continue;
    const duration = block.slotDuration || 30;
    const step = duration + (block.bufferTime || 0);
    const capacity = Math.max(1, block.maxBookingsPerSlot || 1);
    const end = toMinutes(block.endTime);
    for (let s = toMinutes(block.startTime); s + duration <= end; s += step) {
      const e = s + duration;
      if (unavailable.some(([us, ue]) => overlaps(s, e, us, ue))) continue;
      if (bookedRanges.filter(([bs, be]) => overlaps(s, e, bs, be)).length >= capacity) continue;
      const startTime = fromMinutes(s);
      if (!slots.has(startTime)) slots.set(startTime, { startTime, endTime: fromMinutes(e) });
    }
  }
  return Array.from(slots.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * The booking wizard sends the chosen day as the ISO string of its WAT
 * midnight (see lib/wat), so one calendar day is the 24h window starting there.
 */
export function dayWindow(dateIso: string) {
  const start = new Date(dateIso);
  return { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/**
 * The calendar day (YYYY-MM-DD) for a wizard date (ISO of WAT midnight, or a
 * local midnight on older bookings). Shifting by 12h lands on that day for any
 * UTC offset within ±12h.
 */
export const ymdOfWizardDate = (dateIso: string) =>
  new Date(new Date(dateIso).getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Statuses that hold a slot. */
export const SLOT_HOLDING_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED"] as const;
