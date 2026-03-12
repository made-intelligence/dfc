import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminAuth, isAuthError, validatePassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { parsePagination } from "@/lib/pagination";
import { validateFields, MAX_LENGTHS } from "@/lib/validation";
import { auditAdmin } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const { page, limit, skip } = parsePagination(searchParams);

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
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

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

    const fieldError = validateFields(body, {
      name: { required: true, maxLength: MAX_LENGTHS.shortText },
      email: { required: true, maxLength: MAX_LENGTHS.email },
      phone: { maxLength: MAX_LENGTHS.phone },
      password: { required: true },
      bio: { maxLength: MAX_LENGTHS.longText },
      license: { maxLength: MAX_LENGTHS.shortText },
    });
    if (fieldError) return fieldError;

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

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      return NextResponse.json(
        { error: pwCheck.errors.join(". ") },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique slug (batch candidate check)
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const candidates = [baseSlug, ...Array.from({ length: 9 }, (_, i) => `${baseSlug}-${i + 1}`)];
    const existing = await prisma.doctorProfile.findMany({
      where: { slug: { in: candidates } },
      select: { slug: true },
    });
    const taken = new Set(existing.map(e => e.slug));
    const slug = candidates.find(c => !taken.has(c)) || `${baseSlug}-${Date.now()}`;

    // Create user and doctor profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          profileImage,
          role: "DFC_MEMBER",
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

    auditAdmin.userCreate(auth.userId, result.user.id, {
      role: "DFC_MEMBER",
      email: result.user.email,
    }, request);

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
    logger.error('AdminDoctors', error);
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}
