import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tickets = await prisma.secretariatTicket.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        requestType: true,
        rawMessage: true,
        subject: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        notes: true,
      },
    });

    return NextResponse.json({
      success: true,
      tickets: tickets.map((t) => ({
        id: t.id,
        requestType: t.requestType || t.subject || "General enquiry",
        description: t.rawMessage,
        status: t.status,
        createdAt: t.createdAt,
        resolvedAt: t.resolvedAt,
        resolution: t.notes,
      })),
    });
  } catch (error) {
    logger.error('MemberSecretariat', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
