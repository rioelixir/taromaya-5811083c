import { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  BadgeCheck,
  Check,
  X,
  LogOut,
  ShieldCheck,
  Radio,
  ScrollText,
} from "lucide-react";
import { GlassCard } from "@/components/page-shell";
import {
  adminListEmployees,
  adminSetEmployee,
  adminListSessions,
  adminRevokeSession,
  adminRevokeAllSessions,
  adminAuditLog,
} from "@/lib/employee.functions";

type Person = Awaited<ReturnType<typeof adminListEmployees>>[number];
type Session = Awaited<ReturnType<typeof adminListSessions>>[number];
type LogRow = Awaited<ReturnType<typeof adminAuditLog>>[number];

function when(iso: string) {
  return new Date(iso).toLocaleString();
}

export function AdminEmployeesTab() {
  const [people, setPeople] = useState<Person[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, l] = await Promise.all([
        adminListEmployees(),
        adminListSessions(),
        adminAuditLog(),
      ]);
      setPeople(p);
      setSessions(s);
      setLogs(l);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const flip = async (p: Person) => {
    setBusy(p.id);
    setNote(null);
    try {
      await adminSetEmployee({ data: { userId: p.id, isEmployee: !p.isEmployee } });
      await load();
      setNote(
        !p.isEmployee
          ? `${p.email ?? "This person"} is now an employee. Full access turns on whenever they are signed in and working.`
          : `${p.email ?? "This person"} is no longer an employee. Their extra access stopped right away.`,
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  const kickAll = async (p: Person) => {
    setBusy(p.id);
    try {
      await adminRevokeAllSessions({ data: { userId: p.id } });
      await load();
      setNote(`Signed ${p.email ?? "them"} out of every device.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not sign them out");
    } finally {
      setBusy(null);
    }
  };

  const kickOne = async (s: Session) => {
    setBusy(s.id);
    try {
      await adminRevokeSession({ data: { sessionId: s.id } });
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not stop that session");
    } finally {
      setBusy(null);
    }
  };

  const list = people.filter((p) => {
    const hay = `${p.email ?? ""} ${p.display_name ?? ""}`.toLowerCase();
    return !q.trim() || hay.includes(q.trim().toLowerCase());
  });
  const employees = list.filter((p) => p.isEmployee);
  const others = list.filter((p) => !p.isEmployee);
  const activeNow = people.filter((p) => p.accessActive).length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading employees…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard
        title="How employee access works"
        desc="No office hours, no approvals. It looks after itself."
      >
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Mark someone as an employee
            below.
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> While they are signed in and
            using the app, every module is unlocked for free — no prices, no upgrade messages.
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> When they sign out, go quiet, or
            you switch them off, the extra access stops on its own. Nothing they saved is lost.
          </li>
        </ul>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/10 gold-border px-4 py-1.5 text-xs text-gold">
          <Radio className="h-3.5 w-3.5" /> {activeNow} employee
          {activeNow === 1 ? "" : "s"} working right now
        </div>
        {note && <div className="mt-3 text-xs text-pearl">{note}</div>}
      </GlassCard>

      <GlassCard title="Employees" desc="Turn access on or off for anyone. It takes effect instantly.">
        <div className="mb-3 flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="w-full bg-transparent text-sm text-pearl outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          {employees.length === 0 && (
            <div className="text-xs text-muted-foreground">No employees yet.</div>
          )}
          {employees.map((p) => (
            <Row key={p.id} p={p} busy={busy === p.id} onFlip={() => flip(p)} onKick={() => kickAll(p)} />
          ))}
        </div>

        {others.length > 0 && (
          <>
            <div className="mt-5 mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Everyone else
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {others.map((p) => (
                <Row key={p.id} p={p} busy={busy === p.id} onFlip={() => flip(p)} />
              ))}
            </div>
          </>
        )}
      </GlassCard>

      <GlassCard title="Who is signed in" desc="Live sessions across all devices.">
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {sessions.length === 0 && (
            <div className="text-xs text-muted-foreground">No sessions yet.</div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 truncate text-sm text-pearl">
                  {s.live ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-white/25" />
                  )}
                  {s.who}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Started {when(s.started_at)} · last active {when(s.last_seen_at)}
                  {s.revoked_at ? " · signed out" : ""}
                </div>
              </div>
              {s.live && (
                <button
                  onClick={() => kickOne(s)}
                  disabled={busy === s.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-pearl hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {busy === s.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Sign out
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Security log" desc="Every access change, newest first.">
        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1 text-xs">
          {logs.length === 0 && <div className="text-muted-foreground">Nothing logged yet.</div>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-2 text-muted-foreground">
              <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
              <span>
                <span className="text-pearl">{prettyAction(l.action)}</span>
                {l.subject ? ` — ${l.subject}` : ""} · by {l.actor} · {when(l.created_at)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function prettyAction(a: string) {
  switch (a) {
    case "employee_enabled":
      return "Employee access turned on";
    case "employee_disabled":
      return "Employee access turned off";
    case "session_started":
      return "Signed in";
    case "session_ended":
      return "Signed out";
    case "session_revoked":
      return "Session stopped by admin";
    case "sessions_force_logout":
      return "Signed out of all devices by admin";
    default:
      return a;
  }
}

function Row({
  p,
  busy,
  onFlip,
  onKick,
}: {
  p: Person;
  busy: boolean;
  onFlip: () => void;
  onKick?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm text-pearl">{p.email ?? p.display_name ?? p.id}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          {p.isEmployee && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-gold gold-border">
              <BadgeCheck className="h-3 w-3" /> Employee
            </span>
          )}
          {p.accessActive ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Access active
            </span>
          ) : p.isEmployee ? (
            <span className="text-muted-foreground">Not working right now</span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {p.isEmployee && p.hasLiveSession && onKick && (
          <button
            onClick={onKick}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-pearl hover:bg-white/[0.06] disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        )}
        <button
          onClick={onFlip}
          disabled={busy}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs transition-colors disabled:opacity-50",
            p.isEmployee
              ? "border border-white/15 text-pearl hover:bg-white/[0.06]"
              : "bg-gradient-to-r from-gold to-gold-soft font-medium text-cosmic",
          ].join(" ")}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : p.isEmployee ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {p.isEmployee ? "Remove" : "Make employee"}
        </button>
      </div>
    </div>
  );
}
