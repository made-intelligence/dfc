import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.dFCEvent.findMany({
      where: {
        isPublished: true,
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 6,
    });

    return NextResponse.json(
      { events },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ events: [] });
  }
}
