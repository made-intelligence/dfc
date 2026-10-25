import { watInstant, ymdOfStoredDate } from "@/lib/wat";

/**
 * Absolute start and end instants of an appointment.
 *
 * Appointment times are WAT wall-clock times on the appointment's calendar day
 * (see src/lib/wat.ts). Calling `setHours` on the stored date instead
 * reinterprets it in whatever zone the code runs in: on a UTC server, or in a
 * doctor's UK browser, that lands on the wrong day.
 *
 * Safe on both server and client.
 */
export function appointmentInstant(appointmentDate: string | Date, hhmm: string): Date {
  return watInstant(ymdOfStoredDate(appointmentDate), hhmm);
}

export function appointmentWindow(
  appointmentDate: string | Date,
  startTime: string,
  endTime: string
): { start: Date; end: Date } {
  return {
    start: appointmentInstant(appointmentDate, startTime),
    end: appointmentInstant(appointmentDate, endTime),
  };
}

/** Patients and doctors may enter the call this long before the start. */
export const JOIN_EARLY_MINUTES = 10;

/** True while the appointment's call can be joined. */
export function isJoinable(
  appointmentDate: string | Date,
  startTime: string,
  endTime: string,
  now: Date = new Date()
): boolean {
  const { start, end } = appointmentWindow(appointmentDate, startTime, endTime);
  return now.getTime() >= start.getTime() - JOIN_EARLY_MINUTES * 60_000 && now < end;
}
