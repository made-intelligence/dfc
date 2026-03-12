import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, AppointmentStatus, Prisma } from "@prisma/client";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

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
      include: { patientProfile: true },
    });

    if (!user || user.role !== UserRole.PATIENT) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: user.id },
      include: {
        doctor: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        doctorProfile: {
          select: {
            specialty: {
              select: {
                name: true,
              },
            },
            consultationFee: true,
            currency: true,
          },
        },
      },
      orderBy: [{ appointmentDate: "desc" }, { startTime: "asc" }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    logger.error('PatientAppointments', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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
      include: { patientProfile: true },
    });

    if (!user || user.role !== UserRole.PATIENT) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, appointmentDate: newDate, startTime: newStartTime, endTime: newEndTime } = body;

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id, patientId: user.id }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Time Check Logic (Common for Cancel & Reschedule)
    const apptDate = new Date(existingAppointment.appointmentDate);
    const [hours, mins] = existingAppointment.startTime.split(':').map(Number);
    apptDate.setHours(hours, mins, 0, 0);

    const now = new Date();
    const diffMs = apptDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    // 24 Hour Policy (1440 minutes)
    if (diffMinutes < 1440) {
       return NextResponse.json(
        { error: "Appointments cannot be cancelled or rescheduled less than 24 hours in advance." },
        { status: 400 }
      );
    }

    let updateData: Prisma.AppointmentUpdateInput = {};

    // 1. Cancellation
    if (status === AppointmentStatus.CANCELLED) {
       updateData.status = AppointmentStatus.CANCELLED;
    } 
    // 2. Rescheduling
    else if (newDate && newStartTime && newEndTime) {
       // Validate new time is in future
       const newStartDateTime = new Date(newDate);
       const [newH, newM] = newStartTime.split(':').map(Number);
       newStartDateTime.setHours(newH, newM, 0, 0);
       
       if (newStartDateTime <= now) {
           return NextResponse.json({ error: "New appointment time must be in the future." }, { status: 400 });
       }

       // Check Conflict
       const conflict = await prisma.appointment.findFirst({
           where: {
               doctorId: existingAppointment.doctorId,
               appointmentDate: newDate,
               status: { in: ['PENDING', 'CONFIRMED'] },
               OR: [
                   // Simple overlap check
                   { startTime: { lte: newStartTime }, endTime: { gt: newStartTime } },
                   { startTime: { lt: newEndTime }, endTime: { gte: newEndTime } }
               ]
           }
       });

       if (conflict) {
           return NextResponse.json({ error: "The selected time slot is already booked." }, { status: 400 });
       }

       updateData.appointmentDate = newDate;
       updateData.startTime = newStartTime;
       updateData.endTime = newEndTime;
       updateData.status = AppointmentStatus.PENDING; // Reset to PENDING for doctor to confirm? Or keep CONFIRMED?
       // Let's reset to PENDING so doctor acknowledges the change.
    }
    else {
         return NextResponse.json(
            { error: "Invalid action. Provide status=CANCELLED or new date/time for rescheduling." },
            { status: 400 }
          );
    }

    const appointment = await prisma.appointment.update({
      where: {
        id,
        patientId: user.id,
      },
      data: updateData,
      include: {
        doctor: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        doctorProfile: {
          select: {
            specialty: {
              select: {
                name: true,
              },
            },
            consultationFee: true,
            currency: true,
          },
        },
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    logger.error('PatientAppointments', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
