import { BirthVoiceBox } from "@/components/birth-voice-box";
import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli, RASHIS } from "@/lib/vedic";
import { computeAshtakavarga, computeShadbala } from "@/lib/vedic-deep";
import { MapPin, Gauge, Grid3x3 } from "lucide-react";

export const Route = createFileRoute("/strength")({
  component: () => (
    <PremiumGate featureName="Planetary Strength">
      <StrengthPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Shadbala & Ashtakavarga — TAROMAYA" },
      { name: "description", content: "AstroSage-style planetary strength dashboard: six-fold Shadbala rupas and full Bhinna + Sarva Ashtakavarga bindu tables from your Vedic chart." },
      { property: "og:title", content: "Shadbala & Ashtakavarga — TAROMAYA" },
      { property: "og:description", content: "Classical strength scoring and Ashtakavarga bindu tables for every planet in your Kundli." },
    ],
  }),
});

type FormState = { date: string; time: string; tz: string; lat: string; lon: string; place: string };
const DEFAULTS: FormState = {
  date: "1995-06-15", time: "07:45", tz: "5.5",
  lat: "28.6139", lon: "77.2090", place: "New Delhi, India",
};

const inputCls = "w-full rounded-md border border-border/40 bg-background/40 px-2 py-1.5 font-mono text-xs";

