import 'server-only';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { appUrl } from '@/lib/app-url';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import { formatApptDate, formatWatRange } from '@/lib/wat';
import AppointmentEmail, { type AppointmentEmailKind } from '@/emails/AppointmentEmail';

/**
 * Booking confirmation and reminder emails for appointments, to both the
 * patient and the doctor.
 */

const SUBJECTS: Record<AppointmentEmailKind, (other: string, when: string) => string> = {
  CONFIRMED: (other) => `Appointment confirmed with ${other}`,
  REMINDER_DAY: (other, when) => `Reminder: your consultation with ${other}, ${when}`,
  REMINDER_HOUR: (other) => `Starting soon: your consultation with ${other}`,
};

/** Send one kind of appointment email to the patient and the doctor. Never throws. */
export async function sendAppointmentEmails(appointmentId: string, kind: AppointmentEmailKind): Promise<void> {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { name: true, email: true } },
        doctor: { select: { name: true, email: true } },
      },
    });
    if (!appt) return;

    const base = appUrl();
    const joinUrl =
      appt.consultationMode !== 'IN_PERSON' && appt.meetingLink ? `${base}${appt.meetingLink}` : undefined;
    const common = {
      kind,
      dateLabel: formatApptDate(appt.appointmentDate, 'long'),
      timeLabel: `${formatWatRange(appt.startTime, appt.endTime)} (West Africa Time, GMT+1)`,
      reason: appt.reason,
      joinUrl,
      clinicLocation: appt.clinicLocation,
    };

    const when = `${formatApptDate(appt.appointmentDate)} ${formatWatRange(appt.startTime)}`;
    const sends: Promise<unknown>[] = [];
    if (appt.patient.email) {
      sends.push(
        sendEmail({
          to: appt.patient.email,
          subject: SUBJECTS[kind](`Dr. ${appt.doctor.name}`, when),
          templateName: `appointment-${kind.toLowerCase()}`,
          component: React.createElement(AppointmentEmail, {
            ...common,
            recipientName: appt.patient.name,
            recipientRole: 'patient',
            otherPartyName: appt.doctor.name,
            manageUrl: `${base}/appointments`,
          }),
          metadata: { appointmentId: appt.id, recipient: 'patient' },
        })
      );
    }
    if (appt.doctor.email) {
      sends.push(
        sendEmail({
          to: appt.doctor.email,
          subject: SUBJECTS[kind](appt.patient.name, when),
          templateName: `appointment-${kind.toLowerCase()}`,
          component: React.createElement(AppointmentEmail, {
            ...common,
            recipientName: `Dr. ${appt.doctor.name}`,
            recipientRole: 'doctor',
            otherPartyName: appt.patient.name,
            manageUrl: `${base}/doctor/appointments`,
          }),
          metadata: { appointmentId: appt.id, recipient: 'doctor' },
        })
      );
    }
    await Promise.allSettled(sends);
  } catch (error) {
    logger.error('AppointmentEmail', error);
  }
}
