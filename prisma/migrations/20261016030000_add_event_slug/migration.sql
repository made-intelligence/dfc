-- Readable, id-free public URLs for events: /events/<slug>.
ALTER TABLE "DFCEvent" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill existing events from their titles (same rules as slugify() in
-- src/lib/event-url.ts); duplicates get -2, -3 ... in creation order.
WITH base AS (
  SELECT
    id,
    "createdAt",
    COALESCE(
      NULLIF(left(trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')), 80), ''),
      'event'
    ) AS b
  FROM "DFCEvent"
  WHERE "slug" IS NULL
),
numbered AS (
  SELECT id, b, row_number() OVER (PARTITION BY b ORDER BY "createdAt", id) AS rn FROM base
)
UPDATE "DFCEvent" e
SET "slug" = CASE WHEN n.rn = 1 THEN n.b ELSE n.b || '-' || n.rn END
FROM numbered n
WHERE e.id = n.id;

ALTER TABLE "DFCEvent" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "DFCEvent_slug_key" ON "DFCEvent"("slug");
