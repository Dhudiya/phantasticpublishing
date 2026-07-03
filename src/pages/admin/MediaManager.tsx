import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../admin/AuthContext";
import {
  Card, PageHeader, Button, Input, Select, Modal, EmptyState, Badge, Spinner,
} from "../../admin/ui";
import { Upload, Trash2, Copy, Check, Image as ImageIcon, File, Film, Search } from "lucide-react";

interface MediaRow {
  id: string; name: string; url: string; mime_type: string; size_bytes: number;
  category: string; alt_text: string; created_at: string;
}

const BUCKET = "media";

export default function MediaManager() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [detail, setDetail] = useState<MediaRow | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("media").select("*").order("created_at", { ascending: false });
    setRows((data as MediaRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) {
        // bucket may not exist; try to create it then retry
        if (upErr.message.includes("not found") || upErr.message.includes("Bucket")) {
          await supabase.storage.createBucket(BUCKET, { public: true });
          await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        } else {
          continue;
        }
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const category = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";
      await supabase.from("media").insert({
        name: file.name,
        url: pub.publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        category,
        alt_text: "",
        uploaded_by: user?.id,
      });
    }
    setUploading(false);
    load();
  }

  async function remove(row: MediaRow) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    // remove from storage if it's our bucket
    try {
      const path = row.url.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    } catch { /* external URL — ignore */ }
    await supabase.from("media").delete().eq("id", row.id);
    load();
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const filtered = rows.filter((r) => {
    const matchesFilter = filter === "all" || r.category === filter;
    const matchesSearch = search === "" || r.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function iconFor(row: MediaRow) {
    if (row.category === "image") return <ImageIcon size={18} />;
    if (row.category === "video") return <Film size={18} />;
    return <File size={18} />;
  }

  return (
    <div>
      <PageHeader
        title="Media Manager"
        description="Upload and manage images, videos, documents, and logos."
        action={<Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : <><Upload size={16} /> Upload</>}
        </Button>}
      />

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition-colors"
          />
        </div>
        <Select value={filter} onChange={setFilter} className="sm:w-48"
          options={[
            { value: "all", label: "All categories" },
            { value: "image", label: "Images" },
            { value: "video", label: "Videos" },
            { value: "document", label: "Documents" },
            { value: "logo", label: "Logos" },
          ]} />
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ImageIcon size={24} />}
            title="No media found"
            description="Upload images, videos, or documents to get started."
            action={<Button onClick={() => fileRef.current?.click()}><Upload size={16} /> Upload media</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filtered.map((row) => (
            <Card key={row.id} className="overflow-hidden group">
              <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                {row.category === "image" ? (
                  <img src={row.url} alt={row.alt_text || row.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">{iconFor(row)}</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-1">
                  <button onClick={() => setDetail(row)} className="p-2 bg-white/90 rounded-lg text-neutral-700 hover:text-neutral-900" title="Details">
                    <ImageIcon size={15} />
                  </button>
                  <button onClick={() => copyUrl(row.url, row.id)} className="p-2 bg-white/90 rounded-lg text-neutral-700 hover:text-neutral-900" title="Copy URL">
                    {copied === row.id ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <button onClick={() => remove(row)} className="p-2 bg-white/90 rounded-lg text-red-500 hover:text-red-700" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-neutral-900 truncate">{row.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge>{row.category}</Badge>
                  <span className="text-[10px] text-neutral-400">{fmtSize(row.size_bytes)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && (
        <Modal open={!!detail} onClose={() => setDetail(null)} title="Media details" size="lg">
          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-xl overflow-hidden flex items-center justify-center min-h-[200px]">
              {detail.category === "image" ? (
                <img src={detail.url} alt={detail.name} className="max-h-80 object-contain" />
              ) : (
                <div className="text-neutral-300 py-20">{iconFor(detail)}</div>
              )}
            </div>
            <Input label="File name" value={detail.name} onChange={(v) => setDetail({ ...detail, name: v })} />
            <Input label="Alt text" value={detail.alt_text} onChange={(v) => setDetail({ ...detail, alt_text: v })} placeholder="Describe the image" />
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">URL</label>
              <div className="flex gap-2">
                <input readOnly value={detail.url} className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-500" />
                <Button variant="secondary" size="sm" onClick={() => copyUrl(detail.url, detail.id)}>
                  {copied === detail.id ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" onClick={() => { remove(detail); setDetail(null); }}><Trash2 size={15} /> Delete</Button>
              <Button onClick={async () => {
                await supabase.from("media").update({ name: detail.name, alt_text: detail.alt_text }).eq("id", detail.id);
                setDetail(null); load();
              }}>Save changes</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
