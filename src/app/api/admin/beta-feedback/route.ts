import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [feedback, total, stats] = await Promise.all([
      prisma.betaFeedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, role: true, profileImage: true } },
        },
      }),
      prisma.betaFeedback.count({ where }),
      prisma.betaFeedback.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const statusCounts = Object.fromEntries(
      stats.map((s) => [s.status, s._count])
    );

    return NextResponse.json({
      success: true,
      feedback,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: statusCounts,
    });
  } catch (error) {
    logger.error("AdminBetaFeedback", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: "Feedback ID required" }, { status: 400 });
    }

    const updated = await prisma.betaFeedback.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
      },
    });

    return NextResponse.json({ success: true, feedback: updated });
  } catch (error) {
    logger.error("AdminBetaFeedback", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
