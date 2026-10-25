import "server-only";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

// Partner pharmacies call the prescription API with their own key in the
// x-api-key header. The key identifies the pharmacy, so a request can only act
// as the pharmacy it belongs to, and one pharmacy's key can be revoked alone.

const KEY_PREFIX = "dfcph_";

const hashKey = (key: string) => crypto.createHash("sha256").update(key).digest("hex");

/** A new key, its hash to store, and a short prefix admins can recognise it by. */
export function generatePharmacyKey(): { key: string; hash: string; prefix: string } {
  const key = KEY_PREFIX + crypto.randomBytes(32).toString("base64url");
  return { key, hash: hashKey(key), prefix: key.slice(0, KEY_PREFIX.length + 6) };
}

/**
 * The active pharmacy the request's key belongs to, or a 401. Keys are looked
 * up by their SHA-256, so the raw key is never compared or stored, and a
 * failed attempt is audited.
 */
export async function authenticatePharmacy(
  request: NextRequest,
  rxNumber: string,
): Promise<{ id: string; name: string } | NextResponse> {
  const key = request.headers.get("x-api-key")?.trim();
  const pharmacy = key?.startsWith(KEY_PREFIX)
    ? await prisma.partnerPharmacy.findUnique({
        where: { apiKeyHash: hashKey(key) },
        select: { id: true, name: true, isActive: true },
      })
    : null;

  if (!pharmacy || !pharmacy.isActive) {
    await audit(
      {
        userId: null,
        action: "AUTH_FAILED",
        resource: "prescription",
        resourceId: rxNumber,
        details: {
          via: "pharmacy_api",
          reason: !key ? "missing_api_key" : pharmacy ? "inactive_pharmacy" : "invalid_api_key",
          pharmacyId: pharmacy?.id,
        },
        severity: "WARN",
      },
      request,
    );
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }
  return { id: pharmacy.id, name: pharmacy.name };
}
