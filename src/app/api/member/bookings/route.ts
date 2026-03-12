import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "DFC_MEMBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const period = searchParams.get("period") || "all"; // upcoming | past | all

    const now = new Date();
    const where: Record<string, unknown> = {
      memberId: payload.userId,
    };

    if (status) where.status = status;
    if (period === "upcoming") where.bookingDate = { gte: now };
    if (period === "past") where.bookingDate = { lt: now };

    const bookings = await prisma.spaceBooking.findMany({
      where,
      include: {
        space: {
          include: {
            hospital: {
              select: { name: true, city: true, logoUrl: true },
            },
          },
        },
      },
      orderBy: { bookingDate: period === "past" ? "desc" : "asc" },
    });

    // Calculate total spent this year
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const totalSpent = await prisma.spaceBooking.aggregate({
      where: {
        memberId: payload.userId,
        paymentStatus: "PAID",
        bookingDate: { gte: yearStart },
      },
      _sum: { memberRate: true },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        space: b.space.name,
        spaceType: b.space.type,
        hospital: b.space.hospital.name,
        city: b.space.hospital.city,
        hospitalLogo: b.space.hospital.logoUrl,
        bookingDate: b.bookingDate,
        startTime: b.startTime,
        endTime: b.endTime,
        durationType: b.durationType,
        memberRate: b.memberRate,
        currency: b.currency,
        status: b.status,
        paymentStatus: b.paymentStatus,
        purpose: b.purpose,
        canCancel:
          b.status === "CONFIRMED" &&
          b.bookingDate > new Date(now.getTime() + 48 * 60 * 60 * 1000),
      })),
      totalSpentThisYear: Number(totalSpent._sum.memberRate || 0),
    });
  } catch (error) {
    logger.error("MemberBookings", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
