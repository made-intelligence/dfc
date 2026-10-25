import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Patient lookup for the secretariat's booking form: name, email or phone.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const search = (new URL(request.url).searchParams.get("search") || "").trim();
    if (search.length < 2) return NextResponse.json({ patients: [] });

    const patients = await prisma.user.findMany({
      where: {
        role: "PATIENT",
        isActive: true,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    return NextResponse.json({ patients });
  } catch (error) {
    logger.error("AdminPatientSearch", error);
    return NextResponse.json({ error: "Failed to search patients" }, { status: 500 });
  }
}
