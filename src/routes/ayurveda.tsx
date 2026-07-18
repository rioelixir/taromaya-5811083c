import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli, NAKSHATRAS, RASHIS } from "@/lib/vedic";
import { computePrakriti, DOSHA_META, type Dosha } from "@/lib/ayurveda";
import { Flame, Droplet, Wind, Sparkles, Leaf, Utensils, HeartPulse, Ban } from "lucide-react";

export const Route = createFileRoute("/ayurveda")({
  component: () => (
    <PremiumGate featureName="Ayurveda Prakriti">
      <AyurvedaPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Ayurveda Prakriti — TAROMAYA" },
      {
        name: "description",
        content:
          "Derive your Vata-Pitta-Kapha constitution from your Vedic birth chart, with diet, lifestyle, yoga and herb guidance.",
      },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };

const DOSHA_ICON: Record<Dosha, typeof Flame> = {
  Vata: Wind,
  Pitta: Flame,
  Kapha: Droplet,
};

const DOSHA_COLORS: Record<Dosha, { bar: string; text: string; ring: string }> = {
  Vata:  { bar: "from-sky-400 to-indigo-400",    text: "text-sky-300",    ring: "ring-sky-400/40" },
  Pitta: { bar: "from-amber-400 to-rose-400",    text: "text-amber-300",  ring: "ring-amber-400/40" },
  Kapha: { bar: "from-emerald-400 to-teal-400",  text: "text-emerald-300",ring: "ring-emerald-400/40" },
};

function DoshaBar({ dosha, value }: { dosha: Dosha; value: number }) {
  const Icon = DOSHA_ICON[dosha];
  const c = DOSHA_COLORS[dosha];
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${c.text}`} />
          <span className="text-sm text-pearl font-medium">{dosha}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {DOSHA_META[dosha].element}
          </span>
        </div>
        <span className={`text-sm font-display ${c.text}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function AdviceCard({
  icon: Icon,
  title,
  items,
  tone = "gold",
}: {
  icon: typeof Flame;
  title: string;
  items: string[];
  tone?: "gold" | "warn";
}) {
  const accent = tone === "warn" ? "text-rose-300" : "text-gold";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${accent}`} />
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      </div>
      <ul className="space-y-2 text-sm text-pearl">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={accent}>•</span>
            <span className="text-muted-foreground/90">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AyurvedaPage() {
  const [form, setForm] = useState(DEFAULT);

  const result = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
      return { chart, prakriti: computePrakriti(chart) };
    } catch {
      return null;
    }
  }, [form]);

  return (
    <PageShell
      eyebrow="Ayurveda Prakriti"
      title="Your constitutional blueprint"
      subtitle="A tri-doshic reading of Vata, Pitta and Kapha derived from your Vedic birth chart — with personalized diet, lifestyle, yoga and herb guidance."
    >
      <GlassCard title="Birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { k: "date", label: "Date", type: "date" },
            { k: "time", label: "Time", type: "time" },
            { k: "tz", label: "TZ offset", type: "text" },
            { k: "lat", label: "Latitude", type: "text" },
            { k: "lon", label: "Longitude", type: "text" },
          ].map((f) => (
            <label key={f.k} className="text-xs uppercase tracking-widest text-muted-foreground">
              {f.label}
              <input
                type={f.type}
                value={(form as Record<string, string>)[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm text-pearl outline-none focus:ring-1 focus:ring-gold/60"
              />
            </label>
          ))}
        </div>
      </GlassCard>

      {result && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="glass rounded-3xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Constitution</div>
                <div className="mt-1 font-display text-4xl gold-text">
                  {result.prakriti.constitution}
                </div>
                <div className="text-sm text-muted-foreground italic mt-1">
                  Dominant {result.prakriti.dominant} · Secondary {result.prakriti.secondary}
                </div>
              </div>
              <div className={`h-14 w-14 rounded-full grid place-items-center gold-border ring-2 ${DOSHA_COLORS[result.prakriti.dominant].ring}`}>
                <span className="text-2xl">{DOSHA_META[result.prakriti.dominant].symbol}</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <DoshaBar dosha="Vata" value={result.prakriti.scores.Vata} />
              <DoshaBar dosha="Pitta" value={result.prakriti.scores.Pitta} />
              <DoshaBar dosha="Kapha" value={result.prakriti.scores.Kapha} />
            </div>

            <div className="pt-3 border-t border-white/5 grid gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lagna dosha</span>
                <span className="text-pearl">
                  {RASHIS[result.chart.ascendant.rashi]} · {result.prakriti.lagnaDosha}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moon nakshatra</span>
                <span className="text-pearl">
                  {NAKSHATRAS[result.chart.moonNakshatra.index]} · {result.prakriti.moonTattva} tattva
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Qualities</span>
                <span className="text-pearl text-right">
                  {DOSHA_META[result.prakriti.dominant].qualities}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peak season</span>
                <span className="text-pearl">{DOSHA_META[result.prakriti.dominant].season}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <AdviceCard icon={Utensils} title="Diet" items={result.prakriti.advice.diet} />
            <AdviceCard icon={HeartPulse} title="Lifestyle" items={result.prakriti.advice.lifestyle} />
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <AdviceCard icon={Sparkles} title="Yoga & Pranayama" items={result.prakriti.advice.yoga} />
          <AdviceCard icon={Leaf} title="Herbs" items={result.prakriti.advice.herbs} />
          <AdviceCard icon={Ban} title="Avoid" items={result.prakriti.advice.avoid} tone="warn" />
        </div>
      )}
    </PageShell>
  );
}
