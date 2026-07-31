import { useEffect, useState } from "react";
import { Loader2, Crown, Gift, Search, Check, X } from "lucide-react";
import { GlassCard } from "@/components/page-shell";
import {
  getAccessMode,
  adminSetAccessMode,
  adminListSubscribers,
  adminSetUserPaid,
  adminSetPaidForEveryone,
  type AccessMode,
} from "@/lib/subscription.functions";

type Person = {
  id: string;
  email: string | null;
  display_name: string | null;
  is_comped: boolean;
  created_at: string;
};

export function AdminSubscriptionTab() {
  const [mode, setMode] = useState<AccessMode>("free");
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ mode: m }, list] = await Promise.all([getAccessMode(), adminListSubscribers()]);
      setMode(m);
      setPeople(list as Person[]);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const flipMode = async (next: AccessMode) => {
    setSaving(true);
    setNote(null);
    try {
      await adminSetAccessMode({ data: { mode: next } });
      setMode(next);
      setNote(next === "free" ? "Everything is free for everyone now." : "Paid mode is on. Only people marked paid get the extra parts.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const flipPerson = async (p: Person) => {
    setPeople((all) => all.map((x) => (x.id === p.id ? { ...x, is_comped: !x.is_comped } : x)));
    try {
      await adminSetUserPaid({ data: { userId: p.id, paid: !p.is_comped } });
    } catch (e) {
      setPeople((all) => all.map((x) => (x.id === p.id ? { ...x, is_comped: p.is_comped } : x)));
      setNote(e instanceof Error ? e.message : "Could not save");
    }
  };

  const flipEveryone = async (paid: boolean) => {
    setSaving(true);
    try {
      await adminSetPaidForEveryone({ data: { paid } });
      setPeople((all) => all.map((x) => ({ ...x, is_comped: paid })));
      setNote(paid ? "Everyone is marked paid." : "Everyone is marked free.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const shown = people.filter((p) =>
    `${p.email ?? ""} ${p.display_name ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-display text-lg">Free or Paid</h3>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Free means the whole app is open to everyone. Paid means only the people you mark
              below can open the extra parts. You can switch any time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={mode === "free" ? "text-sm text-pearl" : "text-sm text-muted-foreground"}>Free</span>
            <button
              type="button"
              role="switch"
              aria-checked={mode === "paid"}
              aria-label="Switch between free and paid"
              disabled={saving}
              onClick={() => void flipMode(mode === "free" ? "paid" : "free")}
              className={[
                "relative h-8 w-16 rounded-full transition-colors disabled:opacity-60",
                mode === "paid" ? "bg-gold/80" : "bg-white/15",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-1 h-6 w-6 rounded-full bg-pearl transition-all",
                  mode === "paid" ? "left-9" : "left-1",
                ].join(" ")}
              />
            </button>
            <span className={mode === "paid" ? "text-sm text-pearl" : "text-sm text-muted-foreground"}>Paid</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          {mode === "free" ? <Gift className="h-4 w-4 text-gold" /> : <Crown className="h-4 w-4 text-gold" />}
          <span className="text-muted-foreground">
            Right now the app is <strong className="text-pearl">{mode === "free" ? "free for everyone" : "paid"}</strong>.
          </span>
        </div>
        {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-display text-lg">Who gets the paid parts</h3>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void flipEveryone(true)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-pearl hover:bg-white/5 disabled:opacity-60"
            >
              Give to everyone
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void flipEveryone(false)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-pearl hover:bg-white/5 disabled:opacity-60"
            >
              Take from everyone
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2">
          <Search className="h-4 w-4 text-gold shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search people"
            className="w-full bg-transparent text-sm text-pearl outline-none placeholder:text-muted-foreground"
          />
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading people…
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {shown.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-pearl">{p.display_name || p.email || p.id}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.email}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.is_comped}
                  aria-label={`Paid access for ${p.email ?? p.id}`}
                  onClick={() => void flipPerson(p)}
                  className={[
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
                    p.is_comped
                      ? "bg-gold/20 gold-border text-pearl"
                      : "border border-white/10 text-muted-foreground hover:text-pearl",
                  ].join(" ")}
                >
                  {p.is_comped ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {p.is_comped ? "Paid" : "Free"}
                </button>
              </div>
            ))}
            {shown.length === 0 && (
              <p className="text-sm text-muted-foreground">Nobody matched that search.</p>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
