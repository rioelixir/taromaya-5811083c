import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, Star, Tag, Copy, Check } from "lucide-react";
import { GlassCard } from "@/components/page-shell";
import {
  adminListPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
} from "@/lib/subscription.functions";
import {
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} from "@/lib/coupons.functions";

const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_period: string;
  features: string[];
  payment_link: string | null;
  is_active: boolean;
  tier: string;
  badge: string | null;
  highlight: boolean;
  trial_days: number;
  sort_order: number;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

// ─── PLANS MANAGER ─────────────────────────────────────────────────────
export function AdminPlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    adminListPlans().then((p) => setPlans(p as Plan[])).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const createPlan = async () => {
    setBusy(true); setErr(null);
    try {
      await adminCreatePlan({
        data: {
          slug: `plan-${Date.now()}`,
          name: "New Plan",
          price_cents: 99900,
          currency: "INR",
          billing_period: "monthly",
          features: ["Full access to all modules"],
          is_active: true,
          tier: "standard",
          sort_order: plans.length,
        },
      });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Create failed"); }
    finally { setBusy(false); }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading plans…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Create as many tiers as you like — Basic, Premium, Lifetime, etc.</div>
        <button
          onClick={createPlan}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> New plan
        </button>
      </div>
      {err && <div className="text-xs text-red-300">{err}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => (
          <PlanEditor key={p.id} plan={p} onChanged={refresh} />
        ))}
        {plans.length === 0 && (
          <GlassCard title="No plans yet" desc="Click “New plan” above to create your first tier." />
        )}
      </div>
    </div>
  );
}

