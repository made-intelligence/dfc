import "server-only";
import { prisma } from "@/lib/prisma";
import { toMinutes, weekdayOfYmd } from "@/lib/schedule-slots";

// Schedule block writes shared by the doctor's own schedule API and the admin
// one, so both apply the same rules.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toDbDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

type BlockInput = {
  id?: string;
  dayOfWeek?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  slotDuration?: unknown;
  bufferTime?: unknown;
  scheduleType?: unknown;
  isRecurring?: unknown;
  validFrom?: unknown;
  validUntil?: unknown;
  maxBookingsPerSlot?: unknown;
};

/**
 * Checks a block from the schedule page and returns the fields to store, or
 * an error message. One-off blocks (isRecurring false) cover validFrom to
 * validUntil and take their weekday from validFrom.
 */
export async function normalizeBlock(
  doctorProfileId: string,
  block: BlockInput,
): Promise<
  | { error: string }
  | { data: { dayOfWeek: number; startTime: string; endTime: string; slotDuration: number; bufferTime: number; scheduleType: "AVAILABLE" | "BLOCKED" | "HOLIDAY" | "EMERGENCY"; isRecurring: boolean; validFrom: Date | null; validUntil: Date | null; maxBookingsPerSlot: number } }
> {
  const { id, startTime, endTime } = block;
  const isRecurring = block.isRecurring !== false;
  const scheduleType = (["AVAILABLE", "BLOCKED", "HOLIDAY", "EMERGENCY"] as const).find((t) => t === block.scheduleType) ?? "AVAILABLE";

  if (typeof startTime !== "string" || typeof endTime !== "string" || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return { error: "Start and end times must be valid times." };
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return { error: "End time must be after the start time." };
  }

  let dayOfWeek = block.dayOfWeek;
  let validFrom: Date | null = null;
  let validUntil: Date | null = null;
  if (isRecurring) {
    if (typeof dayOfWeek !== "number" || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return { error: "Pick a valid day." };
    }
  } else {
    const from = block.validFrom;
    const until = block.validUntil || block.validFrom;
    if (typeof from !== "string" || !DATE_RE.test(from) || typeof until !== "string" || !DATE_RE.test(until)) {
      return { error: "Pick the date (or dates) this applies to." };
    }
    if (until < from) {
      return { error: "The end date must be on or after the start date." };
    }
    dayOfWeek = weekdayOfYmd(from);
    validFrom = toDbDate(from);
    validUntil = toDbDate(until);
  }

  const slotDuration = Number(block.slotDuration) || 30;
  const bufferTime = Number(block.bufferTime) || 0;
  const maxBookingsPerSlot = Math.trunc(Number(block.maxBookingsPerSlot) || 1);
  if (maxBookingsPerSlot < 1 || maxBookingsPerSlot > 20) {
    return { error: "Patients per slot must be between 1 and 20." };
  }
  if (scheduleType === "AVAILABLE" && toMinutes(endTime) - toMinutes(startTime) < slotDuration) {
    return { error: `The block is shorter than one ${slotDuration}-minute slot.` };
  }

  // Weekly available blocks on the same day must not overlap. One-off blocks
  // are deliberate exceptions (an extra clinic, a day off) and may.
  if (scheduleType === "AVAILABLE" && isRecurring) {
    const clash = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: doctorProfileId,
        dayOfWeek: dayOfWeek as number,
        scheduleType: "AVAILABLE",
        isRecurring: true,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(id ? { id: { not: id } } : {}),
      },
    });
    if (clash) {
      return { error: `This overlaps the existing available block ${clash.startTime}–${clash.endTime} on the same day.` };
    }
  }

  return {
    data: {
      dayOfWeek: dayOfWeek as number,
      startTime,
      endTime,
      slotDuration,
      bufferTime,
      scheduleType,
      isRecurring,
      validFrom,
      validUntil,
      maxBookingsPerSlot,
    },
  };
}

/**
 * The full set of fields to store for a schedule block request body (POST or
 * PUT), or an error message.
 */
export async function scheduleBlockData(doctorProfileId: string, body: Record<string, unknown>) {
  const { id, title, notes, color, consultationMode, location, ...block } = body;
  const checked = await normalizeBlock(doctorProfileId, {
    ...block,
    id: typeof id === "string" ? id : undefined,
  });
  if ("error" in checked) return checked;
  const mode = (["VIDEO", "IN_PERSON", "BOTH"] as const).find((m) => m === consultationMode) ?? "VIDEO";
  return {
    data: {
      title: typeof title === "string" ? title : null,
      ...checked.data,
      notes: typeof notes === "string" ? notes : null,
      color: (typeof color === "string" && color) || "#3B82F6",
      consultationMode: mode,
      location: (typeof location === "string" && location) || null,
    },
  };
}
