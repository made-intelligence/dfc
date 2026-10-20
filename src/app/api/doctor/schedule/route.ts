import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { toMinutes, weekdayOfYmd } from "@/lib/schedule-slots";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toDbDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

type BlockInput = {
  id?: string;
  dayOfWeek?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  slotDuration?: unknown;
  bufferTime?: unknown;
  scheduleType?: unknown;
  isRecurring?: unknown;
  validFrom?: unknown;
  validUntil?: unknown;
  maxBookingsPerSlot?: unknown;
};

/**
 * Checks a block from the schedule page and returns the fields to store, or
 * an error message. One-off blocks (isRecurring false) cover validFrom to
 * validUntil and take their weekday from validFrom.
 */
async function normalizeBlock(
  doctorProfileId: string,
  block: BlockInput,
): Promise<
  | { error: string }
  | { data: { dayOfWeek: number; startTime: string; endTime: string; slotDuration: number; bufferTime: number; scheduleType: "AVAILABLE" | "BLOCKED" | "HOLIDAY" | "EMERGENCY"; isRecurring: boolean; validFrom: Date | null; validUntil: Date | null; maxBookingsPerSlot: number } }
> {
  const { id, startTime, endTime } = block;
  const isRecurring = block.isRecurring !== false;
  const scheduleType = (["AVAILABLE", "BLOCKED", "HOLIDAY", "EMERGENCY"] as const).find((t) => t === block.scheduleType) ?? "AVAILABLE";

  if (typeof startTime !== "string" || typeof endTime !== "string" || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return { error: "Start and end times must be valid times." };
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return { error: "End time must be after the start time." };
  }

  let dayOfWeek = block.dayOfWeek;
  let validFrom: Date | null = null;
  let validUntil: Date | null = null;
  if (isRecurring) {
    if (typeof dayOfWeek !== "number" || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return { error: "Pick a valid day." };
    }
  } else {
    const from = block.validFrom;
    const until = block.validUntil || block.validFrom;
    if (typeof from !== "string" || !DATE_RE.test(from) || typeof until !== "string" || !DATE_RE.test(until)) {
      return { error: "Pick the date (or dates) this applies to." };
    }
    if (until < from) {
      return { error: "The end date must be on or after the start date." };
    }
    dayOfWeek = weekdayOfYmd(from);
    validFrom = toDbDate(from);
    validUntil = toDbDate(until);
  }

  const slotDuration = Number(block.slotDuration) || 30;
  const bufferTime = Number(block.bufferTime) || 0;
  const maxBookingsPerSlot = Math.trunc(Number(block.maxBookingsPerSlot) || 1);
  if (maxBookingsPerSlot < 1 || maxBookingsPerSlot > 20) {
    return { error: "Patients per slot must be between 1 and 20." };
  }
  if (scheduleType === "AVAILABLE" && toMinutes(endTime) - toMinutes(startTime) < slotDuration) {
    return { error: `The block is shorter than one ${slotDuration}-minute slot.` };
  }

  // Weekly available blocks on the same day must not overlap. One-off blocks
  // are deliberate exceptions (an extra clinic, a day off) and may.
  if (scheduleType === "AVAILABLE" && isRecurring) {
    const clash = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: doctorProfileId,
        dayOfWeek: dayOfWeek as number,
        scheduleType: "AVAILABLE",
        isRecurring: true,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(id ? { id: { not: id } } : {}),
      },
    });
    if (clash) {
      return { error: `This overlaps your existing available block ${clash.startTime}–${clash.endTime} on the same day.` };
    }
  }

  return {
    data: {
      dayOfWeek: dayOfWeek as number,
      startTime,
      endTime,
      slotDuration,
      bufferTime,
      scheduleType,
      isRecurring,
      validFrom,
      validUntil,
      maxBookingsPerSlot,
    },
  };
}

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DFC_MEMBER || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: user.doctorProfile.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      schedules,
      consultationFee: user.doctorProfile.consultationFee?.toString() || "0",
      consultationFeeNote: user.doctorProfile.consultationFeeNote || "",
    });
  } catch (error) {
    logger.error('DoctorSchedule', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DFC_MEMBER || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const {
      title,
      notes,
      color,
      consultationMode,
      location,
      ...block
    } = await request.json();

    const checked = await normalizeBlock(user.doctorProfile.id, { ...block });
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const schedule = await prisma.doctorSchedule.create({
      data: {
        doctorId: user.doctorProfile.id,
        title,
        ...checked.data,
        notes,
        color: color || '#3B82F6',
        consultationMode: consultationMode || 'VIDEO',
        location: location || null,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    logger.error('DoctorSchedule', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DFC_MEMBER || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const {
      id,
      title,
      notes,
      color,
      consultationMode,
      location,
      ...block
    } = await request.json();

    const checked = await normalizeBlock(user.doctorProfile.id, { id, ...block });
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const schedule = await prisma.doctorSchedule.update({
      where: {
        id,
        doctorId: user.doctorProfile.id,
      },
      data: {
        title,
        ...checked.data,
        notes,
        color: color || '#3B82F6',
        consultationMode: consultationMode || 'VIDEO',
        location: location || null,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    logger.error('DoctorSchedule', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DFC_MEMBER || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { consultationFee, consultationFeeNote } = await request.json();

    await prisma.doctorProfile.update({
      where: { id: user.doctorProfile.id },
      data: {
        consultationFee: consultationFee ?? 0,
        consultationFeeNote: consultationFeeNote || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DoctorSchedule', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DFC_MEMBER || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID required" },
        { status: 400 },
      );
    }

    await prisma.doctorSchedule.delete({
      where: {
        id,
        doctorId: user.doctorProfile.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DoctorSchedule', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
