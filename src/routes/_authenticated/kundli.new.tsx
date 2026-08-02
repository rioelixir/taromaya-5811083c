import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { BirthInputForm } from "@/components/birth-input-form";
import { Card } from "@/components/ui/card";
import { NorthIndianChart, SouthIndianChart, EastIndianChart, toNavamsha } from "@/components/rashi-chart";
import { ChartExport } from "@/components/chart-export";
import { CHART_VARIANTS, toVariant, type ChartVariant } from "@/lib/chart-variants";
import { VargaExplorer, DashaTimeline } from "@/components/vargas-dasha";
import { StrengthsPanel } from "@/components/strengths-panel";
import { YogasDoshasPanel } from "@/components/yogas-doshas-panel";
import { JaiminiPanel } from "@/components/jaimini-panel";
import { KPPanel } from "@/components/kp-panel";
import { LalKitabPanel } from "@/components/lal-kitab-panel";
import { computePanchang, fmtTime } from "@/lib/panchang";

export const Route = createFileRoute("/_authenticated/kundli/new")({
  head: () => ({
    meta: [
      { title: "New Kundli — TAROMAYA" },
      { name: "description", content: "Precision birth chart with D1 Rashi, D9 Navamsha, and birth-moment Panchang." },
    ],
  }),
  component: NewKundliPage,
});

type ChartLite = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: Array<{ name: string; longitude: number; rashi: number; house: number; degreeInRashi: number; retrograde: boolean; combust?: boolean; exalted?: boolean; debilitated?: boolean }>;
  meta: { engine: string; engineVersion: string; ayanamsa: string; ayanamsaValue: number };
};

