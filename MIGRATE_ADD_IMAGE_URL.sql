-- Migration: Add image_url column to announcements and backfill from images JSON

BEGIN;

-- 1) Add column (if not exists)
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2) Backfill image_url from images JSON (first element)
-- Works when images is a JSON array string like '["/uploads/..jpg", "...]
UPDATE announcements
SET image_url = (CASE WHEN images IS NOT NULL AND images <> ''
    THEN (images::json ->> 0)
    ELSE NULL END)
WHERE image_url IS NULL;

COMMIT;

-- Notes:
-- - This migration assumes PostgreSQL and that the 'images' column contains a JSON array string.
-- - If images sometimes contains a plain filename without JSON, consider running a manual audit.
-- - After migration, frontend can use the 'image_url' column directly (may still need resolveImageUrl()).
