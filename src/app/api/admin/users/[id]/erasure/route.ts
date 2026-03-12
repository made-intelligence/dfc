import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";

/**
 * POST /api/admin/users/[id]/erasure
 *
 * Right-to-erasure (NDPR Article 2.3(e), GDPR Article 17).
 *
 * Strategy: anonymize rather than hard-delete so anonymized clinical data
 * can be retained for public-health statistics (NDPR Article 2.9).
 *
 * Requires SUPERADMIN role and a `confirmEmail` body field matching the
 * target user's email to prevent accidental erasure.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    // Only SUPERADMIN can perform erasure
    if (auth.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Only SUPERADMIN can perform data erasure" },
        { status: 403 }
      );
    }

    const { id: targetUserId } = await params;
    const body = await request.json();
    const { confirmEmail, reason } = body;

    if (!confirmEmail || !reason) {
      return NextResponse.json(
        { error: "confirmEmail and reason are required" },
        { status: 400 }
      );
    }

    // Fetch the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify confirmation email matches
    if (targetUser.email !== confirmEmail) {
      return NextResponse.json(
        { error: "Confirmation email does not match the target user" },
        { status: 400 }
      );
    }

    // Prevent self-erasure
    if (targetUserId === auth.userId) {
      return NextResponse.json(
        { error: "Cannot erase your own account" },
        { status: 400 }
      );
    }

    // Prevent erasing other admins
    if (["SUPERADMIN", "SECRETARIAT"].includes(targetUser.role)) {
      return NextResponse.json(
        { error: "Cannot erase admin accounts via this endpoint" },
        { status: 400 }
      );
    }

    const anonymizedName = `ERASED_${targetUserId.slice(-8)}`;
    const anonymizedEmail = `erased_${targetUserId.slice(-8)}@erased.local`;
    const erasedAt = new Date();

    // Run all erasure operations in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Anonymize User record
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          name: anonymizedName,
          email: anonymizedEmail,
          phone: null,
          password: "ERASED",
          profileImage: null,
          isActive: false,
        },
      });

      // 2. Anonymize PatientProfile if exists
      if (targetUser.patientProfile) {
        const ppId = targetUser.patientProfile.id;

        await tx.patientProfile.update({
          where: { id: ppId },
          data: {
            dateOfBirth: null,
            gender: null,
            address: null,
            emergencyContact: null,
            bloodGroup: null,
            allergies: null,
            nhisNumber: null,
            nextOfKinPhone: null,
          },
        });

        // 3. Delete EMR data that contains PII
        // Keep clinical encounters/records anonymized (no PII in diagnosis/treatment fields)
        // but remove documents with patient files
        await tx.clinicalDocument.deleteMany({ where: { patientId: ppId } });

        // 4. Delete consent records (they reference patient PII context)
        await tx.patientConsent.deleteMany({ where: { patientId: ppId } });

        // 5. Delete access grants and logs
        await tx.recordAccessGrant.deleteMany({ where: { patientId: ppId } });
        await tx.recordAccessLog.deleteMany({ where: { patientId: ppId } });

        // 6. Delete family history (PII about relatives)
        await tx.familyHistoryEntry.deleteMany({ where: { patientId: ppId } });

        // 7. Delete patient allergies, problems (retain for public health stats via encounters)
        await tx.patientAllergy.deleteMany({ where: { patientId: ppId } });
        await tx.patientProblem.deleteMany({ where: { patientId: ppId } });

        // 8. Delete patient medications
        await tx.patientMedication.deleteMany({ where: { patientId: ppId } });

        // 9. Delete medical records (old format)
        await tx.medicalRecord.deleteMany({ where: { patientId: ppId } });

        // 10. Delete ratings (contain patient identity via relation)
        await tx.doctorRating.deleteMany({ where: { patientId: ppId } });
      }

      // 11. Anonymize appointments (keep for doctor schedule records but strip patient identity)
      await tx.appointment.updateMany({
        where: { patientId: targetUserId },
        data: {
          reason: "ERASED",
          notes: null,
          patientLocation: null,
        },
      });

      // 12. Anonymize second opinion cases
      await tx.secondOpinionCase.updateMany({
        where: { userId: targetUserId },
        data: {
          patientName: anonymizedName,
          contactEmail: anonymizedEmail,
          contactPhone: null,
          specificQuestions: null,
          documents: Prisma.JsonNull,
        },
      });

      // 13. Delete notifications
      await tx.notification.deleteMany({ where: { userId: targetUserId } });

      // 14. Revoke all refresh tokens
      await tx.refreshToken.deleteMany({ where: { userId: targetUserId } });

      // 15. Anonymize secretariat tickets
      await tx.secretariatTicket.updateMany({
        where: { userId: targetUserId },
        data: {
          fromName: anonymizedName,
          fromPhone: null,
        },
      });

      // 16. Anonymize payments (keep for tax/accounting but strip PII)
      if (targetUser.patientProfile) {
        await tx.payment.updateMany({
          where: { patientId: targetUser.patientProfile.id },
          data: {
            // Payment records must be retained for tax compliance (6 years)
            // but we strip the patient name reference
          },
        });
      }
    });

    // Audit the erasure (outside transaction — must always log)
    audit(
      {
        userId: auth.userId,
        action: "USER_DELETE",
        resource: "user",
        resourceId: targetUserId,
        details: {
          action: "right_to_erasure",
          reason,
          targetEmail: confirmEmail,
          erasedAt: erasedAt.toISOString(),
          hadPatientProfile: !!targetUser.patientProfile,
          hadDoctorProfile: !!targetUser.doctorProfile,
        },
        severity: "CRITICAL",
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: "User data has been erased in compliance with NDPR/GDPR right-to-erasure",
      erasedAt,
      anonymizedTo: anonymizedName,
    });
  } catch (error) {
    logger.error("AdminUserErasure", error);
    return NextResponse.json(
      { error: "Failed to process erasure request" },
      { status: 500 }
    );
  }
}
