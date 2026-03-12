import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, category, page, rating, message, screenshot } = body;

    if (!name || !email || !category || !message) {
      return NextResponse.json(
        { error: "Name, email, category, and message are required" },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Optionally link to authenticated user
    let userId: string | null = null;
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (token) {
      const payload = await verifyToken(token);
      if (payload) userId = payload.userId;
    }

    const feedback = await prisma.betaFeedback.create({
      data: {
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || null,
        category,
        page: page || null,
        rating: rating || null,
        message: message.trim(),
        screenshot: screenshot || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    logger.error("BetaFeedback", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
