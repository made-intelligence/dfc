import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospitalId") || "";
    const type = searchParams.get("type") || "";
    const city = searchParams.get("city") || "";
    const date = searchParams.get("date") || "";
    const { page, limit, skip } = parsePagination(searchParams);

    const where: Record<string, unknown> = { isActive: true };

    if (hospitalId) where.hospitalId = hospitalId;
    if (type) where.type = type;
    if (city) {
      where.hospital = { city: { contains: city, mode: "insensitive" } };
    }

    const [spaces, total] = await Promise.all([
      prisma.clinicalSpace.findMany({
        where,
        skip,
        take: limit,
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              logoUrl: true,
            },
          },
          bookings: date
            ? {
                where: {
                  bookingDate: new Date(date),
                  status: { in: ["PENDING", "CONFIRMED"] },
                },
                select: { startTime: true, endTime: true },
              }
            : false,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.clinicalSpace.count({ where }),
    ]);

    const spacesWithAvailability = spaces.map((space) => ({
      id: space.id,
      name: space.name,
      type: space.type,
      floor: space.floor,
      capacity: space.capacity,
      equipment: space.equipment,
      amenities: space.amenities,
      images: space.images,
      hourlyRate: space.hourlyRate,
      halfDayRate: space.halfDayRate,
      fullDayRate: space.fullDayRate,
      currency: space.currency,
      hospital: space.hospital,
      bookedSlots: date && Array.isArray(space.bookings)
        ? space.bookings.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
          }))
        : [],
    }));

    return NextResponse.json({
      spaces: spacesWithAvailability,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("SpacesSearch", error);
    return NextResponse.json(
      { error: "Failed to fetch spaces" },
      { status: 500 }
    );
  }
}
