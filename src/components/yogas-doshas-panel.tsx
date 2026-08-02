// Yogas & Doshas scanner with live Sade Sati window projection.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";

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
          <DataTable
            columns={[
              { header: "Yoga", cell: (y: Yoga) => <span className="font-medium text-pearl">{y.name}</span> },
              { header: "Category", cell: (y: Yoga) => <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${CAT_TONE[y.category]}`}>{y.category}</span> },
              { header: "What it means", className: "text-muted-foreground", cell: (y: Yoga) => y.detail },
            ]}
            rows={presentYogas}
            rowKey={(y) => y.name}
            empty="No classical yogas triggered."
          />
          {absentYogas.length > 0 && (
            <details className="text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none py-1">Show inactive ({absentYogas.length})</summary>
              <div className="mt-2">
                <DataTable
                  columns={[{ header: "Inactive yoga", cell: (y: Yoga) => y.name }]}
                  rows={absentYogas}
                  rowKey={(y) => y.name}
                />
              </div>
            </details>
          )}
        </div>
      )}

      {tab === "doshas" && (
        <DataTable
          columns={[
            { header: "Dosha", cell: (d: Dosha) => <span className="font-medium text-pearl">{d.name}</span> },
            {
              header: "Status",
              cell: (d: Dosha) => (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${d.present && d.severity ? SEV_TONE[d.severity] : "border-border/30 text-muted-foreground"}`}>
                  {d.present ? (d.severity ?? "present") : "clear"}
                </span>
              ),
            },
            { header: "What it means", className: "text-muted-foreground", cell: (d: Dosha) => d.detail },
            { header: "Remedy", className: "text-primary/80", cell: (d: Dosha) => d.remedy ?? "—" },
          ]}
          rows={doshas}
          rowKey={(d) => d.name}
        />
      )}

      {tab === "sade" && sade && (
        <div className="space-y-3">
          <DataTable
            columns={[
              { header: "Factor", cell: (r: { label: string; value: string; tone?: string }) => r.label },
              { header: "Value", align: "right", className: "font-mono", cell: (r: { label: string; value: string; tone?: string }) => <span className={r.tone ?? ""}>{r.value}</span> },
            ]}
            rows={[
              { label: "Natal Moon", value: RASHIS[sade.natalMoonSign] },
              { label: "Saturn now", value: RASHIS[sade.currentSaturnSign] },
              {
                label: "Status",
                value: sade.active ? `Active · ${sade.currentPhase}` : "Not currently in Sade Sati",
                tone: sade.active ? "text-rose-300" : "text-emerald-300",
              },
            ]}
            rowKey={(r) => r.label}
          />

          <DataTable
            columns={[
              { header: "Phase", cell: (w: (typeof sade.windows)[number]) => <span className="font-medium">{w.phase}</span> },
              { header: "Saturn in", className: "font-mono", cell: (w: (typeof sade.windows)[number]) => RASHIS[w.sign] },
              { header: "From", className: "font-mono", cell: (w: (typeof sade.windows)[number]) => fmtDate(w.start) },
              { header: "To", className: "font-mono", cell: (w: (typeof sade.windows)[number]) => fmtDate(w.end) },
              { header: "Running", cell: (w: (typeof sade.windows)[number]) => (w.active ? <span className="text-rose-300">Now</span> : <span className="text-muted-foreground">—</span>) },
            ]}
            rows={sade.windows}
            rowClassName={(w) => (w.active ? "bg-rose-500/10" : "")}
            caption="7½-year window"
          />


          <div className="text-[10px] leading-relaxed text-muted-foreground">
            Sade Sati spans Saturn's transit through the 12th, natal, and 2nd signs from the Moon —
            classically ≈ 7 years 6 months. Dates computed live from Saturn's sidereal ingresses (Lahiri).
          </div>
        </div>
      )}
    </Card>
  );
}
