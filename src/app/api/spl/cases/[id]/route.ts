import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const splCase = await prisma.sPLCase.findFirst({
      where: {
        id,
        partnerId: splAdmin.partnerId,
      },
      include: {
        partner: true,
        contract: true,
      },
    });

    if (!splCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(splCase);
  } catch (error) {
    logger.error('SplCaseDetail', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
