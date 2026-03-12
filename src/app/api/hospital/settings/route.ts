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

    return NextResponse.json({ hospital: adminProfile.hospital });
  } catch (error) {
    logger.error('HospitalSettings', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    // Only allow updating specific fields
    const allowedFields = [
      "email",
      "phone",
      "website",
      "address",
      "city",
      "state",
      "description",
      "bedCount",
      "specialties",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "bedCount") {
          updateData[field] = parseInt(body[field], 10) || null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospitalPartner.update({
      where: { id: adminProfile.hospitalId },
      data: updateData,
    });

    return NextResponse.json({ hospital });
  } catch (error) {
    logger.error('HospitalSettings', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
