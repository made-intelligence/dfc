-- Step 1: Create new enum type
CREATE TYPE "UserRole_new" AS ENUM ('SUPERADMIN', 'SECRETARIAT', 'DFC_MEMBER', 'PATIENT', 'HOSPITAL_ADMIN');

-- Step 2: Update column to use new enum, mapping old values
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE role::text
      WHEN 'ADMIN' THEN 'SECRETARIAT'::"UserRole_new"
      WHEN 'DOCTOR' THEN 'DFC_MEMBER'::"UserRole_new"
      ELSE role::text::"UserRole_new"
    END
  );

-- Step 3: Drop old enum and rename new
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 4: Add new columns to DFCMember
ALTER TABLE "DFCMember" ADD COLUMN IF NOT EXISTS "duesStatus" TEXT NOT NULL DEFAULT 'NOT_YET_DUE';
ALTER TABLE "DFCMember" ADD COLUMN IF NOT EXISTS "duesPaidAmount" DOUBLE PRECISION;
ALTER TABLE "DFCMember" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "DFCMember" ADD COLUMN IF NOT EXISTS "nigerianLicence" TEXT;
ALTER TABLE "DFCMember" ADD COLUMN IF NOT EXISTS "acceptsReferrals" BOOLEAN NOT NULL DEFAULT false;
