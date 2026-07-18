// Strengths dashboard — Shadbala, Bhava Bala, Ashtakavarga (Bhinna + Sarva heat-map).
// Consumes any ChartLite-shaped object; internally casts to KundliChart.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
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
        <div className="space-y-2">
          <div className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Planet</span><span>Total</span><span className="text-right">Rupas</span><span className="text-right">Req · Ratio</span>
          </div>
          {shad.map((r) => {
            const pass = r.ratio >= 1;
            return (
              <div key={r.planet} className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-x-3 font-mono text-xs">
                <span className="text-foreground/90">{r.planet}</span>
                {bar(r.total, shadMax, pass ? "emerald" : "rose")}
                <span className="text-right tabular-nums">{r.total.toFixed(2)}</span>
                <span className={`text-right tabular-nums ${pass ? "text-emerald-300" : "text-rose-300"}`}>{r.required.toFixed(1)} · {r.ratio.toFixed(2)}×</span>
              </div>
            );
          })}
          <div className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
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
        <div className="space-y-2">
          <div className="grid grid-cols-[36px_56px_64px_1fr_auto] items-center gap-x-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Bh</span><span>Sign</span><span>Lord</span><span>Total</span><span className="text-right">Rupas</span>
          </div>
          {bhava.map((r) => (
            <div key={r.house} className="grid grid-cols-[36px_56px_64px_1fr_auto] items-center gap-x-3 font-mono text-xs">
              <span className="text-primary/90">H{r.house}</span>
              <span>{RASHIS[r.sign]}</span>
              <span className="text-muted-foreground">{r.lord}</span>
              {bar(r.total, bhavaMax, "amber")}
              <span className="text-right tabular-nums">{r.total.toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
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

          {/* Bhinna table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[11px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/40">
                  <th className="py-1 text-left font-normal">Planet</th>
                  {RASHIS.map((r) => <th key={r} className="text-center font-normal">{r}</th>)}
                  <th className="text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {av.bhinna.map((row) => (
                  <tr key={row.planet} className="border-b border-border/20">
                    <td className="py-1">{row.planet}</td>
                    {row.bindus.map((b, i) => (
                      <td key={i} className="text-center tabular-nums" style={{ background: heatCell(b, 8) }}>{b}</td>
                    ))}
                    <td className="text-right tabular-nums">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] leading-relaxed text-muted-foreground">
            Bhinnashtakavarga per planet ({PLANETS7.join(" · ")}) plus Lagna contributor; Sarva is the sum across all seven.
          </div>
        </div>
      )}
    </Card>
  );
}
