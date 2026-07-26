import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "TAROMAYA — Free for everyone" },
      { name: "description", content: "TAROMAYA is now completely free. All modules unlocked for every signed-in user." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <PageShell hideAI eyebrow="Access" title="Free for everyone" subtitle="TAROMAYA no longer requires a subscription — every module is unlocked.">
      <GlassCard title="You're all set" desc="Sign in and explore everything.">
        <p className="text-sm text-muted-foreground">
          Tarot, Kundli, Panchang, Numerology, AI Guide and every other module are open to all users at no cost.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 rounded-full gold-border bg-gold/10 px-5 py-2 text-sm text-gold hover:bg-gold/20"
        >
          Go to home
        </Link>
      </GlassCard>
    </PageShell>
  );
}
