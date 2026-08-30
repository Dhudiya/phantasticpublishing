/*
# Add anon SELECT policy to seo_page_meta

## Purpose
The SEO component (running in the browser with the anon key) needs to
read auto-fixed SEO metadata from seo_page_meta so it can apply the
fixes at runtime. Currently only the authenticated role can read this
table, which means the public site can't see the auto-fixed metadata.

## Security
- Adds a SELECT-only policy for the anon role.
- No write access is granted to anon — only authenticated admins can
  insert/update/delete.
- The data in seo_page_meta is SEO metadata (titles, descriptions, etc.)
  which is intentionally public — it's the same data that appears in
  page HTML source.
*/

DROP POLICY IF EXISTS "anon_select_seo_meta" ON seo_page_meta;
CREATE POLICY "anon_select_seo_meta" ON seo_page_meta FOR SELECT
  TO anon USING (true);
