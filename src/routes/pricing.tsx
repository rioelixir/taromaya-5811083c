import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Check, Loader2, Crown, Clock, XCircle } from "lucide-react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { getActivePlan, getMySubscription, requestSubscription } from "@/lib/subscription.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Premium — TAROMAYA" },
      {
        name: "description",
        content: "Unlock TAROMAYA Premium — Kundli, transits, synastry, AI readings and full reports.",
      },
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
};

type SubState = {
  loading: boolean;
  signedIn: boolean;
  isPremium: boolean;
  status?: string;
};

function formatPrice(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function PricingPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [subState, setSubState] = useState<SubState>({
    loading: true,
    signedIn: false,
    isPremium: false,
  });
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getActivePlan()
      .then((p) => setPlan(p as Plan | null))
      .catch(() => setPlan(null))
      .finally(() => setLoadingPlan(false));

    async function loadSub() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setSubState({ loading: false, signedIn: false, isPremium: false });
        return;
      }
      try {
        const res = await getMySubscription();
        setSubState({
          loading: false,
          signedIn: true,
          isPremium: res.isPremium,
          status: res.subscription?.status,
        });
      } catch {
        setSubState({ loading: false, signedIn: true, isPremium: false });
      }
    }
    loadSub();
  }, []);

  const onRequest = async () => {
    if (!subState.signedIn) {
      navigate({ to: "/auth" });
      return;
    }
    if (plan?.payment_link) {
      // Fire-and-forget: mark pending so admin sees the request, then send them to pay.
      requestSubscription({ data: {} }).catch(() => {});
      window.open(plan.payment_link, "_blank", "noopener,noreferrer");
      setRequested(true);
      return;
    }
    setRequesting(true);
    setErr(null);
    try {
      await requestSubscription({ data: {} });
      setRequested(true);
      setSubState((s) => ({ ...s, status: "pending" }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not submit request.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <PageShell hideAI
      eyebrow="Membership"
      title="TAROMAYA Premium"
      subtitle="A single membership that unlocks the deepest layer of the cosmos."
    >
      {loadingPlan ? (
        <GlassCard>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading plan…
          </div>
        </GlassCard>
      ) : !plan ? (
        <GlassCard title="No active plan" desc="Premium is temporarily unavailable." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="glass rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
                <Crown className="h-3.5 w-3.5" /> Premium
              </div>
              <h2 className="mt-3 font-display text-4xl gold-text">{plan.name}</h2>
              {plan.description && (
                <p className="mt-3 text-sm text-muted-foreground max-w-lg">{plan.description}</p>
              )}
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-6xl gold-text">
                  {formatPrice(plan.price_cents, plan.currency)}
                </span>
                <span className="text-sm text-muted-foreground">/ {plan.billing_period}</span>
              </div>

              <ul className="mt-8 grid sm:grid-cols-2 gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-pearl">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {subState.isPremium ? (
                  <div className="inline-flex items-center gap-2 rounded-full gold-border bg-gold/10 px-5 py-2.5 text-sm text-pearl">
                    <Sparkles className="h-4 w-4 text-gold" /> You're a Premium member
                  </div>
                ) : requested || subState.status === "pending" ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-gold" /> Request received — an admin will activate your account shortly.
                  </div>
                ) : (
                  <button
                    onClick={onRequest}
                    disabled={requesting}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-3 text-sm font-medium text-cosmic shadow-[0_10px_30px_-8px_oklch(0.82_0.13_85/0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {plan.payment_link ? "Pay & Activate" : subState.signedIn ? "Request Premium" : "Sign in to continue"}
                  </button>
                )}
                {err && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-red-300">
                    <XCircle className="h-3 w-3" /> {err}
                  </div>
                )}
              </div>
            </div>
          </div>

          <GlassCard title="Members-only access" desc="TAROMAYA is a premium membership. All modules unlock with your subscription.">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Full tarot canvas & AI interpretations</li>
              <li>• Complete Vedic Kundli & divisional charts</li>
              <li>• Western natal, transits, synastry & progressions</li>
              <li>• Panchang, Muhurat, Numerology, Remedies & PDF reports</li>
            </ul>
            <div className="mt-6 text-xs text-muted-foreground">
              Already a member?{" "}
              <Link to="/profile" className="text-gold hover:underline">
                View your account
              </Link>
            </div>
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}
