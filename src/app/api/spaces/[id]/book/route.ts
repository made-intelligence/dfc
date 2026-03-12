import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { validateCredentialPassport } from "@/lib/credentials/passport";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "DFC_MEMBER") {
      return NextResponse.json(
        { error: "Only DFC members can book clinical spaces" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, startTime, endTime, durationType, purpose, specialEquipment } = body;

    if (!date || !startTime || !endTime || !durationType) {
      return NextResponse.json(
        { error: "date, startTime, endTime, and durationType are required" },
        { status: 400 }
      );
    }

    // Validate duration type
    if (!["HOURLY", "HALF_DAY", "FULL_DAY"].includes(durationType)) {
      return NextResponse.json(
        { error: "durationType must be HOURLY, HALF_DAY, or FULL_DAY" },
        { status: 400 }
      );
    }

    // 1. Validate credential passport
    const passport = await validateCredentialPassport(payload.userId);
    if (!passport.valid) {
      return NextResponse.json(
        {
          error: "Credential passport validation failed",
          issues: passport.issues,
        },
        { status: 422 }
      );
    }

    // 2. Get space and pricing
    const space = await prisma.clinicalSpace.findUnique({
      where: { id: spaceId },
    });

    if (!space || !space.isActive) {
      return NextResponse.json(
        { error: "Space not found or inactive" },
        { status: 404 }
      );
    }

    // 3. Check for booking conflicts
    const bookingDate = new Date(date);
    const conflict = await prisma.spaceBooking.findFirst({
      where: {
        spaceId,
        bookingDate,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Time slot conflict — this period is already booked" },
        { status: 409 }
      );
    }

    // 4. Calculate pricing
    let memberRate: number;
    let partnerRate: number;

    switch (durationType) {
      case "FULL_DAY":
        memberRate = Number(space.fullDayRate || 0);
        partnerRate = Number(space.partnerFullDayRate || 0);
        break;
      case "HALF_DAY":
        memberRate = Number(space.halfDayRate || 0);
        partnerRate = Number(space.partnerHalfDayRate || 0);
        break;
      default: {
        // Calculate hourly
        const start = startTime.split(":").map(Number);
        const end = endTime.split(":").map(Number);
        const hours = (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60;
        memberRate = Number(space.hourlyRate || 0) * hours;
        partnerRate = Number(space.partnerHourlyRate || 0) * hours;
      }
    }

    const dfcMargin = memberRate - partnerRate;

    // Calculate duration hours
    const startParts = startTime.split(":").map(Number);
    const endParts = endTime.split(":").map(Number);
    const durationHours =
      (endParts[0] * 60 + endParts[1] - (startParts[0] * 60 + startParts[1])) / 60;

    // 5. Create booking
    const booking = await prisma.spaceBooking.create({
      data: {
        spaceId,
        memberId: payload.userId,
        bookingDate,
        startTime,
        endTime,
        durationType,
        durationHours,
        memberRate,
        partnerRate,
        dfcMargin,
        currency: space.currency,
        status: "PENDING",
        credentialSnapshot: passport.snapshot as object,
        indemnityValid: passport.snapshot.indemnityInsurance !== null,
        paymentStatus: "UNPAID",
        purpose: purpose || null,
        specialEquipment: specialEquipment || null,
      },
      include: {
        space: {
          include: {
            hospital: {
              select: { name: true, city: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          space: booking.space.name,
          hospital: booking.space.hospital.name,
          city: booking.space.hospital.city,
          date: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          durationType: booking.durationType,
          memberRate: booking.memberRate,
          currency: booking.currency,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        },
        credentialPassport: {
          valid: passport.valid,
          issues: passport.issues,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("SpaceBooking", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
