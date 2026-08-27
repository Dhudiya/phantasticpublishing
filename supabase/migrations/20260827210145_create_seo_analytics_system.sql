/*
# SEO + Analytics System — Database Schema

## Overview
This migration adds the full database layer for the SEO Bot and analytics system.
It enhances the existing analytics_events table with richer columns for device,
geo, and session data, and creates new tables for SEO audits, issues, metadata,
crawl history, and analytics aggregates.

## Changes to existing tables
- `analytics_events`: adds columns for visitor_id, device_type, browser, os,
  country, region, city, page_title, and session_start. The existing columns
  (event_type, path, referrer, session_id, user_agent, metadata, created_at)
  are preserved. The event_type CHECK constraint is expanded to include the
  new event types. All new columns are nullable so existing rows are not
  affected.

## New tables
1. `seo_audits` — full audit run results (score, counts, timestamp)
2. `seo_issues` — individual issues found during audits (severity, type, page,
   status, fix notes)
3. `seo_page_meta` — per-page SEO metadata (title, description, canonical,
   og data, json-ld, robots directives, manually edited flags)
4. `seo_crawl_history` — crawl log entries (url, status, duration, error)
5. `analytics_daily` — daily aggregate table for fast dashboard queries
6. `analytics_settings` — configuration for the analytics system (single row)

## Security
- analytics_events: keeps existing RLS (public insert, authenticated read).
  New columns are covered by existing policies. Adds anon read on
  analytics_daily and analytics_settings for public display widgets if needed.
- seo_* tables: authenticated-only CRUD (admin access).
- analytics_daily: authenticated read only (admin dashboard).
- analytics_settings: authenticated CRUD (admin config).

## Notes
- All tables use IF NOT EXISTS for idempotency.
- Indexes added on all frequently-queried columns.
- Policies are dropped-first to be safe on re-runs.
*/

-- ─── analytics_events: add columns ──────────────────────────────
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS visitor_id text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN OS text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS page_title text,
  ADD COLUMN IF NOT EXISTS session_start timestamptz;

-- Expand the event_type CHECK to include new event types
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN ('page_view','book_view','author_view','click','search','session','custom'));

-- New indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_type ON analytics_events(created_at DESC, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);

-- ─── seo_audits ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_date timestamptz NOT NULL DEFAULT now(),
  overall_score integer NOT NULL DEFAULT 0,
  pages_crawled integer NOT NULL DEFAULT 0,
  critical_count integer NOT NULL DEFAULT 0,
  high_count integer NOT NULL DEFAULT 0,
  medium_count integer NOT NULL DEFAULT 0,
  low_count integer NOT NULL DEFAULT 0,
  passed_count integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text
);

ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_seo_audits" ON seo_audits;
CREATE POLICY "auth_select_seo_audits" ON seo_audits FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_seo_audits" ON seo_audits;
CREATE POLICY "auth_insert_seo_audits" ON seo_audits FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_seo_audits" ON seo_audits;
CREATE POLICY "auth_delete_seo_audits" ON seo_audits FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_seo_audits_date ON seo_audits(audit_date DESC);

-- ─── seo_issues ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES seo_audits(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('critical','high','medium','low')),
  issue_type text NOT NULL,
  page_url text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','fixed','ignored')),
  fix_notes text,
  fix_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seo_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_seo_issues" ON seo_issues;
CREATE POLICY "auth_select_seo_issues" ON seo_issues FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_seo_issues" ON seo_issues;
CREATE POLICY "auth_insert_seo_issues" ON seo_issues FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_seo_issues" ON seo_issues;
CREATE POLICY "auth_update_seo_issues" ON seo_issues FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_seo_issues" ON seo_issues;
CREATE POLICY "auth_delete_seo_issues" ON seo_issues FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_seo_issues_severity ON seo_issues(severity);
CREATE INDEX IF NOT EXISTS idx_seo_issues_status ON seo_issues(status);
CREATE INDEX IF NOT EXISTS idx_seo_issues_audit ON seo_issues(audit_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_page ON seo_issues(page_url);

-- ─── seo_page_meta ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_page_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  page_type text NOT NULL DEFAULT 'page'
    CHECK (page_type IN ('page','book','author','category','custom')),
  entity_id integer,
  seo_title text,
  seo_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  twitter_card text DEFAULT 'summary_large_image',
  json_ld jsonb NOT NULL DEFAULT '[]'::jsonb,
  robots_index boolean NOT NULL DEFAULT true,
  robots_follow boolean NOT NULL DEFAULT true,
  auto_generated boolean NOT NULL DEFAULT true,
  manually_edited boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seo_page_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_select_seo_meta" ON seo_page_meta FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_insert_seo_meta" ON seo_page_meta FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_update_seo_meta" ON seo_page_meta FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_seo_meta" ON seo_page_meta;
CREATE POLICY "auth_delete_seo_meta" ON seo_page_meta FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_seo_meta_page_key ON seo_page_meta(page_key);
CREATE INDEX IF NOT EXISTS idx_seo_meta_page_type ON seo_page_meta(page_type);

-- ─── seo_crawl_history ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_crawl_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_date timestamptz NOT NULL DEFAULT now(),
  url text NOT NULL,
  status_code integer,
  status_text text,
  response_time_ms integer,
  error text,
  links_found integer NOT NULL DEFAULT 0,
  images_found integer NOT NULL DEFAULT 0
);

ALTER TABLE seo_crawl_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_crawl_history" ON seo_crawl_history;
CREATE POLICY "auth_select_crawl_history" ON seo_crawl_history FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_crawl_history" ON seo_crawl_history;
CREATE POLICY "auth_insert_crawl_history" ON seo_crawl_history FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_crawl_history" ON seo_crawl_history;
CREATE POLICY "auth_delete_crawl_history" ON seo_crawl_history FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_crawl_date ON seo_crawl_history(crawl_date DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_url ON seo_crawl_history(url);

-- ─── analytics_daily ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  path text NOT NULL DEFAULT '',
  page_views integer NOT NULL DEFAULT 0,
  unique_visitors integer NOT NULL DEFAULT 0,
  sessions integer NOT NULL DEFAULT 0,
  device_type text,
  country text,
  referrer text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_select_analytics_daily" ON analytics_daily FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_insert_analytics_daily" ON analytics_daily FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_update_analytics_daily" ON analytics_daily FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_analytics_daily" ON analytics_daily;
CREATE POLICY "auth_delete_analytics_daily" ON analytics_daily FOR DELETE
  TO authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_unique
  ON analytics_daily(date, path, COALESCE(device_type,''), COALESCE(country,''), COALESCE(referrer,''));
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date DESC);

-- ─── analytics_settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_settings (
  id integer PRIMARY KEY DEFAULT 1,
  provider text NOT NULL DEFAULT 'internal',
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_settings_single_row CHECK (id = 1)
);

ALTER TABLE analytics_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_analytics_settings" ON analytics_settings;
CREATE POLICY "auth_select_analytics_settings" ON analytics_settings FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_analytics_settings" ON analytics_settings;
CREATE POLICY "auth_insert_analytics_settings" ON analytics_settings FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_analytics_settings" ON analytics_settings;
CREATE POLICY "auth_update_analytics_settings" ON analytics_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

INSERT INTO analytics_settings (id, provider, is_active, config)
VALUES (1, 'internal', true, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
