/*
# Add seo_og_image column to site_settings

Stores a site-wide default Open Graph / Twitter card image URL.
Individual pages can override this with their own image (e.g. book
covers, author photos). When no page-specific image is set, this
value is used. When this is also empty, the app falls back to a
bundled local image.
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS seo_og_image text NOT NULL DEFAULT '';
