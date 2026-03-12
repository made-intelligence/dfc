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

    const deployments = await prisma.deploymentWindow.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deployments });
  } catch (error) {
    logger.error('HospitalDeployments', error);
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
    const { title, specialty, startDate, endDate, specialistCount, notes } = body;

    if (!title || !specialty || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Title, specialty, start date, and end date are required" },
        { status: 400 }
      );
    }

    const deployment = await prisma.deploymentWindow.create({
      data: {
        hospitalId: adminProfile.hospitalId,
        title,
        specialty,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        specialistCount: specialistCount || 1,
        notes: notes || null,
        status: "REQUESTED",
      },
    });

    return NextResponse.json({ deployment }, { status: 201 });
  } catch (error) {
    logger.error('HospitalDeployments', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
