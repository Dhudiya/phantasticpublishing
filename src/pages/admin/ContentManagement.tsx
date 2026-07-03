import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  Card, PageHeader, Button, Input, Textarea, Select, Modal, EmptyState, Badge, Spinner,
} from "../../admin/ui";
import { Plus, Pencil, Trash2, FileText, Image as ImageIcon, LayoutPanelTop } from "lucide-react";

type Tab = "pages" | "banners" | "sections";

interface PageRow {
  id: string; slug: string; title: string; subtitle: string; status: string;
  hero_image: string; body: string; seo_title: string; seo_description: string;
  sort_order: number; updated_at: string;
}
interface BannerRow {
  id: string; title: string; subtitle: string; image: string; link: string;
  cta_text: string; position: string; active: boolean; sort_order: number;
}
interface SectionRow {
  id: string; page_slug: string | null; name: string; heading: string; body: string;
  image: string; layout: string; active: boolean; sort_order: number;
}

export default function ContentManagement() {
  const [tab, setTab] = useState<Tab>("pages");

  return (
    <div>
      <PageHeader title="Content Management" description="Manage pages, banners, and reusable sections." />

      <div className="flex gap-1 mb-6 bg-neutral-100 p-1 rounded-xl w-fit">
        {([
          { key: "pages", label: "Pages", icon: <FileText size={15} /> },
          { key: "banners", label: "Banners", icon: <ImageIcon size={15} /> },
          { key: "sections", label: "Sections", icon: <LayoutPanelTop size={15} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "pages" && <PagesTab />}
      {tab === "banners" && <BannersTab />}
      {tab === "sections" && <SectionsTab />}
    </div>
  );
}

// ─── Pages tab ───────────────────────────────────────────────────
function PagesTab() {
  const [rows, setRows] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("pages").select("*").order("sort_order", { ascending: true });
    setRows((data as PageRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    await supabase.from("pages").delete().eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <p className="text-sm text-neutral-500">{rows.length} page{rows.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setCreating(true)}><Plus size={14} /> New page</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<FileText size={24} />} title="No pages yet" description="Create your first editable page."
          action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New page</Button>} />
      ) : (
        <div className="divide-y divide-neutral-100">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{p.title}</p>
                <p className="text-xs text-neutral-500 truncate">/{p.slug}</p>
              </div>
              <Badge color={p.status === "published" ? "green" : "neutral"}>{p.status}</Badge>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(p)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(p.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <PageEditor
          page={editing}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </Card>
  );
}

function PageEditor({ page, open, onClose, onSaved }: {
  page: PageRow | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<PageRow>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(page ?? { status: "draft", sort_order: 0, slug: "", title: "", subtitle: "", hero_image: "", body: "", seo_title: "", seo_description: "" });
  }, [page, open]);

  async function save() {
    setSaving(true);
    if (page) {
      await supabase.from("pages").update(form).eq("id", page.id);
    } else {
      await supabase.from("pages").insert(form);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={page ? "Edit page" : "New page"} size="lg">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Title" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} required />
          <Input label="Slug" value={form.slug ?? ""} onChange={(v) => setForm({ ...form, slug: v })} placeholder="about-us" />
        </div>
        <Input label="Subtitle" value={form.subtitle ?? ""} onChange={(v) => setForm({ ...form, subtitle: v })} />
        <Input label="Hero image URL" value={form.hero_image ?? ""} onChange={(v) => setForm({ ...form, hero_image: v })} />
        <Textarea label="Body (HTML/Markdown)" value={form.body ?? ""} onChange={(v) => setForm({ ...form, body: v })} rows={6} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="SEO title" value={form.seo_title ?? ""} onChange={(v) => setForm({ ...form, seo_title: v })} />
          <Input label="SEO description" value={form.seo_description ?? ""} onChange={(v) => setForm({ ...form, seo_description: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Status" value={form.status ?? "draft"} onChange={(v) => setForm({ ...form, status: v })}
            options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save page"}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Banners tab ─────────────────────────────────────────────────
function BannersTab() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("banners").select("*").order("sort_order", { ascending: true });
    setRows((data as BannerRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(row: BannerRow) {
    await supabase.from("banners").update({ active: !row.active }).eq("id", row.id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <p className="text-sm text-neutral-500">{rows.length} banner{rows.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setCreating(true)}><Plus size={14} /> New banner</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<ImageIcon size={24} />} title="No banners yet" description="Create promotional banners for your site."
          action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New banner</Button>} />
      ) : (
        <div className="divide-y divide-neutral-100">
          {rows.map((b) => (
            <div key={b.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                {b.image ? <img src={b.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageIcon size={18} /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{b.title}</p>
                <p className="text-xs text-neutral-500 truncate">{b.position} · {b.cta_text || "No CTA"}</p>
              </div>
              <button onClick={() => toggle(b)} className="relative w-10 h-5 rounded-full transition-colors" style={{ background: b.active ? "#171717" : "#d4d4d4" }}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all" style={{ left: b.active ? "22px" : "2px" }} />
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(b)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"><Pencil size={15} /></button>
                <button onClick={() => remove(b.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <BannerEditor banner={editing} open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }} />
      )}
    </Card>
  );
}

function BannerEditor({ banner, open, onClose, onSaved }: {
  banner: BannerRow | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<BannerRow>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(banner ?? { position: "top", active: true, sort_order: 0, title: "", subtitle: "", image: "", link: "", cta_text: "" });
  }, [banner, open]);

  async function save() {
    setSaving(true);
    if (banner) await supabase.from("banners").update(form).eq("id", banner.id);
    else await supabase.from("banners").insert(form);
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={banner ? "Edit banner" : "New banner"} size="lg">
      <div className="space-y-4">
        <Input label="Title" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} required />
        <Input label="Subtitle" value={form.subtitle ?? ""} onChange={(v) => setForm({ ...form, subtitle: v })} />
        <Input label="Image URL" value={form.image ?? ""} onChange={(v) => setForm({ ...form, image: v })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="CTA text" value={form.cta_text ?? ""} onChange={(v) => setForm({ ...form, cta_text: v })} />
          <Input label="CTA link" value={form.link ?? ""} onChange={(v) => setForm({ ...form, link: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Position" value={form.position ?? "top"} onChange={(v) => setForm({ ...form, position: v })}
            options={[{ value: "top", label: "Top" }, { value: "hero", label: "Hero" }, { value: "footer", label: "Footer" }]} />
          <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save banner"}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Sections tab ────────────────────────────────────────────────
function SectionsTab() {
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("sections").select("*").order("sort_order", { ascending: true });
    setRows((data as SectionRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(row: SectionRow) {
    await supabase.from("sections").update({ active: !row.active }).eq("id", row.id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this section?")) return;
    await supabase.from("sections").delete().eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <p className="text-sm text-neutral-500">{rows.length} section{rows.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setCreating(true)}><Plus size={14} /> New section</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<LayoutPanelTop size={24} />} title="No sections yet" description="Create reusable content sections."
          action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New section</Button>} />
      ) : (
        <div className="divide-y divide-neutral-100">
          {rows.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                <LayoutPanelTop size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{s.name}</p>
                <p className="text-xs text-neutral-500 truncate">{s.layout} · {s.page_slug || "global"}</p>
              </div>
              <button onClick={() => toggle(s)} className="relative w-10 h-5 rounded-full transition-colors" style={{ background: s.active ? "#171717" : "#d4d4d4" }}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all" style={{ left: s.active ? "22px" : "2px" }} />
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(s)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"><Pencil size={15} /></button>
                <button onClick={() => remove(s.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <SectionEditor section={editing} open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }} />
      )}
    </Card>
  );
}

function SectionEditor({ section, open, onClose, onSaved }: {
  section: SectionRow | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<SectionRow>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(section ?? { layout: "full", active: true, sort_order: 0, name: "", heading: "", body: "", image: "", page_slug: "" });
  }, [section, open]);

  async function save() {
    setSaving(true);
    const payload = { ...form, page_slug: form.page_slug || null };
    if (section) await supabase.from("sections").update(payload).eq("id", section.id);
    else await supabase.from("sections").insert(payload);
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={section ? "Edit section" : "New section"} size="lg">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Page slug (optional)" value={form.page_slug ?? ""} onChange={(v) => setForm({ ...form, page_slug: v })} placeholder="home" />
        </div>
        <Input label="Heading" value={form.heading ?? ""} onChange={(v) => setForm({ ...form, heading: v })} />
        <Textarea label="Body" value={form.body ?? ""} onChange={(v) => setForm({ ...form, body: v })} rows={4} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Image URL" value={form.image ?? ""} onChange={(v) => setForm({ ...form, image: v })} />
          <Select label="Layout" value={form.layout ?? "full"} onChange={(v) => setForm({ ...form, layout: v })}
            options={[{ value: "full", label: "Full" }, { value: "split", label: "Split" }, { value: "grid", label: "Grid" }, { value: "cta", label: "CTA" }]} />
        </div>
        <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save section"}</Button>
        </div>
      </div>
    </Modal>
  );
}
