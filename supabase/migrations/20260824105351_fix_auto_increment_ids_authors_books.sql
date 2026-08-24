/*
# Fix: Add auto-increment IDs to authors and books

## Problem
The `authors` and `books` tables have `id integer PRIMARY KEY` with no
default/sequence. The admin panel sends inserts without an `id` field,
so Postgres rejects them with a NOT NULL violation on `id`. This makes
it impossible to create new authors or books from the admin panel.

## Fix
Create sequences and set them as the default for `id` on both tables.
This allows inserts to omit `id` and get an auto-generated value. The
sequences start above the current max ID to avoid collisions with
existing rows.

## Safety
- No data is modified or deleted.
- Existing rows keep their IDs.
- The sequences start at max(id)+1 so there are no collisions.
*/

-- ─── authors: add sequence default ──────────────────────────────
DO $$
DECLARE
  max_id integer;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM authors;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.sequences
    WHERE sequence_schema = 'public' AND sequence_name = 'authors_id_seq'
  ) THEN
    EXECUTE format('CREATE SEQUENCE authors_id_seq START %s', max_id + 1);
  ELSE
    EXECUTE format('ALTER SEQUENCE authors_id_seq RESTART WITH %s', max_id + 1);
  END IF;
END $$;

ALTER TABLE authors ALTER COLUMN id SET DEFAULT nextval('authors_id_seq');
ALTER SEQUENCE authors_id_seq OWNED BY authors.id;

-- ─── books: add sequence default ────────────────────────────────
DO $$
DECLARE
  max_id integer;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM books;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.sequences
    WHERE sequence_schema = 'public' AND sequence_name = 'books_id_seq'
  ) THEN
    EXECUTE format('CREATE SEQUENCE books_id_seq START %s', max_id + 1);
  ELSE
    EXECUTE format('ALTER SEQUENCE books_id_seq RESTART WITH %s', max_id + 1);
  END IF;
END $$;

ALTER TABLE books ALTER COLUMN id SET DEFAULT nextval('books_id_seq');
ALTER SEQUENCE books_id_seq OWNED BY books.id;
