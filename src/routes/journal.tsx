import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/journal")({
  component: () => (
    <PageShell
      eyebrow="Journal"
      title="Reflections & readings"
      subtitle="Capture insights from each reading. Track patterns across time and lunar cycles."
    >
      <GlassCard title="No entries yet" desc="Save your first tarot pull or horoscope note to begin." />
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Journal — TAROMAYA" }] }),
});
