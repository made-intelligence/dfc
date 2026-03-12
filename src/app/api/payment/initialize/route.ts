import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { paymentRateLimit } from "@/lib/rate-limit";
import { auditPayment } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await paymentRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Try to authenticate — but allow guest bookings
    const token = getTokenFromCookies(request.headers.get("cookie"));
    let authenticatedUserId: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        authenticatedUserId = payload.userId;
      }
    }

    const body = await request.json();
    const { email, amount, callbackUrl, metadata } = body;

    if (!email || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid email and amount are required" },
        { status: 400 }
      );
    }

    // For guest bookings, require guest info in metadata
    const isGuest = metadata?.isGuest === true;
    if (!authenticatedUserId && !isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isGuest && (!metadata?.guestName || !metadata?.guestEmail)) {
      return NextResponse.json(
        { error: "Guest name and email are required" },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    // Build Paystack payload — include split if subaccount provided
    const paystackPayload: Record<string, unknown> = {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      callback_url: callbackUrl,
      metadata: {
        ...metadata,
        initiatedBy: authenticatedUserId || "guest",
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

    auditPayment.initialize(authenticatedUserId || `guest:${email}`, data.data?.reference || "unknown", {
      email,
      amount,
      reference: data.data?.reference,
      isGuest,
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
