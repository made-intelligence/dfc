-- Virtual links show publicly on events without a registration link, unless
-- the admin opts out for that event.
ALTER TABLE "DFCEvent" ADD COLUMN "hideVirtualLink" BOOLEAN NOT NULL DEFAULT false;
