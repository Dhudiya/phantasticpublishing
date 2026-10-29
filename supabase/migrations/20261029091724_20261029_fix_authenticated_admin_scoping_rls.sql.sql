/*
# Scope admin-only tables to active admins (was: any signed-in user)

1. Problem (plain English)
- Several tables had policies that only checked "is the caller signed in"
  (`TO authenticated USING (true)`), not "is the caller an active admin".
  Any authenticated user — including a non-admin account or an anonymous
  sign-in — could read and delete all analytics (visitor sessions, geo data),
  read every contact inquiry (names, emails), and rewrite all SEO metadata.

2. Changed tables (policy hardening only, no data changes)
- `analytics_daily`: SELECT/INSERT/UPDATE/DELETE now require `is_admin()`.
- `analytics_settings`: SELECT/INSERT/UPDATE now require `is_admin()`.
- `analytics_events`: SELECT now requires `is_admin()` (public insert policy kept).
- `inquiries`: SELECT now requires `is_admin()` (public insert policy kept).
- `seo_audits`: SELECT/INSERT/DELETE now require `is_admin()`.
- `seo_crawl_history`: SELECT/INSERT/DELETE now require `is_admin()`.
- `seo_issues`: SELECT/INSERT/UPDATE/DELETE now require `is_admin()`.
- `seo_page_meta`: authenticated SELECT/INSERT/UPDATE/DELETE now require
  `is_admin()`. The public `anon_select_seo_meta` read policy is kept so the
  public website can still read its own page metadata.

3. Grant tightening (least privilege)
- Revoked INSERT/UPDATE/DELETE from `anon` on all content tables — the public
  site only ever reads them; RLS already denied writes, this removes the grant.
- `analytics_events`: anon keeps INSERT only.
- `inquiries`: anon keeps INSERT only.
- `seo_page_meta`: anon keeps SELECT only.
- `analytics_daily`, `analytics_settings`, `seo_audits`, `seo_crawl_history`,
  `seo_issues`: revoked all `anon` grants (never used by anonymous visitors).

4. Security notes
- `admin_profiles` SELECT stays permissive on purpose: the `is_admin()`
  helper queries that table, so restricting its SELECT to admins would cause
  infinite policy recursion and break every other policy.
- No columns, types, or rows are modified; this is policy and grant work only.
*/

-- ─── analytics_daily ─────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_select_analytics_daily" ON analytics_daily
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_insert_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_insert_analytics_daily" ON analytics_daily
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_update_analytics_daily" ON analytics_daily
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_delete_analytics_daily" ON analytics_daily
  FOR DELETE TO authenticated USING (is_admin());

-- ─── analytics_settings ──────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select_analytics_settings" ON analytics_settings;
CREATE POLICY "auth_select_analytics_settings" ON analytics_settings
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_insert_analytics_settings" ON analytics_settings;
CREATE POLICY "auth_insert_analytics_settings" ON analytics_settings
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_analytics_settings" ON analytics_settings;
CREATE POLICY "auth_update_analytics_settings" ON analytics_settings
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ─── analytics_events (keep public insert) ───────────────────────
DROP POLICY IF EXISTS "auth_read_analytics" ON analytics_events;
CREATE POLICY "auth_read_analytics" ON analytics_events
  FOR SELECT TO authenticated USING (is_admin());

-- ─── inquiries (keep public insert) ──────────────────────────────
DROP POLICY IF EXISTS "auth_read_inquiries" ON inquiries;
CREATE POLICY "auth_read_inquiries" ON inquiries
  FOR SELECT TO authenticated USING (is_admin());

-- ─── seo_audits ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select_seo_audits" ON seo_audits;
CREATE POLICY "auth_select_seo_audits" ON seo_audits
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_insert_seo_audits" ON seo_audits;
CREATE POLICY "auth_insert_seo_audits" ON seo_audits
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_seo_audits" ON seo_audits;
CREATE POLICY "auth_delete_seo_audits" ON seo_audits
  FOR DELETE TO authenticated USING (is_admin());

-- ─── seo_crawl_history ───────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select_crawl_history" ON seo_crawl_history;
CREATE POLICY "auth_select_crawl_history" ON seo_crawl_history
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_insert_crawl_history" ON seo_crawl_history;
CREATE POLICY "auth_insert_crawl_history" ON seo_crawl_history
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_crawl_history" ON seo_crawl_history;
CREATE POLICY "auth_delete_crawl_history" ON seo_crawl_history
  FOR DELETE TO authenticated USING (is_admin());

-- ─── seo_issues ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_select_seo_issues" ON seo_issues;
CREATE POLICY "auth_select_seo_issues" ON seo_issues
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_insert_seo_issues" ON seo_issues;
CREATE POLICY "auth_insert_seo_issues" ON seo_issues
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_seo_issues" ON seo_issues;
CREATE POLICY "auth_update_seo_issues" ON seo_issues
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_seo_issues" ON seo_issues;
CREATE POLICY "auth_delete_seo_issues" ON seo_issues
  FOR DELETE TO authenticated USING (is_admin());

-- ─── seo_page_meta (keep public read for the website) ────────────
DROP POLICY IF EXISTS "auth_select_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_select_seo_meta" ON seo_page_meta
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "auth_insert_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_insert_seo_meta" ON seo_page_meta
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_update_seo_meta" ON seo_page_meta
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_delete_seo_meta" ON seo_page_meta
  FOR DELETE TO authenticated USING (is_admin());

-- ─── Grant tightening ────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE ON authors, books, banners, media, page_content,
  pages, reviews, sections, services, site_settings, team_members, testimonials
  FROM anon;

REVOKE SELECT, UPDATE, DELETE ON analytics_events FROM anon;
REVOKE SELECT, UPDATE, DELETE ON inquiries FROM anon;
REVOKE INSERT, UPDATE, DELETE ON seo_page_meta FROM anon;

REVOKE ALL ON analytics_daily, analytics_settings, seo_audits,
  seo_crawl_history, seo_issues FROM anon;
