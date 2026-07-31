import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useIsAdmin } from "@/hooks/use-admin";
import { Shield, Users, Settings, Bookmark, Trash2, Save, Plus, Loader2, ShieldCheck, ShieldOff, BarChart3, Image as ImageIcon, Layers, Sparkles, FileText, HelpCircle, Newspaper, Palette, UserPlus, Link2, Copy, Ban, PlayCircle, Activity } from "lucide-react";
import { AdminBrandingTab } from "@/components/admin-branding";
import { AdminAssetsTab } from "@/components/admin-assets";
import { AdminTarotCmsTab, AdminPromptsTab } from "@/components/admin-tarot-cms";
import { AdminPagesTab, AdminFaqsTab, AdminBlogsTab } from "@/components/admin-cms";
import { AdminTutorialsTab } from "@/components/admin-tutorials";
import { AdminNakshatraDeckTab } from "@/components/admin-nakshatra-deck";
import { Link } from "@tanstack/react-router";
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
  adminProvisionTestUser,
} from "@/lib/admin.functions";
import {
  adminCreateStaffUser,
  adminCreateStaffInvite,
  adminListStaffInvites,
  adminRevokeStaffInvite,
  adminDeleteStaffInvite,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — TAROMAYA" }] }),
});

type Tab = "overview" | "users" | "staff" | "settings" | "kundlis" | "assets" | "decks" | "prompts" | "pages" | "faqs" | "blogs" | "branding" | "tutorials" | "nakshatra";

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <PageShell hideAI hideVoice eyebrow="Admin" title="Loading…">
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
        <TabBtn active={tab === "staff"} onClick={() => setTab("staff")} icon={<UserPlus className="h-4 w-4" />}>Employees & Invites</TabBtn>
        <TabBtn active={tab === "decks"} onClick={() => setTab("decks")} icon={<Layers className="h-4 w-4" />}>Tarot CMS</TabBtn>
        <TabBtn active={tab === "nakshatra"} onClick={() => setTab("nakshatra")} icon={<Layers className="h-4 w-4" />}>Nakshatra Deck</TabBtn>
        <TabBtn active={tab === "prompts"} onClick={() => setTab("prompts")} icon={<Sparkles className="h-4 w-4" />}>AI Prompts</TabBtn>
        <TabBtn active={tab === "branding"} onClick={() => setTab("branding")} icon={<Palette className="h-4 w-4" />}>Branding & Theme</TabBtn>
        <TabBtn active={tab === "pages"} onClick={() => setTab("pages")} icon={<FileText className="h-4 w-4" />}>Pages</TabBtn>
        <TabBtn active={tab === "faqs"} onClick={() => setTab("faqs")} icon={<HelpCircle className="h-4 w-4" />}>FAQs</TabBtn>
        <TabBtn active={tab === "blogs"} onClick={() => setTab("blogs")} icon={<Newspaper className="h-4 w-4" />}>Blog</TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings className="h-4 w-4" />}>Settings</TabBtn>
        <TabBtn active={tab === "kundlis"} onClick={() => setTab("kundlis")} icon={<Bookmark className="h-4 w-4" />}>Saved Charts</TabBtn>
        <TabBtn active={tab === "assets"} onClick={() => setTab("assets")} icon={<ImageIcon className="h-4 w-4" />}>Assets</TabBtn>
        <TabBtn active={tab === "tutorials"} onClick={() => setTab("tutorials")} icon={<PlayCircle className="h-4 w-4" />}>Tutorials</TabBtn>
        <Link to="/diagnostics" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-pearl hover:bg-white/5">
          <Activity className="h-4 w-4" /> Diagnostics
        </Link>
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "staff" && <StaffTab />}
      {tab === "decks" && <AdminTarotCmsTab />}
      {tab === "nakshatra" && <AdminNakshatraDeckTab />}
      {tab === "prompts" && <AdminPromptsTab />}
      {tab === "branding" && <AdminBrandingTab />}
      {tab === "pages" && <AdminPagesTab />}
      {tab === "faqs" && <AdminFaqsTab />}
      {tab === "blogs" && <AdminBlogsTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "kundlis" && <KundlisTab />}
      {tab === "assets" && <AdminAssetsTab />}
      {tab === "tutorials" && <AdminTutorialsTab />}
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total users" value={stats?.users ?? "—"} icon={<Users className="h-5 w-5 text-gold" />} />
        <StatCard label="Admins" value={stats?.admins ?? "—"} icon={<Shield className="h-5 w-5 text-gold" />} />
        <StatCard label="Saved charts" value={stats?.kundlis ?? "—"} icon={<Bookmark className="h-5 w-5 text-gold" />} />
      </div>
      <TestUserCard />
    </div>
  );
}

