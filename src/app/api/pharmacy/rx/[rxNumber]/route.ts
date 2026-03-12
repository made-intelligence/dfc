import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET — pharmacy scans QR / looks up prescription
// Auth: API key for partner pharmacies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rxNumber: string }> }
) {
  try {
    const { rxNumber } = await params;
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey || apiKey !== process.env.PHARMACY_API_KEY) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { rxNumber },
      include: {
        items: true,
        encounter: {
          select: {
            doctor: {
              select: {
                user: { select: { name: true } },
                title: true,
                specialty: { select: { name: true } },
                mdcnNumber: true,
              },
            },
            patient: {
              select: {
                user: { select: { name: true } },
                dateOfBirth: true,
                gender: true,
                bloodGroup: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This prescription has been cancelled" },
        { status: 410 }
      );
    }

    if (prescription.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This prescription has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      prescription: {
        rxNumber: prescription.rxNumber,
        status: prescription.status,
        createdAt: prescription.createdAt,
        expiresAt: prescription.expiresAt,
        prescriber: {
          name: prescription.encounter.doctor.user.name,
          title: prescription.encounter.doctor.title,
          specialty: prescription.encounter.doctor.specialty?.name,
          mdcnNumber: prescription.encounter.doctor.mdcnNumber,
        },
        patient: {
          name: prescription.encounter.patient.user.name,
          dateOfBirth: prescription.encounter.patient.dateOfBirth,
          gender: prescription.encounter.patient.gender,
        },
        items: prescription.items.map((item) => ({
          drugName: item.drugName,
          dose: item.dose,
          form: item.form,
          route: item.route,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions,
        })),
      },
    });
  } catch (error) {
    logger.error("PharmacyRxLookup", error);
    return NextResponse.json(
      { error: "Failed to look up prescription" },
      { status: 500 }
    );
  }
}
