import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              user: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              specialty: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const [doctors, totalDoctors, activeDoctors, avgRating, newThisMonth] =
      await Promise.all([
        prisma.doctorProfile.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
            specialty: {
              select: {
                name: true,
              },
            },
            ratings: {
              select: { rating: true },
            },
            appointments: {
              where: { status: "COMPLETED" },
              select: { id: true },
            },
          },
        }),
        prisma.doctorProfile.count(),
        prisma.doctorProfile.count({ where: { isAvailable: true } }),
        prisma.doctorRating.aggregate({ _avg: { rating: true } }),
        prisma.doctorProfile.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    const doctorsWithStats = doctors.map((doctor) => ({
      id: doctor.user.id,
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      specialty: doctor.specialty?.name || "General",
      consultationFee: doctor.consultationFee,
      isActive: doctor.user.isActive,
      rating:
        doctor.ratings.length > 0
          ? doctor.ratings.reduce((sum, r) => sum + r.rating, 0) /
            doctor.ratings.length
          : 0,
      totalPatients: doctor.appointments.length,
      joinDate: doctor.createdAt,
    }));

    return NextResponse.json({
      doctors: doctorsWithStats,
      stats: {
        totalDoctors,
        activeDoctors,
        avgRating: avgRating._avg.rating || 0,
        newThisMonth,
      },
      pagination: {
        page,
        limit,
        total: totalDoctors,
        pages: Math.ceil(totalDoctors / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      profileImage,
      license,
      experience,
      bio,
      consultationFee,
      specialtyId,
    } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.doctorProfile.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create user and doctor profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          profileImage,
          role: "DOCTOR",
        },
      });

      const doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          slug,
          license,
          experience: parseInt(experience),
          bio,
          consultationFee: parseFloat(consultationFee),
          specialtyId: specialtyId || null,
        },
      });

      return { user, doctorProfile };
    });

    return NextResponse.json({
      message: "Doctor created successfully",
      doctor: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        slug: result.doctorProfile.slug,
      },
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}
