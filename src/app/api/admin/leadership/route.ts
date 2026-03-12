import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return auth;

  const profiles = await prisma.leadershipProfile.findMany({
    orderBy: [{ group: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { name, title, group, role, bio, imageUrl, linkedinUrl, institution, location, order } = body;

  if (!name || !title || !group) {
    return NextResponse.json({ error: "Name, title, and group are required." }, { status: 400 });
  }

  const profile = await prisma.leadershipProfile.create({
    data: {
      name,
      title,
      group,
      role: role || null,
      bio: bio || null,
      imageUrl: imageUrl || null,
      linkedinUrl: linkedinUrl || null,
      institution: institution || null,
      location: location || null,
      order: order ?? 0,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "Profile ID is required." }, { status: 400 });
  }

  const profile = await prisma.leadershipProfile.update({
    where: { id },
    data,
  });

  return NextResponse.json({ profile });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Profile ID is required." }, { status: 400 });
  }

  await prisma.leadershipProfile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
