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

    // The join link is public only for open events (no registration) the admin hasn't opted out of.
    const publicEvents = events.map((e) =>
      e.registrationUrl || e.hideVirtualLink ? { ...e, virtualLink: null } : e,
    );

    return NextResponse.json(
      { events: publicEvents },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ events: [] });
  }
}
