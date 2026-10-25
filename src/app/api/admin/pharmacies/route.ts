import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { auditAdminChange } from "@/lib/audit";
import { pharmacyFields, PHARMACY_SELECT } from "@/lib/pharmacies";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const search = (new URL(request.url).searchParams.get("search") || "").trim();
    const pharmacies = await prisma.partnerPharmacy.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { chain: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      select: PHARMACY_SELECT,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ pharmacies });
  } catch (error) {
    logger.error("AdminPharmacies", error);
    return NextResponse.json({ error: "Failed to fetch pharmacies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const checked = pharmacyFields(await request.json(), false);
    if ("error" in checked) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    const pharmacy = await prisma.partnerPharmacy.create({
      data: checked.data as Prisma.PartnerPharmacyCreateInput,
      select: PHARMACY_SELECT,
    });

    await auditAdminChange(
      auth.userId,
      "partner_pharmacy",
      pharmacy.id,
      { change: "create", name: pharmacy.name, city: pharmacy.city },
      request,
    );
    return NextResponse.json({ pharmacy }, { status: 201 });
  } catch (error) {
    logger.error("AdminPharmacies", error);
    return NextResponse.json({ error: "Failed to add the pharmacy" }, { status: 500 });
  }
}
