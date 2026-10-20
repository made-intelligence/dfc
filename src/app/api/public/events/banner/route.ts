import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bannerShowing, startOfTodayWAT } from "@/lib/event-banner";

// Events flagged for the site-wide pop-up banner: published, not yet over,
// soonest first. Several rotate as a carousel; capped to keep it short.
const MAX_BANNER_EVENTS = 5;

export async function GET() {
  try {
    // The database narrows to events ending today (WAT) or later; the exact
    // cut-off (an hour after a single-day event starts) is applied below.
    const today = startOfTodayWAT();
    const candidates = await prisma.dFCEvent.findMany({
      where: {
        isPublished: true,
        showBanner: true,
        OR: [{ endDate: { gte: today } }, { endDate: null, date: { gte: today } }],
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        date: true,
        endDate: true,
        time: true,
        location: true,
        city: true,
        isVirtual: true,
        isInPerson: true,
        imageUrl: true,
        registrationUrl: true,
        updatedAt: true,
      },
    });
    const now = new Date();
    const events = candidates.filter((e) => bannerShowing(e, now)).slice(0, MAX_BANNER_EVENTS);

    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ events: [] });
  }
}
