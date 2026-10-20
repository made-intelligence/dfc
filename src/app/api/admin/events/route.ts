import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { uploadImage, deleteImageByUrl, ImageValidationError } from "@/lib/cloudinary";
import { uniqueEventSlug } from "@/lib/event-slug";
import { emptyEventStats, type EventInteractionKind, type EventStats } from "@/lib/event-tracking-kinds";

const EVENTS_FOLDER = "dfc/events";

// Whitelist updatable columns to prevent mass-assignment of arbitrary fields.
const ALLOWED = [
  "title", "description", "type", "date", "endDate", "time", "location",
  "city", "isVirtual", "isInPerson", "virtualLink", "hideVirtualLink", "imageUrl", "registrationUrl",
  "isPublished", "isFeatured", "showBanner",
];

/**
 * Create/edit accept either JSON (flag toggles) or multipart with a JSON `data`
 * field plus an optional `image` file, so the image is only uploaded together
 * with a save that is actually going to happen.
 */
async function readBody(
  req: NextRequest,
): Promise<{ body: Record<string, unknown>; image: File | null; fullForm: boolean }> {
  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const fd = await req.formData();
    const image = fd.get("image");
    return {
      body: JSON.parse(String(fd.get("data") ?? "{}")),
      image: image instanceof File && image.size > 0 ? image : null,
      fullForm: true,
    };
  }
  return { body: await req.json(), image: null, fullForm: false };
}

const filled = (v: unknown) => typeof v === "string" ? v.trim() !== "" : v != null;

/** Everything except the registration URL is required on a full create/edit. */
function missingRequired(body: Record<string, unknown>, hasImage: boolean): string | null {
  const missing: string[] = [];
  for (const [k, label] of [
    ["title", "title"], ["type", "type"], ["description", "description"],
    ["date", "date"], ["time", "time"],
  ] as const) {
    if (!filled(body[k])) missing.push(label);
  }
  if (!body.isVirtual && !body.isInPerson) missing.push("attendance (in person and/or virtual)");
  if (body.isInPerson && !filled(body.location)) missing.push("location");
  if (body.isInPerson && !filled(body.city)) missing.push("city");
  if (body.isVirtual && !filled(body.virtualLink)) missing.push("virtual link");
  if (!hasImage) missing.push("cover image");
  if (missing.length) return `Missing required fields: ${missing.join(", ")}.`;
  if (body.endDate && String(body.endDate) <= String(body.date)) return "End date must be after the start date.";
  return null;
}

/** Over once its last day (in WAT) has passed. Dates are stored as UTC midnight of the day. */
function hasEnded(event: { date: Date; endDate: Date | null }) {
  const todayWAT = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
  return (event.endDate ?? event.date).toISOString().slice(0, 10) < todayWAT;
}

function pick(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in body) data[k] = body[k];
  if (data.date) data.date = new Date(data.date as string);
  if ("endDate" in data) data.endDate = data.endDate ? new Date(data.endDate as string) : null;
  return data;
}

async function uploadOrError(image: File): Promise<string | NextResponse> {
  try {
    return await uploadImage(image, EVENTS_FOLDER);
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to upload image." }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  const [events, counts] = await Promise.all([
    prisma.dFCEvent.findMany({ orderBy: { date: "asc" } }),
    prisma.dFCEventInteraction.groupBy({ by: ["eventId", "kind"], _count: { _all: true } }),
  ]);

  const stats: Record<string, EventStats> = {};
  for (const c of counts) {
    (stats[c.eventId] ??= emptyEventStats())[c.kind as EventInteractionKind] = c._count._all;
  }

  return NextResponse.json({
    events: events.map((e) => ({ ...e, stats: stats[e.id] ?? emptyEventStats() })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const { body, image } = await readBody(req);
  const invalid = missingRequired(body, !!image || filled(body.imageUrl));
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const data = pick(body);
  let uploadedUrl: string | null = null;
  if (image) {
    const result = await uploadOrError(image);
    if (result instanceof NextResponse) return result;
    uploadedUrl = data.imageUrl = result;
  }

  try {
    const event = await prisma.dFCEvent.create({
      data: {
        ...data,
        title: String(body.title),
        // Fixed at creation (later title edits keep the URL stable).
        slug: await uniqueEventSlug(String(body.title)),
        date: new Date(body.date as string),
      } as Parameters<typeof prisma.dFCEvent.create>[0]["data"],
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    // Don't leave an orphaned upload behind when the event wasn't saved.
    await deleteImageByUrl(uploadedUrl);
    logger.error("CreateEvent", error);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const { body, image, fullForm } = await readBody(req);
  const id = body.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  const existing = await prisma.dFCEvent.findUnique({
    where: { id },
    select: { imageUrl: true, date: true, endDate: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  // Past events are a record of what happened: their details are locked.
  // Visibility switches (publish/feature/banner) from the list still work.
  if (fullForm && hasEnded(existing)) {
    return NextResponse.json({ error: "Past events can't be edited." }, { status: 409 });
  }

  // Flag toggles from the list send JSON; only the full edit form is validated.
  if (fullForm) {
    const invalid = missingRequired(body, !!image || filled(body.imageUrl));
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const data = pick(body);
  let uploadedUrl: string | null = null;
  if (image) {
    const result = await uploadOrError(image);
    if (result instanceof NextResponse) return result;
    uploadedUrl = data.imageUrl = result;
  }

  try {
    const event = await prisma.dFCEvent.update({ where: { id }, data });
    // Image replaced or removed: drop the old file from Cloudinary.
    if ("imageUrl" in data && existing.imageUrl && existing.imageUrl !== event.imageUrl) {
      await deleteImageByUrl(existing.imageUrl);
    }
    return NextResponse.json({ event });
  } catch (error) {
    await deleteImageByUrl(uploadedUrl);
    logger.error("UpdateEvent", error);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  const event = await prisma.dFCEvent.delete({ where: { id } });
  await deleteImageByUrl(event.imageUrl);
  return NextResponse.json({ success: true });
}
