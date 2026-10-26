import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { auditAdminChange } from "@/lib/audit";
import { pharmacyFields, PHARMACY_SELECT } from "@/lib/pharmacies";

type Params = { params: Promise<{ id: string }> };

// Edit a partner pharmacy, or switch it off (isActive false), which also stops
// its API key working. Pharmacies are never deleted: dispensing logs refer to them.
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const existing = await prisma.partnerPharmacy.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const checked = pharmacyFields(await request.json(), true);
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const pharmacy = await prisma.partnerPharmacy.update({
      where: { id },
      data: checked.data,
      select: PHARMACY_SELECT,
    });

    const toggled = existing.isActive !== pharmacy.isActive;
    await auditAdminChange(
      auth.userId,
      "partner_pharmacy",
      id,
      {
        change: toggled ? (pharmacy.isActive ? "activate" : "deactivate") : "update",
        fields: Object.keys(checked.data),
      },
      request,
      toggled ? "WARN" : "INFO",
    );
    return NextResponse.json({ pharmacy });
  } catch (error) {
    logger.error("AdminPharmacy", error);
    return NextResponse.json({ error: "Failed to update the pharmacy" }, { status: 500 });
  }
}
