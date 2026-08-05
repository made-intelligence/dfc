-- Account-claim invite fields for admin-created members.
-- Additive + nullable, safe to apply to a live database with existing rows.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "claimToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "claimTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_claimToken_key" ON "User"("claimToken");