const RASHIS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function NewKundliPage() {
  const [chart, setChart] = useState<ChartLite | null>(null);
  const [birth, setBirth] = useState<{ year: number; month: number; day: number; hour: number; minute: number; seconds?: number; tzOffsetHours: number; latitude: number; longitude: number } | null>(null);
  const [style, setStyle] = useState<"north" | "south" | "east">("north");
  const [variant, setVariant] = useState<ChartVariant>("lagna");

  const baseChart = useMemo(
    () => (chart ? (toVariant(chart, variant) as unknown as ChartLite) : null),
    [chart, variant],
  );
  const navChart = useMemo(() => (chart ? toNavamsha(chart) : null), [chart]);
  const variantMeta = CHART_VARIANTS.find((v) => v.key === variant)!;

  const panchang = useMemo(() => {
    if (!birth) return null;
    const utcMs = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute, birth.seconds ?? 0)
      - birth.tzOffsetHours * 3600 * 1000;
    return computePanchang({ date: new Date(utcMs), latitude: birth.latitude, longitude: birth.longitude });
  }, [birth]);

  return (
    <PageShell aiModule="Kundli" title="Precision Kundli" subtitle="Swiss-Ephemeris engine · Lahiri default · D1 + D9 + Panchang">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <BirthInputForm
          onComputed={(c, b) => { setChart(c as unknown as ChartLite); if (b) setBirth(b as unknown as typeof birth); }}
        />

        {chart && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-lg">Charts</h3>
              <div className="inline-flex overflow-hidden rounded-full border border-border/50 bg-background/40 text-xs">
                {(["north", "south", "east"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setStyle(k)}
                    className={`min-h-11 px-4 py-2 capitalize ${style === k ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {CHART_VARIANTS.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setVariant(v.key)}
                    className={`min-h-11 rounded-full border px-4 py-2 text-xs transition ${
                      variant === v.key
                        ? "border-primary/60 bg-primary/20 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{variantMeta.note}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ChartExport filename={`taromaya-${variant}-chart`}>
                {style === "north" ? (
                  <NorthIndianChart chart={baseChart ?? chart} title={`D1 · ${variantMeta.label}`} />
                ) : style === "south" ? (
                  <SouthIndianChart chart={baseChart ?? chart} title={`D1 · ${variantMeta.label}`} />
                ) : (
                  <EastIndianChart chart={baseChart ?? chart} title={`D1 · ${variantMeta.label}`} />
                )}
              </ChartExport>
              {navChart && (
                <ChartExport filename="taromaya-navamsha-chart">
                  {style === "north" ? (
                    <NorthIndianChart chart={navChart} title="D9 · Navamsha" />
                  ) : style === "south" ? (
                    <SouthIndianChart chart={navChart} title="D9 · Navamsha" />
                  ) : (
                    <EastIndianChart chart={navChart} title="D9 · Navamsha" />
                  )}
                </ChartExport>
              )}
            </div>

            <Card className="glass-card space-y-3 p-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Lagna</div>
                <div className="font-mono">{RASHIS[chart.ascendant.rashi]} {chart.ascendant.degreeInRashi.toFixed(2)}°</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Planets</div>
                <ul className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 font-mono text-xs sm:grid-cols-2">
                  {chart.planets.map((p) => (
                    <li key={p.name} className="flex justify-between gap-2">
                      <span>{p.name}{p.retrograde ? "℞" : ""}</span>
                      <span className="text-right">
                        {RASHIS[p.rashi]} {p.degreeInRashi.toFixed(2)}° · H{p.house}
                        {p.combust ? " ✦" : ""}{p.exalted ? " ↑" : ""}{p.debilitated ? " ↓" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {chart.meta.engineVersion}
              </div>

            </Card>

            {panchang && (
              <Card className="glass-card space-y-2 p-4 text-sm">
                <h3 className="font-serif text-lg">Birth-moment Panchang</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                  <span className="text-muted-foreground">Weekday</span><span>{panchang.weekday}</span>
                  <span className="text-muted-foreground">Tithi</span><span>{panchang.tithi.name} · {panchang.tithi.paksha}</span>
                  <span className="text-muted-foreground">Nakshatra</span><span>{panchang.nakshatra.name} · pada {panchang.nakshatra.pada} · {panchang.nakshatra.lord}</span>
                  <span className="text-muted-foreground">Yoga</span><span>{panchang.yoga.name}</span>
                  <span className="text-muted-foreground">Karana</span><span>{panchang.karana.name}</span>
                  <span className="text-muted-foreground">Sunrise</span><span>{fmtTime(panchang.sunrise)}</span>
                  <span className="text-muted-foreground">Sunset</span><span>{fmtTime(panchang.sunset)}</span>
                  <span className="text-muted-foreground">Moon age</span><span>{panchang.moonAge.toFixed(2)} days · {(panchang.moonIllumination * 100).toFixed(0)}% lit</span>
                </div>
              </Card>
            )}

            <StrengthsPanel chart={chart} />

            <YogasDoshasPanel chart={chart} />

            {(() => {
              const utcMs = birth
                ? Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute, birth.seconds ?? 0)
                    - birth.tzOffsetHours * 3600 * 1000
                : null;
              return <JaiminiPanel chart={chart} birthDate={utcMs !== null ? new Date(utcMs) : null} />;
            })()}

            <KPPanel chart={chart} />

            {(() => {
              const utcMs = birth
                ? Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute, birth.seconds ?? 0)
                    - birth.tzOffsetHours * 3600 * 1000
                : null;
              return <LalKitabPanel chart={chart} birthDate={utcMs !== null ? new Date(utcMs) : null} />;
            })()}

            <VargaExplorer chart={chart} />



            {(() => {
              const moon = chart.planets.find((p) => p.name === "Moon");
              if (!moon || !birth) return null;
              const utcMs = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute, birth.seconds ?? 0)
                - birth.tzOffsetHours * 3600 * 1000;
              return <DashaTimeline birthDate={new Date(utcMs)} moonLongitude={moon.longitude} chart={chart} />;
            })()}
          </div>
        )}
      </div>
    </PageShell>
  );
}
