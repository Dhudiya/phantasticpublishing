import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { TeamMember } from "../../hooks/useData";
import {
  Card, PageHeader, Button, Input, Textarea, Modal, EmptyState, Spinner,
} from "../../admin/ui";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("team_members").select("*").order("sort_order", { ascending: true });
    setMembers((data as TeamMember[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this team member?")) return;
    await supabase.from("team_members").delete().eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Team Members"
        description="Manage the team displayed on the About page."
        action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New member</Button>}
      />

      {members.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={24} />}
            title="No team members yet"
            description="Add your first team member."
            action={<Button onClick={() => setCreating(true)}><Plus size={16} /> New member</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden shrink-0">
                  {m.photo ? (
                    <img src={m.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300"><Users size={18} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">{m.name} <span className="text-neutral-400 font-normal">· {m.role}</span></p>
                  <p className="text-xs text-neutral-500 truncate">{m.bio}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(m)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(m.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(editing || creating) && (
        <MemberEditor
          member={editing}
          open={!!(editing || creating)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function MemberEditor({ member, open, onClose, onSaved }: {
  member: TeamMember | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<TeamMember>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(member ?? {
      id: "", name: "", role: "", photo: "", bio: "", sort_order: 0,
    });
  }, [member, open]);

  async function save() {
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) };
    if (member) {
      await supabase.from("team_members").update(payload).eq("id", member.id);
    } else {
      const id = crypto.randomUUID();
      await supabase.from("team_members").insert({ ...payload, id });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={member ? "Edit team member" : "New team member"}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Role" value={form.role ?? ""} onChange={(v) => setForm({ ...form, role: v })} placeholder="Editorial Director" />
        </div>
        <Input label="Photo URL" value={form.photo ?? ""} onChange={(v) => setForm({ ...form, photo: v })} />
        {form.photo && (
          <div className="rounded-full overflow-hidden border border-neutral-200 bg-neutral-50 h-16 w-16">
            <img src={form.photo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <Textarea label="Bio" value={form.bio ?? ""} onChange={(v) => setForm({ ...form, bio: v })} rows={4} />
        <Input label="Sort order" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save member"}</Button>
        </div>
      </div>
    </Modal>
  );
}
