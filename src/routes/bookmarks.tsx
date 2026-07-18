import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { PremiumGate } from "@/components/premium-gate";

export const Route = createFileRoute("/bookmarks")({
  component: () => (
    <PremiumGate featureName="Bookmarks">
      <PageShell eyebrow="Bookmarks" title="Saved for later" subtitle="Cards, readings, and insights you've saved.">
        <GlassCard title="Empty" desc="Save any card or reading to see it here." />
      </PageShell>
    </PremiumGate>
  ),
  head: () => ({ meta: [{ title: "Bookmarks — TAROMAYA" }] }),
});
