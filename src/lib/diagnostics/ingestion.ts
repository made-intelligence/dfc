import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// PIPELINE TIER 1: API webhook (Cerba-Lancet, Synlab)
export async function handleApiResult(
  partnerId: string,
  payload: {
    referralCode?: string;
    patientName?: string;
    testName: string;
    results: { test: string; value: string; unit: string; refRange?: string; flag?: string }[];
    reportDate: string;
    labName?: string;
  }
): Promise<void> {
  try {
    // 1. Match to DiagnosticReferral
    let referral = null;
    if (payload.referralCode) {
      referral = await prisma.diagnosticReferral.findUnique({
        where: { referralCode: payload.referralCode },
      });
    }

    // 2. Determine patient and investigation
    const patientId = referral?.patientId;
    const investigationId = referral?.investigationId;

    if (!patientId) {
      logger.error("DiagnosticIngestion", "Cannot match result to patient");
      return;
    }

    // 3. Check for abnormal values
    const isAbnormal = payload.results.some(
      (r) => r.flag === "H" || r.flag === "L" || r.flag === "C"
    );

    // 4. Create LabResult
    const labResult = await prisma.labResult.create({
      data: {
        patientId,
        investigationId: investigationId || undefined,
        uploadedById: "SYSTEM",
        testName: payload.testName,
        labName: payload.labName || null,
        reportDate: new Date(payload.reportDate),
        results: payload.results,
        isAbnormal,
      },
    });

    // 5. Update DiagnosticReferral status
    if (referral) {
      await prisma.diagnosticReferral.update({
        where: { id: referral.id },
        data: {
          status: "RESULTED",
          resultId: labResult.id,
        },
      });
    }

    // 6. Update InvestigationOrder if linked
    if (investigationId) {
      await prisma.investigationOrder.update({
        where: { id: investigationId },
        data: {
          status: "RESULTED",
          resultedAt: new Date(),
          resultId: labResult.id,
        },
      });
    }

    // 7. Notify physician
    if (referral) {
      await prisma.notification.create({
        data: {
          userId: referral.orderedById,
          title: `Lab result ready: ${payload.testName}`,
          message: isAbnormal
            ? `Abnormal result for ${payload.testName}. Review required.`
            : `Normal result for ${payload.testName}.`,
          type: isAbnormal ? "warning" : "info",
          link: `/emr/results/${labResult.id}`,
        },
      });
    }

    logger.info(
      "DiagnosticIngestion",
      `Result ingested: ${payload.testName} for patient ${patientId}`
    );
  } catch (error) {
    logger.error("DiagnosticIngestion", error);
    throw error;
  }
}

// PIPELINE TIER 2: PDF email parsing (placeholder — requires pdf-parse)
export async function processResultEmail(
  emailFrom: string,
  emailSubject: string,
  _pdfBuffer: Buffer
): Promise<void> {
  try {
    // 1. Identify partner from email address
    const partner = await prisma.diagnosticPartner.findFirst({
      where: { resultEmailAddr: emailFrom },
    });

    if (!partner) {
      logger.error(
        "DiagnosticIngestion",
        `Unknown result email sender: ${emailFrom}`
      );
      return;
    }

    // 2. TODO: Extract text from PDF using pdf-parse
    // 3. TODO: Parse patient name, test name, values, reference ranges
    // 4. TODO: Match to LOINC codes
    // 5. TODO: Create LabResult
    // 6. TODO: Store original PDF to Cloudinary

    logger.info(
      "DiagnosticIngestion",
      `Email result received from ${partner.name}: ${emailSubject}`
    );
  } catch (error) {
    logger.error("DiagnosticIngestionEmail", error);
    throw error;
  }
}

// Generate a unique referral code
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DFC-REF-${code}`;
}
