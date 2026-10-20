-- Site-wide pop-up banner flag for events. Additive with a default, safe on live data.
ALTER TABLE "DFCEvent" ADD COLUMN IF NOT EXISTS "showBanner" BOOLEAN NOT NULL DEFAULT false;
