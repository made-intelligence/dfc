-- CreateEnum
CREATE TYPE "DFCMemberCategory" AS ENUM ('MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER', 'LEGACY_MEMBER');

-- CreateEnum
CREATE TYPE "DFCMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING', 'REVOKED');

-- CreateEnum
CREATE TYPE "LegacyMemberStatus" AS ENUM ('IMPORTED', 'SENT', 'CLAIMED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_MEMBER', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InitiativeType" AS ENUM ('TWG', 'TASK_FORCE', 'COMMITTEE', 'PROJECT');

-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InitiativePillar" AS ENUM ('CLINICAL_SERVICES', 'POLICY_ADVOCACY', 'EDUCATION_TRAINING', 'RESEARCH', 'GOVERNANCE');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_patientId_fkey";

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "city" TEXT,
ADD COLUMN     "diasporaLicence" TEXT,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "mdcnNumber" TEXT,
ADD COLUMN     "subSpecialty" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "appointmentId" DROP NOT NULL,
ALTER COLUMN "patientId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DFCMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "DFCMemberCategory" NOT NULL DEFAULT 'MEMBER',
    "status" "DFCMemberStatus" NOT NULL DEFAULT 'PENDING',
    "goodStanding" BOOLEAN NOT NULL DEFAULT false,
    "path" TEXT,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,
    "lastDuesPaidAt" TIMESTAMP(3),
    "duesExpiresAt" TIMESTAMP(3),
    "registrationFeePaidAt" TIMESTAMP(3),
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "memberNumber" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DFCMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndorsementRecord" (
    "id" TEXT NOT NULL,
    "endorserId" TEXT NOT NULL,
    "endorsedId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "attestation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EndorsementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyMember" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "claimToken" TEXT NOT NULL,
    "status" "LegacyMemberStatus" NOT NULL DEFAULT 'IMPORTED',
    "claimedByUserId" TEXT,
    "sentAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegacyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretariatTicket" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT,
    "assignedToId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "requestType" TEXT,
    "subject" TEXT,
    "rawMessage" TEXT NOT NULL,
    "intent" TEXT,
    "fromPhone" TEXT,
    "fromName" TEXT,
    "aiClassification" JSONB,
    "notes" TEXT,
    "specialty" TEXT,
    "tier" TEXT,
    "documents" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretariatTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "templateName" TEXT,
    "messageBody" TEXT,
    "mediaUrl" TEXT,
    "waMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppBroadcast" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "InitiativeType" NOT NULL DEFAULT 'TWG',
    "status" "InitiativeStatus" NOT NULL DEFAULT 'DRAFT',
    "pillar" "InitiativePillar",
    "remit" TEXT,
    "createdById" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeMember" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InitiativeMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DFCMember_userId_key" ON "DFCMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DFCMember_memberNumber_key" ON "DFCMember"("memberNumber");

-- CreateIndex
CREATE INDEX "DFCMember_status_idx" ON "DFCMember"("status");

-- CreateIndex
CREATE INDEX "DFCMember_category_idx" ON "DFCMember"("category");

-- CreateIndex
CREATE INDEX "DFCMember_goodStanding_idx" ON "DFCMember"("goodStanding");

-- CreateIndex
CREATE UNIQUE INDEX "EndorsementRecord_endorserId_endorsedId_key" ON "EndorsementRecord"("endorserId", "endorsedId");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyMember_claimToken_key" ON "LegacyMember"("claimToken");

-- CreateIndex
CREATE INDEX "LegacyMember_phone_idx" ON "LegacyMember"("phone");

-- CreateIndex
CREATE INDEX "LegacyMember_status_idx" ON "LegacyMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecretariatTicket_reference_key" ON "SecretariatTicket"("reference");

-- CreateIndex
CREATE INDEX "SecretariatTicket_status_idx" ON "SecretariatTicket"("status");

-- CreateIndex
CREATE INDEX "SecretariatTicket_userId_idx" ON "SecretariatTicket"("userId");

-- CreateIndex
CREATE INDEX "SecretariatTicket_requestType_idx" ON "SecretariatTicket"("requestType");

-- CreateIndex
CREATE INDEX "WhatsAppLog_phone_idx" ON "WhatsAppLog"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppLog_userId_idx" ON "WhatsAppLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InitiativeMember_initiativeId_userId_key" ON "InitiativeMember"("initiativeId", "userId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DFCMember" ADD CONSTRAINT "DFCMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndorsementRecord" ADD CONSTRAINT "EndorsementRecord_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "DFCMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndorsementRecord" ADD CONSTRAINT "EndorsementRecord_endorsedId_fkey" FOREIGN KEY ("endorsedId") REFERENCES "DFCMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretariatTicket" ADD CONSTRAINT "SecretariatTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretariatTicket" ADD CONSTRAINT "SecretariatTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeMember" ADD CONSTRAINT "InitiativeMember_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
