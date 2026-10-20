import { NextRequest, NextResponse } from "next/server";
import { SPLContractStatus } from "@prisma/client";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;

    const partner = await prisma.sPLPartner.findUnique({
      where: { id },
      include: {
        contracts: { orderBy: { startDate: "desc" } },
        cases: {
          orderBy: { submittedAt: "desc" },
          take: 10,
          select: {
            id: true,
            referenceNumber: true,
            patientName: true,
            specialty: true,
            status: true,
            submittedAt: true,
          },
        },
        adminUsers: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { cases: true } },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const invoiceTotals = await prisma.sPLInvoice.groupBy({
      by: ["status"],
      where: { partnerId: id },
      _sum: { total: true },
      _count: true,
    });

    return NextResponse.json({ success: true, partner, invoiceTotals });
  } catch (error) {
    logger.error("AdminSplPartnerDetail", error);
    return NextResponse.json({ error: "Failed to fetch SPL partner" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.status !== undefined && !Object.values(SPLContractStatus).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const editable = ["status", "name", "shortName", "type", "primaryContact", "primaryEmail", "primaryPhone", "rcNumber"] as const;
    const data: Record<string, unknown> = {};
    for (const field of editable) {
      if (body[field] === undefined) continue;
      if (typeof body[field] !== "string" || body[field].length > 200) {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
      }
      const value = body[field].trim();
      if ((field === "name" || field === "shortName" || field === "type") && !value) {
        return NextResponse.json({ error: `${field} cannot be empty` }, { status: 400 });
      }
      data[field] = value || null;
    }

    const partner = await prisma.sPLPartner.update({ where: { id }, data });

    audit({
      userId: auth.userId,
      action: "ADMIN_ACTION",
      resource: "spl_partner",
      resourceId: id,
      details: { action: "updated", fields: Object.keys(data) },
    }, request);

    return NextResponse.json({ success: true, partner });
  } catch (error) {
    logger.error("AdminSplPartnerUpdate", error);
    return NextResponse.json({ error: "Failed to update SPL partner" }, { status: 500 });
  }
}
