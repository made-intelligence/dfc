import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// POST — pharmacy confirms dispensing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rxNumber: string }> }
) {
  try {
    const { rxNumber } = await params;
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey || apiKey !== process.env.PHARMACY_API_KEY) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await request.json();
    const { pharmacyId, itemsDispensed, dispensedBy, notes } = body;

    if (!pharmacyId || !itemsDispensed || !Array.isArray(itemsDispensed)) {
      return NextResponse.json(
        { error: "pharmacyId and itemsDispensed array are required" },
        { status: 400 }
      );
    }

    const prescription = await prisma.prescription.findUnique({
      where: { rxNumber },
      include: { items: true },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Prescription has been cancelled" },
        { status: 410 }
      );
    }

    if (prescription.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Prescription has expired" },
        { status: 410 }
      );
    }

    // Verify pharmacy exists
    const pharmacy = await prisma.partnerPharmacy.findUnique({
      where: { id: pharmacyId },
    });
    if (!pharmacy || !pharmacy.isActive) {
      return NextResponse.json(
        { error: "Pharmacy not found or inactive" },
        { status: 404 }
      );
    }

    // Create dispensing log and update prescription in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create dispensing log
      const log = await tx.pharmacyDispensingLog.create({
        data: {
          prescriptionId: prescription.id,
          pharmacyId,
          dispensedBy: dispensedBy || null,
          itemsDispensed,
          notes: notes || null,
        },
      });

      // Update prescription status
      await tx.prescription.update({
        where: { id: prescription.id },
        data: {
          status: "DISPENSED",
          dispensedAt: new Date(),
          dispensedBy: dispensedBy || pharmacy.name,
        },
      });

      // Create PatientMedication records for each dispensed item
      for (const item of prescription.items) {
        const isDispensed = itemsDispensed.some(
          (d: { drugName: string }) =>
            d.drugName?.toLowerCase() === item.drugName.toLowerCase()
        );
        if (isDispensed) {
          await tx.patientMedication.create({
            data: {
              patientId: prescription.patientId,
              prescribedById: prescription.prescribedById,
              prescriptionId: prescription.id,
              drugName: item.drugName,
              dose: item.dose,
              form: item.form,
              route: item.route,
              frequency: item.frequency,
              duration: item.duration,
              status: "ACTIVE",
            },
          });
        }
      }

      return log;
    });

    return NextResponse.json({
      dispensingLog: {
        id: result.id,
        dispensedAt: result.dispensedAt,
        pharmacy: pharmacy.name,
      },
      message: "Prescription dispensed successfully",
    });
  } catch (error) {
    logger.error("PharmacyDispense", error);
    return NextResponse.json(
      { error: "Failed to record dispensing" },
      { status: 500 }
    );
  }
}
