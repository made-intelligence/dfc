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
      include: { patientProfile: true },
    });

    if (!user || user.role !== UserRole.PATIENT) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get or create patient profile
    let patientProfile = user.patientProfile;
    if (!patientProfile) {
      patientProfile = await prisma.patientProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Fetch patient profile with medical records
    const profile = await prisma.patientProfile.findUnique({
      where: { id: patientProfile.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        medicalRecords: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
                specialty: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            appointment: {
              select: {
                appointmentDate: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            appointments: true,
            medicalRecords: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    logger.error('PatientProfile', error);
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

    // Get or create patient profile
    let patientProfile = user.patientProfile;
    if (!patientProfile) {
      patientProfile = await prisma.patientProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
      profileImage,
    } = await request.json();

    // Update user information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone,
        ...(profileImage !== undefined && { profileImage }),
      },
    });

    // Update patient profile
    const updatedProfile = await prisma.patientProfile.update({
      where: { id: patientProfile.id },
      data: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        emergencyContact,
        bloodGroup,
        allergies,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        medicalRecords: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
                specialty: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            appointment: {
              select: {
                appointmentDate: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            appointments: true,
            medicalRecords: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    logger.error('PatientProfile', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
