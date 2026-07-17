import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { usePremium } from "@/hooks/use-premium";
import { StarField } from "@/components/star-field";

export function PremiumGate({
  featureName,
  children,
}: {
  featureName: string;
  children: ReactNode;
}) {
  const { isPremium, loading } = usePremium();
  if (loading) return null;
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative flex min-h-dvh w-full flex-col">
      <StarField />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="glass rounded-3xl p-8 sm:p-12 max-w-lg text-center">
          <div className="mx-auto h-16 w-16 grid place-items-center rounded-full gold-border bg-gold/10">
            <Lock className="h-7 w-7 text-gold" />
          </div>
          <div className="mt-5 text-[10px] uppercase tracking-[0.35em] text-gold/80">
            Premium feature
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl gold-text">
            {featureName} awaits
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Unlock the full cosmic experience with TAROMAYA Premium — advanced Vedic charts,
            transits, synastry, reports and unlimited AI readings.
          </p>
          <Link
            to="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-3 text-sm font-medium text-cosmic shadow-[0_10px_30px_-8px_oklch(0.82_0.13_85/0.5)] transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" /> View Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
