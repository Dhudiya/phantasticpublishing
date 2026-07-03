/*
# Add social link columns to authors table

## Purpose
The TypeScript Author interface (src/hooks/useData.ts) expects individual
columns for social links: social_twitter, social_instagram, social_website.
However, the original migration only created a single `social` jsonb column
that is unused by the frontend. This migration adds the three individual
text columns the frontend reads, keeping the old `social` column for
backward compatibility (no data loss).

## 1. Modified Tables
- `authors`
  - Added `social_twitter` (text, default '')
  - Added `social_instagram` (text, default '')
  - Added `social_website` (text, default '')

## 2. Security
- No policy changes. Existing RLS policies cover the new columns automatically.

## 3. Important Notes
1. Uses DO $$ ... IF NOT EXISTS ... END $$ to be idempotent.
2. The old `social` jsonb column is retained but unused by the frontend.
3. Defaults are empty string (not null) to match the NOT NULL text pattern
   used by other columns on this table.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'authors' AND column_name = 'social_twitter'
  ) THEN
    ALTER TABLE authors ADD COLUMN social_twitter text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'authors' AND column_name = 'social_instagram'
  ) THEN
    ALTER TABLE authors ADD COLUMN social_instagram text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'authors' AND column_name = 'social_website'
  ) THEN
    ALTER TABLE authors ADD COLUMN social_website text NOT NULL DEFAULT '';
  END IF;
END $$;
