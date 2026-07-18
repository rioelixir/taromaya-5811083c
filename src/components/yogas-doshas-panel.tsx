// Yogas & Doshas scanner with live Sade Sati window projection.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { detectYogas, detectDoshas, type Yoga, type Dosha } from "@/lib/vedic-extended";
import { analyseSadeSati } from "@/lib/dosha-windows";
import type { KundliChart } from "@/lib/vedic";

const RASHIS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

const CAT_TONE: Record<Yoga["category"], string> = {
  auspicious: "border-emerald-400/40 bg-emerald-500/5 text-emerald-200",
  wealth: "border-amber-400/40 bg-amber-500/5 text-amber-200",
  royal: "border-primary/50 bg-primary/10 text-primary",
  spiritual: "border-violet-400/40 bg-violet-500/5 text-violet-200",
  challenging: "border-rose-400/40 bg-rose-500/5 text-rose-200",
};

const SEV_TONE: Record<NonNullable<Dosha["severity"]>, string> = {
  mild: "border-amber-400/40 bg-amber-500/5 text-amber-200",
  moderate: "border-orange-400/40 bg-orange-500/5 text-orange-200",
  strong: "border-rose-400/50 bg-rose-500/10 text-rose-200",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function YogasDoshasPanel({ chart }: { chart: unknown }) {
  const c = chart as KundliChart;
  const [tab, setTab] = useState<"yogas" | "doshas" | "sade">("yogas");
  const yogas = useMemo(() => detectYogas(c), [c]);
  const doshas = useMemo(() => detectDoshas(c), [c]);
  const moon = c.planets.find((p) => p.name === "Moon");
  const sade = useMemo(() => (moon ? analyseSadeSati(moon.rashi) : null), [moon]);

  const presentYogas = yogas.filter((y) => y.present);
  const absentYogas = yogas.filter((y) => !y.present);
  const presentDoshas = doshas.filter((d) => d.present);

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg tracking-wide">Yogas &amp; Doshas</h3>
        <div className="inline-flex overflow-hidden rounded-full border border-border/50 bg-background/40 text-[11px]">
          {(["yogas", "doshas", "sade"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 transition ${tab === k ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {k === "yogas" ? `Yogas · ${presentYogas.length}` : k === "doshas" ? `Doshas · ${presentDoshas.length}` : "Sade Sati"}
            </button>
          ))}
        </div>
      </div>

      {tab === "yogas" && (
        <div className="space-y-3">
          {presentYogas.length === 0 && <div className="text-sm text-muted-foreground">No classical yogas triggered.</div>}
          <div className="grid gap-2 sm:grid-cols-2">
            {presentYogas.map((y) => (
              <div key={y.name} className={`rounded-lg border px-3 py-2 text-xs ${CAT_TONE[y.category]}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{y.name}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70">{y.category}</span>
                </div>
                <p className="mt-1 leading-relaxed opacity-90">{y.detail}</p>
              </div>
            ))}
          </div>
          {absentYogas.length > 0 && (
            <details className="text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none py-1">Show inactive ({absentYogas.length})</summary>
              <ul className="mt-1 space-y-0.5 pl-2 font-mono">
                {absentYogas.map((y) => <li key={y.name}>· {y.name}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {tab === "doshas" && (
        <div className="space-y-2">
          {doshas.map((d) => (
            <div
              key={d.name}
              className={`rounded-lg border px-3 py-2 text-xs ${d.present && d.severity ? SEV_TONE[d.severity] : "border-border/30 bg-background/20 text-muted-foreground"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{d.name}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {d.present ? (d.severity ?? "present") : "clear"}
                </span>
              </div>
              <p className="mt-1 leading-relaxed opacity-90">{d.detail}</p>
              {d.remedy && <p className="mt-1 text-[11px] italic opacity-80">Remedy — {d.remedy}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "sade" && sade && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Natal Moon</div>
                <div className="font-mono">{RASHIS[sade.natalMoonSign]}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Saturn now</div>
                <div className="font-mono">{RASHIS[sade.currentSaturnSign]}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                <div className={`font-mono ${sade.active ? "text-rose-300" : "text-emerald-300"}`}>
                  {sade.active ? `Active · ${sade.currentPhase}` : "Not currently in Sade Sati"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">7½-Year Window</div>
            {sade.windows.map((w, i) => (
              <div
                key={i}
                className={`grid grid-cols-[80px_1fr_auto] items-center gap-x-3 rounded-lg border px-3 py-2 text-xs ${
                  w.active
                    ? "border-rose-400/50 bg-rose-500/10 text-rose-100"
                    : "border-border/30 bg-background/20"
                }`}
              >
                <span className="font-medium">{w.phase}</span>
                <span className="font-mono text-[11px]">Saturn in {RASHIS[w.sign]}</span>
                <span className="text-right font-mono text-[10px] opacity-90">
                  {fmtDate(w.start)} → {fmtDate(w.end)}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] leading-relaxed text-muted-foreground">
            Sade Sati spans Saturn's transit through the 12th, natal, and 2nd signs from the Moon —
            classically ≈ 7 years 6 months. Dates computed live from Saturn's sidereal ingresses (Lahiri).
          </div>
        </div>
      )}
    </Card>
  );
}
