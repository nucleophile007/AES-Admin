BEGIN;

ALTER TABLE "AvailabilityDay"
DROP CONSTRAINT IF EXISTS "AvailabilityDay_date_program_adminEmail_key";

WITH expanded AS (
  SELECT
    "date",
    "adminEmail",
    jsonb_array_elements_text(COALESCE("times"::jsonb, '[]'::jsonb)) AS time
  FROM "AvailabilityDay"
),
merged AS (
  SELECT
    "date",
    "adminEmail",
    COALESCE(jsonb_agg(DISTINCT time ORDER BY time), '[]'::jsonb) AS merged_times
  FROM expanded
  GROUP BY "date", "adminEmail"
)
UPDATE "AvailabilityDay" d
SET "times" = m.merged_times
FROM merged m
WHERE d."date" = m."date"
  AND d."adminEmail" = m."adminEmail";

DELETE FROM "AvailabilityDay" d
USING "AvailabilityDay" keep
WHERE d.id > keep.id
  AND d."date" = keep."date"
  AND d."adminEmail" = keep."adminEmail";

ALTER TABLE "AvailabilityDay"
DROP COLUMN IF EXISTS "program";

CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilityDay_date_adminEmail_key"
ON "AvailabilityDay" ("date", "adminEmail");

COMMIT;
