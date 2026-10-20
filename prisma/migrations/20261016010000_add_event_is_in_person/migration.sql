-- In-person flag for events; isVirtual AND isInPerson = hybrid.
-- Existing rows were either virtual or in person, so backfill from isVirtual.
ALTER TABLE "DFCEvent" ADD COLUMN IF NOT EXISTS "isInPerson" BOOLEAN NOT NULL DEFAULT true;
UPDATE "DFCEvent" SET "isInPerson" = NOT "isVirtual";
