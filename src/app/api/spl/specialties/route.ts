import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET — SPL specialty activation status
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (
      !payload ||
      !["SUPERADMIN", "SECRETARIAT", "SPL_ADMIN"].includes(payload.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const specialties = await prisma.sPLSpecialtyActivation.findMany({
      orderBy: [{ tier: "asc" }, { specialty: "asc" }],
    });

    return NextResponse.json({ specialties });
  } catch (error) {
    logger.error("SPLSpecialties", error);
    return NextResponse.json(
      { error: "Failed to fetch SPL specialties" },
      { status: 500 }
    );
  }
}
