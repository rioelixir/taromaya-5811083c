import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Check, Loader2, Crown, Clock, XCircle, Tag, Star } from "lucide-react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { getActivePlans, getMySubscription, requestSubscription } from "@/lib/subscription.functions";
import { validateCoupon } from "@/lib/coupons.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Premium — TAROMAYA" },
      { name: "description", content: "Choose your TAROMAYA membership — Kundli, transits, synastry, AI readings and full reports." },
    ],
  }),
});

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_period: string;
  features: string[];
  payment_link: string | null;
  tier: string;
  badge: string | null;
  highlight: boolean;
  trial_days: number;
};

type SubState = {
  loading: boolean;
  signedIn: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  status?: string;
};

function formatPrice(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [subState, setSubState] = useState<SubState>({ loading: true, signedIn: false, isPremium: false, isAdmin: false });
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponPlanId, setCouponPlanId] = useState<string>("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<null | { code: string; amountOffCents: number; finalPriceCents: number; currency: string; planId: string }>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);

  useEffect(() => {
    getActivePlans()
      .then((p) => {
        const list = p as Plan[];
        setPlans(list);
        if (list.length && !couponPlanId) setCouponPlanId(list[0].id);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));

    async function loadSub() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setSubState({ loading: false, signedIn: false, isPremium: false, isAdmin: false });
        return;
      }
      const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      const isAdmin = !!roleRow;
      try {
        const res = await getMySubscription();
        setSubState({ loading: false, signedIn: true, isPremium: res.isPremium, isAdmin, status: res.subscription?.status });
      } catch {
        setSubState({ loading: false, signedIn: true, isPremium: false, isAdmin });
      }
    }
    loadSub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === couponPlanId) ?? null, [plans, couponPlanId]);

  const applyCoupon = async () => {
    if (!couponCode.trim() || !couponPlanId) return;
    if (!subState.signedIn) { navigate({ to: "/auth" }); return; }
    setApplying(true); setCouponErr(null); setApplied(null);
    try {
      const res = await validateCoupon({ data: { code: couponCode.trim(), planId: couponPlanId } });
      if (res.ok) {
        setApplied({ code: res.code, amountOffCents: res.amountOffCents, finalPriceCents: res.finalPriceCents, currency: res.currency, planId: couponPlanId });
      } else {
        setCouponErr(res.reason);
      }
    } catch (e) {
      setCouponErr(e instanceof Error ? e.message : "Could not validate coupon");
    } finally { setApplying(false); }
  };

  const onChoose = async (plan: Plan) => {
    if (!subState.signedIn) { navigate({ to: "/auth" }); return; }
    if (plan.payment_link) {
      requestSubscription({ data: {} }).catch(() => {});
      window.open(plan.payment_link, "_blank", "noopener,noreferrer");
      setRequested(true);
      return;
    }
    setRequesting(plan.id); setErr(null);
    try {
      await requestSubscription({ data: {} });
      setRequested(true);
      setSubState((s) => ({ ...s, status: "pending" }));
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not submit request."); }
    finally { setRequesting(null); }
  };

  if (subState.isAdmin) {
    return (
      <PageShell hideAI eyebrow="Admin" title="Unlimited access" subtitle="Admins bypass membership — every module is unlocked for you.">
        <GlassCard>
          <div className="flex items-center gap-2 text-sm text-pearl">
            <Crown className="h-4 w-4 text-gold" /> You have full admin access. No subscription needed.
          </div>
          <Link to="/admin" className="mt-4 inline-flex items-center gap-2 rounded-full gold-border bg-gold/10 px-5 py-2 text-sm text-gold hover:bg-gold/20">
            Open admin panel
          </Link>
        </GlassCard>
      </PageShell>
    );
  }

  return (
    <PageShell hideAI eyebrow="Membership" title="Choose your TAROMAYA plan" subtitle="A single membership that unlocks the deepest layer of the cosmos.">
      {loadingPlans ? (
        <GlassCard>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
          </div>
        </GlassCard>
      ) : plans.length === 0 ? (
        <GlassCard title="No active plans" desc="Premium is temporarily unavailable." />
      ) : (
        <>
          <div className={`grid gap-6 ${plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "lg:grid-cols-2" : ""}`}>
            {plans.map((plan) => {
              const isApplied = applied && applied.planId === plan.id;
              const finalPrice = isApplied ? applied!.finalPriceCents : plan.price_cents;
              return (
                <div key={plan.id} className={`glass rounded-3xl p-6 relative overflow-hidden ${plan.highlight ? "ring-2 ring-gold/60" : ""}`}>
                  {plan.highlight && (
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
                        <Crown className="h-3.5 w-3.5" /> {plan.tier}
                      </div>
                      {plan.badge && (
                        <div className="inline-flex items-center gap-1 rounded-full gold-border bg-gold/10 px-2.5 py-0.5 text-[10px] text-gold">
                          <Star className="h-3 w-3" /> {plan.badge}
                        </div>
                      )}
                    </div>
                    <h2 className="mt-3 font-display text-3xl gold-text">{plan.name}</h2>
                    {plan.description && <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>}
                    <div className="mt-5 flex items-baseline gap-2">
                      {isApplied && applied!.amountOffCents > 0 && (
                        <span className="font-display text-2xl text-muted-foreground line-through decoration-red-400/60">
                          {formatPrice(plan.price_cents, plan.currency)}
                        </span>
                      )}
                      <span className="font-display text-5xl gold-text">
                        {formatPrice(finalPrice, plan.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ {plan.billing_period}</span>
                    </div>
                    {plan.trial_days > 0 && (
                      <div className="mt-2 text-[11px] text-aurora">{plan.trial_days}-day trial included</div>
                    )}

                    <ul className="mt-6 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-pearl">
                          <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {subState.isPremium ? (
                        <div className="inline-flex items-center gap-2 rounded-full gold-border bg-gold/10 px-4 py-2 text-sm text-pearl">
                          <Sparkles className="h-4 w-4 text-gold" /> You're a Premium member
                        </div>
                      ) : requested || subState.status === "pending" ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 text-gold" /> Request received — admin will activate soon.
                        </div>
                      ) : (
                        <button
                          onClick={() => onChoose(plan)}
                          disabled={requesting === plan.id}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-5 py-2.5 text-sm font-medium text-cosmic shadow-[0_10px_30px_-8px_oklch(0.82_0.13_85/0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50"
                        >
                          {requesting === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {plan.payment_link ? "Pay & Activate" : subState.signedIn ? "Choose plan" : "Sign in to continue"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {err && <div className="mt-4 inline-flex items-center gap-2 text-xs text-red-300"><XCircle className="h-3 w-3" /> {err}</div>}

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <GlassCard title="Have a promo code?" desc="Apply a coupon to see your final price before you pay.">
              <div className="space-y-3">
                {plans.length > 1 && (
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Plan</div>
                    <select
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl focus:outline-none focus:border-gold/50"
                      value={couponPlanId}
                      onChange={(e) => { setCouponPlanId(e.target.value); setApplied(null); setCouponErr(null); }}
                    >
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                )}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
                    <input
                      className="w-full rounded-xl bg-black/30 border border-white/10 pl-9 pr-3 py-2 text-sm text-pearl uppercase placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
                      placeholder="ENTER CODE"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setApplied(null); setCouponErr(null); }}
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    disabled={applying || !couponCode.trim() || !couponPlanId}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {applied && selectedPlan && (
                  <div className="rounded-xl gold-border bg-gold/10 px-3 py-2 text-xs text-pearl">
                    ✅ <span className="font-mono">{applied.code}</span> applied — you save{" "}
                    <span className="text-gold">{formatPrice(applied.amountOffCents, applied.currency)}</span> on {selectedPlan.name}.
                  </div>
                )}
                {couponErr && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">{couponErr}</div>
                )}
              </div>
            </GlassCard>

            <GlassCard title="Members-only access" desc="TAROMAYA is a premium membership. All modules unlock with your subscription.">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Full tarot canvas & AI interpretations</li>
                <li>• Complete Vedic Kundli & divisional charts</li>
                <li>• Western natal, transits, synastry & progressions</li>
                <li>• Panchang, Muhurat, Numerology, Remedies & PDF reports</li>
              </ul>
              <div className="mt-6 text-xs text-muted-foreground">
                Already a member?{" "}
                <Link to="/profile" className="text-gold hover:underline">View your account</Link>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </PageShell>
  );
}
