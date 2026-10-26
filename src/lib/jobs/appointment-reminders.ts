import 'server-only';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { appointmentInstant } from '@/lib/appointment-time';
import { sendAppointmentEmails } from '@/lib/appointment-email';

const HOUR = 60 * 60 * 1000;

/**
 * Email the patient and doctor before each confirmed appointment:
 *  - once it starts within 24 hours, unless it was booked inside that window,
 *    since the confirmation has only just gone out;
 *  - when it starts within the hour.
 *
 * Safe to run at any cadence: each reminder is claimed with a conditional
 * update before sending, so overlapping runs never send it twice. Scheduled
 * daily by /api/cron/daily (07:00 WAT), which sends the 24-hour reminder; run it
 * every 15 minutes if the starting-soon email should arrive reliably.
 */
export async function runAppointmentReminders(now: Date = new Date()) {
  // appointmentDate is a local midnight, so widen the window by a day each side
  // and decide on the exact start instant below.
  const candidates = await prisma.appointment.findMany({
    where: {
      status: 'CONFIRMED',
      appointmentDate: {
        gte: new Date(now.getTime() - 24 * HOUR),
        lte: new Date(now.getTime() + 48 * HOUR),
      },
      OR: [{ reminderDaySentAt: null }, { reminderHourSentAt: null }],
    },
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      createdAt: true,
      reminderDaySentAt: true,
      reminderHourSentAt: true,
    },
  });

  let day = 0;
  let hour = 0;

  for (const appt of candidates) {
    const start = appointmentInstant(appt.appointmentDate, appt.startTime);
    const untilStart = start.getTime() - now.getTime();
    if (untilStart <= 0) continue;

    if (!appt.reminderHourSentAt && untilStart <= HOUR) {
      const claimed = await prisma.appointment.updateMany({
        where: { id: appt.id, reminderHourSentAt: null },
        // Claiming the hour reminder also retires the day one: no point sending both now.
        data: { reminderHourSentAt: now, reminderDaySentAt: appt.reminderDaySentAt ?? now },
      });
      if (claimed.count === 1) {
        await sendAppointmentEmails(appt.id, 'REMINDER_HOUR');
        hour++;
      }
      continue;
    }

    const bookedInsideWindow = start.getTime() - appt.createdAt.getTime() <= 24 * HOUR;
    if (!appt.reminderDaySentAt && untilStart <= 24 * HOUR && !bookedInsideWindow) {
      const claimed = await prisma.appointment.updateMany({
        where: { id: appt.id, reminderDaySentAt: null },
        data: { reminderDaySentAt: now },
      });
      if (claimed.count === 1) {
        await sendAppointmentEmails(appt.id, 'REMINDER_DAY');
        day++;
      }
    }
  }

  logger.info('AppointmentReminders', `sent day=${day} hour=${hour} checked=${candidates.length}`);
  return { dayReminders: day, hourReminders: hour, checked: candidates.length };
}
