-- Anonymous per-event engagement log (views/clicks). New table only; safe on live data.
CREATE TABLE IF NOT EXISTS "DFCEventInteraction" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DFCEventInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DFCEventInteraction_eventId_kind_idx" ON "DFCEventInteraction"("eventId", "kind");

DO $$ BEGIN
  ALTER TABLE "DFCEventInteraction"
    ADD CONSTRAINT "DFCEventInteraction_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "DFCEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
