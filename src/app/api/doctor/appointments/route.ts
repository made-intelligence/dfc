import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DFC_MEMBER || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: user.id },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ appointmentDate: "desc" }, { startTime: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    logger.error('DoctorAppointments', error);
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

    const { id, status, notes } = await request.json();

    // Strict Completion Validation
    if (status === 'COMPLETED') {
        const appointmentToCheck = await prisma.appointment.findUnique({
            where: { id, doctorId: user.id }
        });
        
        if (!appointmentToCheck) {
             return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        if (!appointmentToCheck.doctorJoinedAt || !appointmentToCheck.patientJoinedAt) {
             return NextResponse.json(
                { error: "Cannot mark as completed. Both Doctor and Patient must have joined the video call session." },
                { status: 400 }
             );
        }
    }

    const appointment = await prisma.appointment.update({
      where: {
        id,
        doctorId: user.id,
      },
      data: {
        status,
        ...(notes && { notes }),
      },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    logger.error('DoctorAppointments', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
