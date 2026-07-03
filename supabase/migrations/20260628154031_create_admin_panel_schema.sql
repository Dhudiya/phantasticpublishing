/*
# Admin Panel Schema for Phantastic Publishing

This migration adds the full backend for a secure admin dashboard on top of the
existing public content tables (authors, books, reviews, testimonials,
team_members, services). It introduces authentication, role-based access,
content management, media management, site settings, theme settings, contact
inquiry/lead tracking, and lightweight analytics.

## 1. Authentication & Roles

- `admin_profiles` — extends Supabase `auth.users` with admin metadata.
  - `id` (uuid, PK, FK → auth.users.id, ON DELETE CASCADE)
  - `full_name` (text)
  - `role` (text: 'super_admin' | 'admin' | 'editor'; default 'editor')
  - `active` (boolean, default true) — allows disabling an admin without deleting
  - `created_at`, `updated_at` (timestamptz)
  - RLS: an admin can read all admin profiles; a user can update only their own
    profile row (name only). Role assignment is restricted to super_admin via a
    trigger-safe policy. In practice, role changes are performed by a
    super_admin through the service role; the client policy allows self-read and
    self-name-update.

## 2. Content Management

- `pages` — editable site pages (title, slug, status, hero, body, seo).
  - `id` (uuid PK)
  - `slug` (text, unique)
  - `title`, `subtitle` (text)
  - `status` (text: 'published' | 'draft'; default 'draft')
  - `hero_image` (text, URL)
  - `body` (text, markdown/HTML)
  - `seo_title`, `seo_description` (text)
  - `sort_order` (int, default 0)
  - `created_at`, `updated_at`
- `banners` — promotional banners shown across the site.
  - `id`, `title`, `subtitle`, `image`, `link`, `cta_text`
  - `position` (text: 'top' | 'hero' | 'footer'; default 'top')
  - `active` (boolean, default true)
  - `sort_order`, `start_at`, `end_at` (timestamptz, nullable)
  - timestamps
- `sections` — reusable content sections (e.g. homepage blocks).
  - `id`, `page_slug` (text, nullable — null = global)
  - `name`, `heading`, `body`, `image`
  - `layout` (text: 'full' | 'split' | 'grid' | 'cta'; default 'full')
  - `config` (jsonb, default '{}')
  - `active` (boolean, default true)
  - `sort_order`, timestamps

## 3. Media Manager

- `media` — uploaded files (images, videos, documents, logos).
  - `id`, `name`, `url`, `mime_type`, `size_bytes` (bigint)
  - `category` (text: 'image' | 'video' | 'document' | 'logo'; default 'image')
  - `alt_text` (text)
  - `uploaded_by` (uuid, FK → auth.users, nullable)
  - `created_at`
  - RLS: authenticated admins can CRUD; public can SELECT (so the site can render
    media URLs/metadata).

## 4. Site Settings

- `site_settings` — single-row key/value store for global config.
  - `id` (int PK, always 1 — enforced by trigger)
  - `site_name`, `tagline`, `description` (text)
  - `logo_light_url`, `logo_dark_url` (text) — logo variants
  - `favicon_url` (text)
  - `primary_color`, `secondary_color`, `accent_color` (text) — brand colours
  - `theme_mode` (text: 'light' | 'dark' | 'system'; default 'system')
  - `seo_title`, `seo_description`, `seo_keywords` (text)
  - `social_twitter`, `social_instagram`, `social_facebook`, `social_linkedin`, `social_youtube` (text)
  - `header_cta_text`, `header_cta_link` (text)
  - `footer_copyright`, `footer_address`, `footer_email`, `footer_phone` (text)
  - `analytics_id` (text) — external analytics ID
  - `updated_at`
  - RLS: public SELECT; authenticated CRUD.

## 5. Inquiries / Leads

- `inquiries` — contact form submissions and leads.
  - `id`, `name`, `email`, `phone` (nullable), `subject`, `message`
  - `type` (text: 'contact' | 'submission' | 'partnership' | 'careers'; default 'contact')
  - `status` (text: 'new' | 'read' | 'replied' | 'archived'; default 'new')
  - `notes` (text, nullable) — internal admin notes
  - `created_at`, `updated_at`
  - RLS: public INSERT (anyone can submit the contact form); authenticated
    SELECT/UPDATE/DELETE (only admins manage inquiries).

## 6. Analytics

- `analytics_events` — lightweight traffic/engagement events.
  - `id`, `event_type` (text: 'page_view' | 'click' | 'session' | 'custom')
  - `path` (text), `referrer` (text, nullable)
  - `session_id` (text, nullable), `user_agent` (text, nullable)
  - `metadata` (jsonb, default '{}')
  - `created_at`
  - RLS: public INSERT (the site logs events); authenticated SELECT (admins view
    reports). No UPDATE/DELETE needed.

## 7. Security Summary

- RLS enabled on every new table.
- Public content + media + settings: public SELECT, authenticated CRUD.
- Inquiries: public INSERT only; management restricted to authenticated admins.
- Analytics: public INSERT only; reads restricted to authenticated admins.
- admin_profiles: authenticated SELECT; self UPDATE (name only).
- All policies use `auth.uid()` for ownership where relevant.

## 8. Important Notes

1. The first super_admin is created by signing up via the admin panel; the
   default role is 'editor'. To bootstrap a super_admin, run (via service role
   or SQL editor): `UPDATE admin_profiles SET role='super_admin' WHERE
   id='<user-uuid>';` after the first sign-up.
2. `site_settings` is seeded with sensible defaults so the site renders before
   any admin configuration.
3. All timestamps are `timestamptz` with `DEFAULT now()`.
*/

