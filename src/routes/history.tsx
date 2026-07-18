import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { PremiumGate } from "@/components/premium-gate";

export const Route = createFileRoute("/history")({
  component: () => (
    <PremiumGate featureName="History">
      <PageShell eyebrow="History" title="Your cosmic timeline" subtitle="Every reading, every chart, every question.">
        <GlassCard title="Nothing here yet" desc="Your readings and conversations will appear here." />
      </PageShell>
    </PremiumGate>
  ),
  head: () => ({ meta: [{ title: "History — TAROMAYA" }] }),
});
