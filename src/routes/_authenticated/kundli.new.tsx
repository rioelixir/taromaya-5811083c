import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { BirthInputForm } from "@/components/birth-input-form";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/kundli/new")({
  head: () => ({
    meta: [
      { title: "New Kundli — TAROMAYA" },
      { name: "description", content: "Precision birth chart intake with historical timezone, coordinates, and configurable ayanamsa." },
    ],
  }),
  component: NewKundliPage,
});

type ChartLite = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: Array<{ name: string; rashi: number; house: number; degreeInRashi: number; retrograde: boolean; combust?: boolean; exalted?: boolean; debilitated?: boolean }>;
  meta: { engine: string; engineVersion: string; ayanamsa: string; ayanamsaValue: number };
};

const RASHIS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function NewKundliPage() {
  const [chart, setChart] = useState<ChartLite | null>(null);

  return (
    <PageShell title="Precision Kundli" subtitle="Verified Swiss-Ephemeris engine · Lahiri default">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <BirthInputForm onComputed={(c) => setChart(c as unknown as ChartLite)} />
        {chart && (
          <Card className="glass-card h-fit space-y-3 p-5 text-sm">
            <h3 className="font-serif text-lg">Result summary</h3>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Lagna</div>
              <div className="font-mono">{RASHIS[chart.ascendant.rashi]} {chart.ascendant.degreeInRashi.toFixed(2)}°</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Planets</div>
              <ul className="mt-1 space-y-0.5 font-mono text-xs">
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
            <div className="pt-2 text-[10px] text-muted-foreground">
              {chart.meta.engineVersion} · ayanamsa {chart.meta.ayanamsa} ({chart.meta.ayanamsaValue.toFixed(4)}°)
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
