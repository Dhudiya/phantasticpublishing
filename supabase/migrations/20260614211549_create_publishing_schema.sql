/*
# Create Phantastic Publishing Schema (Single-Tenant, Public Content)

1. New Tables
- `authors` — publisher's authors with bios, photos, genres, awards, social links
- `books` — published books with cover images, descriptions, ratings, ISBN, metadata
- `reviews` — reader reviews for books (star rating + text)
- `testimonials` — author/reader testimonials displayed on homepage
- `team_members` — internal team members shown on About page
- `services` — publishing services offered (editing, design, printing, etc.)

2. Relationships
- `books.author_id` → `authors.id` (many books belong to one author)
- `reviews.book_id` → `books.id` (many reviews belong to one book)

3. Security
- All tables have RLS enabled.
- All tables allow anon + authenticated SELECT (public content).
- All tables allow anon + authenticated INSERT/UPDATE/DELETE (admin access via anon key).
- This is a single-tenant public content site — no user accounts or ownership scoping.

4. Important Notes
- Integer IDs used for backward compatibility with existing data imports.
- `sort_order` columns allow manual ordering of displayed items.
- `social` on authors stored as JSONB for flexible social link structure.
- `features` on services stored as JSONB array for feature lists.
*/

-- Authors
CREATE TABLE IF NOT EXISTS authors (
  id integer PRIMARY KEY,
  name text NOT NULL,
  photo text NOT NULL,
  genre text NOT NULL,
  biography text NOT NULL,
  short_bio text NOT NULL,
  awards jsonb NOT NULL DEFAULT '[]'::jsonb,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id integer PRIMARY KEY,
  title text NOT NULL,
  author_id integer NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  genre text NOT NULL,
  description text NOT NULL,
  short_description text NOT NULL,
  cover_image text NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 0.0,
  isbn text NOT NULL,
  year integer NOT NULL,
  pages integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  book_id integer NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  reviewer text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL,
  date text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  text text NOT NULL,
  avatar text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  photo text NOT NULL,
  bio text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Authors policies (public read, public write)
DROP POLICY IF EXISTS "public_read_authors" ON authors;
CREATE POLICY "public_read_authors" ON authors FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_authors" ON authors;
CREATE POLICY "public_write_authors" ON authors FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_authors" ON authors;
CREATE POLICY "public_update_authors" ON authors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_authors" ON authors;
CREATE POLICY "public_delete_authors" ON authors FOR DELETE TO anon, authenticated USING (true);

-- Books policies
DROP POLICY IF EXISTS "public_read_books" ON books;
CREATE POLICY "public_read_books" ON books FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_books" ON books;
CREATE POLICY "public_write_books" ON books FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_books" ON books;
CREATE POLICY "public_update_books" ON books FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_books" ON books;
CREATE POLICY "public_delete_books" ON books FOR DELETE TO anon, authenticated USING (true);

-- Reviews policies
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_reviews" ON reviews;
CREATE POLICY "public_write_reviews" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_reviews" ON reviews;
CREATE POLICY "public_update_reviews" ON reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_reviews" ON reviews;
CREATE POLICY "public_delete_reviews" ON reviews FOR DELETE TO anon, authenticated USING (true);

-- Testimonials policies
DROP POLICY IF EXISTS "public_read_testimonials" ON testimonials;
CREATE POLICY "public_read_testimonials" ON testimonials FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_testimonials" ON testimonials;
CREATE POLICY "public_write_testimonials" ON testimonials FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_testimonials" ON testimonials;
CREATE POLICY "public_update_testimonials" ON testimonials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_testimonials" ON testimonials;
CREATE POLICY "public_delete_testimonials" ON testimonials FOR DELETE TO anon, authenticated USING (true);

-- Team members policies
DROP POLICY IF EXISTS "public_read_team_members" ON team_members;
CREATE POLICY "public_read_team_members" ON team_members FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_team_members" ON team_members;
CREATE POLICY "public_write_team_members" ON team_members FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_team_members" ON team_members;
CREATE POLICY "public_update_team_members" ON team_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_team_members" ON team_members;
CREATE POLICY "public_delete_team_members" ON team_members FOR DELETE TO anon, authenticated USING (true);

-- Services policies
DROP POLICY IF EXISTS "public_read_services" ON services;
CREATE POLICY "public_read_services" ON services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_services" ON services;
CREATE POLICY "public_write_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_services" ON services;
CREATE POLICY "public_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_services" ON services;
CREATE POLICY "public_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
