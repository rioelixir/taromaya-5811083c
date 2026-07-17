import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

const groups = [
  { title: "Appearance", items: ["Theme", "Language", "Typography size"] },
  { title: "Notifications", items: ["Daily horoscope", "Muhurat alerts", "Transit alerts"] },
  { title: "Privacy", items: ["Data export", "Delete account"] },
  { title: "About", items: ["Help center", "About TAROMAYA", "Terms & Privacy"] },
];

export const Route = createFileRoute("/settings")({
  component: () => (
    <PageShell eyebrow="Settings" title="Preferences" subtitle="Tune TAROMAYA to feel like yours.">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <GlassCard key={g.title} title={g.title}>
            <ul className="divide-y divide-white/5">
              {g.items.map((i) => (
                <li key={i} className="py-3 flex items-center justify-between">
                  <span className="text-sm text-pearl">{i}</span>
                  <span className="text-xs text-muted-foreground">›</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Settings — TAROMAYA" }] }),
});
