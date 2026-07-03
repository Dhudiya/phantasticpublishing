/*
# Create page_content table for editable public page content

## Purpose
This table stores the editable content for each public-facing page (Home, About,
Books, Authors, Services, Contact). It allows admins to manage all hardcoded
content on the public site — hero text, section headings, paragraphs, images,
CTAs, and structured content blocks — through the admin panel CMS.

## 1. New Table
- `page_content`
  - `id` (uuid, primary key)
  - `page_slug` (text, unique) — e.g. 'home', 'about', 'books', 'authors', 'services', 'contact'
  - `content` (jsonb) — structured content object; shape varies per page
  - `updated_at` (timestamptz)

The `content` jsonb holds page-specific fields. For example, the home page stores:
  hero { eyebrow, title_line_1, title_line_2, subtitle, background_image,
        cta_primary_text, cta_primary_link, cta_secondary_text, cta_secondary_link },
  featured_books { eyebrow, heading, view_all_text, view_all_link },
  about_intro { eyebrow, heading, paragraphs[], link_text, link_url, image,
               stat_value, stat_label },
  services_overview { ... }, featured_authors { ... }, testimonials { ... }, cta { ... }

The frontend merges DB content over TypeScript defaults so the site renders even
before any admin content is saved.

## 2. Security
- RLS enabled.
- Public SELECT (anon + authenticated) so the public site can read content.
- Authenticated INSERT/UPDATE/DELETE so only signed-in admins can edit.
- This mirrors the existing public content tables (authors, books, etc.).

## 3. Important Notes
1. The table starts empty. The frontend has TypeScript defaults that match the
   current hardcoded page content; the admin "Site Pages" editor populates the
   DB on first save.
2. `page_slug` is unique so there is exactly one content row per public page.
3. The `touch_updated_at()` trigger (already defined in a prior migration) is
   attached to keep `updated_at` current.
*/

CREATE TABLE IF NOT EXISTS page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text UNIQUE NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_page_content" ON page_content;
CREATE POLICY "public_read_page_content" ON page_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_page_content" ON page_content;
CREATE POLICY "auth_insert_page_content" ON page_content FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_page_content" ON page_content;
CREATE POLICY "auth_update_page_content" ON page_content FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_page_content" ON page_content;
CREATE POLICY "auth_delete_page_content" ON page_content FOR DELETE
  TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_page_content_updated ON page_content;
CREATE TRIGGER trg_page_content_updated BEFORE UPDATE ON page_content
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_page_content_slug ON page_content(page_slug);
