import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const splAdmin = await prisma.sPLAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { partner: true },
    });
    if (!splAdmin)
      return NextResponse.json(
        { error: "SPL profile not found" },
        { status: 404 }
      );

    const invoices = await prisma.sPLInvoice.findMany({
      where: { partnerId: splAdmin.partnerId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate outstanding total (SENT + OVERDUE)
    const outstandingInvoices = invoices.filter(
      (inv) => inv.status === "SENT" || inv.status === "OVERDUE"
    );
    const outstandingTotal = outstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );

    return NextResponse.json({ invoices, outstandingTotal });
  } catch (error) {
    logger.error('SplInvoices', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
