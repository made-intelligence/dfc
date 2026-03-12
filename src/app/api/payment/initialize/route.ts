import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, amount, callbackUrl, metadata } = body;

    if (!email || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid email and amount are required" },
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

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects amount in kobo
        callback_url: callbackUrl,
        metadata: {
          ...metadata,
          initiatedBy: payload.userId, // Track who initiated the payment
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('PaymentInitialize', 'Paystack init error', data);
      return NextResponse.json(
        { error: data.message || "Failed to initialize payment" },
        { status: response.status }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    logger.error('PaymentInitialize', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
