import "server-only";
import { Prisma } from "@prisma/client";

// Partner pharmacy fields shared by the admin pharmacy routes.

const TYPES = ["PHYSICAL", "ONLINE", "BOTH"];

const label = (key: string) => `${key[0].toUpperCase()}${key.slice(1)}`;

/**
 * The editable fields of a partner pharmacy from a request body, or an error.
 * `partial` (an update) lets required fields be left out.
 */
export function pharmacyFields(
  body: Record<string, unknown>,
  partial: boolean,
): { error: string } | { data: Prisma.PartnerPharmacyUpdateInput } {
  const text = (key: string) => {
    const v = body[key];
    return typeof v === "string" ? v.trim() : undefined;
  };
  const data: Prisma.PartnerPharmacyUpdateInput = {};

  for (const key of ["name", "address", "city", "phone"] as const) {
    const v = text(key);
    const blanked = v === ""; // sent, but empty
    const missing = v === undefined && !partial;
    if (blanked || missing) return { error: `${label(key)} is required.` };
    if (v) data[key] = v;
  }
  for (const key of ["chain", "email", "onlineOrderUrl", "apiEndpoint"] as const) {
    const v = text(key);
    if (v !== undefined) data[key] = v || null;
  }
  const type = text("type");
  if (type !== undefined) {
    if (!TYPES.includes(type)) return { error: "Type must be physical, online or both." };
    data.type = type;
  } else if (!partial) {
    data.type = "PHYSICAL";
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  return { data };
}

/** A pharmacy as admins see it: never the key hash. */
export const PHARMACY_SELECT = {
  id: true,
  name: true,
  chain: true,
  address: true,
  city: true,
  phone: true,
  email: true,
  type: true,
  onlineOrderUrl: true,
  apiEndpoint: true,
  isActive: true,
  apiKeyPrefix: true,
  apiKeyIssuedAt: true,
  createdAt: true,
  _count: { select: { dispensingLogs: true } },
} satisfies Prisma.PartnerPharmacySelect;