function StrengthPage() {
  const [form, setForm] = useState<FormState>(DEFAULTS);

  const chart = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      return computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
    } catch { return null; }
  }, [form]);

  const shad = useMemo(() => (chart ? computeShadbala(chart) : null), [chart]);
  const av = useMemo(() => (chart ? computeAshtakavarga(chart) : null), [chart]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <PageShell
      title="Shadbala & Ashtakavarga"
      subtitle="Classical six-fold strength (rupas) and full bindu tables — AstroSage-style"
    >
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <GlassCard>
          <h3 className="mb-3 font-serif text-lg">Birth Details</h3>
          <div className="space-y-3 text-xs">
            <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
          </div>
        </GlassCard>

        {shad && av && (
          <div className="space-y-4">
            <GlassCard>
              <h3 className="mb-2 font-serif text-lg">In plain English</h3>
              <p className="text-sm text-muted-foreground">
                Think of this page as a report card for each planet in your chart. Some planets are placed
                in a way that makes them act powerfully and reliably; others are placed in a weaker spot and
                need more support (through timing or remedies) to show their best side. The strongest planet
                here is <span className="text-primary">{[...shad].sort((a, b) => b.ratio - a.ratio)[0].planet}</span>,
                and the one most in need of support is{" "}
                <span className="text-primary">{[...shad].sort((a, b) => a.ratio - b.ratio)[0].planet}</span>.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Further down, two advanced tables break this down in classical Vedic detail: Shadbala (a
                six-part strength score for each planet) and Ashtakavarga (a point count showing which signs
                are lucky for each planet).
              </p>
            </GlassCard>

            <GlassCard>
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-gold" />
                <h3 className="font-serif text-lg">Shadbala (Six-fold Strength)</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">values in rupas</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead>
                    <tr className="border-b border-border/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-2">Planet</th>
                      <th className="px-2 text-right">Sthana</th>
                      <th className="px-2 text-right">Dig</th>
                      <th className="px-2 text-right">Kala</th>
                      <th className="px-2 text-right">Chesta</th>
                      <th className="px-2 text-right">Naisargika</th>
                      <th className="px-2 text-right">Drig</th>
                      <th className="px-2 text-right font-semibold">Total</th>
                      <th className="px-2 text-right">Required</th>
                      <th className="pl-2 text-right">Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {shad.map((r) => {
                      const strong = r.ratio >= 1;
                      return (
                        <tr key={r.planet} className="border-b border-border/10">
                          <td className="py-2 pr-2 font-serif text-sm">{r.planet}</td>
                          <td className="px-2 text-right">{r.sthana.toFixed(2)}</td>
                          <td className="px-2 text-right">{r.dig.toFixed(2)}</td>
                          <td className="px-2 text-right">{r.kala.toFixed(2)}</td>
                          <td className="px-2 text-right">{r.chesta.toFixed(2)}</td>
                          <td className="px-2 text-right">{r.naisargika.toFixed(2)}</td>
                          <td className="px-2 text-right">{r.drig.toFixed(2)}</td>
                          <td className={`px-2 text-right font-semibold ${strong ? "text-emerald-300" : "text-rose-300"}`}>{r.total.toFixed(2)}</td>
                          <td className="px-2 text-right text-muted-foreground">{r.required.toFixed(2)}</td>
                          <td className={`pl-2 text-right ${strong ? "text-emerald-300" : "text-rose-300"}`}>{r.ratio.toFixed(2)}×</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                A planet is <span className="text-emerald-300">strong</span> when its total meets the classical Parashari requirement (ratio ≥ 1.00×). Weak planets often indicate remedial focus.
              </p>
            </GlassCard>

            <GlassCard>
              <div className="mb-3 flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-gold" />
                <h3 className="font-serif text-lg">Ashtakavarga — Bhinna & Sarva</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-b border-border/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-2">Planet</th>
                      {RASHIS.map((r) => (
                        <th key={r} className="px-1 text-center">{r.slice(0, 3)}</th>
                      ))}
                      <th className="pl-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {av.bhinna.map((row) => (
                      <tr key={row.planet} className="border-b border-border/10">
                        <td className="py-2 pr-2 font-serif text-sm">{row.planet}</td>
                        {row.bindus.map((b, i) => (
                          <td key={i} className="px-1 text-center">
                            <BinduCell value={b} />
                          </td>
                        ))}
                        <td className="pl-2 text-right font-semibold">{row.total}</td>
                      </tr>
                    ))}
                    <tr className="bg-primary/5">
                      <td className="py-2 pr-2 font-serif text-sm text-primary">Sarva</td>
                      {av.sarva.map((b, i) => (
                        <td key={i} className="px-1 text-center">
                          <SarvaCell value={b} />
                        </td>
                      ))}
                      <td className="pl-2 text-right font-semibold text-primary">{av.sarvaTotal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                Bindus per rashi across all seven planets form the <span className="text-primary">Sarva Ashtakavarga</span>. Signs with ≥ 30 bindus are auspicious houses of gain; ≤ 25 indicate reduced yield.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="mb-2 font-serif text-lg">Reading the report</h3>
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p><span className="text-primary">Sthana</span> — positional strength from exaltation proximity and own-sign placement.</p>
                <p><span className="text-primary">Dig</span> — directional strength based on the house of full potency.</p>
                <p><span className="text-primary">Kala</span> — temporal strength (diurnal / nocturnal preference).</p>
                <p><span className="text-primary">Chesta</span> — motional strength from retrograde or accelerated motion.</p>
                <p><span className="text-primary">Naisargika</span> — inherent hierarchy (Sun strongest → Saturn weakest).</p>
                <p><span className="text-primary">Drig</span> — aspectual balance from benefic and malefic sightings.</p>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function BinduCell({ value }: { value: number }) {
  const tone = value >= 6 ? "text-emerald-300" : value >= 4 ? "text-gold" : value >= 2 ? "text-muted-foreground" : "text-rose-300/80";
  return <span className={tone}>{value}</span>;
}

function SarvaCell({ value }: { value: number }) {
  const tone = value >= 30 ? "bg-emerald-500/20 text-emerald-200"
    : value >= 28 ? "bg-primary/20 text-primary"
    : value >= 25 ? "bg-background/40 text-foreground/80"
    : "bg-rose-500/15 text-rose-200";
  return (
    <span className={`inline-block min-w-[26px] rounded px-1 py-0.5 text-center ${tone}`}>
      {value}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
