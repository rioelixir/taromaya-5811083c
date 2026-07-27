import { useEffect, useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { GlassCard } from "@/components/page-shell";
import { adminUpsertSetting } from "@/lib/admin.functions";
import { usePaywallConfig, type PaywallConfig } from "@/hooks/use-paywall";

const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

export function AdminPaywallTab() {
  const { config, loading, reload } = usePaywallConfig();
  const [draft, setDraft] = useState<PaywallConfig>(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setDraft(config), [config]);

  const set = <K extends keyof PaywallConfig>(k: K, v: PaywallConfig[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await adminUpsertSetting({ data: { key: "app.paywall", value: draft } });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading paywall settings…
      </div>
    );
  }

  return (
    <GlassCard title="Subscription Gateway" desc="Turn the ₹1973 UPI/QR paywall on or off for the whole app.">
      <div className="space-y-5">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
            className="h-5 w-5 accent-gold"
          />
          <div>
            <div className="text-sm font-medium">
              {draft.enabled ? "Paywall ON — users must pay to access modules" : "Paywall OFF — app is free for everyone"}
            </div>
            <div className="text-xs text-muted-foreground">
              Admins, comped users and active subscribers always get access.
            </div>
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount (INR)">
            <input
              type="number"
              className={inputCls}
              value={draft.amount_inr}
              onChange={(e) => set("amount_inr", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Payee Name">
            <input
              className={inputCls}
              value={draft.payee_name}
              onChange={(e) => set("payee_name", e.target.value)}
              placeholder="TAROMAYA"
            />
          </Field>
          <Field label="UPI ID (VPA)">
            <input
              className={inputCls}
              value={draft.upi_id}
              onChange={(e) => set("upi_id", e.target.value)}
              placeholder="name@bank"
            />
          </Field>
          <Field label="QR Image URL">
            <input
              className={inputCls}
              value={draft.qr_url}
              onChange={(e) => set("qr_url", e.target.value)}
              placeholder="https://…/qr.png"
            />
          </Field>
        </div>

        <Field label="Message to users">
          <textarea
            className={inputCls}
            rows={2}
            value={draft.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </Field>

        {draft.qr_url && (
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">Preview:</div>
            <img src={draft.qr_url} alt="QR preview" className="h-24 w-24 rounded-lg bg-white p-2 object-contain" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gold/20 border border-gold/40 text-gold px-5 py-2 text-sm hover:bg-gold/30 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save settings"}
          </button>
          {err && <div className="text-xs text-red-300">{err}</div>}
        </div>
      </div>
    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
