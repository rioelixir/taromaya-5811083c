import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useIsAdmin } from "@/hooks/use-admin";
import { Shield, Users, Settings, Bookmark, Trash2, Save, Plus, Loader2, ShieldCheck, ShieldOff, BarChart3 } from "lucide-react";
import {
  adminListUsers,
  adminGrantRole,
  adminRevokeRole,
  adminDeleteUser,
  adminListSettings,
  adminUpsertSetting,
  adminDeleteSetting,
  adminListKundlis,
  adminDeleteKundli,
  adminStats,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — TAROMAYA" }] }),
});

type Tab = "overview" | "users" | "settings" | "kundlis";

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <PageShell eyebrow="Admin" title="Loading…">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying access…
        </div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell eyebrow="Admin" title="Access denied">
        <div className="text-sm text-muted-foreground">This area is restricted.</div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Admin Panel" title="Cosmic control room" subtitle="Manage users, roles, saved charts and app-wide settings.">
      <div className="mb-6 flex flex-wrap gap-2">
        <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={<BarChart3 className="h-4 w-4" />}>Overview</TabBtn>
        <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />}>Users</TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings className="h-4 w-4" />}>Settings</TabBtn>
        <TabBtn active={tab === "kundlis"} onClick={() => setTab("kundlis")} icon={<Bookmark className="h-4 w-4" />}>Saved Charts</TabBtn>
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "kundlis" && <KundlisTab />}
    </PageShell>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all",
        active
          ? "bg-gradient-to-r from-gold/20 to-galaxy/15 gold-border text-pearl"
          : "border border-white/10 text-muted-foreground hover:text-pearl hover:bg-white/5",
      ].join(" ")}
    >
      {icon} {children}
    </button>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<{ users: number; kundlis: number; admins: number } | null>(null);
  useEffect(() => {
    adminStats().then(setStats).catch(() => setStats({ users: 0, kundlis: 0, admins: 0 }));
  }, []);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Total users" value={stats?.users ?? "—"} icon={<Users className="h-5 w-5 text-gold" />} />
      <StatCard label="Admins" value={stats?.admins ?? "—"} icon={<Shield className="h-5 w-5 text-gold" />} />
      <StatCard label="Saved charts" value={stats?.kundlis ?? "—"} icon={<Bookmark className="h-5 w-5 text-gold" />} />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-4xl gold-text">{value}</div>
        </div>
        <div className="h-12 w-12 grid place-items-center rounded-full gold-border bg-gold/10">{icon}</div>
      </div>
    </GlassCard>
  );
}

type UserRow = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  confirmed: boolean;
  roles: string[];
};

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const refresh = () => {
    setLoading(true);
    adminListUsers()
      .then((u) => setUsers(u as UserRow[]))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const toggleAdmin = async (u: UserRow) => {
    if (u.roles.includes("admin")) {
      await adminRevokeRole({ data: { userId: u.id, role: "admin" } });
    } else {
      await adminGrantRole({ data: { userId: u.id, role: "admin" } });
    }
    refresh();
  };
  const removeUser = async (u: UserRow) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    await adminDeleteUser({ data: { userId: u.id } });
    refresh();
  };

  const filtered = users.filter((u) => !q || u.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <GlassCard title="Users" desc={`${users.length} total`}>
      <input
        placeholder="Search by email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
      />
      {err && <div className="text-xs text-red-300 mb-3">{err}</div>}
      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-2 py-2">Email</th>
                <th className="text-left px-2 py-2">Role</th>
                <th className="text-left px-2 py-2">Joined</th>
                <th className="text-left px-2 py-2">Last seen</th>
                <th className="text-right px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-2 py-3 text-pearl">
                    {u.email} {!u.confirmed && <span className="text-[10px] text-amber-300 ml-1">(unverified)</span>}
                  </td>
                  <td className="px-2 py-3">
                    {u.roles.includes("admin") ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gold gold-border rounded-full px-2 py-0.5"><Shield className="h-3 w-3" />admin</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">user</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-2 py-3 text-muted-foreground text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleAdmin(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-pearl hover:bg-white/5"
                      >
                        {u.roles.includes("admin") ? <><ShieldOff className="h-3 w-3" /> Revoke</> : <><ShieldCheck className="h-3 w-3" /> Make admin</>}
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

type SettingRow = { key: string; value: any; updated_at: string };

function SettingsTab() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");

  const refresh = () => {
    setLoading(true);
    adminListSettings().then((d) => setRows(d as SettingRow[])).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const addSetting = async () => {
    if (!newKey.trim()) return;
    await adminUpsertSetting({ data: { key: newKey.trim(), value: {} } });
    setNewKey("");
    refresh();
  };

  return (
    <div className="space-y-4">
      <GlassCard title="Add setting" desc="Create a new configuration key stored as JSON.">
        <div className="flex gap-2">
          <input
            placeholder="e.g. homepage.hero"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
          />
          <button
            onClick={addSetting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </GlassCard>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        rows.map((r) => <SettingEditor key={r.key} row={r} onChanged={refresh} />)
      )}
    </div>
  );
}

function SettingEditor({ row, onChanged }: { row: SettingRow; onChanged: () => void }) {
  const [text, setText] = useState(JSON.stringify(row.value, null, 2));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const save = async () => {
    setErr(null); setOk(false);
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { setErr("Invalid JSON"); return; }
    setSaving(true);
    try {
      await adminUpsertSetting({ data: { key: row.key, value: parsed } });
      setOk(true);
      onChanged();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!confirm(`Delete setting "${row.key}"?`)) return;
    await adminDeleteSetting({ data: { key: row.key } });
    onChanged();
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-display text-lg text-pearl">{row.key}</div>
          <div className="text-[10px] text-muted-foreground">Updated {new Date(row.updated_at).toLocaleString()}</div>
        </div>
        <button onClick={remove} className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10">
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(14, Math.max(4, text.split("\n").length))}
        spellCheck={false}
        className="w-full font-mono text-xs rounded-xl bg-black/40 border border-white/10 p-3 text-pearl focus:outline-none focus:border-gold/50"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
        {err && <span className="text-xs text-red-300">{err}</span>}
        {ok && <span className="text-xs text-aurora">Saved</span>}
      </div>
    </GlassCard>
  );
}

type KundliRow = { id: string; user_id: string; name: string; place: string | null; created_at: string };
function KundlisTab() {
  const [rows, setRows] = useState<KundliRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    adminListKundlis().then((d) => setRows(d as KundliRow[])).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const del = async (id: string) => {
    if (!confirm("Delete this saved chart?")) return;
    await adminDeleteKundli({ data: { id } });
    refresh();
  };

  return (
    <GlassCard title="Saved charts" desc={`${rows.length} total`}>
      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-2 py-2">Name</th>
                <th className="text-left px-2 py-2">Place</th>
                <th className="text-left px-2 py-2">User</th>
                <th className="text-left px-2 py-2">Created</th>
                <th className="text-right px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-2 py-3 text-pearl">{r.name}</td>
                  <td className="px-2 py-3 text-muted-foreground text-xs">{r.place ?? "—"}</td>
                  <td className="px-2 py-3 text-muted-foreground text-xs font-mono">{r.user_id.slice(0, 8)}…</td>
                  <td className="px-2 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => del(r.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
