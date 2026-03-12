import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { v4 as uuidv4 } from 'uuid';
import React from 'react';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Require authentication — user must be logged in to verify payment
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      logger.error('PaymentVerify', 'Paystack secret key not configured');
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      );
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || verifyData.status !== true || verifyData.data?.status !== "success") {
      logger.error('PaymentVerify', 'Payment verification failed', {
        httpOk: verifyResponse.ok,
        httpStatus: verifyResponse.status,
        paystackStatus: verifyData.status,
        dataStatus: verifyData.data?.status,
        message: verifyData.message
      });
      return NextResponse.json(
        { error: verifyData.message || "Payment verification failed" },
        { status: 400 }
      );
    }

    const { metadata, amount, currency } = verifyData.data;
    const { doctorId, patientId, date, time, reason } = metadata;

    // IDOR protection: verify the authenticated user is the patient
    if (patientId && patientId !== payload.userId) {
      logger.error('PaymentVerify', 'User mismatch', {
        authenticatedUser: payload.userId,
        paymentPatientId: patientId,
      });
      return NextResponse.json(
        { error: "Payment does not belong to authenticated user" },
        { status: 403 }
      );
    }

    // Block non-admin users from verifying payments without patient context
    if (!patientId && !['SUPERADMIN', 'SECRETARIAT'].includes(payload.role)) {
      return NextResponse.json(
        { error: "Payment missing patient context" },
        { status: 403 }
      );
    }

    // Check if payment already processed
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentReference: reference }
    });

    if (existingPayment) {
      if (existingPayment.appointmentId) {
        const existingAppointment = await prisma.appointment.findUnique({
          where: { id: existingPayment.appointmentId },
          select: { id: true, meetingLink: true }
        });
        return NextResponse.json({
          success: true,
          appointmentId: existingAppointment?.id,
          meetingLink: existingAppointment?.meetingLink,
          message: "Payment already processed"
        });
      }
      return NextResponse.json({
        success: true,
        message: "Payment already processed"
      });
    }

    // Get patient profile ID
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: patientId }
    });

    if (!patientProfile) {
      return NextResponse.json(
        { error: "Patient profile not found" },
        { status: 404 }
      );
    }

    // Create Appointment
    const appointmentDate = new Date(date);
    const [hours, mins] = time.split(':').map(Number);
    const endTimeDate = new Date(appointmentDate);
    endTimeDate.setHours(hours, mins + 30);
    const endTime = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')}`;

    // Generate meeting link
    const meetingId = uuidv4();
    const meetingLink = `/room/${meetingId}`;

    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        appointmentDate,
        startTime: time,
        endTime: endTime,
        status: "CONFIRMED", 
        reason: reason || "Consultation",
        consultationFee: amount / 100,
        meetingLink: meetingLink,
        payments: {
          create: {
            amount: amount / 100,
            currency: currency,
            paymentReference: reference,
            patientId: patientProfile.id,
          }
        }
      },
      include: {
        doctor: { select: { name: true, email: true } },
        patient: { select: { name: true, email: true } }
      }
    });

    // Send confirmation email asynchronously (don't block response)
    const { sendEmail } = await import('@/lib/email/service');
    const BookingConfirmation = (await import('@/emails/BookingConfirmation')).default;
    
    const emailPromise = sendEmail({
      to: appointment.patient.email,
      subject: 'Booking Confirmation - DFC Medical',
      templateName: 'BookingConfirmation',
      component: React.createElement(BookingConfirmation, {
        patientName: appointment.patient.name,
        doctorName: appointment.doctor.name,
        date: date,
        time: time,
        meetingLink: meetingLink
      }),
      metadata: { appointmentId: appointment.id }
    });
    
    const doctorEmailPromise = sendEmail({
      to: appointment.doctor.email,
      subject: 'New Appointment Booked - DFC Medical',
      templateName: 'BookingConfirmation',
      component: React.createElement(BookingConfirmation, {
         patientName: appointment.doctor.name,
         doctorName: "Patient: " + appointment.patient.name,
         date: date,
         time: time,
         meetingLink: meetingLink
      }),
      metadata: { appointmentId: appointment.id, type: 'doctor_notification' }
    });

    // Create In-App Notifications
    const notificationsPromise = prisma.notification.createMany({
      data: [
        {
          userId: appointment.doctorId,
          title: "New Appointment",
          message: `You have a new appointment with ${appointment.patient.name} on ${date} at ${time}`,
          type: "info",
          link: `/doctor/appointments`,
        },
         {
          userId: appointment.patientId,
          title: "Appointment Confirmed",
          message: `Your appointment with Dr. ${appointment.doctor.name} on ${date} at ${time} has been confirmed.`,
          type: "success",
          link: `/appointments`,
        }
      ]
    });

    await Promise.allSettled([emailPromise, doctorEmailPromise, notificationsPromise]);

    return NextResponse.json({ 
        success: true, 
        appointmentId: appointment.id,
        meetingLink 
    });

  } catch (error: unknown) {
    logger.error('PaymentVerify', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
