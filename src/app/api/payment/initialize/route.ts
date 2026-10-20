import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { paymentRateLimit } from "@/lib/rate-limit";
import { auditPayment } from "@/lib/audit";
import { findOpenSlot } from "@/lib/booking-availability";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await paymentRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Booking requires an account: guests sign in or register first.
    const token = getTokenFromCookies(request.headers.get("cookie"));
    const session = token ? await verifyToken(token) : null;
    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to book", code: "SIGN_IN_REQUIRED" },
        { status: 401 }
      );
    }
    const authenticatedUserId = session.userId;

    const body = await request.json();
    const { amount, callbackUrl, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "A valid amount is required" },
        { status: 400 }
      );
    }

    // The booking belongs to the session user; ignore any guest fields.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isGuest: _g, guestName: _n, guestEmail: _e, guestPhone: _p, ...rest } = metadata || {};
    const bookingMetadata: Record<string, unknown> = rest.doctorId
      ? { ...rest, patientId: authenticatedUserId }
      : rest;

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    // Authoritative pricing: for appointment bookings the fee is taken from the
    // doctor's profile server-side. Never trust the client-supplied amount.
    // (If a doctor has no fee configured we fall back to the requested amount,
    // and verify-time enforcement below only applies when a fee is set.)
    let chargeAmount = amount;
    if (metadata?.doctorId) {
      // Refuse before taking money if the slot is taken or not on the schedule.
      if (!metadata.date || !metadata.time ||
          !(await findOpenSlot(metadata.doctorId, metadata.date, metadata.time))) {
        return NextResponse.json(
          { error: "That time is no longer available. Please pick another slot.", code: "SLOT_UNAVAILABLE" },
          { status: 409 }
        );
      }
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: metadata.doctorId },
        select: { consultationFee: true },
      });
      const fee = doctorProfile ? Number(doctorProfile.consultationFee) : 0;
      if (fee > 0) chargeAmount = fee;
    }

    // Build Paystack payload — include split if subaccount provided
    const paystackPayload: Record<string, unknown> = {
      email: session.email,
      amount: chargeAmount * 100, // Paystack expects amount in kobo
      callback_url: callbackUrl,
      metadata: {
        ...bookingMetadata,
        initiatedBy: authenticatedUserId,
      },
    };

    // Split payment: route funds to member/hospital/pharmacy sub-account
    // DFC keeps the platform fee; subaccount receives the rest
    if (metadata?.subaccountCode) {
      paystackPayload.subaccount = metadata.subaccountCode;
      paystackPayload.bearer = "account"; // DFC pays Paystack transaction fees
      if (metadata?.platformFeeKobo) {
        paystackPayload.transaction_charge = metadata.platformFeeKobo;
      }
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('PaymentInitialize', 'Paystack init error', data);
      return NextResponse.json(
        { error: data.message || "Failed to initialize payment" },
        { status: response.status }
      );
    }

    auditPayment.initialize(authenticatedUserId, data.data?.reference || "unknown", {
      email: session.email,
      amount,
      reference: data.data?.reference,
    }, request);

    return NextResponse.json(data.data);
  } catch (error) {
    logger.error('PaymentInitialize', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
