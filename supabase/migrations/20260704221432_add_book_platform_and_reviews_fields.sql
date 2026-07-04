/*
# Add platform URLs, reviews toggle, and nullable rating to books

1. Purpose
   - Support per-book platform purchase links (Google Books, Apple Books, Amazon Kindle).
   - Allow admins to enable/disable the Reviews section per book.
   - Allow rating to be optional (NULL = no rating displayed).

2. New Columns on `books`
   - `google_books_url` (text, default '') — URL to the book on Google Books. Empty string = not provided.
   - `apple_books_url`  (text, default '') — URL to the book on Apple Books. Empty string = not provided.
   - `amazon_kindle_url` (text, default '') — URL to the book on Amazon Kindle. Empty string = not provided.
   - `reviews_enabled` (boolean, default true) — When true, the Reviews section renders on the book detail page (if reviews exist). When false, the section is completely hidden.

3. Modified Columns on `books`
   - `rating` changed from `NOT NULL DEFAULT 0.0` to nullable (NULL = no rating to display). Existing rows with 0.0 rating are set to NULL so they don't show a false 0.0 star display.

4. Security
   - No new tables. Existing RLS policies on `books` remain unchanged (admin-only writes, public reads via anon+authenticated).

5. Notes
   - All new columns have safe defaults so existing rows and inserts that omit them continue to work.
   - The rating column is altered to DROP NOT NULL and existing 0.0 values are set to NULL to avoid showing a zero-star rating for books that previously had no rating set.
*/

-- Add platform URL columns
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS google_books_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS apple_books_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS amazon_kindle_url text NOT NULL DEFAULT '';

-- Add reviews_enabled toggle
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS reviews_enabled boolean NOT NULL DEFAULT true;

-- Make rating nullable (NULL = no rating to display)
ALTER TABLE books ALTER COLUMN rating DROP NOT NULL;

-- Convert existing 0.0 ratings to NULL so they don't show a false zero-star display
UPDATE books SET rating = NULL WHERE rating = 0.0;