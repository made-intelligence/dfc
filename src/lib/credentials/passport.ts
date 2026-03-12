import { prisma } from "@/lib/prisma";

export interface CredentialSnapshot {
  membershipStatus: string | null;
  goodStanding: boolean;
  category: string | null;
  verifiedCredentials: {
    type: string;
    registrationNumber: string;
    issuingBody: string;
    country: string;
    specialty: string | null;
    expiryDate: Date | null;
  }[];
  indemnityInsurance: {
    registrationNumber: string;
    expiryDate: Date | null;
  } | null;
  mdcnRegistration: {
    registrationNumber: string;
    status: string;
  } | null;
  snapshotDate: Date;
}

export interface PassportValidation {
  valid: boolean;
  issues: string[];
  snapshot: CredentialSnapshot;
}

export async function validateCredentialPassport(
  userId: string
): Promise<PassportValidation> {
  const issues: string[] = [];

  // 1. DFC membership in good standing
  const member = await prisma.dFCMember.findUnique({
    where: { userId },
    include: {
      credentials: {
        where: { status: "VERIFIED" },
      },
    },
  });

  if (!member) {
    issues.push("No DFC membership found");
  } else if (!member.goodStanding) {
    issues.push("DFC membership not in good standing");
  }

  // 2. At least one verified medical credential
  const verifiedCreds = member?.credentials ?? [];
  if (verifiedCreds.length === 0) {
    issues.push("No verified medical credentials on file");
  }

  // 3. Valid indemnity insurance
  const indemnity = verifiedCreds.find(
    (c) =>
      c.type === "INDEMNITY_INSURANCE" &&
      c.expiryDate &&
      c.expiryDate > new Date()
  );
  if (!indemnity) {
    issues.push("No valid indemnity insurance on file");
  }

  // 4. MDCN registration current
  const mdcn = verifiedCreds.find((c) => c.type === "MDCN");
  if (!mdcn) {
    issues.push("MDCN registration not verified");
  }

  const snapshot: CredentialSnapshot = {
    membershipStatus: member?.status ?? null,
    goodStanding: member?.goodStanding ?? false,
    category: member?.category ?? null,
    verifiedCredentials: verifiedCreds.map((c) => ({
      type: c.type,
      registrationNumber: c.registrationNumber,
      issuingBody: c.issuingBody,
      country: c.country,
      specialty: c.specialty,
      expiryDate: c.expiryDate,
    })),
    indemnityInsurance: indemnity
      ? {
          registrationNumber: indemnity.registrationNumber,
          expiryDate: indemnity.expiryDate,
        }
      : null,
    mdcnRegistration: mdcn
      ? {
          registrationNumber: mdcn.registrationNumber,
          status: "VERIFIED",
        }
      : null,
    snapshotDate: new Date(),
  };

  return {
    valid: issues.length === 0,
    issues,
    snapshot,
  };
}
