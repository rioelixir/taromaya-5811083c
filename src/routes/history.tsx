import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/history")({
  component: () => (
    <PageShell eyebrow="History" title="Your cosmic timeline" subtitle="Every reading, every chart, every question.">
      <GlassCard title="Nothing here yet" desc="Your readings and conversations will appear here." />
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "History — TAROMAYA" }] }),
});
