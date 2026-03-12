import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import crypto from "crypto";

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

    const subscriptions = await prisma.doctorSubscription.findMany({
      where: { doctorId: user.doctorProfile.id },
      orderBy: { createdAt: "desc" },
    });

    // Find current active subscription
    const currentSubscription = subscriptions.find(
      (sub) => sub.status === "ACTIVE" && new Date(sub.endDate) > new Date(),
    );

    return NextResponse.json({
      current: currentSubscription || null,
      history: subscriptions,
    });
  } catch (error) {
    logger.error('DoctorSubscription', error);
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

    const { planName, amount } = await request.json();

    // Calculate subscription duration based on plan
    const getDuration = (plan: string) => {
      switch (plan.toLowerCase()) {
        case "basic":
          return 30; // 1 month
        case "professional":
          return 90; // 3 months
        case "premium":
          return 180; // 6 months
        default:
          return 30;
      }
    };

    const duration = getDuration(planName);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    // Generate payment reference (in real app, this would come from payment gateway)
    const paymentReference = `DFC-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

    const subscription = await prisma.doctorSubscription.create({
      data: {
        doctorId: user.doctorProfile.id,
        planName,
        amount,
        currency: "NGN",
        status: "PENDING", // In real app, this would be updated after payment confirmation
        startDate,
        endDate,
        paymentReference,
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    logger.error('DoctorSubscription', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
