import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminProfile = await prisma.hospitalAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { hospital: true },
    });
    if (!adminProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = { hospitalId: adminProfile.hospitalId };
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    const verifications = await prisma.specialistVerification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    logger.error('HospitalVerification', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminProfile = await prisma.hospitalAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { hospital: true },
    });
    if (!adminProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { specialistName, specialty, licenseNumber, documentUrl, notes } = body;

    if (!specialistName || !specialty) {
      return NextResponse.json(
        { error: "Specialist name and specialty are required" },
        { status: 400 }
      );
    }

    const verification = await prisma.specialistVerification.create({
      data: {
        hospitalId: adminProfile.hospitalId,
        specialistName,
        specialty,
        licenseNumber: licenseNumber || null,
        documentUrl: documentUrl || null,
        notes: notes || null,
        requestedById: payload.userId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) {
    logger.error('HospitalVerification', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
