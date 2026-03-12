import { prisma } from "@/lib/prisma";

export type ConsentType =
  | "TREATMENT"
  | "TELEMEDICINE"
  | "SECOND_OPINION_SHARING"
  | "DATA_PROCESSING"
  | "RESEARCH"
  | "PHOTOGRAPHY";

/**
 * Check if a patient has active consent for a given type.
 * Returns true if consent is given and not revoked.
 */
export async function hasConsent(
  patientId: string,
  type: ConsentType
): Promise<boolean> {
  const consent = await prisma.patientConsent.findFirst({
    where: {
      patientId,
      type,
      given: true,
      revokedAt: null,
    },
    orderBy: { givenAt: "desc" },
  });

  return !!consent;
}

/**
 * Check if consent was given within the last N days (for expiry enforcement).
 * Default: 365 days (annual re-consent).
 */
export async function hasValidConsent(
  patientId: string,
  type: ConsentType,
  maxAgeDays = 365
): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const consent = await prisma.patientConsent.findFirst({
    where: {
      patientId,
      type,
      given: true,
      revokedAt: null,
      givenAt: { gte: cutoff },
    },
    orderBy: { givenAt: "desc" },
  });

  return !!consent;
}

/**
 * Require consent before allowing access. Returns an error message if consent is missing.
 */
export async function requireConsent(
  patientId: string,
  type: ConsentType
): Promise<string | null> {
  const valid = await hasValidConsent(patientId, type);
  if (!valid) {
    return `Patient consent for ${type} is required or has expired. Please obtain consent before proceeding.`;
  }
  return null;
}

/**
 * Map of route patterns to required consent types.
 * Used by EMR/clinical routes to enforce consent before data access.
 */
export const CONSENT_REQUIREMENTS: Record<string, ConsentType> = {
  "emr/encounters": "TREATMENT",
  "emr/prescriptions": "TREATMENT",
  "emr/export": "DATA_PROCESSING",
  "cdss/": "TREATMENT",
  "second-opinion": "SECOND_OPINION_SHARING",
  "room/": "TELEMEDICINE",
};

/**
 * Determine which consent type is needed for a given API path.
 */
export function getRequiredConsent(pathname: string): ConsentType | null {
  for (const [pattern, consentType] of Object.entries(CONSENT_REQUIREMENTS)) {
    if (pathname.includes(pattern)) {
      return consentType;
    }
  }
  return null;
}
