import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, AppointmentStatus } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";

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
      include: { patientProfile: true },
    });

    if (!user || user.role !== UserRole.PATIENT) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: user.id },
      include: {
        doctor: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        doctorProfile: {
          select: {
            specialty: {
              select: {
                name: true,
              },
            },
            consultationFee: true,
            currency: true,
          },
        },
      },
      orderBy: [{ appointmentDate: "desc" }, { startTime: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
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
      include: { patientProfile: true },
    });

    if (!user || user.role !== UserRole.PATIENT) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id, status } = await request.json();

    // Only allow patients to cancel their own appointments
    if (status !== AppointmentStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Patients can only cancel appointments" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.update({
      where: {
        id,
        patientId: user.id,
      },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
      include: {
        doctor: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        doctorProfile: {
          select: {
            specialty: {
              select: {
                name: true,
              },
            },
            consultationFee: true,
            currency: true,
          },
        },
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
