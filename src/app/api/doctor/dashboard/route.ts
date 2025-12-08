import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, AppointmentStatus } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== UserRole.DOCTOR || !user.doctorProfile) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Get today's appointments
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: user.id,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Get total patients count
    const uniquePatients = await prisma.appointment.findMany({
      where: {
        doctorId: user.id,
        status: AppointmentStatus.COMPLETED,
      },
      select: { patientId: true },
      distinct: ["patientId"],
    });
    const totalPatients = uniquePatients.length;

    // Get this month's revenue
    const thisMonthAppointments = await prisma.appointment.count({
      where: {
        doctorId: user.id,
        status: AppointmentStatus.COMPLETED,
        appointmentDate: {
          gte: thisMonth,
          lt: nextMonth,
        },
      },
    });

    const thisMonthRevenue = thisMonthAppointments * Number(user.doctorProfile.consultationFee || 0);

    // Get ratings (simplified)
    const avgRating = 4.5; // Placeholder
    const totalRatings = 0; // Placeholder

    // Get recent activity
    const recentAppointments = await prisma.appointment.findMany({
      where: { doctorId: user.id },
      include: {
        patient: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Get upcoming appointments for next 7 days
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: user.id,
        appointmentDate: {
          gte: today,
          lt: nextWeek,
        },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      stats: {
        todayAppointments: todayAppointments.length,
        totalPatients,
        thisMonthRevenue,
        avgRating,
        totalRatings,
      },
      todaySchedule: todayAppointments,
      upcomingAppointments,
      recentActivity: recentAppointments.slice(0, 5),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}