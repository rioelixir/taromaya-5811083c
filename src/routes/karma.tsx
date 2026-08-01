import { BirthVoiceBox } from "@/components/birth-voice-box";
import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeKarma } from "@/lib/karma";
import { Infinity as InfIcon, Flame, Waves, Sparkles, Feather, Gift } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/karma")({
  component: () => (
    <PremiumGate featureName="Karma & Past-Life">
      <KarmaPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Karma & Past Life — TAROMAYA" },
      {
        name: "description",
        content:
          "Read your prior-life mastery, dharmic ache and moksha index from the Rahu-Ketu axis, 12th house and retrograde planets of your Vedic chart.",
      },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

const PILLAR_ICON = [InfIcon, Flame, Waves, Feather] as const;

function KarmaPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);

  const reading = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
      return analyzeKarma(chart);
    } catch {
      return null;
    }
  }, [form]);

  return (
    <PageShell
      eyebrow="Karma · Past Life · Moksha"
      title="The soul you arrived with"
      subtitle="A four-pillar karmic reading drawn from your Rahu-Ketu axis, twelfth house of Vyaya, and retrograde planets — the ancient Jyotish lens on prior-life mastery and this life's dharmic ache."
    >
      <GlassCard title="Birth data">
        <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
      </GlassCard>

      {reading && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass rounded-3xl p-6 space-y-4">
              <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Past-life summary</div>
              <p className="text-pearl leading-relaxed">{reading.pastLifeSummary}</p>
              <div className="pt-3 border-t border-white/5">
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80 mb-2">Soul lesson</div>
                <p className="text-pearl leading-relaxed italic">{reading.soulLesson}</p>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Moksha index</div>
                <div className="mt-2 font-display text-6xl gold-text">{reading.moksha}<span className="text-2xl text-muted-foreground">/100</span></div>
                <p className="text-sm text-muted-foreground mt-1">
                  Higher = deeper karmic ripeness for spiritual liberation this lifetime.
                </p>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-gold to-amber-300 transition-all"
                  style={{ width: `${reading.moksha}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Row label="Ketu" value={`${reading.ketuSign} · ${reading.ketuHouse}H`} />
                <Row label="Rahu" value={`${reading.rahuSign} · ${reading.rahuHouse}H`} />
                <Row label="12th lord" value={reading.twelfthLord ?? "—"} />
                <Row label="Retrogrades" value={reading.retrogrades.length ? String(reading.retrogrades.length) : "0"} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reading.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICON[i] ?? Sparkles;
              return (
                <div key={pillar.title} className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gold" />
                    <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{pillar.title}</div>
                  </div>
                  <div className="font-display text-lg gold-text">{pillar.headline}</div>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">{pillar.body}</p>
                  {pillar.bullets.length > 0 && (
                    <ul className="space-y-1.5 text-sm text-pearl pt-1">
                      {pillar.bullets.map((b, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-gold">•</span>
                          <span className="text-muted-foreground/90">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <LibCard icon={Sparkles} title="Mantras of release" items={reading.liberation.mantras} />
            <LibCard icon={Feather} title="Practices" items={reading.liberation.practices} />
            <LibCard icon={Gift} title="Karmic charities" items={reading.liberation.charities} />
          </div>
        </>
      )}
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-white/5">
      <span className="text-muted-foreground uppercase tracking-widest text-[10px]">{label}</span>
      <span className="text-pearl text-right">{value}</span>
    </div>
  );
}

function LibCard({ icon: Icon, title, items }: { icon: typeof Sparkles; title: string; items: string[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-gold" />
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gold">•</span>
            <span className="text-muted-foreground/90">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
