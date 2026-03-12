-- CreateEnum
CREATE TYPE "SecondOpinionStatus" AS ENUM ('SUBMITTED', 'PAID', 'ASSIGNED', 'IN_REVIEW', 'REPORT_DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SecondOpinionTier" AS ENUM ('STANDARD', 'COMPLEX', 'ONCOLOGY');

-- CreateTable
CREATE TABLE "SecondOpinionCase" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientDob" TIMESTAMP(3),
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "requesterType" TEXT NOT NULL DEFAULT 'patient',
    "userId" TEXT,
    "specialty" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "proposedTreatment" TEXT,
    "specificQuestions" TEXT,
    "documents" JSONB,
    "tier" "SecondOpinionTier" NOT NULL DEFAULT 'STANDARD',
    "amountKobo" INTEGER NOT NULL DEFAULT 0,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "status" "SecondOpinionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "aiBrief" TEXT,
    "specialistId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedById" TEXT,
    "reviewStartedAt" TIMESTAMP(3),
    "specialistNotes" TEXT,
    "reportContent" TEXT,
    "reportPdfUrl" TEXT,
    "reportDeliveredAt" TIMESTAMP(3),
    "videoCallScheduledAt" TIMESTAMP(3),
    "videoCallLink" TEXT,
    "videoCallCompletedAt" TIMESTAMP(3),
    "coordinatorNotes" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecondOpinionCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecondOpinionCase_reference_key" ON "SecondOpinionCase"("reference");
CREATE UNIQUE INDEX "SecondOpinionCase_paymentReference_key" ON "SecondOpinionCase"("paymentReference");
CREATE INDEX "SecondOpinionCase_status_idx" ON "SecondOpinionCase"("status");
CREATE INDEX "SecondOpinionCase_userId_idx" ON "SecondOpinionCase"("userId");
CREATE INDEX "SecondOpinionCase_specialistId_idx" ON "SecondOpinionCase"("specialistId");
CREATE INDEX "SecondOpinionCase_reference_idx" ON "SecondOpinionCase"("reference");

-- AddForeignKey
ALTER TABLE "SecondOpinionCase" ADD CONSTRAINT "SecondOpinionCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecondOpinionCase" ADD CONSTRAINT "SecondOpinionCase_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
