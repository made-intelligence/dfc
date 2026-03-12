-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "consultationFeeNote" TEXT;

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
