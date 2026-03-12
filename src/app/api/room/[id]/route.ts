import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { requireConsent } from "@/lib/consent";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Meeting ID (uuid from url)
    const token = getTokenFromCookies(request.headers.get("cookie"));
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find appointment containing this meeting uuid
    const appointment = await prisma.appointment.findFirst({
        where: {
            meetingLink: {
                contains: id
            }
        },
        include: {
            doctor: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    email: true,
                    doctorProfile: {
                        select: {
                            specialty: { select: { name: true } }
                        }
                    }
                }
            },
            patient: {
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            }
        }
    });

    if (!appointment) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Verify participant
    const isDoctor = appointment.doctorId === payload.userId;
    const isPatient = appointment.patientId === payload.userId;

    if (!isDoctor && !isPatient) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check TELEMEDICINE consent for the patient
    if (appointment.patientId) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: appointment.patientId },
        select: { id: true },
      });
      if (patientProfile) {
        const consentError = await requireConsent(patientProfile.id, 'TELEMEDICINE');
        if (consentError) {
          return NextResponse.json({ error: consentError }, { status: 403 });
        }
      }
    }

    // Time Validation (10 minute buffer)
    const now = new Date();
    const apptDate = new Date(appointment.appointmentDate);
    
    const [startH, startM] = appointment.startTime.split(':').map(Number);
    const startDateTime = new Date(apptDate);
    startDateTime.setHours(startH, startM, 0, 0);

    const [endH, endM] = appointment.endTime.split(':').map(Number);
    const endDateTime = new Date(apptDate);
    endDateTime.setHours(endH, endM, 0, 0);

    // Allow joining 10 minutes early
    const allowedJoinTime = new Date(startDateTime.getTime() - 10 * 60000);

    if (now < allowedJoinTime) {
         return NextResponse.json({ 
            error: "It is too early to join this meeting. Please try again 10 minutes before the scheduled time." 
         }, { status: 403 });
    }

    if (now > endDateTime) {
         return NextResponse.json({ 
            error: "This meeting has ended." 
         }, { status: 403 });
    }

    // 0. Update Location if provided (sanitized)
    const url = new URL(request.url);
    const rawLocation = url.searchParams.get("location");

    if (rawLocation) {
        const location = rawLocation
          .replace(/<[^>]*>/g, '')
          .replace(/[<>"'&]/g, '')
          .trim()
          .slice(0, 255);

        if (location && isDoctor) {
            await prisma.appointment.update({
                where: { id: appointment.id },
                data: { doctorLocation: location }
            });
            appointment.doctorLocation = location;
        } else if (location && isPatient) {
             await prisma.appointment.update({
                where: { id: appointment.id },
                data: { patientLocation: location }
            });
            appointment.patientLocation = location;
        }
    }

    // 1. Mark Attendance
    if (isDoctor && !appointment.doctorJoinedAt) {
        await prisma.appointment.update({
            where: { id: appointment.id },
            data: { doctorJoinedAt: new Date() }
        });
    }
    if (isPatient && !appointment.patientJoinedAt) {
        await prisma.appointment.update({
            where: { id: appointment.id },
            data: { patientJoinedAt: new Date() }
        });
    }

    // 2. Check for Next Appointment (Conflict Detection) - For Doc Only
    let nextAppointmentStartTime = null;
    if (isDoctor) {
        const nextAppt = await prisma.appointment.findFirst({
            where: {
                doctorId: appointment.doctorId,
                appointmentDate: appointment.appointmentDate,
                startTime: appointment.endTime, // Starts exactly when current ends
                status: { in: ['PENDING', 'CONFIRMED'] }
            },
            select: { startTime: true }
        });
        if (nextAppt) {
            nextAppointmentStartTime = nextAppt.startTime;
        }
    }

    return NextResponse.json({
        success: true,
        appointment: {
            id: appointment.id,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            appointmentDate: appointment.appointmentDate,
            doctor: appointment.doctor,
            patient: appointment.patient,
            patientLocation: appointment.patientLocation,
            doctorLocation: appointment.doctorLocation,
            nextAppointmentStartTime: nextAppointmentStartTime,
            currentUser: {
                id: payload.userId,
                role: isDoctor ? 'DFC_MEMBER' : 'PATIENT',
                name: isDoctor ? appointment.doctor.name : appointment.patient.name
            }
        }
    });

  } catch (error) {
    logger.error('RoomDetail', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