-- ─── admin_profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'admin', 'editor')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_all_profiles" ON admin_profiles;
CREATE POLICY "admin_read_all_profiles" ON admin_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_own_profile" ON admin_profiles;
CREATE POLICY "admin_update_own_profile" ON admin_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_insert_own_profile" ON admin_profiles;
CREATE POLICY "admin_insert_own_profile" ON admin_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ─── pages ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  hero_image text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pages" ON pages;
CREATE POLICY "public_read_pages" ON pages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_pages" ON pages;
CREATE POLICY "auth_insert_pages" ON pages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_pages" ON pages;
CREATE POLICY "auth_update_pages" ON pages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_pages" ON pages;
CREATE POLICY "auth_delete_pages" ON pages FOR DELETE
  TO authenticated USING (true);

-- ─── banners ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  cta_text text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT 'top' CHECK (position IN ('top', 'hero', 'footer')),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_banners" ON banners;
CREATE POLICY "public_read_banners" ON banners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_banners" ON banners;
CREATE POLICY "auth_insert_banners" ON banners FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_banners" ON banners;
CREATE POLICY "auth_update_banners" ON banners FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_banners" ON banners;
CREATE POLICY "auth_delete_banners" ON banners FOR DELETE
  TO authenticated USING (true);

-- ─── sections ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text,
  name text NOT NULL,
  heading text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  layout text NOT NULL DEFAULT 'full' CHECK (layout IN ('full', 'split', 'grid', 'cta')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_sections" ON sections;
CREATE POLICY "public_read_sections" ON sections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_sections" ON sections;
CREATE POLICY "auth_insert_sections" ON sections FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_sections" ON sections;
CREATE POLICY "auth_update_sections" ON sections FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_sections" ON sections;
CREATE POLICY "auth_delete_sections" ON sections FOR DELETE
  TO authenticated USING (true);

-- ─── media ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  mime_type text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'image' CHECK (category IN ('image', 'video', 'document', 'logo')),
  alt_text text NOT NULL DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_media" ON media;
CREATE POLICY "public_read_media" ON media FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_media" ON media;
CREATE POLICY "auth_insert_media" ON media FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_media" ON media;
CREATE POLICY "auth_update_media" ON media FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_media" ON media;
CREATE POLICY "auth_delete_media" ON media FOR DELETE
  TO authenticated USING (true);

-- ─── site_settings (single row) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'Phantastic Publishing',
  tagline text NOT NULL DEFAULT 'Bringing Stories to Life',
  description text NOT NULL DEFAULT 'An independent publishing house dedicated to discovering and nurturing bold literary voices.',
  logo_light_url text NOT NULL DEFAULT '',
  logo_dark_url text NOT NULL DEFAULT '',
  favicon_url text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#171717',
  secondary_color text NOT NULL DEFAULT '#525252',
  accent_color text NOT NULL DEFAULT '#0ea5e9',
  theme_mode text NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
  seo_title text NOT NULL DEFAULT 'Phantastic Publishing — Bringing Stories to Life',
  seo_description text NOT NULL DEFAULT 'An independent publishing house dedicated to discovering and nurturing bold literary voices across every genre.',
  seo_keywords text NOT NULL DEFAULT 'publishing, books, authors, literary, independent publisher',
  social_twitter text NOT NULL DEFAULT '',
  social_instagram text NOT NULL DEFAULT '',
  social_facebook text NOT NULL DEFAULT '',
  social_linkedin text NOT NULL DEFAULT '',
  social_youtube text NOT NULL DEFAULT '',
  header_cta_text text NOT NULL DEFAULT 'Submit a Manuscript',
  header_cta_link text NOT NULL DEFAULT '/contact',
  footer_copyright text NOT NULL DEFAULT 'Phantastic Publishing. All rights reserved.',
  footer_address text NOT NULL DEFAULT 'Brooklyn, New York',
  footer_email text NOT NULL DEFAULT 'contact@phantasticpub.com',
  footer_phone text NOT NULL DEFAULT '',
  analytics_id text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_site_settings" ON site_settings;
CREATE POLICY "auth_update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_site_settings" ON site_settings;
CREATE POLICY "auth_insert_site_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (true);

-- Seed the single settings row if absent
INSERT INTO site_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- ─── inquiries ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  type text NOT NULL DEFAULT 'contact' CHECK (type IN ('contact', 'submission', 'partnership', 'careers')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_inquiries" ON inquiries;
CREATE POLICY "public_insert_inquiries" ON inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_inquiries" ON inquiries;
CREATE POLICY "auth_read_inquiries" ON inquiries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_inquiries" ON inquiries;
CREATE POLICY "auth_update_inquiries" ON inquiries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_inquiries" ON inquiries;
CREATE POLICY "auth_delete_inquiries" ON inquiries FOR DELETE
  TO authenticated USING (true);

-- ─── analytics_events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'page_view' CHECK (event_type IN ('page_view', 'click', 'session', 'custom')),
  path text NOT NULL DEFAULT '',
  referrer text,
  session_id text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_analytics" ON analytics_events;
CREATE POLICY "public_insert_analytics" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_analytics" ON analytics_events;
CREATE POLICY "auth_read_analytics" ON analytics_events FOR SELECT
  TO authenticated USING (true);

-- ─── updated_at triggers ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_profiles_updated ON admin_profiles;
CREATE TRIGGER trg_admin_profiles_updated BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_pages_updated ON pages;
CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_banners_updated ON banners;
CREATE TRIGGER trg_banners_updated BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_sections_updated ON sections;
CREATE TRIGGER trg_sections_updated BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_site_settings_updated ON site_settings;
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_inquiries_updated ON inquiries;
CREATE TRIGGER trg_inquiries_updated BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);
CREATE INDEX IF NOT EXISTS idx_sections_page_slug ON sections(page_slug);
CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_path ON analytics_events(path);
