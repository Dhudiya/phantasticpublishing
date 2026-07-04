/*
# Add global platform logo URL fields to site_settings

1. Purpose
   - Allow admins to configure Google Books, Apple Books, and Amazon Kindle
     logo image URLs once globally instead of per book.
   - The frontend reads these URLs from site_settings and displays them on
     every Book Details page that has a matching platform URL set on the book.

2. Modified Table: `site_settings`
   New columns:
   - `google_books_logo_url` (text, default '') — URL to the Google Books logo image.
   - `apple_books_logo_url`  (text, default '') — URL to the Apple Books logo image.
   - `amazon_kindle_logo_url` (text, default '') — URL to the Amazon Kindle logo image.

3. Notes
   - All columns default to '' (empty string). When empty, the frontend falls
     back to the built-in SVG icons already embedded in the code.
   - No new tables or RLS changes — these are additional columns on the existing
     single-row site_settings table (id = 1) which already has appropriate policies.
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS google_books_logo_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS apple_books_logo_url  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS amazon_kindle_logo_url text NOT NULL DEFAULT '';