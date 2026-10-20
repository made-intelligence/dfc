-- Booking accounts sign in with a password emailed to them; forgotten
-- passwords are replaced the same way. Earlier drafts of this flow (code
-- table, registration links) are retired.
DROP TABLE IF EXISTS "EmailVerificationCode";
DROP TABLE IF EXISTS "PendingRegistration";

CREATE TABLE "TemporaryPassword" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemporaryPassword_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TemporaryPassword_userId_createdAt_idx" ON "TemporaryPassword"("userId", "createdAt");

ALTER TABLE "TemporaryPassword" ADD CONSTRAINT "TemporaryPassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
