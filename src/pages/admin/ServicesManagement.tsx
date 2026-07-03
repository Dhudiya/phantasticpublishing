import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Service } from "../../hooks/useData";
import {
  Card, PageHeader, Button, Input, Textarea, Select, Modal, EmptyState, Badge, Spinner,
} from "../../admin/ui";
import { Plus, Pencil, Trash2, PenTool } from "lucide-react";

const ICON_OPTIONS = [
  { value: "PenTool", label: "Pen Tool" },
  { value: "CheckCircle", label: "Check Circle" },
  { value: "Palette", label: "Palette" },
  { value: "Printer", label: "Printer" },
  { value: "Globe", label: "Globe" },
  { value: "TrendingUp", label: "Trending Up" },
  { value: "BookOpen", label: "Book Open" },
  { value: "Star", label: "Star" },
  { value: "Award", label: "Award" },
];

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
    setServices((data as Service[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage the publishing services displayed on the Services page."
        action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New service</Button>}
      />

      {services.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PenTool size={24} />}
            title="No services yet"
            description="Add your first publishing service."
            action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New service</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">{services.length} service{services.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {services.map((service) => (
              <div key={service.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                  <PenTool size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">{service.title}</p>
                  <p className="text-xs text-neutral-500 truncate">{service.features.length} feature{service.features.length !== 1 ? "s" : ""}</p>
                </div>
                <Badge color="neutral">{service.icon}</Badge>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(service)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(service.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(editing || creating) && (
        <ServiceEditor
          service={editing}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function ServiceEditor({ service, open, onClose, onSaved }: {
  service: Service | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Service>>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(service ?? {
      id: "", title: "", description: "", icon: "PenTool", features: [], sort_order: 0,
    });
    setFeatures(service?.features ?? []);
  }, [service, open]);

  async function save() {
    setSaving(true);
    const payload = { ...form, features, sort_order: Number(form.sort_order) };
    if (service) {
      await supabase.from("services").update(payload).eq("id", service.id);
    } else {
      const id = crypto.randomUUID();
      await supabase.from("services").insert({ ...payload, id });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={service ? "Edit service" : "New service"} size="lg">
      <div className="space-y-4">
        <Input label="Title" value={form.title ?? ""} onChange={(v) => setForm({ ...form, title: v })} required />
        <Textarea label="Description" value={form.description ?? ""} onChange={(v) => setForm({ ...form, description: v })} rows={3} />
        <Select
          label="Icon"
          value={form.icon ?? "PenTool"}
          onChange={(v) => setForm({ ...form, icon: v })}
          options={ICON_OPTIONS}
        />
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1.5">Features (What's Included)</label>
          <div className="space-y-2">
            {features.map((feature, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={feature}
                  onChange={(e) => setFeatures(features.map((f, idx) => idx === i ? e.target.value : f))}
                  placeholder="e.g. Developmental editing"
                  className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                />
                <button
                  onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}
                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setFeatures([...features, ""])}>
              <Plus size={14} /> Add feature
            </Button>
          </div>
        </div>
        <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save service"}</Button>
        </div>
      </div>
    </Modal>
  );
}
