import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';
import BookingConfirmation from '@/emails/BookingConfirmation';
import React from 'react';

export async function POST(request: Request) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient address required' }, { status: 400 });
    }

    const emailResult = await sendEmail({
      to,
      subject: 'Test Booking Confirmation',
      templateName: 'BookingConfirmation',
      component: React.createElement(BookingConfirmation, {
        patientName: 'John Doe',
        doctorName: 'Sarah Smith',
        date: 'October 24, 2025',
        time: '10:00 AM',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
      }),
    });

    if (emailResult.success) {
      return NextResponse.json({ message: 'Email sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send email', details: emailResult.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
