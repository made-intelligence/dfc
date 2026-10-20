import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { activeEmailTransport } from "@/lib/email/service";
import { logger } from "@/lib/logger";

/**
 * Operational snapshot for the admin Analytics page. Every figure here is
 * measured; nothing is estimated or simulated.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalUsers, totalDoctors, totalAppointments, emailsSent24h, emailsFailed24h, openTickets] =
      await Promise.all([
        prisma.user.count(),
        prisma.doctorProfile.count(),
        prisma.appointment.count(),
        prisma.emailLog.count({ where: { status: "SENT", createdAt: { gte: since } } }),
        prisma.emailLog.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
        prisma.secretariatTicket.count({ where: { status: "OPEN" } }),
      ]);

    return NextResponse.json({
      status: dbLatencyMs < 1000 ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: { status: dbLatencyMs < 1000 ? "operational" : "slow", latencyMs: dbLatencyMs },
      email: {
        transport: activeEmailTransport(),
        sent24h: emailsSent24h,
        failed24h: emailsFailed24h,
      },
      payments: { configured: !!process.env.PAYSTACK_SECRET_KEY },
      metrics: { totalUsers, totalDoctors, totalAppointments, openTickets },
    });
  } catch (error) {
    logger.error("SystemHealth", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: { status: "error", latencyMs: null },
        error: "System health check failed",
      },
      { status: 500 }
    );
  }
}
