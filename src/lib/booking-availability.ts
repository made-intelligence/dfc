import { prisma } from "@/lib/prisma";
import {
  blocksForDate,
  dayWindow,
  generateDaySlots,
  SLOT_HOLDING_STATUSES,
  ymdOfWizardDate,
  type Slot,
} from "@/lib/schedule-slots";

export async function getBookedSlots(doctorUserId: string, dateIso: string): Promise<Slot[]> {
  return prisma.appointment.findMany({
    where: {
      doctorId: doctorUserId,
      appointmentDate: dayWindow(dateIso),
      status: { in: [...SLOT_HOLDING_STATUSES] },
    },
    select: { startTime: true, endTime: true },
  });
}

/** Every slot the doctor still has free on that day (WAT times). */
export async function getOpenSlots(doctorUserId: string, dateIso: string): Promise<Slot[]> {
  const profile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
    select: { schedules: true },
  });
  if (!profile) return [];
  const blocks = blocksForDate(profile.schedules, ymdOfWizardDate(dateIso));
  const booked = await getBookedSlots(doctorUserId, dateIso);
  return generateDaySlots(blocks, booked);
}

/**
 * The slot starting at `time` on that day if the doctor's schedule offers it
 * and it still has room; null otherwise.
 */
export async function findOpenSlot(
  doctorUserId: string,
  dateIso: string,
  time: string
): Promise<Slot | null> {
  const open = await getOpenSlots(doctorUserId, dateIso);
  return open.find((s) => s.startTime === time) ?? null;
}
