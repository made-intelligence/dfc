import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { auditAdminChange } from "@/lib/audit";
import { generatePharmacyKey } from "@/lib/pharmacy-auth";

type Params = { params: Promise<{ id: string }> };

// A pharmacy's API key opens patient prescriptions, so only super admins
// issue or revoke one.
async function superAdmin(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;
  if (auth.role !== UserRole.SUPERADMIN) {
    return NextResponse.json({ error: "Only super admins can manage pharmacy API keys" }, { status: 403 });
  }
  return auth;
}

/**
 * Issue a new key, replacing any existing one (which stops working at once).
 * The key is in this response only: only its hash is stored.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await superAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const existing = await prisma.partnerPharmacy.findUnique({
      where: { id },
      select: { apiKeyPrefix: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const { key, hash, prefix } = generatePharmacyKey();
    const pharmacy = await prisma.partnerPharmacy.update({
      where: { id },
      data: { apiKeyHash: hash, apiKeyPrefix: prefix, apiKeyIssuedAt: new Date() },
      select: { apiKeyPrefix: true, apiKeyIssuedAt: true },
    });

    await auditAdminChange(
      auth.userId,
      "partner_pharmacy",
      id,
      { change: existing.apiKeyPrefix ? "rotate_api_key" : "issue_api_key", prefix, replaced: existing.apiKeyPrefix },
      request,
      "WARN",
    );
    return NextResponse.json({ key, ...pharmacy });
  } catch (error) {
    logger.error("AdminPharmacyKey", error);
    return NextResponse.json({ error: "Failed to issue the key" }, { status: 500 });
  }
}

/** Revoke the key: the pharmacy can no longer call the API until issued a new one. */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await superAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const existing = await prisma.partnerPharmacy.findUnique({
      where: { id },
      select: { apiKeyPrefix: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    await prisma.partnerPharmacy.update({
      where: { id },
      data: { apiKeyHash: null, apiKeyPrefix: null, apiKeyIssuedAt: null },
    });

    await auditAdminChange(
      auth.userId,
      "partner_pharmacy",
      id,
      { change: "revoke_api_key", prefix: existing.apiKeyPrefix },
      request,
      "WARN",
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("AdminPharmacyKey", error);
    return NextResponse.json({ error: "Failed to revoke the key" }, { status: 500 });
  }
}
