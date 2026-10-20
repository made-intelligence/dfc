import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRateLimit } from "@/lib/rate-limit";
import { EVENT_INTERACTION_KINDS, type EventInteractionKind } from "@/lib/event-tracking-kinds";

/**
 * Records one anonymous engagement hit for a published event. Sent with
 * navigator.sendBeacon (text/plain body), so the body is parsed manually.
 * Nothing about the visitor is stored.
 */
export async function POST(request: NextRequest) {
  const limited = await apiRateLimit(request);
  if (limited) return limited;

  let body: { eventId?: unknown; kind?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { eventId, kind } = body;
  if (typeof eventId !== "string" || !EVENT_INTERACTION_KINDS.includes(kind as EventInteractionKind)) {
    return NextResponse.json({ error: "Invalid event or kind" }, { status: 400 });
  }

  // Only count hits on events the public can actually see.
  const event = await prisma.dFCEvent.findFirst({
    where: { id: eventId, isPublished: true },
    select: { id: true },
  });
  if (!event) return new NextResponse(null, { status: 204 });

  await prisma.dFCEventInteraction.create({ data: { eventId, kind: kind as string } });
  return new NextResponse(null, { status: 204 });
}
