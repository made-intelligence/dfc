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

/**
 * The slot starting at `time` on that day if the doctor's schedule offers it
 * and it still has room; null otherwise.
 */
export async function findOpenSlot(
  doctorUserId: string,
  dateIso: string,
  time: string
): Promise<Slot | null> {
  const profile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
    select: { schedules: true },
  });
  if (!profile) return null;
  const blocks = blocksForDate(profile.schedules, ymdOfWizardDate(dateIso));
  const booked = await getBookedSlots(doctorUserId, dateIso);
  return generateDaySlots(blocks, booked).find((s) => s.startTime === time) ?? null;
}
