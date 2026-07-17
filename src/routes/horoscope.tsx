import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/horoscope")({
  component: HoroscopePage,
  head: () => ({ meta: [{ title: "Horoscope — TAROMAYA" }] }),
});

const signs = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

function HoroscopePage() {
  return (
    <PageShell
      eyebrow="Horoscope"
      title="Read the sky"
      subtitle="Daily, weekly, monthly and yearly predictions across life, love, career and health."
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {periods.map((p, i) => (
          <button
            key={p}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest ${
              i === 0 ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {signs.map((s) => (
          <GlassCard key={s}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Sign</div>
            <div className="mt-1 font-display text-xl text-pearl">{s}</div>
            <div className="mt-3 text-xs text-muted-foreground line-clamp-3">
              A gentle current pushes you toward clarity. Trust it.
            </div>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}
