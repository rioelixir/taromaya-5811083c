import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/reports")({
  component: () => (
    <PageShell
      eyebrow="Reports"
      title="Luxury PDF reports"
      subtitle="Comprehensive personal reports with charts, infographics, and beautiful typography."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Life Report",
          "Career Report",
          "Love & Marriage",
          "Health & Wellness",
          "Finance & Business",
          "Yearly Forecast",
        ].map((r) => (
          <GlassCard key={r} title={r} desc="Detailed 30+ page report with remedies." />
        ))}
      </div>
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Reports — TAROMAYA" }] }),
});
