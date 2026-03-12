import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const initiative = await prisma.initiative.findFirst({
      where: { name: "Emergency Response Initiative", status: "ACTIVE" },
      include: {
        pillars: {
          orderBy: { order: "asc" },
          include: {
            members: {
              include: {
                dfcMember: {
                  include: { user: { select: { name: true } } },
                },
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!initiative) {
      return NextResponse.json({ initiative: null });
    }

    const pillars = initiative.pillars.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle,
      focus: p.focus,
      outputs: p.outputs,
      order: p.order,
      memberCount: p.members.length,
      leads: p.members
        .filter((m) => ["CO_LEAD", "LEAD"].includes(m.role))
        .map((m) => ({ name: m.dfcMember.user.name, role: m.role })),
    }));

    return NextResponse.json({
      initiative: {
        name: initiative.name,
        description: initiative.description,
        remit: initiative.remit,
        expectedOutputs: initiative.expectedOutputs,
        pillarCount: pillars.length,
        memberCount: initiative._count.members,
        pillars,
      },
    });
  } catch {
    return NextResponse.json({ initiative: null });
  }
}
