import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";
import { authenticatePharmacy } from "@/lib/pharmacy-auth";

// POST — pharmacy confirms dispensing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rxNumber: string }> }
) {
  try {
    const { rxNumber } = await params;
    // The key says which pharmacy this is; the body cannot choose another.
    const pharmacy = await authenticatePharmacy(request, rxNumber);
    if (pharmacy instanceof NextResponse) return pharmacy;
    const pharmacyId = pharmacy.id;

    const body = await request.json();
    const { itemsDispensed, dispensedBy, notes } = body;

    // Older integrations still send pharmacyId; it must be their own.
    if (body.pharmacyId && body.pharmacyId !== pharmacyId) {
      await audit({
        action: "AUTH_FAILED",
        resource: "prescription",
        resourceId: rxNumber,
        details: { via: "pharmacy_api", reason: "pharmacy_mismatch", pharmacyId, claimedPharmacyId: body.pharmacyId },
        severity: "CRITICAL",
      }, request);
      return NextResponse.json(
        { error: "This key belongs to a different pharmacy" },
        { status: 403 }
      );
    }

    if (!itemsDispensed || !Array.isArray(itemsDispensed)) {
      return NextResponse.json(
        { error: "itemsDispensed array is required" },
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

    // The pharmacy acts by API key, not as a user; who dispensed is in details.
    await audit({
      action: "PRESCRIPTION_DISPENSE",
      resource: "prescription",
      resourceId: prescription.id,
      details: {
        rxNumber,
        pharmacyId,
        pharmacy: pharmacy.name,
        dispensedBy: dispensedBy || null,
        items: itemsDispensed.map((d: { drugName?: string }) => d.drugName),
        dispensingLogId: result.id,
      },
    }, request);

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