function TestUserCard() {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const provision = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await adminProvisionTestUser({ data: { password: pwd || undefined } });
      setResult({ email: res.email, password: res.password });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard
      title="View-as-user test account"
      desc="Creates (or resets) a regular non-admin user with an active subscription so you can log in and inspect every module exactly as a subscriber sees it."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Optional password (min 8 chars) — leave blank to auto-generate"
          className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
        />
        <button
          onClick={provision}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-5 py-2 text-sm font-medium text-cosmic disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {result ? "Reset test user" : "Create test user"}
        </button>
      </div>
      {err && <div className="mt-3 text-xs text-red-300">{err}</div>}
      {result && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-gold/80">Credentials — copy now</div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-mono text-pearl">{result.email}</span></div>
          <div><span className="text-muted-foreground">Password:</span> <span className="font-mono text-pearl">{result.password}</span></div>
          <div className="text-xs text-muted-foreground pt-1">
            Sign out and log in with these credentials to browse the app as a regular subscriber. The account is not an admin and has a 1-year active subscription.
          </div>
        </div>
      )}
    </GlassCard>
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

// ------------------------------------------------------------------
// Employees & Invites
// ------------------------------------------------------------------

type StaffInvite = {
  id: string;
  code: string;
  note: string | null;
  expires_at: string | null;
  max_uses: number;
  used_count: number;
  revoked: boolean;
  created_at: string;
};

