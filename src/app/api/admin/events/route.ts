import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  const events = await prisma.dFCEvent.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { title, description, type, date, endDate, time, location, city, isVirtual, virtualLink, imageUrl, registrationUrl, isPublished, isFeatured } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required." }, { status: 400 });
  }

  const event = await prisma.dFCEvent.create({
    data: {
      title,
      description: description || null,
      type: type || "GENERAL",
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      time: time || null,
      location: location || null,
      city: city || null,
      isVirtual: isVirtual || false,
      virtualLink: virtualLink || null,
      imageUrl: imageUrl || null,
      registrationUrl: registrationUrl || null,
      isPublished: isPublished || false,
      isFeatured: isFeatured || false,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  if (data.date) data.date = new Date(data.date);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const event = await prisma.dFCEvent.update({
    where: { id },
    data,
  });

  return NextResponse.json({ event });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  await prisma.dFCEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
