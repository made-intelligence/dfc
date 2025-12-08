import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            doctors: {
              where: {
                isAvailable: true,
                user: {
                  isActive: true,
                },
              },
            },
          },
        },
      },
    });

    const specialtiesWithCount = specialties.map((specialty) => ({
      id: specialty.id,
      name: specialty.name,
      description: specialty.description,
      doctorCount: specialty._count.doctors,
    }));

    return NextResponse.json({
      specialties: specialtiesWithCount,
    });
  } catch (error) {
    console.error("Failed to fetch specialties:", error);
    return NextResponse.json(
      { error: "Failed to fetch specialties" },
      { status: 500 },
    );
  }
}
