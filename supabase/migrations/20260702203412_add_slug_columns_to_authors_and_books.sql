/*
# Add slug columns to authors and books tables

## Purpose
The public-facing URLs for book and author detail pages currently use integer
IDs (e.g. /books/3, /authors/1). This migration adds human-readable slug
columns so URLs look like /books/the-glass-garden and /authors/eleanor-whitfield.

## 1. Modified Tables

### authors
- Added `slug` (text, unique, not null with default '')
  - Populated from existing names using lowercase + hyphen replacement

### books
- Added `slug` (text, unique, not null with default '')
  - Populated from existing titles using lowercase + hyphen replacement

## 2. Slug Generation Logic
- Converts to lowercase
- Replaces any sequence of non-alphanumeric characters with a single hyphen
- Trims leading/trailing hyphens

## 3. Indexes
- `idx_authors_slug` on authors(slug) for fast slug lookups
- `idx_books_slug` on books(slug) for fast slug lookups

## 4. Important Notes
1. All statements are idempotent (IF NOT EXISTS / DO $$ blocks).
2. Existing rows get slugs auto-populated from their name/title.
3. New rows inserted from the admin panel will have slugs set by the
   application layer before insert.
4. The column is UNIQUE to prevent duplicate slugs.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'authors' AND column_name = 'slug'
  ) THEN
    ALTER TABLE authors ADD COLUMN slug text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'slug'
  ) THEN
    ALTER TABLE books ADD COLUMN slug text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Populate slugs for existing authors from their names
UPDATE authors
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug = '' OR slug IS NULL;

-- Populate slugs for existing books from their titles
UPDATE books
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug = '' OR slug IS NULL;

-- Add unique constraints if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'authors' AND constraint_name = 'authors_slug_key'
  ) THEN
    ALTER TABLE authors ADD CONSTRAINT authors_slug_key UNIQUE (slug);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'books' AND constraint_name = 'books_slug_key'
  ) THEN
    ALTER TABLE books ADD CONSTRAINT books_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
