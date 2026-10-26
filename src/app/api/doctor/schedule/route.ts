import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { scheduleBlockData } from "@/lib/doctor-schedule";
import { auditAppointment } from "@/lib/audit";

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

    const body = await request.json();
    delete body.id; // a new block has no id to exclude from the overlap check
    const checked = await scheduleBlockData(user.doctorProfile.id, body);
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const schedule = await prisma.doctorSchedule.create({
      data: { doctorId: user.doctorProfile.id, ...checked.data },
    });

    await auditAppointment.schedule(user.id, user.id, { change: "create", by: "doctor", scheduleId: schedule.id }, request);
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

    const body = await request.json();
    const checked = await scheduleBlockData(user.doctorProfile.id, body);
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const schedule = await prisma.doctorSchedule.update({
      where: {
        id: body.id,
        doctorId: user.doctorProfile.id,
      },
      data: checked.data,
    });

    await auditAppointment.schedule(user.id, user.id, { change: "update", by: "doctor", scheduleId: schedule.id }, request);
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

    await auditAppointment.schedule(user.id, user.id, {
      change: "fee",
      by: "doctor",
      from: user.doctorProfile.consultationFee?.toString(),
      to: consultationFee ?? 0,
    }, request);
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

    await auditAppointment.schedule(user.id, user.id, { change: "delete", by: "doctor", scheduleId: id }, request);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DoctorSchedule', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
