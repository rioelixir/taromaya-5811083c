// Strengths dashboard — Shadbala, Bhava Bala, Ashtakavarga (Bhinna + Sarva heat-map).
// Consumes any ChartLite-shaped object; internally casts to KundliChart.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import {
  computeShadbala,
  computeAshtakavarga,
  type ShadbalaRow,
  type Ashtakavarga,
} from "@/lib/vedic-deep";
import type { KundliChart, PlanetName } from "@/lib/vedic";

const RASHIS = ["Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"];
const PLANETS7: PlanetName[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
const RASHI_LORDS: PlanetName[] = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];

const norm12 = (n: number) => ((n % 12) + 12) % 12;

type BhavaBalaRow = { house: number; sign: number; lord: PlanetName; lordStrength: number; occupantStrength: number; aspectStrength: number; total: number };

function computeBhavaBala(chart: KundliChart, shad: ShadbalaRow[]): BhavaBalaRow[] {
  const asc = chart.ascendant.rashi;
  const shadMap = new Map(shad.map((r) => [r.planet, r.total]));
  return Array.from({ length: 12 }, (_, i) => {
    const houseNo = i + 1;
    const sign = norm12(asc + i);
    const lord = RASHI_LORDS[sign];
    const lordStrength = shadMap.get(lord) ?? 0;
    // Occupants
    let occupantStrength = 0;
    chart.planets.forEach((p) => {
      const h = norm12(p.rashi - asc) + 1;
      if (h === houseNo) occupantStrength += shadMap.get(p.name as PlanetName) ?? 0;
    });
    // Simple aspectual: 7th aspect from every planet
    let aspectStrength = 0;
    chart.planets.forEach((p) => {
      const h = norm12(p.rashi - asc) + 1;
      if (norm12(houseNo - h) + 1 === 7) aspectStrength += (shadMap.get(p.name as PlanetName) ?? 0) * 0.25;
    });
    return { house: houseNo, sign, lord, lordStrength, occupantStrength, aspectStrength, total: lordStrength + occupantStrength + aspectStrength };
  });
}

