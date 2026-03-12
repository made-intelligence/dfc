import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: id },
      include: {
        user: true,
        ratings: {
          include: {
            patient: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        specialty: { select: { name: true } },
        appointments: {
          include: {
            patient: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        schedules: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const avgRating =
      doctor.ratings.length > 0
        ? doctor.ratings.reduce((sum, r) => sum + r.rating, 0) /
          doctor.ratings.length
        : 0;

    return NextResponse.json({
      id: doctor.id,
      userId: doctor.userId,
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      profileImage: doctor.user.profileImage,
      isActive: doctor.user.isActive,
      specialty: doctor.specialty?.name,
      license: doctor.license,
      experience: doctor.experience,
      bio: doctor.bio,
      consultationFee: doctor.consultationFee,
      isAvailable: doctor.isAvailable,
      createdAt: doctor.createdAt,
      avgRating,
      totalRatings: doctor.ratings.length,
      totalAppointments: doctor.appointments.length,
      recentRatings: doctor.ratings.map((rating) => ({
        id: rating.id,
        rating: rating.rating,
        review: rating.review,
        patientName: rating.patient.user.name,
        createdAt: rating.createdAt,
      })),
      recentAppointments: doctor.appointments.map((apt) => ({
        id: apt.id,
        date: apt.appointmentDate,
        patient: apt.patient.name,
        status: apt.status,
      })),
      schedules: doctor.schedules,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch doctor details" },
      { status: 500 },
    );
  }
}
