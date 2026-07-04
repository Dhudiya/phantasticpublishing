import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Author, Book, Review } from "../../hooks/useData";
import { slugify } from "../../lib/slugify";
import {
  Card, PageHeader, Button, Input, Textarea, Select, Modal, EmptyState, Badge, Spinner,
} from "../../admin/ui";
import { Plus, Pencil, Trash2, BookOpen, Star, ChevronRight, ChevronDown, MessageSquare } from "lucide-react";

export default function BooksManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Book | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: bks } = await supabase.from("books").select("*").order("sort_order", { ascending: true });
    const { data: auts } = await supabase.from("authors").select("*").order("sort_order", { ascending: true });
    setBooks((bks as Book[]) ?? []);
    setAuthors((auts as Author[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this book? Reviews will also be deleted. This cannot be undone.")) return;
    await supabase.from("books").delete().eq("id", id);
    load();
  }

  const authorName = (id: string) => authors.find((a) => a.id === id)?.name ?? "Unknown";

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Books"
        description="Manage your book catalog. Click a book to manage its reviews."
        action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New book</Button>}
      />

      {books.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen size={24} />}
            title="No books yet"
            description="Add your first book to the catalog."
            action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New book</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">{books.length} book{books.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {books.map((book) => (
              <div key={book.id}>
                <div className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
                  <button
                    onClick={() => setExpandedId(expandedId === String(book.id) ? null : String(book.id))}
                    className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    {expandedId === String(book.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="w-12 h-16 rounded bg-neutral-100 overflow-hidden shrink-0">
                    {book.cover_image ? (
                      <img src={book.cover_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300"><BookOpen size={18} /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{book.title}</p>
                    <p className="text-xs text-neutral-500 truncate">{authorName(String(book.author_id))} · {book.genre}</p>
                  </div>
                  {book.rating !== null && book.rating > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <Star size={12} className="fill-black text-black" />
                      {book.rating}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-300">—</div>
                  )}
                  {book.reviews_enabled ? (
                    <Badge color="green" title="Reviews enabled"><MessageSquare size={10} className="mr-0.5" />On</Badge>
                  ) : (
                    <Badge color="neutral" title="Reviews disabled"><MessageSquare size={10} className="mr-0.5" />Off</Badge>
                  )}
                  <Badge color="neutral">{book.year}</Badge>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(book)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(String(book.id))} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {expandedId === String(book.id) && (
                  <ReviewsManager bookId={String(book.id)} />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {(editing || creating) && (
        <BookEditor
          book={editing}
          authors={authors}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

// ─── Book editor ─────────────────────────────────────────────────
function BookEditor({ book, authors, open, onClose, onSaved }: {
  book: Book | null;
  authors: Author[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Book>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(book ?? {
      title: "", author_id: authors[0]?.id ? String(authors[0].id) : "", genre: "",
      description: "", short_description: "", cover_image: "", rating: null,
      isbn: "", year: new Date().getFullYear(), pages: 0, sort_order: 0,
      google_books_url: "", apple_books_url: "", amazon_kindle_url: "",
      reviews_enabled: true,
    });
  }, [book, open, authors]);

  async function save() {
    setSaving(true);
    const ratingVal = form.rating === null || form.rating === undefined || form.rating === 0
      ? null
      : Number(form.rating);
    const payload = {
      ...form,
      id: form.id ? Number(form.id) : undefined,
      author_id: Number(form.author_id),
      rating: ratingVal,
      year: Number(form.year),
      pages: Number(form.pages),
      sort_order: Number(form.sort_order),
      slug: form.slug || slugify(form.title ?? ""),
      google_books_url: form.google_books_url ?? "",
      apple_books_url: form.apple_books_url ?? "",
      amazon_kindle_url: form.amazon_kindle_url ?? "",
      reviews_enabled: form.reviews_enabled ?? true,
    };
    if (book) {
      await supabase.from("books").update(payload).eq("id", book.id);
    } else {
      const { data } = await supabase.from("books").insert(payload).select();
      void data;
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={book ? "Edit book" : "New book"} size="lg">
      <div className="space-y-4">
        <Input label="Title" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} required />
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Author"
            value={String(form.author_id ?? "")}
            onChange={(v) => setForm({ ...form, author_id: v })}
            options={authors.map((a) => ({ value: String(a.id), label: a.name }))}
          />
          <Input label="Genre" value={form.genre ?? ""} onChange={(v) => setForm({ ...form, genre: v })} placeholder="Fiction" />
        </div>
        <Input label="Cover image URL" value={form.cover_image ?? ""} onChange={(v) => setForm({ ...form, cover_image: v })} />
        {form.cover_image && (
          <div className="rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 h-40">
            <img src={form.cover_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <Textarea label="Short description" value={form.short_description ?? ""} onChange={(v) => setForm({ ...form, short_description: v })} rows={2} />
        <Textarea label="Full description" value={form.description ?? ""} onChange={(v) => setForm({ ...form, description: v })} rows={4} />
        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Rating (0-5, blank = none)" type="number" value={form.rating !== null && form.rating !== undefined ? String(form.rating) : ""} onChange={(v) => setForm({ ...form, rating: v === "" ? null : Number(v) })} placeholder="e.g. 4.5" />
          <Input label="Year" type="number" value={String(form.year ?? "")} onChange={(v) => setForm({ ...form, year: Number(v) })} />
          <Input label="Pages" type="number" value={String(form.pages ?? 0)} onChange={(v) => setForm({ ...form, pages: Number(v) })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="ISBN" value={form.isbn ?? ""} onChange={(v) => setForm({ ...form, isbn: v })} />
          <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        </div>

        {/* Platform purchase links */}
        <div className="border-t border-neutral-100 pt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Purchase Links</p>
            <p className="text-xs text-neutral-400 mt-0.5">Leave blank to hide a platform's logo from the book page.</p>
          </div>
          <Input label="Google Books URL" value={form.google_books_url ?? ""} onChange={(v) => setForm({ ...form, google_books_url: v })} placeholder="https://books.google.com/…" />
          <Input label="Apple Books URL" value={form.apple_books_url ?? ""} onChange={(v) => setForm({ ...form, apple_books_url: v })} placeholder="https://books.apple.com/…" />
          <Input label="Amazon Kindle URL" value={form.amazon_kindle_url ?? ""} onChange={(v) => setForm({ ...form, amazon_kindle_url: v })} placeholder="https://amazon.com/…" />
        </div>

        {/* Reviews toggle */}
        <div className="border-t border-neutral-100 pt-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Enable Reviews</p>
              <p className="text-xs text-neutral-400 mt-0.5">Show the Reviews section on this book's detail page.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, reviews_enabled: !(form.reviews_enabled ?? true) })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${(form.reviews_enabled ?? true) ? "bg-neutral-900" : "bg-neutral-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${(form.reviews_enabled ?? true) ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save book"}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Reviews manager ─────────────────────────────────────────────
function ReviewsManager({ bookId }: { bookId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Review | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").eq("book_id", bookId).order("sort_order", { ascending: true });
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  }, [bookId]);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  }

  if (loading) return <div className="bg-neutral-50 px-4 py-3"><Spinner /></div>;

  return (
    <div className="bg-neutral-50 px-4 pb-4 pt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Reviews ({reviews.length})</p>
        <Button size="sm" variant="secondary" onClick={() => setCreating(true)}><Plus size={12} /> Add review</Button>
      </div>
      {reviews.length === 0 ? (
        <p className="text-xs text-neutral-400 py-4 text-center">No reviews yet.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-lg p-3 flex items-start gap-3">
              <div className="flex items-center gap-0.5 pt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className={i < r.rating ? "fill-black text-black" : "fill-neutral-200 text-neutral-200"} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-900">{r.reviewer}</p>
                <p className="text-xs text-neutral-500 line-clamp-2">{r.text}</p>
                <p className="text-[10px] text-neutral-400 mt-1">{r.date}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(r)} className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => remove(r.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <ReviewEditor
          review={editing}
          bookId={bookId}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function ReviewEditor({ review, bookId, open, onClose, onSaved }: {
  review: Review | null;
  bookId: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Review>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(review ?? {
      id: crypto.randomUUID(), book_id: bookId, reviewer: "", rating: 5,
      text: "", date: new Date().toISOString().slice(0, 10), sort_order: 0,
    });
  }, [review, open, bookId]);

  async function save() {
    setSaving(true);
    if (review) {
      await supabase.from("reviews").update(form).eq("id", review.id);
    } else {
      await supabase.from("reviews").insert(form);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={review ? "Edit review" : "New review"}>
      <div className="space-y-4">
        <Input label="Reviewer name" value={form.reviewer ?? ""} onChange={(v) => setForm({ ...form, reviewer: v })} required />
        <Select
          label="Rating"
          value={String(form.rating ?? 5)}
          onChange={(v) => setForm({ ...form, rating: Number(v) })}
          options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n !== 1 ? "s" : ""}` }))}
        />
        <Textarea label="Review text" value={form.text ?? ""} onChange={(v) => setForm({ ...form, text: v })} rows={4} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Date" value={form.date ?? ""} onChange={(v) => setForm({ ...form, date: v })} placeholder="2025-01-15" />
          <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save review"}</Button>
        </div>
      </div>
    </Modal>
  );
}
