import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, isAuthError, JWTPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  const payload = auth as JWTPayload;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalPartners, activeContracts, openCases, deliveredThisMonth] =
      await Promise.all([
        prisma.sPLPartner.count(),
        prisma.sPLContract.count({ where: { status: "ACTIVE" } }),
        prisma.sPLCase.count({
          where: {
            status: {
              notIn: ["DELIVERED", "PAID", "CANCELLED"],
            },
          },
        }),
        prisma.sPLCase.findMany({
          where: {
            status: "DELIVERED",
            deliveredAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: { agreedFee: true },
        }),
      ]);

    const revenueThisMonth = deliveredThisMonth.reduce(
      (sum, c) => sum + (c.agreedFee ? Number(c.agreedFee) : 0),
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalPartners,
        activeContracts,
        openCases,
        revenueThisMonth,
      },
    });
  } catch (error) {
    logger.error('AdminSplOverview', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL overview" },
      { status: 500 }
    );
  }
}
