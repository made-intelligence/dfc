import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profiles = await prisma.leadershipProfile.findMany({
      where: { isActive: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
    });

    const grouped: Record<string, typeof profiles> = {};
    for (const p of profiles) {
      if (!grouped[p.group]) grouped[p.group] = [];
      grouped[p.group].push(p);
    }

    return NextResponse.json(
      { profiles: grouped },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch {
    return NextResponse.json({ profiles: {} });
  }
}
