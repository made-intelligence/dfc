import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Live headline numbers for the public marketing surfaces.
 *
 * These used to be hardcoded in the components, so they kept showing figures
 * that no longer matched the directory. Everything here is counted with the
 * same predicate the doctor search uses, so the stats strip and the search
 * results can never disagree.
 */

// Same definition of "bookable" as /api/public/doctors.
const AVAILABLE = {
  isAvailable: true,
  user: { isActive: true },
} as const;

export async function GET() {
  try {
    const [specialists, byCountry, bySpecialty, members, hospitals, cases] =
      await Promise.all([
        prisma.doctorProfile.count({ where: AVAILABLE }),
        prisma.doctorProfile.groupBy({ by: ["country"], where: AVAILABLE }),
        prisma.doctorProfile.groupBy({ by: ["specialtyId"], where: AVAILABLE }),
        prisma.dFCMember.count({ where: { status: "ACTIVE" } }),
        prisma.hospitalPartner.count({
          where: { status: { in: ["ACTIVE", "APPROVED"] } },
        }),
        prisma.secondOpinionCase.count(),
      ]);

    return NextResponse.json(
      {
        specialists,
        specialties: bySpecialty.filter((r) => r.specialtyId).length,
        countries: byCountry.filter((r) => r.country).length,
        members,
        hospitals,
        cases,
      },
      // Short window only: these numbers change whenever the directory is
      // curated, and a stale count is what sent us here in the first place.
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    logger.error("PublicStats", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
