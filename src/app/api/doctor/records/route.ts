import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { validateFields, MAX_LENGTHS } from "@/lib/validation";

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

    const records = await prisma.medicalRecord.findMany({
      where: { doctorId: user.doctorProfile.id },
      include: {
        appointment: {
          select: {
            appointmentDate: true,
            patient: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    logger.error('DoctorRecords', error);
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
    const {
      appointmentId,
      diagnosis,
      symptoms,
      treatment,
      medications,
      followUpDate,
      notes,
    } = body;

    // Validate field lengths
    const validationError = validateFields(body, {
      appointmentId: { required: true, maxLength: MAX_LENGTHS.shortText },
      diagnosis: { required: true, maxLength: MAX_LENGTHS.longText },
      symptoms: { maxLength: MAX_LENGTHS.longText },
      treatment: { maxLength: MAX_LENGTHS.longText },
      medications: { maxLength: MAX_LENGTHS.mediumText },
      notes: { maxLength: MAX_LENGTHS.longText },
    });
    if (validationError) return validationError;

    // Verify the appointment belongs to this doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: user.id,
      },
      include: {
        patientProfile: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Process medications into JSON array
    const medicationsArray = medications
      ? medications
          .split(",")
          .map((med: string) => med.trim())
          .filter((med: string) => med)
      : [];

    const record = await prisma.medicalRecord.create({
      data: {
        appointmentId,
        patientId: appointment.patientProfile.id,
        doctorId: user.doctorProfile.id,
        diagnosis,
        symptoms: symptoms || null,
        treatment: treatment || null,
        medications:
          medicationsArray.length > 0 ? JSON.stringify(medicationsArray) : null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
      },
      include: {
        appointment: {
          select: {
            appointmentDate: true,
            patient: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    logger.error('DoctorRecords', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
