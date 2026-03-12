-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'SECRETARIAT', 'DFC_MEMBER', 'PATIENT', 'HOSPITAL_ADMIN', 'SPL_ADMIN');
-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('AVAILABLE', 'BLOCKED', 'HOLIDAY', 'EMERGENCY');
-- CreateEnum
CREATE TYPE "ConsultationMode" AS ENUM ('VIDEO', 'IN_PERSON', 'BOTH');
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');
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
CREATE TYPE "SecondOpinionStatus" AS ENUM ('SUBMITTED', 'PAID', 'ASSIGNED', 'IN_REVIEW', 'REPORT_DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED');
-- CreateEnum
CREATE TYPE "SecondOpinionTier" AS ENUM ('STANDARD', 'COMPLEX', 'ONCOLOGY');
-- CreateEnum
CREATE TYPE "CDSSAlertLevel" AS ENUM ('CRITICAL', 'WARNING', 'INFO');
-- CreateEnum
CREATE TYPE "CDSSAlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'DISMISSED', 'ACTIONED');
-- CreateEnum
CREATE TYPE "HospitalPartnerStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');
-- CreateEnum
CREATE TYPE "HospitalTier" AS ENUM ('STANDARD', 'PREMIUM', 'ENTERPRISE');
-- CreateEnum
CREATE TYPE "SPLContractStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'PAUSED', 'EXPIRED', 'TERMINATED');
-- CreateEnum
CREATE TYPE "SPLContractModel" AS ENUM ('FEE_FOR_SERVICE', 'SUBSCRIPTION', 'HYBRID');
-- CreateEnum
CREATE TYPE "SPLCaseStatus" AS ENUM ('SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_REVIEW', 'REPORT_READY', 'DELIVERED', 'BILLED', 'PAID', 'CANCELLED');
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "provider" TEXT DEFAULT 'local',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "adminProfileId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "license" TEXT,
    "experience" INTEGER NOT NULL,
    "bio" TEXT,
    "consultationFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "country" TEXT NOT NULL DEFAULT 'United Kingdom',
    "institution" TEXT,
    "city" TEXT,
    "subSpecialty" TEXT,
    "title" TEXT,
    "mdcnNumber" TEXT,
    "diasporaLicence" TEXT,
    "consultationFeeNote" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "specialtyId" TEXT,
    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "bloodGroup" TEXT,
    "allergies" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "nationality" TEXT,
    "occupation" TEXT,
    "maritalStatus" TEXT,
    "primaryPhysicianId" TEXT,
    "nhisNumber" TEXT,
    "hmoName" TEXT,
    "hmoPolicyNumber" TEXT,
    "nextOfKinName" TEXT,
    "nextOfKinPhone" TEXT,
    "nextOfKinRelation" TEXT,
    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DoctorSchedule" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "title" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferTime" INTEGER NOT NULL DEFAULT 0,
    "scheduleType" "ScheduleType" NOT NULL DEFAULT 'AVAILABLE',
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "maxBookingsPerSlot" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "consultationMode" "ConsultationMode" NOT NULL DEFAULT 'VIDEO',
    "location" TEXT,
    "notes" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "consultationFee" DOUBLE PRECISION NOT NULL,
    "consultationMode" "ConsultationMode" NOT NULL DEFAULT 'VIDEO',
    "meetingLink" TEXT,
    "clinicLocation" TEXT,
    "patientJoinedAt" TIMESTAMP(3),
    "doctorJoinedAt" TIMESTAMP(3),
    "patientLocation" TEXT,
    "doctorLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "symptoms" TEXT,
    "treatment" TEXT,
    "medications" TEXT,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DoctorSubscription" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DoctorSubscription_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DoctorRating" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DoctorRating_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT,
    "userId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentReference" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "paymentType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "specialty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "specialty_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "general" JSONB,
    "notifications" JSONB,
    "security" JSONB,
    "system" JSONB,
    "payment" JSONB,
    "email" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DFCMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "DFCMemberCategory" NOT NULL DEFAULT 'MEMBER',
    "status" "DFCMemberStatus" NOT NULL DEFAULT 'PENDING',
    "goodStanding" BOOLEAN NOT NULL DEFAULT false,
    "path" TEXT,
    "isLegacy" BOOLEAN NOT NULL DEFAULT false,
    "duesStatus" TEXT NOT NULL DEFAULT 'NOT_YET_DUE',
    "lastDuesPaidAt" TIMESTAMP(3),
    "duesExpiresAt" TIMESTAMP(3),
    "duesPaidAmount" DOUBLE PRECISION,
    "registrationFeePaidAt" TIMESTAMP(3),
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "nigerianLicence" TEXT,
    "acceptsReferrals" BOOLEAN NOT NULL DEFAULT false,
    "memberNumber" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institution" TEXT,
    "isBotMember" BOOLEAN NOT NULL DEFAULT false,
    "paystackSubAccountCode" TEXT,
    "excoPosition" TEXT,
    "excoElectedAt" TIMESTAMP(3),
    "excoTermEnd" TIMESTAMP(3),
    "profileCompletionScore" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    CONSTRAINT "DFCMember_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "EndorsementRecord" (
    "id" TEXT NOT NULL,
    "endorserId" TEXT NOT NULL,
    "endorsedId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "yearsKnown" INTEGER,
    "attestation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EndorsementRecord_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "MedicalCredential" (
    "id" TEXT NOT NULL,
    "dfcMemberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "specialty" TEXT,
    "subSpecialty" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,
    "documentUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MedicalCredential_pkey" PRIMARY KEY ("id")
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
    "remit" TEXT,
    "expectedOutputs" TEXT,
    "createdById" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "InitiativePillar" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "focus" TEXT,
    "outputs" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InitiativePillar_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "InitiativeMember" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "dfcMemberId" TEXT NOT NULL,
    "pillarId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InitiativeMember_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "LeadershipProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "role" TEXT,
    "bio" TEXT,
    "imageUrl" TEXT,
    "linkedinUrl" TEXT,
    "institution" TEXT,
    "location" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeadershipProfile_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DFCProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "type" TEXT,
    "imageUrl" TEXT,
    "joinUrl" TEXT,
    "supportUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DFCProject_pkey" PRIMARY KEY ("id")
);
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
-- CreateTable
CREATE TABLE "DFCEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "time" TEXT,
    "location" TEXT,
    "city" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "virtualLink" TEXT,
    "imageUrl" TEXT,
    "registrationUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DFCEvent_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ClinicalEncounter" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "encounterType" TEXT NOT NULL,
    "encounterDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "chiefComplaint" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "primaryDiagnosis" TEXT,
    "secondaryDiagnoses" JSONB,
    "rawTranscript" TEXT,
    "scribeNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "signedById" TEXT,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClinicalEncounter_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VitalSign" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "temperature" DECIMAL(4,1),
    "oxygenSat" DECIMAL(4,1),
    "weight" DECIMAL(5,1),
    "height" DECIMAL(5,1),
    "bmi" DECIMAL(4,1),
    "bloodGlucose" DECIMAL(5,1),
    "notes" TEXT,
    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PatientProblem" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "icdCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "onsetDate" TIMESTAMP(3),
    "resolvedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PatientProblem_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "allergyType" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PatientMedication" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescribedById" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "drugName" TEXT NOT NULL,
    "brandName" TEXT,
    "dose" TEXT NOT NULL,
    "form" TEXT,
    "route" TEXT,
    "frequency" TEXT NOT NULL,
    "duration" TEXT,
    "indication" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "discontinuedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PatientMedication_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescribedById" TEXT NOT NULL,
    "rxNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "dispensedAt" TIMESTAMP(3),
    "dispensedBy" TEXT,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "form" TEXT,
    "route" TEXT,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "quantity" TEXT,
    "instructions" TEXT,
    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "InvestigationOrder" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "orderedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'ROUTINE',
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "orderRef" TEXT,
    "resultId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultedAt" TIMESTAMP(3),
    CONSTRAINT "InvestigationOrder_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "investigationId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "labName" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,
    "results" JSONB,
    "interpretation" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ClinicalDocument" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeKb" INTEGER,
    "isPatientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClinicalDocument_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "EncounterReferral" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "referredById" TEXT NOT NULL,
    "referralType" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'ROUTINE',
    "referredToId" TEXT,
    "referredToName" TEXT,
    "referredToHospital" TEXT,
    "clinicalReason" TEXT NOT NULL,
    "letterUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "responseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EncounterReferral_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "FamilyHistoryEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "ageOfOnset" INTEGER,
    "deceased" BOOLEAN NOT NULL DEFAULT false,
    "causeOfDeath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyHistoryEntry_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "RecordAccessGrant" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "grantedToId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'READ',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RecordAccessGrant_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "RecordAccessLog" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "accessedById" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "RecordAccessLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PatientConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "given" BOOLEAN NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "witnessName" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    CONSTRAINT "PatientConsent_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "CDSSAlert" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "generatedForId" TEXT NOT NULL,
    "level" "CDSSAlertLevel" NOT NULL,
    "status" "CDSSAlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceData" JSONB,
    "suggestion" TEXT,
    "dismissedReason" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CDSSAlert_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "CDSSInteractionLog" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "physicianId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CDSSInteractionLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "HospitalPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "HospitalPartnerStatus" NOT NULL DEFAULT 'PENDING',
    "tier" "HospitalTier" NOT NULL DEFAULT 'STANDARD',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "rcNumber" TEXT,
    "licenseNumber" TEXT,
    "logoUrl" TEXT,
    "bedCount" INTEGER,
    "specialties" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paystackSubAccountCode" TEXT,
    CONSTRAINT "HospitalPartner_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "HospitalAdminUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HospitalAdminUser_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DeploymentWindow" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "specialistCount" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeploymentWindow_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SpecialistVerification" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "specialistName" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "documentUrl" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SpecialistVerification_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SPLPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "SPLContractStatus" NOT NULL DEFAULT 'DRAFT',
    "logoUrl" TEXT,
    "primaryContact" TEXT,
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "rcNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SPLPartner_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SPLContract" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "model" "SPLContractModel" NOT NULL,
    "status" "SPLContractStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "specialties" JSONB,
    "serviceTypes" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "feeSchedule" JSONB,
    "subscriptionFeeMonthly" DECIMAL(12,2),
    "subscribedVolume" INTEGER,
    "subscriptionPeriod" TEXT,
    "dfcPlatformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalNoticeDays" INTEGER NOT NULL DEFAULT 60,
    "contractUrl" TEXT,
    "contractSignedAt" TIMESTAMP(3),
    "casesDeliveredThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "casesRemainingThisPeriod" INTEGER,
    "revenueThisPeriod" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SPLContract_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SPLCase" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "hmoPartnerId" TEXT,
    "serviceType" TEXT NOT NULL,
    "status" "SPLCaseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "patientRef" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientDob" TEXT,
    "patientEmail" TEXT,
    "patientPhone" TEXT,
    "membershipNumber" TEXT,
    "specialty" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "clinicalSummary" TEXT,
    "documentUrls" JSONB,
    "triageNotes" TEXT,
    "assignedToId" TEXT,
    "aiBrief" TEXT,
    "reportText" TEXT,
    "reportPdfUrl" TEXT,
    "coordinatorNotes" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "agreedFee" DECIMAL(12,2),
    "dfcPlatformFee" DECIMAL(12,2),
    "specialistFee" DECIMAL(12,2),
    "invoiceId" TEXT,
    "paidAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SPLCase_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SPLInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "caseCount" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "dfcFee" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SPLInvoice_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SPLAdminUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SPLAdminUser_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "StandingCommittee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "description" TEXT,
    "mandate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StandingCommittee_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "userId" TEXT,
    "memberName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isUnlinked" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ProfileViewLog" (
    "id" TEXT NOT NULL,
    "profileUserId" TEXT NOT NULL,
    "viewerType" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "source" TEXT,
    "city" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileViewLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "EarningsLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarningsLedger_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ClinicalQuestion" (
    "id" TEXT NOT NULL,
    "submittedBy" TEXT,
    "specialty" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "slug" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClinicalQuestion_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ClinicalAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClinicalAnswer_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "MemberReputationScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "answersGiven" INTEGER NOT NULL DEFAULT 0,
    "helpfulRating" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "profileViews90d" INTEGER NOT NULL DEFAULT 0,
    "cmeHours" INTEGER NOT NULL DEFAULT 0,
    "casesReviewed" INTEGER NOT NULL DEFAULT 0,
    "deploymentsCompleted" INTEGER NOT NULL DEFAULT 0,
    "endorsementsReceived" INTEGER NOT NULL DEFAULT 0,
    "credentialsVerified" BOOLEAN NOT NULL DEFAULT false,
    "bySpecialty" JSONB,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MemberReputationScore_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ClinicalSpace" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "floor" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "equipment" JSONB,
    "amenities" JSONB,
    "images" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" DECIMAL(10,2),
    "halfDayRate" DECIMAL(10,2),
    "fullDayRate" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "partnerHourlyRate" DECIMAL(10,2),
    "partnerHalfDayRate" DECIMAL(10,2),
    "partnerFullDayRate" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClinicalSpace_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SpaceAvailability" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "specificDate" TIMESTAMP(3),
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    CONSTRAINT "SpaceAvailability_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SpaceBooking" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationType" TEXT NOT NULL,
    "durationHours" DECIMAL(4,1) NOT NULL,
    "memberRate" DECIMAL(10,2) NOT NULL,
    "partnerRate" DECIMAL(10,2) NOT NULL,
    "dfcMargin" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "credentialSnapshot" JSONB NOT NULL,
    "indemnityValid" BOOLEAN NOT NULL,
    "paymentReference" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "purpose" TEXT,
    "specialEquipment" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SpaceBooking_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DiagnosticPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "integrationMode" TEXT NOT NULL,
    "apiBaseUrl" TEXT,
    "apiKeyEnvVar" TEXT,
    "resultEmailAddr" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiagnosticPartner_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DiagnosticCentre" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "coordinates" JSONB,
    "openingHours" JSONB,
    "capabilities" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiagnosticCentre_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DiagnosticRateSchedule" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "loincCode" TEXT NOT NULL,
    "investigationName" TEXT NOT NULL,
    "partnerRate" DECIMAL(10,2) NOT NULL,
    "dfcRate" DECIMAL(10,2) NOT NULL,
    "dfcMargin" DECIMAL(5,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "turnaroundHours" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "negotiatedBy" TEXT,
    "approvedByExCo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiagnosticRateSchedule_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DiagnosticReferral" (
    "id" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "orderedById" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "partnerId" TEXT,
    "centreId" TEXT,
    "loincCode" TEXT NOT NULL,
    "investigationName" TEXT NOT NULL,
    "dfcRate" DECIMAL(10,2) NOT NULL,
    "physicianMarkup" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "patientPrice" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "qrCodeUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "transmittedAt" TIMESTAMP(3),
    "resultId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiagnosticReferral_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DiagnosisCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "block" TEXT,
    "isNigerianTop" BOOLEAN NOT NULL DEFAULT false,
    "nigeriaWeighting" INTEGER NOT NULL DEFAULT 0,
    "isDSM5" BOOLEAN NOT NULL DEFAULT false,
    "searchTerms" TEXT,
    CONSTRAINT "DiagnosisCode_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "FormularyDrug" (
    "id" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "brandNames" JSONB,
    "atcCode" TEXT,
    "doseStrengths" JSONB NOT NULL,
    "forms" JSONB NOT NULL,
    "routes" JSONB NOT NULL,
    "frequencies" JSONB NOT NULL,
    "indication" TEXT,
    "nigeriaAvailable" TEXT NOT NULL DEFAULT 'WIDELY_AVAILABLE',
    "esml" BOOLEAN NOT NULL DEFAULT false,
    "nigeriaWeighting" INTEGER NOT NULL DEFAULT 0,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "pregnancyCategory" TEXT,
    "lactationSafe" TEXT,
    "contraindications" JSONB,
    "blackBoxWarnings" JSONB,
    "sideEffects" JSONB,
    "isHighAlert" BOOLEAN NOT NULL DEFAULT false,
    "maxDosePerDay" TEXT,
    "renalAdjustment" JSONB,
    "hepaticAdjustment" JSONB,
    "paediatricDosing" JSONB,
    "geriatricNotes" TEXT,
    "therapeuticClassId" TEXT,
    "formularyTier" TEXT NOT NULL DEFAULT 'UNRESTRICTED',
    "nafdacRegNumber" TEXT,
    CONSTRAINT "FormularyDrug_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "TherapeuticClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    CONSTRAINT "TherapeuticClass_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DrugInteraction" (
    "id" TEXT NOT NULL,
    "drugAId" TEXT NOT NULL,
    "drugBId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "mechanism" TEXT NOT NULL,
    "clinicalEffect" TEXT NOT NULL,
    "management" TEXT NOT NULL,
    "evidence" TEXT NOT NULL DEFAULT 'ESTABLISHED',
    "source" TEXT,
    CONSTRAINT "DrugInteraction_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PartnerPharmacy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chain" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "onlineOrderUrl" TEXT,
    "apiEndpoint" TEXT,
    "paystackSubAccountCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerPharmacy_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PharmacyDispensingLog" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensedBy" TEXT,
    "itemsDispensed" JSONB NOT NULL,
    "notes" TEXT,
    CONSTRAINT "PharmacyDispensingLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DrugRateSchedule" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "pharmacyId" TEXT,
    "partnerRate" DECIMAL(10,2) NOT NULL,
    "dfcRate" DECIMAL(10,2) NOT NULL,
    "dfcMargin" DECIMAL(5,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    CONSTRAINT "DrugRateSchedule_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SPLSpecialtyActivation" (
    "id" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "minAnchorCity" INTEGER NOT NULL,
    "minSecondaryCity" INTEGER NOT NULL,
    "currentAnchorCount" INTEGER NOT NULL DEFAULT 0,
    "currentSecondaryCount" INTEGER NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SPLSpecialtyActivation_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "HMOPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "logoUrl" TEXT,
    "livesUnderMgmt" INTEGER NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "equityClass" TEXT,
    "equityPercent" DECIMAL(5,2),
    "equityPaidNgn" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HMOPartner_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "HMOContract" (
    "id" TEXT NOT NULL,
    "hmoId" TEXT NOT NULL,
    "contractRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3) NOT NULL,
    "livesCommitted" INTEGER NOT NULL,
    "signupFeePerLife" DECIMAL(8,2) NOT NULL,
    "signupFeeTotal" DECIMAL(14,2) NOT NULL,
    "signupFeeStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "volumeCommitments" JSONB NOT NULL,
    "tariffTiers" JSONB NOT NULL,
    "dfcPlatformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HMOContract_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "InvestigationCode" (
    "id" TEXT NOT NULL,
    "loincCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commonName" TEXT,
    "category" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "fastingRequired" BOOLEAN NOT NULL DEFAULT false,
    "nigeriaWeighting" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvestigationCode_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");
-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");
-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminProfileId_permissionId_key" ON "AdminPermission"("adminProfileId", "permissionId");
-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_slug_key" ON "DoctorProfile"("slug");
-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_license_key" ON "DoctorProfile"("license");
-- CreateIndex
CREATE INDEX "DoctorProfile_specialtyId_idx" ON "DoctorProfile"("specialtyId");
-- CreateIndex
CREATE INDEX "DoctorProfile_isAvailable_idx" ON "DoctorProfile"("isAvailable");
-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");
-- CreateIndex
CREATE INDEX "DoctorSchedule_doctorId_dayOfWeek_idx" ON "DoctorSchedule"("doctorId", "dayOfWeek");
-- CreateIndex
CREATE INDEX "DoctorSchedule_doctorId_scheduleType_idx" ON "DoctorSchedule"("doctorId", "scheduleType");
-- CreateIndex
CREATE INDEX "Appointment_doctorId_status_idx" ON "Appointment"("doctorId", "status");
-- CreateIndex
CREATE INDEX "Appointment_patientId_status_idx" ON "Appointment"("patientId", "status");
-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");
-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_appointmentId_key" ON "MedicalRecord"("appointmentId");
-- CreateIndex
CREATE UNIQUE INDEX "DoctorSubscription_paymentReference_key" ON "DoctorSubscription"("paymentReference");
-- CreateIndex
CREATE UNIQUE INDEX "DoctorRating_doctorId_patientId_key" ON "DoctorRating"("doctorId", "patientId");
-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentReference_key" ON "Payment"("paymentReference");
-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
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
CREATE INDEX "MedicalCredential_dfcMemberId_idx" ON "MedicalCredential"("dfcMemberId");
-- CreateIndex
CREATE INDEX "MedicalCredential_registrationNumber_idx" ON "MedicalCredential"("registrationNumber");
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
CREATE UNIQUE INDEX "Initiative_name_key" ON "Initiative"("name");
-- CreateIndex
CREATE UNIQUE INDEX "InitiativePillar_initiativeId_name_key" ON "InitiativePillar"("initiativeId", "name");
-- CreateIndex
CREATE UNIQUE INDEX "InitiativeMember_initiativeId_dfcMemberId_pillarId_key" ON "InitiativeMember"("initiativeId", "dfcMemberId", "pillarId");
-- CreateIndex
CREATE INDEX "LeadershipProfile_group_idx" ON "LeadershipProfile"("group");
-- CreateIndex
CREATE UNIQUE INDEX "SecondOpinionCase_reference_key" ON "SecondOpinionCase"("reference");
-- CreateIndex
CREATE UNIQUE INDEX "SecondOpinionCase_paymentReference_key" ON "SecondOpinionCase"("paymentReference");
-- CreateIndex
CREATE INDEX "SecondOpinionCase_status_idx" ON "SecondOpinionCase"("status");
-- CreateIndex
CREATE INDEX "SecondOpinionCase_userId_idx" ON "SecondOpinionCase"("userId");
-- CreateIndex
CREATE INDEX "SecondOpinionCase_specialistId_idx" ON "SecondOpinionCase"("specialistId");
-- CreateIndex
CREATE INDEX "SecondOpinionCase_reference_idx" ON "SecondOpinionCase"("reference");
-- CreateIndex
CREATE INDEX "DFCEvent_date_idx" ON "DFCEvent"("date");
-- CreateIndex
CREATE INDEX "DFCEvent_isPublished_date_idx" ON "DFCEvent"("isPublished", "date");
-- CreateIndex
CREATE UNIQUE INDEX "ClinicalEncounter_appointmentId_key" ON "ClinicalEncounter"("appointmentId");
-- CreateIndex
CREATE INDEX "ClinicalEncounter_patientId_encounterDate_idx" ON "ClinicalEncounter"("patientId", "encounterDate");
-- CreateIndex
CREATE INDEX "ClinicalEncounter_doctorId_idx" ON "ClinicalEncounter"("doctorId");
-- CreateIndex
CREATE INDEX "ClinicalEncounter_status_idx" ON "ClinicalEncounter"("status");
-- CreateIndex
CREATE INDEX "VitalSign_patientId_recordedAt_idx" ON "VitalSign"("patientId", "recordedAt");
-- CreateIndex
CREATE INDEX "PatientProblem_patientId_status_idx" ON "PatientProblem"("patientId", "status");
-- CreateIndex
CREATE INDEX "PatientAllergy_patientId_idx" ON "PatientAllergy"("patientId");
-- CreateIndex
CREATE INDEX "PatientMedication_patientId_status_idx" ON "PatientMedication"("patientId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "Prescription_rxNumber_key" ON "Prescription"("rxNumber");
-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");
-- CreateIndex
CREATE INDEX "InvestigationOrder_patientId_idx" ON "InvestigationOrder"("patientId");
-- CreateIndex
CREATE UNIQUE INDEX "LabResult_investigationId_key" ON "LabResult"("investigationId");
-- CreateIndex
CREATE INDEX "LabResult_patientId_reportDate_idx" ON "LabResult"("patientId", "reportDate");
-- CreateIndex
CREATE INDEX "ClinicalDocument_patientId_type_idx" ON "ClinicalDocument"("patientId", "type");
-- CreateIndex
CREATE INDEX "EncounterReferral_patientId_idx" ON "EncounterReferral"("patientId");
-- CreateIndex
CREATE INDEX "FamilyHistoryEntry_patientId_idx" ON "FamilyHistoryEntry"("patientId");
-- CreateIndex
CREATE INDEX "RecordAccessGrant_grantedToId_idx" ON "RecordAccessGrant"("grantedToId");
-- CreateIndex
CREATE UNIQUE INDEX "RecordAccessGrant_patientId_grantedToId_key" ON "RecordAccessGrant"("patientId", "grantedToId");
-- CreateIndex
CREATE INDEX "RecordAccessLog_patientId_accessedAt_idx" ON "RecordAccessLog"("patientId", "accessedAt");
-- CreateIndex
CREATE INDEX "RecordAccessLog_accessedById_idx" ON "RecordAccessLog"("accessedById");
-- CreateIndex
CREATE INDEX "PatientConsent_patientId_type_idx" ON "PatientConsent"("patientId", "type");
-- CreateIndex
CREATE INDEX "CDSSAlert_patientId_status_idx" ON "CDSSAlert"("patientId", "status");
-- CreateIndex
CREATE INDEX "CDSSAlert_encounterId_idx" ON "CDSSAlert"("encounterId");
-- CreateIndex
CREATE INDEX "CDSSAlert_generatedForId_status_idx" ON "CDSSAlert"("generatedForId", "status");
-- CreateIndex
CREATE INDEX "CDSSInteractionLog_physicianId_idx" ON "CDSSInteractionLog"("physicianId");
-- CreateIndex
CREATE INDEX "CDSSInteractionLog_alertId_idx" ON "CDSSInteractionLog"("alertId");
-- CreateIndex
CREATE UNIQUE INDEX "HospitalPartner_slug_key" ON "HospitalPartner"("slug");
-- CreateIndex
CREATE UNIQUE INDEX "HospitalPartner_email_key" ON "HospitalPartner"("email");
-- CreateIndex
CREATE INDEX "HospitalPartner_status_idx" ON "HospitalPartner"("status");
-- CreateIndex
CREATE UNIQUE INDEX "HospitalAdminUser_userId_key" ON "HospitalAdminUser"("userId");
-- CreateIndex
CREATE INDEX "DeploymentWindow_hospitalId_idx" ON "DeploymentWindow"("hospitalId");
-- CreateIndex
CREATE INDEX "DeploymentWindow_status_idx" ON "DeploymentWindow"("status");
-- CreateIndex
CREATE INDEX "SpecialistVerification_hospitalId_idx" ON "SpecialistVerification"("hospitalId");
-- CreateIndex
CREATE INDEX "SpecialistVerification_status_idx" ON "SpecialistVerification"("status");
-- CreateIndex
CREATE UNIQUE INDEX "SPLPartner_primaryEmail_key" ON "SPLPartner"("primaryEmail");
-- CreateIndex
CREATE INDEX "SPLContract_partnerId_status_idx" ON "SPLContract"("partnerId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "SPLCase_referenceNumber_key" ON "SPLCase"("referenceNumber");
-- CreateIndex
CREATE INDEX "SPLCase_partnerId_status_idx" ON "SPLCase"("partnerId", "status");
-- CreateIndex
CREATE INDEX "SPLCase_contractId_idx" ON "SPLCase"("contractId");
-- CreateIndex
CREATE INDEX "SPLCase_referenceNumber_idx" ON "SPLCase"("referenceNumber");
-- CreateIndex
CREATE UNIQUE INDEX "SPLInvoice_invoiceNumber_key" ON "SPLInvoice"("invoiceNumber");
-- CreateIndex
CREATE UNIQUE INDEX "SPLAdminUser_userId_key" ON "SPLAdminUser"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "StandingCommittee_name_key" ON "StandingCommittee"("name");
-- CreateIndex
CREATE UNIQUE INDEX "StandingCommittee_shortCode_key" ON "StandingCommittee"("shortCode");
-- CreateIndex
CREATE INDEX "StandingCommittee_isActive_idx" ON "StandingCommittee"("isActive");
-- CreateIndex
CREATE INDEX "CommitteeMember_committeeId_idx" ON "CommitteeMember"("committeeId");
-- CreateIndex
CREATE INDEX "CommitteeMember_userId_idx" ON "CommitteeMember"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "CommitteeMember_committeeId_userId_key" ON "CommitteeMember"("committeeId", "userId");
-- CreateIndex
CREATE INDEX "ProfileViewLog_profileUserId_viewedAt_idx" ON "ProfileViewLog"("profileUserId", "viewedAt");
-- CreateIndex
CREATE INDEX "ProfileViewLog_viewerType_idx" ON "ProfileViewLog"("viewerType");
-- CreateIndex
CREATE INDEX "EarningsLedger_userId_source_idx" ON "EarningsLedger"("userId", "source");
-- CreateIndex
CREATE INDEX "EarningsLedger_status_idx" ON "EarningsLedger"("status");
-- CreateIndex
CREATE UNIQUE INDEX "ClinicalQuestion_slug_key" ON "ClinicalQuestion"("slug");
-- CreateIndex
CREATE INDEX "ClinicalQuestion_specialty_status_idx" ON "ClinicalQuestion"("specialty", "status");
-- CreateIndex
CREATE INDEX "ClinicalQuestion_slug_idx" ON "ClinicalQuestion"("slug");
-- CreateIndex
CREATE INDEX "ClinicalAnswer_authorId_idx" ON "ClinicalAnswer"("authorId");
-- CreateIndex
CREATE INDEX "ClinicalAnswer_questionId_idx" ON "ClinicalAnswer"("questionId");
-- CreateIndex
CREATE UNIQUE INDEX "MemberReputationScore_userId_key" ON "MemberReputationScore"("userId");
-- CreateIndex
CREATE INDEX "ClinicalSpace_hospitalId_type_isActive_idx" ON "ClinicalSpace"("hospitalId", "type", "isActive");
-- CreateIndex
CREATE INDEX "SpaceAvailability_spaceId_idx" ON "SpaceAvailability"("spaceId");
-- CreateIndex
CREATE INDEX "SpaceBooking_memberId_bookingDate_idx" ON "SpaceBooking"("memberId", "bookingDate");
-- CreateIndex
CREATE INDEX "SpaceBooking_spaceId_bookingDate_idx" ON "SpaceBooking"("spaceId", "bookingDate");
-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticPartner_name_key" ON "DiagnosticPartner"("name");
-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticPartner_slug_key" ON "DiagnosticPartner"("slug");
-- CreateIndex
CREATE INDEX "DiagnosticCentre_city_isActive_idx" ON "DiagnosticCentre"("city", "isActive");
-- CreateIndex
CREATE INDEX "DiagnosticRateSchedule_partnerId_loincCode_idx" ON "DiagnosticRateSchedule"("partnerId", "loincCode");
-- CreateIndex
CREATE INDEX "DiagnosticRateSchedule_effectiveFrom_effectiveTo_idx" ON "DiagnosticRateSchedule"("effectiveFrom", "effectiveTo");
-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticReferral_referralCode_key" ON "DiagnosticReferral"("referralCode");
-- CreateIndex
CREATE INDEX "DiagnosticReferral_patientId_idx" ON "DiagnosticReferral"("patientId");
-- CreateIndex
CREATE INDEX "DiagnosticReferral_orderedById_idx" ON "DiagnosticReferral"("orderedById");
-- CreateIndex
CREATE INDEX "DiagnosticReferral_status_idx" ON "DiagnosticReferral"("status");
-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisCode_code_key" ON "DiagnosisCode"("code");
-- CreateIndex
CREATE INDEX "DiagnosisCode_code_idx" ON "DiagnosisCode"("code");
-- CreateIndex
CREATE INDEX "DiagnosisCode_nigeriaWeighting_idx" ON "DiagnosisCode"("nigeriaWeighting");
-- CreateIndex
CREATE INDEX "DiagnosisCode_isDSM5_idx" ON "DiagnosisCode"("isDSM5");
-- CreateIndex
CREATE INDEX "FormularyDrug_genericName_idx" ON "FormularyDrug"("genericName");
-- CreateIndex
CREATE INDEX "FormularyDrug_nigeriaWeighting_idx" ON "FormularyDrug"("nigeriaWeighting");
-- CreateIndex
CREATE INDEX "FormularyDrug_atcCode_idx" ON "FormularyDrug"("atcCode");
-- CreateIndex
CREATE INDEX "FormularyDrug_therapeuticClassId_idx" ON "FormularyDrug"("therapeuticClassId");
-- CreateIndex
CREATE UNIQUE INDEX "TherapeuticClass_name_key" ON "TherapeuticClass"("name");
-- CreateIndex
CREATE INDEX "TherapeuticClass_category_idx" ON "TherapeuticClass"("category");
-- CreateIndex
CREATE INDEX "TherapeuticClass_parentId_idx" ON "TherapeuticClass"("parentId");
-- CreateIndex
CREATE INDEX "DrugInteraction_drugAId_idx" ON "DrugInteraction"("drugAId");
-- CreateIndex
CREATE INDEX "DrugInteraction_drugBId_idx" ON "DrugInteraction"("drugBId");
-- CreateIndex
CREATE INDEX "DrugInteraction_severity_idx" ON "DrugInteraction"("severity");
-- CreateIndex
CREATE UNIQUE INDEX "DrugInteraction_drugAId_drugBId_key" ON "DrugInteraction"("drugAId", "drugBId");
-- CreateIndex
CREATE INDEX "PartnerPharmacy_city_isActive_idx" ON "PartnerPharmacy"("city", "isActive");
-- CreateIndex
CREATE INDEX "DrugRateSchedule_drugId_idx" ON "DrugRateSchedule"("drugId");
-- CreateIndex
CREATE UNIQUE INDEX "SPLSpecialtyActivation_specialty_key" ON "SPLSpecialtyActivation"("specialty");
-- CreateIndex
CREATE UNIQUE INDEX "HMOPartner_name_key" ON "HMOPartner"("name");
-- CreateIndex
CREATE UNIQUE INDEX "HMOPartner_shortCode_key" ON "HMOPartner"("shortCode");
-- CreateIndex
CREATE UNIQUE INDEX "HMOContract_contractRef_key" ON "HMOContract"("contractRef");
-- CreateIndex
CREATE INDEX "HMOContract_hmoId_status_idx" ON "HMOContract"("hmoId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "InvestigationCode_loincCode_key" ON "InvestigationCode"("loincCode");
-- CreateIndex
CREATE INDEX "InvestigationCode_category_idx" ON "InvestigationCode"("category");
-- CreateIndex
CREATE INDEX "InvestigationCode_nigeriaWeighting_idx" ON "InvestigationCode"("nigeriaWeighting");
-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");
-- CreateIndex
CREATE INDEX "AuditLog_severity_createdAt_idx" ON "AuditLog"("severity", "createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");
-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_adminProfileId_fkey" FOREIGN KEY ("adminProfileId") REFERENCES "AdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctor_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorProfile_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientProfile_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DoctorSubscription" ADD CONSTRAINT "DoctorSubscription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DoctorRating" ADD CONSTRAINT "DoctorRating_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DoctorRating" ADD CONSTRAINT "DoctorRating_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DFCMember" ADD CONSTRAINT "DFCMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "EndorsementRecord" ADD CONSTRAINT "EndorsementRecord_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "DFCMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "EndorsementRecord" ADD CONSTRAINT "EndorsementRecord_endorsedId_fkey" FOREIGN KEY ("endorsedId") REFERENCES "DFCMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MedicalCredential" ADD CONSTRAINT "MedicalCredential_dfcMemberId_fkey" FOREIGN KEY ("dfcMemberId") REFERENCES "DFCMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SecretariatTicket" ADD CONSTRAINT "SecretariatTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SecretariatTicket" ADD CONSTRAINT "SecretariatTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "InitiativePillar" ADD CONSTRAINT "InitiativePillar_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "InitiativeMember" ADD CONSTRAINT "InitiativeMember_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "InitiativeMember" ADD CONSTRAINT "InitiativeMember_dfcMemberId_fkey" FOREIGN KEY ("dfcMemberId") REFERENCES "DFCMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "InitiativeMember" ADD CONSTRAINT "InitiativeMember_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "InitiativePillar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SecondOpinionCase" ADD CONSTRAINT "SecondOpinionCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SecondOpinionCase" ADD CONSTRAINT "SecondOpinionCase_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClinicalEncounter" ADD CONSTRAINT "ClinicalEncounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClinicalEncounter" ADD CONSTRAINT "ClinicalEncounter_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClinicalEncounter" ADD CONSTRAINT "ClinicalEncounter_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "ClinicalEncounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PatientProblem" ADD CONSTRAINT "PatientProblem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PatientMedication" ADD CONSTRAINT "PatientMedication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "ClinicalEncounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "InvestigationOrder" ADD CONSTRAINT "InvestigationOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "ClinicalEncounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "InvestigationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "ClinicalEncounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "EncounterReferral" ADD CONSTRAINT "EncounterReferral_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "ClinicalEncounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "FamilyHistoryEntry" ADD CONSTRAINT "FamilyHistoryEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "RecordAccessGrant" ADD CONSTRAINT "RecordAccessGrant_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "RecordAccessLog" ADD CONSTRAINT "RecordAccessLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PatientConsent" ADD CONSTRAINT "PatientConsent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "CDSSInteractionLog" ADD CONSTRAINT "CDSSInteractionLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "CDSSAlert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "HospitalAdminUser" ADD CONSTRAINT "HospitalAdminUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "HospitalAdminUser" ADD CONSTRAINT "HospitalAdminUser_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DeploymentWindow" ADD CONSTRAINT "DeploymentWindow_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SpecialistVerification" ADD CONSTRAINT "SpecialistVerification_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SPLContract" ADD CONSTRAINT "SPLContract_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "SPLPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SPLCase" ADD CONSTRAINT "SPLCase_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "SPLPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SPLCase" ADD CONSTRAINT "SPLCase_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "SPLContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SPLCase" ADD CONSTRAINT "SPLCase_hmoPartnerId_fkey" FOREIGN KEY ("hmoPartnerId") REFERENCES "HMOPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SPLInvoice" ADD CONSTRAINT "SPLInvoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "SPLContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SPLAdminUser" ADD CONSTRAINT "SPLAdminUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SPLAdminUser" ADD CONSTRAINT "SPLAdminUser_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "SPLPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "StandingCommittee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClinicalAnswer" ADD CONSTRAINT "ClinicalAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ClinicalQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClinicalSpace" ADD CONSTRAINT "ClinicalSpace_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SpaceAvailability" ADD CONSTRAINT "SpaceAvailability_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "ClinicalSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SpaceBooking" ADD CONSTRAINT "SpaceBooking_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "ClinicalSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DiagnosticCentre" ADD CONSTRAINT "DiagnosticCentre_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "DiagnosticPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DiagnosticRateSchedule" ADD CONSTRAINT "DiagnosticRateSchedule_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "DiagnosticPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "FormularyDrug" ADD CONSTRAINT "FormularyDrug_therapeuticClassId_fkey" FOREIGN KEY ("therapeuticClassId") REFERENCES "TherapeuticClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "TherapeuticClass" ADD CONSTRAINT "TherapeuticClass_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TherapeuticClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_drugAId_fkey" FOREIGN KEY ("drugAId") REFERENCES "FormularyDrug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_drugBId_fkey" FOREIGN KEY ("drugBId") REFERENCES "FormularyDrug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PharmacyDispensingLog" ADD CONSTRAINT "PharmacyDispensingLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "PartnerPharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "HMOContract" ADD CONSTRAINT "HMOContract_hmoId_fkey" FOREIGN KEY ("hmoId") REFERENCES "HMOPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
