import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const splAdmin = await prisma.sPLAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { partner: true },
    });
    if (!splAdmin)
      return NextResponse.json(
        { error: "SPL profile not found" },
        { status: 404 }
      );

    return NextResponse.json({ partner: splAdmin.partner });
  } catch (error) {
    logger.error('SplSettings', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const splAdmin = await prisma.sPLAdminUser.findUnique({
      where: { userId: payload.userId },
      include: { partner: true },
    });
    if (!splAdmin)
      return NextResponse.json(
        { error: "SPL profile not found" },
        { status: 404 }
      );

    const body = await request.json();
    const { primaryContact, primaryEmail, primaryPhone } = body;

    const updatedPartner = await prisma.sPLPartner.update({
      where: { id: splAdmin.partnerId },
      data: {
        ...(primaryContact !== undefined && { primaryContact }),
        ...(primaryEmail !== undefined && { primaryEmail }),
        ...(primaryPhone !== undefined && { primaryPhone }),
      },
    });

    return NextResponse.json({ partner: updatedPartner });
  } catch (error) {
    logger.error('SplSettings', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
