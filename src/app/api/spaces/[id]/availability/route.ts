import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date parameter is required" },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const [space, availability, existingBookings] = await Promise.all([
      prisma.clinicalSpace.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          type: true,
          hourlyRate: true,
          halfDayRate: true,
          fullDayRate: true,
          currency: true,
        },
      }),
      prisma.spaceAvailability.findMany({
        where: {
          spaceId: id,
          OR: [
            { dayOfWeek, isBlocked: false },
            { specificDate: targetDate, isBlocked: false },
          ],
        },
      }),
      prisma.spaceBooking.findMany({
        where: {
          spaceId: id,
          bookingDate: targetDate,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Check for blocks on this date
    const blocks = await prisma.spaceAvailability.findMany({
      where: {
        spaceId: id,
        isBlocked: true,
        OR: [{ dayOfWeek }, { specificDate: targetDate }],
      },
    });

    return NextResponse.json({
      space,
      date,
      dayOfWeek,
      availableWindows: availability.map((a) => ({
        startTime: a.startTime,
        endTime: a.endTime,
      })),
      bookedSlots: existingBookings,
      blockedSlots: blocks.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.blockedReason,
      })),
    });
  } catch (error) {
    logger.error("SpaceAvailability", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
