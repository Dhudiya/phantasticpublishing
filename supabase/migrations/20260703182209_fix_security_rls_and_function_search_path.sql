-- ─────────────────────────────────────────────────────────────────
-- Fix 1: Recreate touch_updated_at with a fixed, immutable search_path
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- Fix 2: Admin helper — returns true when the caller is an active
--         admin (row exists in admin_profiles with active = true).
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE id = auth.uid()
      AND active = true
  )
$$;

-- ─────────────────────────────────────────────────────────────────
-- Fix 3: Content tables — restrict all write operations to admins
--         (authors, books, reviews, testimonials, team_members, services)
-- ─────────────────────────────────────────────────────────────────

-- authors
DROP POLICY IF EXISTS "public_write_authors"  ON public.authors;
DROP POLICY IF EXISTS "public_update_authors" ON public.authors;
DROP POLICY IF EXISTS "public_delete_authors" ON public.authors;

CREATE POLICY "admin_write_authors"  ON public.authors FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_authors" ON public.authors FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_authors" ON public.authors FOR DELETE
  TO authenticated USING (public.is_admin());

-- books
DROP POLICY IF EXISTS "public_write_books"  ON public.books;
DROP POLICY IF EXISTS "public_update_books" ON public.books;
DROP POLICY IF EXISTS "public_delete_books" ON public.books;

CREATE POLICY "admin_write_books"  ON public.books FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_books" ON public.books FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_books" ON public.books FOR DELETE
  TO authenticated USING (public.is_admin());

-- reviews
DROP POLICY IF EXISTS "public_write_reviews"  ON public.reviews;
DROP POLICY IF EXISTS "public_update_reviews" ON public.reviews;
DROP POLICY IF EXISTS "public_delete_reviews" ON public.reviews;

CREATE POLICY "admin_write_reviews"  ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_reviews" ON public.reviews FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_reviews" ON public.reviews FOR DELETE
  TO authenticated USING (public.is_admin());

-- testimonials
DROP POLICY IF EXISTS "public_write_testimonials"  ON public.testimonials;
DROP POLICY IF EXISTS "public_update_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "public_delete_testimonials" ON public.testimonials;

CREATE POLICY "admin_write_testimonials"  ON public.testimonials FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_testimonials" ON public.testimonials FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_testimonials" ON public.testimonials FOR DELETE
  TO authenticated USING (public.is_admin());

-- team_members
DROP POLICY IF EXISTS "public_write_team_members"  ON public.team_members;
DROP POLICY IF EXISTS "public_update_team_members" ON public.team_members;
DROP POLICY IF EXISTS "public_delete_team_members" ON public.team_members;

CREATE POLICY "admin_write_team_members"  ON public.team_members FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_team_members" ON public.team_members FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_team_members" ON public.team_members FOR DELETE
  TO authenticated USING (public.is_admin());

-- services
DROP POLICY IF EXISTS "public_write_services"  ON public.services;
DROP POLICY IF EXISTS "public_update_services" ON public.services;
DROP POLICY IF EXISTS "public_delete_services" ON public.services;

CREATE POLICY "admin_write_services"  ON public.services FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_services" ON public.services FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_services" ON public.services FOR DELETE
  TO authenticated USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- Fix 4: Admin CMS tables — restrict writes to admins
--         (pages, banners, sections, media, page_content, site_settings)
-- ─────────────────────────────────────────────────────────────────

-- pages
DROP POLICY IF EXISTS "auth_insert_pages" ON public.pages;
DROP POLICY IF EXISTS "auth_update_pages" ON public.pages;
DROP POLICY IF EXISTS "auth_delete_pages" ON public.pages;

CREATE POLICY "admin_insert_pages" ON public.pages FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_pages" ON public.pages FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_pages" ON public.pages FOR DELETE
  TO authenticated USING (public.is_admin());

-- banners
DROP POLICY IF EXISTS "auth_insert_banners" ON public.banners;
DROP POLICY IF EXISTS "auth_update_banners" ON public.banners;
DROP POLICY IF EXISTS "auth_delete_banners" ON public.banners;

CREATE POLICY "admin_insert_banners" ON public.banners FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_banners" ON public.banners FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_banners" ON public.banners FOR DELETE
  TO authenticated USING (public.is_admin());

-- sections
DROP POLICY IF EXISTS "auth_insert_sections" ON public.sections;
DROP POLICY IF EXISTS "auth_update_sections" ON public.sections;
DROP POLICY IF EXISTS "auth_delete_sections" ON public.sections;

CREATE POLICY "admin_insert_sections" ON public.sections FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_sections" ON public.sections FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_sections" ON public.sections FOR DELETE
  TO authenticated USING (public.is_admin());

-- media
DROP POLICY IF EXISTS "auth_insert_media" ON public.media;
DROP POLICY IF EXISTS "auth_update_media" ON public.media;
DROP POLICY IF EXISTS "auth_delete_media" ON public.media;

CREATE POLICY "admin_insert_media" ON public.media FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_media" ON public.media FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_media" ON public.media FOR DELETE
  TO authenticated USING (public.is_admin());

-- page_content
DROP POLICY IF EXISTS "auth_insert_page_content" ON public.page_content;
DROP POLICY IF EXISTS "auth_update_page_content" ON public.page_content;
DROP POLICY IF EXISTS "auth_delete_page_content" ON public.page_content;

CREATE POLICY "admin_insert_page_content" ON public.page_content FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_page_content" ON public.page_content FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_page_content" ON public.page_content FOR DELETE
  TO authenticated USING (public.is_admin());

-- site_settings
DROP POLICY IF EXISTS "auth_insert_site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "auth_update_site_settings" ON public.site_settings;

CREATE POLICY "admin_insert_site_settings" ON public.site_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_site_settings" ON public.site_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- Fix 5: Inquiries — restrict UPDATE/DELETE to admins; narrow
--         the public INSERT to prevent status/type injection
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_insert_inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "auth_update_inquiries"   ON public.inquiries;
DROP POLICY IF EXISTS "auth_delete_inquiries"   ON public.inquiries;

-- Anyone may submit a contact form, but only with status='new'
-- and only with permitted type values (already enforced by CHECK constraint,
-- but explicitly stated here so the policy is not vacuously true).
CREATE POLICY "public_insert_inquiries" ON public.inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new' AND type IN ('contact', 'submission', 'partnership', 'careers'));

CREATE POLICY "admin_update_inquiries" ON public.inquiries FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_inquiries" ON public.inquiries FOR DELETE
  TO authenticated USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- Fix 6: Analytics events — narrow the anon INSERT to valid event
--         types so the WITH CHECK clause is not vacuously true.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_insert_analytics" ON public.analytics_events;

CREATE POLICY "public_insert_analytics" ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (event_type IN ('page_view', 'click', 'session', 'custom') AND path IS NOT NULL);
