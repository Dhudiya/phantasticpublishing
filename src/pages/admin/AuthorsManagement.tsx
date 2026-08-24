import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Author } from "../../hooks/useData";
import { slugify } from "../../lib/slugify";
import {
  Card, PageHeader, Button, Input, Textarea, Modal, EmptyState, Badge, Spinner,
} from "../../admin/ui";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

export default function AuthorsManagement() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Author | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("authors").select("*").order("sort_order", { ascending: true });
    setAuthors((data as Author[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this author? Their books will also be deleted. This cannot be undone.")) return;
    await supabase.from("authors").delete().eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Authors"
        description="Manage author profiles, bios, awards, and social links."
        action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New author</Button>}
      />

      {authors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={24} />}
            title="No authors yet"
            description="Add your first author profile."
            action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New author</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">{authors.length} author{authors.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {authors.map((author) => (
              <div key={author.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-neutral-100 overflow-hidden shrink-0">
                  {author.photo ? (
                    <img src={author.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300"><Users size={18} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">{author.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{author.genre} · {author.awards.length} award{author.awards.length !== 1 ? "s" : ""}</p>
                </div>
                <Badge color="neutral">#{author.sort_order}</Badge>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(author)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(String(author.id))} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(editing || creating) && (
        <AuthorEditor
          author={editing}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function AuthorEditor({ author, open, onClose, onSaved }: {
  author: Author | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Author>>({});
  const [awards, setAwards] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(author ?? {
      name: "", photo: "", genre: "", biography: "", short_bio: "",
      awards: [], social_twitter: "", social_instagram: "", social_website: "", sort_order: 0,
    });
    setAwards(author?.awards ?? []);
    setError(null);
  }, [author, open]);

  async function save() {
    setError(null);
    if (!form.name?.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    const { id: _omit, ...rest } = form;
    void _omit;
    const payload = {
      ...rest,
      awards,
      sort_order: Number(form.sort_order),
      slug: form.slug || slugify(form.name ?? ""),
    };
    if (author) {
      const { error: err } = await supabase.from("authors").update(payload).eq("id", author.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("authors").insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={author ? "Edit author" : "New author"} size="lg">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Genre" value={form.genre ?? ""} onChange={(v) => setForm({ ...form, genre: v })} placeholder="Literary Fiction" />
        </div>
        <Input label="Photo URL" value={form.photo ?? ""} onChange={(v) => setForm({ ...form, photo: v })} />
        {form.photo && (
          <div className="rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 h-32">
            <img src={form.photo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <Textarea label="Short bio" value={form.short_bio ?? ""} onChange={(v) => setForm({ ...form, short_bio: v })} rows={2} />
        <Textarea label="Full biography" value={form.biography ?? ""} onChange={(v) => setForm({ ...form, biography: v })} rows={5} />

        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1.5">Awards</label>
          <div className="space-y-2">
            {awards.map((award, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={award}
                  onChange={(e) => setAwards(awards.map((a, idx) => idx === i ? e.target.value : a))}
                  className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                />
                <button
                  onClick={() => setAwards(awards.filter((_, idx) => idx !== i))}
                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setAwards([...awards, ""])}>
              <Plus size={14} /> Add award
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Twitter URL" value={form.social_twitter ?? ""} onChange={(v) => setForm({ ...form, social_twitter: v })} />
          <Input label="Instagram URL" value={form.social_instagram ?? ""} onChange={(v) => setForm({ ...form, social_instagram: v })} />
          <Input label="Website URL" value={form.social_website ?? ""} onChange={(v) => setForm({ ...form, social_website: v })} />
        </div>
        <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save author"}</Button>
        </div>
      </div>
    </Modal>
  );
}
