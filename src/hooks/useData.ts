import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ─── Types ──────────────────────────────────────────────────────

export interface Author {
  id: string;
  name: string;
  slug: string;
  photo: string;
  genre: string;
  biography: string;
  short_bio: string;
  awards: string[];
  social_twitter: string | null;
  social_instagram: string | null;
  social_website: string | null;
  sort_order: number;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  genre: string;
  description: string;
  short_description: string;
  cover_image: string;
  rating: number;
  isbn: string;
  year: number;
  pages: number;
  sort_order: number;
}

export interface Review {
  id: string;
  book_id: string;
  reviewer: string;
  rating: number;
  text: string;
  date: string;       // column name in DB is "date"
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar: string;
  sort_order: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  sort_order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  sort_order: number;
}

// ─── Generic hook ───────────────────────────────────────────────

function useSupabaseQuery<T>(
  table: string,
  select: string = "*",
  orderBy: string = "sort_order",
  orderAsc: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from(table)
      .select(select)
      .order(orderBy, { ascending: orderAsc });

    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((rows as T[]) ?? []);
    }
    setLoading(false);
  }, [table, select, orderBy, orderAsc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── Specific hooks ─────────────────────────────────────────────

export function useAuthors() {
  return useSupabaseQuery<Author>("authors");
}

export function useBooks() {
  return useSupabaseQuery<Book>("books");
}

export function useTestimonials() {
  return useSupabaseQuery<Testimonial>("testimonials");
}

export function useTeamMembers() {
  return useSupabaseQuery<TeamMember>("team_members");
}

export function useServices() {
  return useSupabaseQuery<Service>("services");
}

// ─── Slug-based single-item hooks (used by public detail pages) ─

export function useBookBySlug(slug: string | undefined) {
  const [data, setData] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      const { data: book, error: bErr } = await supabase
        .from("books")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (bErr) {
        if (!cancelled) { setError(bErr.message); setLoading(false); }
        return;
      }

      if (!book) {
        if (!cancelled) { setError("Not found"); setLoading(false); }
        return;
      }

      const { data: revs, error: rErr } = await supabase
        .from("reviews")
        .select("*")
        .eq("book_id", (book as Book).id)
        .order("sort_order", { ascending: true });

      if (!cancelled) {
        if (rErr) setError(rErr.message);
        setData(book as Book);
        setReviews((revs as Review[]) ?? []);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [slug]);

  return { data, reviews, loading, error };
}

export function useAuthorBySlug(slug: string | undefined) {
  const [data, setData] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      const { data: author, error: aErr } = await supabase
        .from("authors")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (aErr) {
        if (!cancelled) { setError(aErr.message); setLoading(false); }
        return;
      }

      if (!author) {
        if (!cancelled) { setError("Not found"); setLoading(false); }
        return;
      }

      const { data: bks, error: bErr } = await supabase
        .from("books")
        .select("*")
        .eq("author_id", (author as Author).id)
        .order("sort_order", { ascending: true });

      if (!cancelled) {
        if (bErr) setError(bErr.message);
        setData(author as Author);
        setBooks((bks as Book[]) ?? []);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [slug]);

  return { data, books, loading, error };
}

// ─── ID-based hooks (kept for admin panel use) ──────────────────

export function useBookById(id: string | undefined) {
  const [data, setData] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      const { data: book, error: bErr } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (bErr) {
        if (!cancelled) { setError(bErr.message); setLoading(false); }
        return;
      }

      const { data: revs, error: rErr } = await supabase
        .from("reviews")
        .select("*")
        .eq("book_id", id)
        .order("sort_order", { ascending: true });

      if (!cancelled) {
        if (rErr) setError(rErr.message);
        setData(book as Book);
        setReviews((revs as Review[]) ?? []);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [id]);

  return { data, reviews, loading, error };
}

export function useAuthorById(id: string | undefined) {
  const [data, setData] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      const { data: author, error: aErr } = await supabase
        .from("authors")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (aErr) {
        if (!cancelled) { setError(aErr.message); setLoading(false); }
        return;
      }

      const { data: bks, error: bErr } = await supabase
        .from("books")
        .select("*")
        .eq("author_id", id)
        .order("sort_order", { ascending: true });

      if (!cancelled) {
        if (bErr) setError(bErr.message);
        setData(author as Author);
        setBooks((bks as Book[]) ?? []);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [id]);

  return { data, books, loading, error };
}

export function useRelatedBooks(bookId: string | undefined, genre: string | undefined, limit = 4) {
  const [data, setData] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId || !genre) return;
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data: rows } = await supabase
        .from("books")
        .select("*")
        .eq("genre", genre)
        .neq("id", bookId)
        .limit(limit)
        .order("sort_order", { ascending: true });

      if (!cancelled) {
        setData((rows as Book[]) ?? []);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [bookId, genre, limit]);

  return { data, loading };
}

// ─── Genre list (derived from books) ────────────────────────────

export function useGenres() {
  const { data: books } = useBooks();
  const genres = ["All", ...Array.from(new Set(books.map((b) => b.genre))).sort()];
  return genres;
}
