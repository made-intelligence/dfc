import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { findOpenSlot } from '@/lib/booking-availability';
import { sendAppointmentEmails } from '@/lib/appointment-email';
import { formatApptDate, formatWatRange } from '@/lib/wat';
import { audit, auditAccount, auditAppointment, auditPayment } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Try to authenticate — but allow guest verifications
    const token = getTokenFromCookies(request.headers.get("cookie"));
    let authenticatedUserId: string | null = null;
    let authenticatedRole: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        authenticatedUserId = payload.userId;
        authenticatedRole = payload.role;
      }
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
    // isGuest only appears on payments started before booking required an
    // account; initialize no longer creates them, so this path just lets
    // those last in-flight payments complete.
    const { doctorId, patientId, date, time, reason, isGuest, guestName, guestEmail, guestPhone, consultationMode, clinicLocation } = metadata;

    // Price-integrity check: the amount actually paid must match the doctor's
    // configured consultation fee (in kobo). This blocks amount-tampering where
    // a client initializes a near-zero charge for a full-price consultation.
    if (doctorId) {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: doctorId },
        select: { consultationFee: true },
      });
      const expectedKobo = doctorProfile ? Math.round(Number(doctorProfile.consultationFee) * 100) : 0;
      if (expectedKobo > 0 && (amount !== expectedKobo || (currency && currency !== "NGN"))) {
        logger.error("PaymentVerify", "Amount/currency mismatch", { reference, amount, expectedKobo, currency });
        await audit({
          userId: authenticatedUserId,
          action: "PAYMENT_VERIFY",
          resource: "payment",
          resourceId: reference,
          details: { outcome: "amount_mismatch", amount, expectedKobo, currency, doctorId },
          severity: "CRITICAL",
        }, request);
        return NextResponse.json(
          { error: "Payment amount does not match the consultation fee." },
          { status: 400 }
        );
      }
    }

    // IDOR protection for authenticated users
    if (authenticatedUserId && patientId && patientId !== authenticatedUserId) {
      logger.error('PaymentVerify', 'User mismatch', {
        authenticatedUser: authenticatedUserId,
        paymentPatientId: patientId,
      });
      await audit({
        userId: authenticatedUserId,
        action: "PAYMENT_VERIFY",
        resource: "payment",
        resourceId: reference,
        details: { outcome: "payer_mismatch", paymentPatientId: patientId },
        severity: "CRITICAL",
      }, request);
      return NextResponse.json(
        { error: "Payment does not belong to authenticated user" },
        { status: 403 }
      );
    }

    // For non-guest, non-admin requests — require auth
    if (!isGuest && !authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block non-admin users from verifying payments without patient context (non-guest)
    if (!isGuest && !patientId && !['SUPERADMIN', 'SECRETARIAT'].includes(authenticatedRole || '')) {
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
          select: { id: true, meetingLink: true, patientId: true }
        });

        // Check if the booking patient is a guest (no password, provider=guest)
        let isGuestAccount = false;
        let guestAccountEmail: string | undefined;
        if (existingAppointment?.patientId) {
          const bookingUser = await prisma.user.findUnique({
            where: { id: existingAppointment.patientId },
            select: { provider: true, password: true, email: true },
          });
          if (bookingUser && bookingUser.provider === "guest" && !bookingUser.password) {
            isGuestAccount = true;
            guestAccountEmail = bookingUser.email;
          }
        }

        return NextResponse.json({
          success: true,
          appointmentId: existingAppointment?.id,
          meetingLink: existingAppointment?.meetingLink,
          message: "Payment already processed",
          isGuest: isGuestAccount,
          guestEmail: guestAccountEmail,
        });
      }
      return NextResponse.json({
        success: true,
        message: "Payment already processed"
      });
    }

    // Re-check the slot: someone may have paid for it since this payment
    // started. The money is already captured, so log it for a refund.
    const slot = await findOpenSlot(doctorId, date, time);
    if (!slot) {
      logger.error('PaymentVerify', 'Slot taken after payment; refund needed', { reference, doctorId, date, time });
      await audit({
        userId: authenticatedUserId,
        action: "PAYMENT_VERIFY",
        resource: "payment",
        resourceId: reference,
        details: { outcome: "slot_taken_refund_needed", amount: amount / 100, currency, doctorId, date, time },
        severity: "CRITICAL",
      }, request);
      return NextResponse.json(
        {
          error: `Sorry, that time was booked by someone else while you were paying. Please contact support with payment reference ${reference} for a refund or to rebook.`,
          code: "SLOT_TAKEN",
        },
        { status: 409 }
      );
    }

    // Resolve patient: either existing user or create guest account
    let resolvedPatientId: string;
    let resolvedPatientProfileId: string;
    let isNewGuestAccount = false;

    if (isGuest) {
      // Check if a user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: guestEmail.toLowerCase() },
        include: { patientProfile: true },
      });

      if (existingUser) {
        resolvedPatientId = existingUser.id;
        if (existingUser.patientProfile) {
          resolvedPatientProfileId = existingUser.patientProfile.id;
        } else {
          // User exists but no patient profile — create one
          const newProfile = await prisma.patientProfile.create({
            data: { userId: existingUser.id },
          });
          resolvedPatientProfileId = newProfile.id;
        }
      } else {
        // Create guest account (no password — they'll claim it later)
        const guestUser = await prisma.user.create({
          data: {
            email: guestEmail.toLowerCase(),
            name: guestName,
            phone: guestPhone || null,
            role: UserRole.PATIENT,
            password: null, // No password — guest account
            provider: "guest",
            patientProfile: {
              create: {},
            },
          },
          include: { patientProfile: true },
        });

        resolvedPatientId = guestUser.id;
        resolvedPatientProfileId = guestUser.patientProfile!.id;
        isNewGuestAccount = true;
      }
    } else {
      resolvedPatientId = patientId;
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: patientId }
      });

      if (!patientProfile) {
        return NextResponse.json(
          { error: "Patient profile not found" },
          { status: 404 }
        );
      }
      resolvedPatientProfileId = patientProfile.id;
    }

    // Create Appointment
    const appointmentDate = new Date(date);
    const endTime = slot.endTime;

    // Generate meeting link
    const meetingId = uuidv4();
    const meetingLink = `/room/${meetingId}`;

    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: resolvedPatientId,
        appointmentDate,
        startTime: time,
        endTime: endTime,
        status: "CONFIRMED",
        reason: reason || "Consultation",
        consultationFee: amount / 100,
        meetingLink: meetingLink,
        consultationMode: consultationMode || "VIDEO",
        clinicLocation: clinicLocation || null,
        payments: {
          create: {
            amount: amount / 100,
            currency: currency,
            paymentReference: reference,
            patientId: resolvedPatientProfileId,
          }
        }
      },
      include: {
        doctor: { select: { name: true, email: true } },
        patient: { select: { name: true, email: true } }
      }
    });

    // Confirmation emails to the patient and the doctor
    const emailPromise = sendAppointmentEmails(appointment.id, "CONFIRMED");

    // Create In-App Notifications
    const notificationsPromise = prisma.notification.createMany({
      data: [
        {
          userId: appointment.doctorId,
          title: "New Appointment",
          message: `You have a new appointment with ${appointment.patient.name} on ${formatApptDate(appointment.appointmentDate)} at ${formatWatRange(time)}`,
          type: "info",
          link: `/doctor/appointments`,
        },
         {
          userId: appointment.patientId,
          title: "Appointment Confirmed",
          message: `Your appointment with Dr. ${appointment.doctor.name} on ${formatApptDate(appointment.appointmentDate)} at ${formatWatRange(time)} has been confirmed.`,
          type: "success",
          link: `/appointments`,
        }
      ]
    });

    const auditPromises = [
      auditPayment.verify(resolvedPatientId, reference, {
        outcome: "paid",
        amount: amount / 100,
        currency,
        appointmentId: appointment.id,
      }, request),
      auditAppointment.book(resolvedPatientId, appointment.id, {
        via: isGuest ? "guest_checkout" : "patient",
        doctorId,
        date,
        time,
        paymentReference: reference,
      }, request),
    ];
    if (isNewGuestAccount) {
      auditPromises.push(auditAccount.create(resolvedPatientId, { via: "guest_checkout" }, request));
    }

    await Promise.allSettled([emailPromise, notificationsPromise, ...auditPromises]);

    return NextResponse.json({
        success: true,
        appointmentId: appointment.id,
        meetingLink,
        isGuest: isNewGuestAccount,
        guestEmail: isNewGuestAccount ? guestEmail : undefined,
    });

  } catch (error: unknown) {
    logger.error('PaymentVerify', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
