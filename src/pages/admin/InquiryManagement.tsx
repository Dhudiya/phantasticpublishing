import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  Card, PageHeader, Button, Select, Badge, Spinner, EmptyState, Modal, Textarea,
} from "../../admin/ui";
import { Inbox, Trash2, Reply, Archive, Search } from "lucide-react";

interface Inquiry {
  id: string; name: string; email: string; phone: string; subject: string;
  message: string; type: string; status: string; notes: string;
  created_at: string; updated_at: string;
}

const statusColor: Record<string, "amber" | "blue" | "green" | "neutral"> = {
  new: "amber", read: "blue", replied: "green", archived: "neutral",
};

export default function InquiryManagement() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    setRows((data as Inquiry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    await supabase.from("inquiries").update({ status }).eq("id", id);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  async function markRead(row: Inquiry) {
    if (row.status === "new") await updateStatus(row.id, "read");
  }

  async function saveNotes(notes: string) {
    if (!selected) return;
    await supabase.from("inquiries").update({ notes }).eq("id", selected.id);
    setSelected({ ...selected, notes });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this inquiry permanently?")) return;
    await supabase.from("inquiries").delete().eq("id", id);
    setSelected(null);
    load();
  }

  const filtered = rows.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch = search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: rows.length,
    new: rows.filter((r) => r.status === "new").length,
    read: rows.filter((r) => r.status === "read").length,
    replied: rows.filter((r) => r.status === "replied").length,
    archived: rows.filter((r) => r.status === "archived").length,
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Inquiries" description="Contact form submissions and leads." />

      {/* Status filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {([
          { key: "all", label: "All", count: counts.all },
          { key: "new", label: "New", count: counts.new },
          { key: "read", label: "Read", count: counts.read },
          { key: "replied", label: "Replied", count: counts.replied },
          { key: "archived", label: "Archived", count: counts.archived },
        ] as { key: string; label: string; count: number }[]).map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === c.key ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            {c.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === c.key ? "bg-white/20" : "bg-neutral-100"}`}>{c.count}</span>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or subject…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Inbox size={24} />} title="No inquiries found" description="Contact form submissions will appear here." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {filtered.map((inq) => (
              <button
                key={inq.id}
                onClick={() => { setSelected(inq); markRead(inq); }}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600 shrink-0">
                  {inq.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-neutral-900 truncate">{inq.name}</p>
                    {inq.status === "new" && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{inq.subject || inq.email}</p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{inq.message.slice(0, 80)}{inq.message.length > 80 ? "…" : ""}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge color={statusColor[inq.status]}>{inq.status}</Badge>
                  <span className="text-[10px] text-neutral-400">{new Date(inq.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Inquiry details" size="lg">
          <InquiryDetail
            inquiry={selected}
            onStatusChange={(s) => updateStatus(selected.id, s)}
            onNotesChange={saveNotes}
            onDelete={() => remove(selected.id)}
          />
        </Modal>
      )}
    </div>
  );
}

function InquiryDetail({
  inquiry, onStatusChange, onNotesChange, onDelete,
}: {
  inquiry: Inquiry;
  onStatusChange: (s: string) => void;
  onNotesChange: (n: string) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(inquiry.notes);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-neutral-900">{inquiry.name}</h3>
          <a href={`mailto:${inquiry.email}`} className="text-sm text-blue-600 hover:underline">{inquiry.email}</a>
          {inquiry.phone && <p className="text-sm text-neutral-500 mt-0.5">{inquiry.phone}</p>}
        </div>
        <Badge color={statusColor[inquiry.status]}>{inquiry.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-neutral-400 mb-0.5">Type</p>
          <p className="font-medium text-neutral-700 capitalize">{inquiry.type}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-0.5">Received</p>
          <p className="font-medium text-neutral-700">{new Date(inquiry.created_at).toLocaleString()}</p>
        </div>
      </div>

      {inquiry.subject && (
        <div>
          <p className="text-xs text-neutral-400 mb-0.5">Subject</p>
          <p className="text-sm font-medium text-neutral-900">{inquiry.subject}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-neutral-400 mb-1">Message</p>
        <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-700 whitespace-pre-wrap">{inquiry.message}</div>
      </div>

      <div>
        <p className="text-xs text-neutral-400 mb-1">Internal notes</p>
        <Textarea value={notes} onChange={setNotes} rows={3} placeholder="Add private notes about this lead…" />
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="secondary" onClick={() => onNotesChange(notes)}>Save notes</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
        <Select
          value={inquiry.status}
          onChange={onStatusChange}
          className="w-36"
          options={[
            { value: "new", label: "New" },
            { value: "read", label: "Read" },
            { value: "replied", label: "Replied" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <a href={`mailto:${inquiry.email}?subject=Re: ${inquiry.subject || inquiry.type}`}>
          <Button variant="secondary" size="sm"><Reply size={14} /> Reply</Button>
        </a>
        <Button variant="secondary" size="sm" onClick={() => onStatusChange("archived")}><Archive size={14} /> Archive</Button>
        <div className="flex-1" />
        <Button variant="danger" size="sm" onClick={onDelete}><Trash2 size={14} /> Delete</Button>
      </div>
    </div>
  );
}
