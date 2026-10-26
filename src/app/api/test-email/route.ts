import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';
import AppointmentEmail from '@/emails/AppointmentEmail';
import React from 'react';
import { requireAdminAuth, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withAudit } from "@/lib/audit-route";

async function handlePOST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (isAuthError(authResult)) return authResult;

    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient address required' }, { status: 400 });
    }

    const emailResult = await sendEmail({
      to,
      subject: 'Test Booking Confirmation',
      templateName: 'appointment-test',
      component: React.createElement(AppointmentEmail, {
        kind: 'CONFIRMED',
        recipientName: 'Test Patient',
        recipientRole: 'patient',
        otherPartyName: 'Test Doctor',
        dateLabel: 'Friday, 24 October 2026',
        timeLabel: '10:00 – 10:30',
        reason: 'Test consultation',
        joinUrl: 'https://www.dfcare.org/room/test',
        manageUrl: 'https://www.dfcare.org/appointments',
      }),
    });

    if (emailResult.success) {
      return NextResponse.json({ message: 'Email sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send email', details: emailResult.error }, { status: 500 });
    }
  } catch (error: unknown) {
    logger.error('TestEmail', error);
    return NextResponse.json({ error: 'Email sending failed' }, { status: 500 });
  }
}

export const POST = withAudit("test_email", handlePOST);
