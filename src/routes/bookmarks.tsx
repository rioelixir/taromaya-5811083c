import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/bookmarks")({
  component: () => (
    <PageShell eyebrow="Bookmarks" title="Saved for later" subtitle="Cards, readings, and insights you've saved.">
      <GlassCard title="Empty" desc="Save any card or reading to see it here." />
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Bookmarks — TAROMAYA" }] }),
});