function StaffTab() {
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => {
    setLoadingList(true);
    adminListStaffInvites()
      .then((rows) => setInvites(rows as StaffInvite[]))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoadingList(false));
  };
  useEffect(refresh, []);

  return (
    <div className="space-y-6">
      <CreateStaffUserCard />
      <CreateInviteCard onCreated={refresh} />
      <GlassCard title="Active invite links" desc={`${invites.length} total`}>
        {err && <div className="text-xs text-red-300 mb-3">{err}</div>}
        {loadingList ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : invites.length === 0 ? (
          <div className="text-sm text-muted-foreground">No invites yet. Create one above.</div>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <InviteRow key={inv.id} invite={inv} onChange={refresh} />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function CreateStaffUserCard() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setResult(null); setBusy(true);
    try {
      const res = await adminCreateStaffUser({
        data: {
          email,
          password: password || undefined,
          fullName: name || undefined,
          note: note || undefined,
        },
      });
      setResult({ email: res.email, password: res.password });
      setEmail(""); setName(""); setPassword(""); setNote("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard
      title="Create employee account"
      desc="Directly provision a free account with a 5-year active subscription. Share the credentials with the employee."
    >
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input required type="email" placeholder="Employee email" value={email} onChange={(e) => setEmail(e.target.value)} className={staffInput} />
        <input placeholder="Full name (optional)" value={name} onChange={(e) => setName(e.target.value)} className={staffInput} />
        <input placeholder="Password (optional — auto-generated if blank)" value={password} onChange={(e) => setPassword(e.target.value)} className={staffInput} />
        <input placeholder="Internal note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className={staffInput} />
        <button disabled={busy} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-5 py-2.5 text-sm font-medium text-cosmic disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create employee account
        </button>
      </form>
      {err && <div className="mt-3 text-xs text-red-300">{err}</div>}
      {result && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-gold/80">Credentials — copy & share now</div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-mono text-pearl">{result.email}</span></div>
          <div><span className="text-muted-foreground">Password:</span> <span className="font-mono text-pearl">{result.password}</span></div>
        </div>
      )}
    </GlassCard>
  );
}

function CreateInviteCard({ onCreated }: { onCreated: () => void }) {
  const [note, setNote] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">(30);
  const [maxUses, setMaxUses] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLastLink(null); setBusy(true);
    try {
      const inv = await adminCreateStaffInvite({
        data: {
          note: note || undefined,
          expiresInDays: expiresInDays === "" ? null : Number(expiresInDays),
          maxUses,
        },
      });
      const url = `${window.location.origin}/invite/${(inv as StaffInvite).code}`;
      setLastLink(url);
      setNote("");
      onCreated();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to create invite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard
      title="Generate invite link"
      desc="Shareable link — anyone who opens it signs up (or signs in) and is instantly unlocked with a free 5-year subscription."
    >
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <input placeholder="Note (e.g. Design team)" value={note} onChange={(e) => setNote(e.target.value)} className={`${staffInput} sm:col-span-3`} />
        <label className="text-xs text-muted-foreground flex flex-col gap-1">
          Expires in (days, blank = never)
          <input type="number" min={0} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value === "" ? "" : Number(e.target.value))} className={staffInput} />
        </label>
        <label className="text-xs text-muted-foreground flex flex-col gap-1">
          Max uses
          <input type="number" min={1} max={500} value={maxUses} onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value) || 1))} className={staffInput} />
        </label>
        <button disabled={busy} className="self-end inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-5 py-2.5 text-sm font-medium text-cosmic disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Generate link
        </button>
      </form>
      {err && <div className="mt-3 text-xs text-red-300">{err}</div>}
      {lastLink && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
          <div className="text-[10px] uppercase tracking-widest text-gold/80 mb-2">New invite link</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 text-xs text-pearl font-mono">{lastLink}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(lastLink); }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-pearl hover:bg-white/10"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function InviteRow({ invite, onChange }: { invite: StaffInvite; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${invite.code}`;
  const exhausted = invite.used_count >= invite.max_uses;
  const expired = !!invite.expires_at && new Date(invite.expires_at) < new Date();
  const status = invite.revoked ? "Revoked" : expired ? "Expired" : exhausted ? "Fully used" : "Active";
  const statusColor =
    status === "Active" ? "text-aurora border-aurora/40 bg-aurora/10" : "text-muted-foreground border-white/10 bg-white/5";

  const revoke = async () => {
    if (!confirm("Revoke this invite?")) return;
    setBusy(true);
    try { await adminRevokeStaffInvite({ data: { id: invite.id } }); onChange(); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm("Delete this invite permanently?")) return;
    setBusy(true);
    try { await adminDeleteStaffInvite({ data: { id: invite.id } }); onChange(); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-pearl">{invite.code}</span>
            <span className={`text-[10px] uppercase tracking-widest rounded-full border px-2 py-0.5 ${statusColor}`}>{status}</span>
          </div>
          {invite.note && <div className="mt-1 text-xs text-muted-foreground">{invite.note}</div>}
          <div className="mt-1 text-[11px] text-muted-foreground">
            {invite.used_count}/{invite.max_uses} used
            {invite.expires_at ? ` · expires ${new Date(invite.expires_at).toLocaleDateString()}` : " · no expiry"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-pearl hover:bg-white/10"
          >
            <Copy className="h-3.5 w-3.5" /> Copy link
          </button>
          {!invite.revoked && (
            <button
              disabled={busy}
              onClick={revoke}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-pearl hover:bg-white/10 disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5" /> Revoke
            </button>
          )}
          <button
            disabled={busy}
            onClick={remove}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
      <div className="mt-3">
        <code className="block truncate rounded-lg bg-black/40 px-3 py-2 text-[11px] text-muted-foreground font-mono">{url}</code>
      </div>
    </div>
  );
}

const staffInput =
  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

