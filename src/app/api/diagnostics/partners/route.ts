import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET — list diagnostic partners and their centres (public for members)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "";

    const partners = await prisma.diagnosticPartner.findMany({
      where: { isActive: true },
      include: {
        centres: {
          where: {
            isActive: true,
            ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
          },
          orderBy: { city: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      partners: partners.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        logoUrl: p.logoUrl,
        integrationMode: p.integrationMode,
        centres: p.centres.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          city: c.city,
          state: c.state,
          phone: c.phone,
          openingHours: c.openingHours,
          capabilities: c.capabilities,
        })),
        centreCount: p.centres.length,
      })),
    });
  } catch (error) {
    logger.error("DiagnosticPartners", error);
    return NextResponse.json(
      { error: "Failed to fetch diagnostic partners" },
      { status: 500 }
    );
  }
}
