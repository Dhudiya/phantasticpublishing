import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth, AdminRole } from "../../admin/AuthContext";
import {
  Card, PageHeader, Select, Badge, Spinner, EmptyState,
} from "../../admin/ui";
import { Users, Shield, Check, X, Crown } from "lucide-react";

interface AdminUser {
  id: string;
  full_name: string;
  role: AdminRole;
  active: boolean;
  created_at: string;
  email?: string;
}

const roleColor: Record<AdminRole, "amber" | "blue" | "neutral"> = {
  super_admin: "amber",
  admin: "blue",
  editor: "neutral",
};
const roleLabel: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

const permissions: Record<AdminRole, string[]> = {
  super_admin: ["Full access", "Manage users & roles", "All content", "Settings", "Theme", "Analytics"],
  admin: ["All content", "Settings", "Theme", "Analytics", "Inquiries"],
  editor: ["Edit content", "Upload media", "View inquiries"],
};

export default function UserManagement() {
  const { profile: me, refreshProfile } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_profiles").select("*").order("created_at", { ascending: false });
    // fetch emails from auth via the session user — we can't list all auth.users from the client,
    // so we show what we have; the current user's email is in the session.
    const { data: session } = await supabase.auth.getSession();
    const myEmail = session.session?.user.email;
    const rows = ((data as Omit<AdminUser, "email">[]) ?? []).map((u) => ({
      ...u,
      email: u.id === me?.id ? myEmail : undefined,
    }));
    setRows(rows);
    setLoading(false);
  }, [me?.id]);

  function setRows(r: AdminUser[]) { setUsers(r); }

  useEffect(() => { load(); }, [load]);

  async function updateRole(id: string, role: AdminRole) {
    if (id === me?.id && role !== "super_admin") {
      if (!confirm("Demote yourself? You may lose access to this panel.")) return;
    }
    await supabase.from("admin_profiles").update({ role }).eq("id", id);
    load();
    if (id === me?.id) refreshProfile();
  }

  async function toggleActive(id: string, active: boolean) {
    if (id === me?.id) {
      alert("You cannot disable your own account.");
      return;
    }
    await supabase.from("admin_profiles").update({ active: !active }).eq("id", id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="User Management" description="Manage admin accounts, roles, and permissions." />

      {/* Roles & permissions reference */}
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {(Object.keys(permissions) as AdminRole[]).map((role) => (
          <Card key={role} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {role === "super_admin" ? <Crown size={16} className="text-amber-500" /> : <Shield size={16} className="text-neutral-400" />}
              <Badge color={roleColor[role]}>{roleLabel[role]}</Badge>
            </div>
            <ul className="space-y-1.5">
              {permissions[role].map((p) => (
                <li key={p} className="flex items-center gap-2 text-xs text-neutral-600">
                  <Check size={12} className="text-green-500 shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <p className="text-sm text-neutral-500">{users.length} admin{users.length !== 1 ? "s" : ""}</p>
        </div>
        {users.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="No admins yet" description="New admin accounts are created by a super_admin in the Supabase dashboard." />
        ) : (
          <div className="divide-y divide-neutral-100">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                    {u.full_name.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {u.full_name}
                      {u.id === me?.id && <span className="text-xs text-neutral-400 ml-2">(you)</span>}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{u.email || `Joined ${new Date(u.created_at).toLocaleDateString()}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={u.active ? "green" : "red"}>{u.active ? "Active" : "Disabled"}</Badge>
                  <Select
                    value={u.role}
                    onChange={(v) => updateRole(u.id, v as AdminRole)}
                    className="w-36"
                    options={[
                      { value: "super_admin", label: "Super Admin" },
                      { value: "admin", label: "Admin" },
                      { value: "editor", label: "Editor" },
                    ]}
                  />
                  <button
                    onClick={() => toggleActive(u.id, u.active)}
                    disabled={u.id === me?.id}
                    className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={u.active ? "Disable" : "Enable"}
                  >
                    {u.active ? <X size={15} /> : <Check size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-neutral-400 mt-4">
        Public registration is disabled. New admin accounts are created by a super_admin in the Supabase dashboard,
        then promoted here to grant additional access.
      </p>
    </div>
  );
}
