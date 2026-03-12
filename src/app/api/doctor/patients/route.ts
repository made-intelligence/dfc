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

    // Get all patients who have appointments with this doctor
    const patients = await prisma.user.findMany({
      where: {
        role: UserRole.PATIENT,
        createdAppointments: {
          some: {
            doctorId: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        patientProfile: {
          select: {
            dateOfBirth: true,
            gender: true,
            address: true,
            bloodGroup: true,
            allergies: true,
            emergencyContact: true,
          },
        },
        _count: {
          select: {
            createdAppointments: {
              where: {
                doctorId: user.id,
              },
            },
          },
        },
        createdAppointments: {
          where: {
            doctorId: user.id,
          },
          orderBy: {
            appointmentDate: "desc",
          },
          take: 1,
          select: {
            appointmentDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to include lastAppointment
    const transformedPatients = patients.map((patient) => ({
      ...patient,
      _count: {
        appointments: patient._count.createdAppointments,
      },
      lastAppointment: patient.createdAppointments[0] || null,
      createdAppointments: undefined,
    }));

    return NextResponse.json(transformedPatients);
  } catch (error) {
    logger.error('DoctorPatients', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
