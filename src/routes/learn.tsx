import { createFileRoute } from "@tanstack/react-router";
import { PageShell, ComingSoonGrid } from "@/components/page-shell";
import { PremiumGate } from "@/components/premium-gate";

const topics = [
  "Tarot Basics", "Major Arcana", "Minor Arcana", "Court Cards",
  "Vedic Astrology 101", "The 12 Houses", "The 9 Planets", "27 Nakshatras",
  "Dashas Explained", "Divisional Charts", "Doshas & Remedies",
  "Numerology Foundations", "Panchang Guide", "Meditation & Mantras",
];

export const Route = createFileRoute("/learn")({
  component: () => (
    <PremiumGate featureName="Learning">
      <PageShell hideAI
        eyebrow="Learning"
        title="Ancient wisdom, modern lens"
        subtitle="Structured courses on tarot, astrology, numerology, and Vedic time — from novice to advanced."
      >
        <ComingSoonGrid items={topics} />
      </PageShell>
    </PremiumGate>
  ),
  head: () => ({ meta: [{ title: "Learning — TAROMAYA" }] }),
});
