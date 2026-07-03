import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Testimonial } from "../../hooks/useData";
import {
  Card, PageHeader, Button, Input, Textarea, Modal, EmptyState, Spinner,
} from "../../admin/ui";
import { Plus, Pencil, Trash2, Quote } from "lucide-react";

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*").order("sort_order", { ascending: true });
    setTestimonials((data as Testimonial[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Manage the reader/author testimonials displayed on the home page."
        action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New testimonial</Button>}
      />

      {testimonials.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Quote size={24} />}
            title="No testimonials yet"
            description="Add your first testimonial."
            action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New testimonial</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">{testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {testimonials.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden shrink-0">
                  {t.avatar ? (
                    <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300"><Quote size={18} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">{t.name} <span className="text-neutral-400 font-normal">· {t.role}</span></p>
                  <p className="text-xs text-neutral-500 truncate">{t.text}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(t)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(t.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(editing || creating) && (
        <TestimonialEditor
          testimonial={editing}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function TestimonialEditor({ testimonial, open, onClose, onSaved }: {
  testimonial: Testimonial | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Testimonial>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(testimonial ?? {
      id: "", name: "", role: "", text: "", avatar: "", sort_order: 0,
    });
  }, [testimonial, open]);

  async function save() {
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) };
    if (testimonial) {
      await supabase.from("testimonials").update(payload).eq("id", testimonial.id);
    } else {
      const id = crypto.randomUUID();
      await supabase.from("testimonials").insert({ ...payload, id });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={testimonial ? "Edit testimonial" : "New testimonial"}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Role" value={form.role ?? ""} onChange={(v) => setForm({ ...form, role: v })} placeholder="Author, Reader" />
        </div>
        <Textarea label="Testimonial text" value={form.text ?? ""} onChange={(v) => setForm({ ...form, text: v })} rows={4} />
        <Input label="Avatar URL" value={form.avatar ?? ""} onChange={(v) => setForm({ ...form, avatar: v })} />
        {form.avatar && (
          <div className="rounded-full overflow-hidden border border-neutral-200 bg-neutral-50 h-16 w-16">
            <img src={form.avatar} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save testimonial"}</Button>
        </div>
      </div>
    </Modal>
  );
}