function bar(value: number, max: number, tone: "amber" | "emerald" | "rose" = "amber") {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const grad =
    tone === "emerald" ? "from-emerald-400/70 to-emerald-500/40"
    : tone === "rose" ? "from-rose-400/70 to-rose-500/40"
    : "from-amber-300/80 to-amber-500/40";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className={`h-full rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function heatCell(v: number, max: number) {
  const t = Math.max(0, Math.min(1, v / max));
  // Amber → gold gradient
  const alpha = 0.08 + t * 0.55;
  return `rgba(212, 175, 55, ${alpha.toFixed(3)})`;
}

export function StrengthsPanel({ chart }: { chart: unknown }) {
  const c = chart as KundliChart;
  const shad = useMemo(() => computeShadbala(c), [c]);
  const av = useMemo<Ashtakavarga>(() => computeAshtakavarga(c), [c]);
  const bhava = useMemo(() => computeBhavaBala(c, shad), [c, shad]);
  const [tab, setTab] = useState<"shad" | "bhava" | "av">("shad");

  const shadMax = Math.max(...shad.map((r) => r.total), 1);
  const bhavaMax = Math.max(...bhava.map((r) => r.total), 1);
  const bindusMax = Math.max(...av.sarva, 1);

  const shadColumns: Column<ShadbalaRow>[] = [
    { header: "Planet", cell: (r: ShadbalaRow) => <span className="text-foreground/90">{r.planet}</span> },
    { header: "Total", cell: (r: ShadbalaRow) => bar(r.total, shadMax, r.ratio >= 1 ? "emerald" : "rose") },
    { header: "Rupas", align: "right", cell: (r: ShadbalaRow) => <span className="tabular-nums">{r.total.toFixed(2)}</span> },
    {
      header: "Req · Ratio",
      align: "right",
      cell: (r: ShadbalaRow) => (
        <span className={`tabular-nums ${r.ratio >= 1 ? "text-emerald-300" : "text-rose-300"}`}>
          {r.required.toFixed(1)} · {r.ratio.toFixed(2)}×
        </span>
      ),
    },
  ];

  const bhavaColumns: Column<BhavaBalaRow>[] = [
    { header: "Bh", cell: (r: BhavaBalaRow) => <span className="text-primary/90">H{r.house}</span> },
    { header: "Sign", cell: (r: BhavaBalaRow) => RASHIS[r.sign] },
    { header: "Lord", cell: (r: BhavaBalaRow) => <span className="text-muted-foreground">{r.lord}</span> },
    { header: "Total", cell: (r: BhavaBalaRow) => bar(r.total, bhavaMax, "amber") },
    { header: "Rupas", align: "right", cell: (r: BhavaBalaRow) => <span className="tabular-nums">{r.total.toFixed(2)}</span> },
  ];

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg tracking-wide">Strengths</h3>
        <div className="inline-flex overflow-hidden rounded-full border border-border/50 bg-background/40 text-[11px]">
          {(["shad", "bhava", "av"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 transition ${tab === k ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {k === "shad" ? "Shadbala" : k === "bhava" ? "Bhava Bala" : "Ashtakavarga"}
            </button>
          ))}
        </div>
      </div>

      {tab === "shad" && (
        <div className="space-y-3 font-mono text-xs">
          <DataTable columns={shadColumns} rows={shad} rowKey={(r: ShadbalaRow) => r.planet} />
          <div className="pt-1 text-[10px] font-sans leading-relaxed text-muted-foreground">
            Six-fold strength in Rupas: Sthana · Dig · Kala · Chesta · Naisargika · Drig. Ratio ≥ 1× meets Parashari minimum.
          </div>
          {/* Component breakdown — six mini bar charts per planet */}
          <div className="mt-4 space-y-2">
            {shad.map((r) => {
              const parts: Array<[string, number]> = [
                ["Sthana", r.sthana], ["Dig", r.dig], ["Kala", r.kala],
                ["Chesta", r.chesta], ["Naisar.", r.naisargika], ["Drig", r.drig],
              ];
              const maxPart = Math.max(...parts.map((p) => p[1]), 1);
              return (
                <div key={r.planet} className="rounded-lg border border-border/40 bg-background/30 p-2">
                  <div className="mb-1 flex items-baseline justify-between text-[11px]">
                    <span className="font-medium">{r.planet}</span>
                    <span className="font-mono text-muted-foreground">Σ {r.total.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1 items-end h-12">
                    {parts.map(([label, val]) => {
                      const h = (val / maxPart) * 100;
                      return (
                        <div key={label} className="flex flex-col items-center justify-end h-full" title={`${label}: ${val.toFixed(2)}`}>
                          <div className="w-full rounded-t bg-gradient-to-t from-amber-300/80 to-amber-500/30" style={{ height: `${Math.max(6, h)}%` }} />
                          <div className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground">{label}</div>
                          <div className="text-[9px] font-mono tabular-nums">{val.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {tab === "bhava" && (
        <div className="space-y-3 font-mono text-xs">
          <DataTable columns={bhavaColumns} rows={bhava} rowKey={(r: BhavaBalaRow) => r.house} />
          <div className="pt-1 text-[10px] font-sans leading-relaxed text-muted-foreground">
            Bhava Bala ≈ lord's Shadbala + occupants' Shadbala + 25% of 7th-aspect strength.
          </div>
        </div>
      )}

      {tab === "av" && (
        <div className="space-y-4">
          {/* Sarvashtakavarga heat map */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Sarvashtakavarga</div>
              <div className="font-mono text-[11px] text-muted-foreground">total {av.sarvaTotal}</div>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {av.sarva.map((v, i) => (
                <div
                  key={i}
                  className="flex aspect-square flex-col items-center justify-center rounded-md border border-border/40 text-[10px]"
                  style={{ background: heatCell(v, bindusMax) }}
                  title={`${RASHIS[i]}: ${v} bindus`}
                >
                  <span className="opacity-70">{RASHIS[i]}</span>
                  <span className="font-mono text-[13px] tabular-nums text-foreground">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              ≥ 30 bindus favours the sign · classical benchmark ≈ 28 (avg).
            </div>
          </div>

          {/* Bhinna bar chart per planet */}
          <div className="space-y-2">
            {av.bhinna.map((row) => (
              <div key={row.planet} className="rounded-lg border border-border/40 bg-background/30 p-2">
                <div className="mb-1 flex items-baseline justify-between text-[11px]">
                  <span className="font-medium">{row.planet}</span>
                  <span className="font-mono text-muted-foreground">Σ {row.total}</span>
                </div>
                <div className="grid grid-cols-12 gap-0.5 items-end h-10">
                  {row.bindus.map((b, i) => (
                    <div key={i} className="flex flex-col items-center justify-end h-full" title={`${RASHIS[i]}: ${b}`}>
                      <div className="w-full rounded-t" style={{ height: `${Math.max(8, (b / 8) * 100)}%`, background: heatCell(b, 8) }} />
                      <div className="mt-0.5 text-[7px] uppercase text-muted-foreground">{RASHIS[i].slice(0,2)}</div>
                      <div className="text-[8px] font-mono">{b}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] leading-relaxed text-muted-foreground">
            Bhinnashtakavarga per planet ({PLANETS7.join(" · ")}) plus Lagna contributor; Sarva is the sum across all seven.
          </div>
        </div>
      )}
    </Card>
  );
}