function PlanEditor({ plan, onChanged }: { plan: Plan; onChanged: () => void }) {
  const [p, setP] = useState<Plan>(plan);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setP(plan), [plan.id]);

  const save = async () => {
    setSaving(true); setErr(null); setOk(false);
    try {
      await adminUpdatePlan({
        data: {
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          price_cents: Math.round(p.price_cents),
          currency: p.currency,
          billing_period: p.billing_period,
          features: p.features,
          payment_link: p.payment_link,
          is_active: p.is_active,
          tier: p.tier,
          badge: p.badge,
          highlight: p.highlight,
          trial_days: p.trial_days,
          sort_order: p.sort_order,
        },
      });
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    await adminDeletePlan({ data: { id: p.id } });
    onChanged();
  };

  const priceMajor = (p.price_cents / 100).toString();

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-medium text-pearl flex items-center gap-2">
            {p.highlight && <Star className="h-3.5 w-3.5 text-gold" />}
            {p.name}
          </div>
          <div className="text-[11px] text-muted-foreground">{p.slug}</div>
        </div>
        <button onClick={del} className="p-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input className={inputCls} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
          <Field label="Slug"><input className={inputCls} value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value })} /></Field>
        </div>
        <Field label="Description">
          <textarea rows={2} className={inputCls} value={p.description ?? ""} onChange={(e) => setP({ ...p, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Price">
            <input type="number" min="0" step="0.01" className={inputCls} value={priceMajor}
              onChange={(e) => setP({ ...p, price_cents: Math.round((parseFloat(e.target.value) || 0) * 100) })} />
          </Field>
          <Field label="Currency">
            <input className={inputCls} value={p.currency} onChange={(e) => setP({ ...p, currency: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Period">
            <select className={inputCls} value={p.billing_period} onChange={(e) => setP({ ...p, billing_period: e.target.value })}>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
              <option value="lifetime">lifetime</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Tier">
            <select className={inputCls} value={p.tier} onChange={(e) => setP({ ...p, tier: e.target.value })}>
              <option value="basic">basic</option>
              <option value="standard">standard</option>
              <option value="premium">premium</option>
              <option value="lifetime">lifetime</option>
            </select>
          </Field>
          <Field label="Trial days">
            <input type="number" min="0" className={inputCls} value={p.trial_days}
              onChange={(e) => setP({ ...p, trial_days: parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Sort order">
            <input type="number" className={inputCls} value={p.sort_order}
              onChange={(e) => setP({ ...p, sort_order: parseInt(e.target.value) || 0 })} />
          </Field>
        </div>
        <Field label="Badge (e.g. Most Popular, Best Value)">
          <input className={inputCls} value={p.badge ?? ""} onChange={(e) => setP({ ...p, badge: e.target.value || null })} />
        </Field>
        <Field label="Payment link (Razorpay / Stripe / UPI URL)">
          <input className={inputCls} placeholder="https://…" value={p.payment_link ?? ""}
            onChange={(e) => setP({ ...p, payment_link: e.target.value || null })} />
        </Field>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-pearl">
            <input type="checkbox" checked={p.is_active} onChange={(e) => setP({ ...p, is_active: e.target.checked })} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-pearl">
            <input type="checkbox" checked={p.highlight} onChange={(e) => setP({ ...p, highlight: e.target.checked })} />
            Highlight (Most Popular)
          </label>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Features</div>
          <FeatureList value={p.features} onChange={(features) => setP({ ...p, features })} />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          {ok && <span className="text-xs text-aurora inline-flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>}
          {err && <span className="text-xs text-red-300">{err}</span>}
        </div>
      </div>
    </GlassCard>
  );
}

function FeatureList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      {value.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <input className={inputCls} value={f} onChange={(e) => onChange(value.map((v, idx) => idx === i ? e.target.value : v))} />
          <button onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="p-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Add a feature…" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); if (draft.trim()) { onChange([...value, draft.trim()]); setDraft(""); } }
          }} />
        <button onClick={() => { if (draft.trim()) { onChange([...value, draft.trim()]); setDraft(""); } }}
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 text-sm text-pearl hover:bg-white/5">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

// ─── COUPONS MANAGER ──────────────────────────────────────────────────
type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  discount_amount_cents: number;
  currency: string;
  max_redemptions: number | null;
  times_redeemed: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

export function AdminCouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    adminListCoupons().then((c) => setCoupons(c as Coupon[])).finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const create = async () => {
    setErr(null);
    try {
      const code = `PROMO${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await adminCreateCoupon({ data: { code, discount_percent: 10, description: "10% off", is_active: true } });
      refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await adminDeleteCoupon({ data: { id } });
    refresh();
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (loading) return <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Discount codes users can apply at checkout.</div>
        <button onClick={create} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-3 py-1.5 text-sm font-medium">
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>
      {err && <div className="text-xs text-red-300">{err}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {coupons.map((c) => (
          <CouponEditor key={c.id} coupon={c} onChanged={refresh} onDelete={() => remove(c.id)} onCopy={() => copy(c.code)} copied={copied === c.code} />
        ))}
        {coupons.length === 0 && <GlassCard title="No coupons yet" desc="Create your first promo code above." />}
      </div>
    </div>
  );
}

function CouponEditor({
  coupon, onChanged, onDelete, onCopy, copied,
}: { coupon: Coupon; onChanged: () => void; onDelete: () => void; onCopy: () => void; copied: boolean }) {
  const [c, setC] = useState<Coupon>(coupon);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  useEffect(() => setC(coupon), [coupon.id]);

  const amtMajor = (c.discount_amount_cents / 100).toString();

  const save = async () => {
    setSaving(true);
    try {
      await adminUpdateCoupon({
        data: {
          id: c.id,
          code: c.code,
          description: c.description,
          discount_percent: c.discount_percent,
          discount_amount_cents: c.discount_amount_cents,
          currency: c.currency,
          max_redemptions: c.max_redemptions,
          valid_from: c.valid_from,
          valid_until: c.valid_until,
          is_active: c.is_active,
        },
      });
      onChanged();
      setOk(true); setTimeout(() => setOk(false), 1500);
    } finally { setSaving(false); }
  };

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gold" />
          <div>
            <button onClick={onCopy} className="text-sm font-mono font-medium text-pearl inline-flex items-center gap-1 hover:text-gold">
              {c.code}
              {copied ? <Check className="h-3 w-3 text-aurora" /> : <Copy className="h-3 w-3 opacity-60" />}
            </button>
            <div className="text-[11px] text-muted-foreground">
              Redeemed {c.times_redeemed}{c.max_redemptions !== null ? ` / ${c.max_redemptions}` : ""}
            </div>
          </div>
        </div>
        <button onClick={onDelete} className="p-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Code">
          <input className={inputCls} value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Description">
          <input className={inputCls} value={c.description ?? ""} onChange={(e) => setC({ ...c, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="% off">
            <input type="number" min="0" max="100" className={inputCls} value={c.discount_percent}
              onChange={(e) => setC({ ...c, discount_percent: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })} />
          </Field>
          <Field label="Amount off">
            <input type="number" min="0" step="0.01" className={inputCls} value={amtMajor}
              onChange={(e) => setC({ ...c, discount_amount_cents: Math.round((parseFloat(e.target.value) || 0) * 100) })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Max redemptions (blank = unlimited)">
            <input type="number" min="0" className={inputCls}
              value={c.max_redemptions ?? ""}
              onChange={(e) => setC({ ...c, max_redemptions: e.target.value === "" ? null : parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Currency">
            <input className={inputCls} value={c.currency} onChange={(e) => setC({ ...c, currency: e.target.value.toUpperCase() })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valid from">
            <input type="datetime-local" className={inputCls}
              value={c.valid_from ? c.valid_from.slice(0, 16) : ""}
              onChange={(e) => setC({ ...c, valid_from: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </Field>
          <Field label="Valid until">
            <input type="datetime-local" className={inputCls}
              value={c.valid_until ? c.valid_until.slice(0, 16) : ""}
              onChange={(e) => setC({ ...c, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-pearl">
          <input type="checkbox" checked={c.is_active} onChange={(e) => setC({ ...c, is_active: e.target.checked })} />
          Active
        </label>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          {ok && <span className="text-xs text-aurora">Saved</span>}
        </div>
      </div>
    </GlassCard>
  );
}
