import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;


  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("partnerId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;

    const invoices = await prisma.sPLInvoice.findMany({
      where,
      include: {
        contract: {
          include: {
            partner: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    logger.error('AdminSplInvoices', error);
    return NextResponse.json(
      { error: "Failed to fetch SPL invoices" },
      { status: 500 }
    );
  }
}

const INVOICE_DUE_DAYS = 30;

/**
 * POST — generate an invoice for a contract.
 *
 * Bills every DELIVERED case on the contract that is not yet on an invoice
 * (optionally limited to cases delivered within periodStart..periodEnd), moves
 * those cases to BILLED and links them to the invoice. Subscription contracts
 * bill the monthly fee instead of per-case fees.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { contractId, notes } = body;
    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const periodStart = body.periodStart ? new Date(body.periodStart) : null;
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : null;
    if ((periodStart && isNaN(periodStart.getTime())) || (periodEnd && isNaN(periodEnd.getTime()))) {
      return NextResponse.json({ error: "Invalid billing period" }, { status: 400 });
    }
    if (periodEnd) periodEnd.setHours(23, 59, 59, 999);

    const contract = await prisma.sPLContract.findUnique({
      where: { id: contractId },
      include: { partner: { select: { shortName: true } } },
    });
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const deliveredWindow: Record<string, Date> = {};
    if (periodStart) deliveredWindow.gte = periodStart;
    if (periodEnd) deliveredWindow.lte = periodEnd;

    const cases = await prisma.sPLCase.findMany({
      where: {
        contractId,
        status: "DELIVERED",
        invoiceId: null,
        ...(periodStart || periodEnd ? { deliveredAt: deliveredWindow } : {}),
      },
      orderBy: { deliveredAt: "asc" },
    });

    const isSubscription = contract.model === "SUBSCRIPTION";
    if (cases.length === 0 && !isSubscription) {
      return NextResponse.json(
        { error: "There are no delivered, unbilled cases on this contract for that period" },
        { status: 400 }
      );
    }

    const caseFees = cases.reduce((sum, c) => sum + Number(c.agreedFee ?? 0), 0);
    const subtotal = isSubscription ? Number(contract.subscriptionFeeMonthly ?? 0) : caseFees;
    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "These cases have no agreed fee, so there is nothing to bill. Set fees on the cases first." },
        { status: 400 }
      );
    }
    const feePercent = Number(contract.dfcPlatformFeePercent);
    const dfcFee = isSubscription
      ? Math.round(subtotal * feePercent) / 100
      : cases.reduce(
          (sum, c) =>
            sum +
            (c.dfcPlatformFee != null
              ? Number(c.dfcPlatformFee)
              : (Number(c.agreedFee ?? 0) * feePercent) / 100),
          0
        );

    const deliveredDates = cases.map((c) => c.deliveredAt ?? c.updatedAt);
    const now = new Date();
    const start = periodStart ?? (deliveredDates[0] || new Date(now.getFullYear(), now.getMonth(), 1));
    const end = periodEnd ?? (deliveredDates[deliveredDates.length - 1] || now);

    // INV-<partner>-<yyyymm>-<n>, numbered per partner per month
    const prefix = `INV-${contract.partner.shortName.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-`;
    const existing = await prisma.sPLInvoice.count({ where: { invoiceNumber: { startsWith: prefix } } });

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.sPLInvoice.create({
        data: {
          invoiceNumber: `${prefix}${String(existing + 1).padStart(3, "0")}`,
          contractId,
          partnerId: contract.partnerId,
          periodStart: start,
          periodEnd: end,
          caseCount: cases.length,
          subtotal,
          dfcFee,
          total: subtotal,
          status: "DRAFT",
          dueDate: new Date(now.getTime() + INVOICE_DUE_DAYS * 24 * 60 * 60 * 1000),
          notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        },
        include: {
          contract: { include: { partner: { select: { name: true, shortName: true } } } },
        },
      });
      if (cases.length > 0) {
        await tx.sPLCase.updateMany({
          where: { id: { in: cases.map((c) => c.id) }, invoiceId: null },
          data: { invoiceId: created.id, status: "BILLED" },
        });
      }
      return created;
    });

    audit({
      userId: auth.userId,
      action: "ADMIN_ACTION",
      resource: "spl_invoice",
      resourceId: invoice.id,
      details: { action: "created", invoiceNumber: invoice.invoiceNumber, caseCount: cases.length },
    }, request);

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    logger.error("AdminSplInvoiceCreate", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
