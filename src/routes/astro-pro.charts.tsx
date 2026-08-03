import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProShell, ProCard, NeedsProfile, StrengthBar } from "@/components/astro-pro/pro-shell";
import { DataTable } from "@/components/data-table";
import { NorthIndianChart, SouthIndianChart } from "@/components/rashi-chart";
import { useProChart } from "@/lib/astro-pro/profiles";
import { analysePlanets } from "@/lib/astro-pro/analysis";
import { RASHIS, RASHI_LORDS, formatDegree, type PlanetName } from "@/lib/vedic";
import {
  computeVarga, VARGA_LABELS, VARGA_ORDER, type VargaCode,
} from "@/lib/vedic-extended";
import { CHART_VARIANTS, toVariant, type ChartVariant, type VariantChart } from "@/lib/chart-variants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/astro-pro/charts")({
  head: () => ({
    meta: [
      { title: "Birth and Divisional Charts — Taromaya Astrology Pro" },
      {
        name: "description",
        content: "Lagna, Moon, Sun and Bhava Chalit charts plus every divisional chart from D1 to D60, each with placements, lords and strength.",
      },
      { property: "og:title", content: "Birth and Divisional Charts — Taromaya Astrology Pro" },
      { property: "og:description", content: "Lagna, Moon, Sun, Bhava Chalit and D1 to D60 divisional charts with full placement tables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Charts,
});

const STYLES = [
  { key: "north", label: "North Indian" },
  { key: "south", label: "South Indian" },
] as const;

function Charts() {
  const { active, chart } = useProChart();
  const [variant, setVariant] = useState<ChartVariant>("lagna");
  const [style, setStyle] = useState<"north" | "south">("north");
  const [varga, setVarga] = useState<VargaCode>("D1");

  const reports = useMemo(() => (chart ? analysePlanets(chart) : []), [chart]);

  const base: VariantChart | null = useMemo(() => {
    if (!chart) return null;
    return {
      ascendant: { rashi: chart.ascendant.rashi, degreeInRashi: chart.ascendant.degreeInRashi },
      planets: reports.map((r) => ({
        name: r.planet,
        longitude: chart.planets.find((p) => p.name === r.planet)?.longitude ?? 0,
        rashi: r.rashi,
        house: r.house,
        retrograde: r.retrograde,
        combust: r.combust,
        exalted: r.dignity === "Exalted",
        debilitated: r.dignity === "Debilitated",
      })),
    };
  }, [chart, reports]);

  const shown = useMemo(() => {
    if (!chart || !base) return null;
    if (varga === "D1") return toVariant(base, variant);
    const v = computeVarga(chart, varga);
    const ascSign = v.ascendantSign;
    return {
      ascendant: { rashi: ascSign, degreeInRashi: 0 },
      planets: v.planetSigns.map((p) => ({
        name: p.name,
        longitude: p.sign * 30,
        rashi: p.sign,
        house: ((p.sign - ascSign + 12) % 12) + 1,
      })),
    } satisfies VariantChart;
  }, [chart, base, varga, variant]);

  if (!active || !chart || !shown) {
    return (
      <ProShell title="Charts" subtitle="Birth chart, reference variants and every divisional chart.">
        <NeedsProfile />
      </ProShell>
    );
  }

  const meta = varga === "D1" ? null : VARGA_LABELS[varga];
  const vargaStrength = Math.round(
    reports.reduce((s, r) => s + r.strength, 0) / Math.max(1, reports.length),
  );

  return (
    <ProShell
      title="Charts"
      subtitle={`${active.fullName} · ${varga === "D1" ? "Rashi (D1)" : `${varga} ${meta?.name ?? ""}`}`}
      chartName={active.fullName}
    >
      <ProCard title="Chart view" hint="Choose the divisional chart, the reference point and the drawing style.">
        <div className="space-y-3">
          <Row label="Division">
            <div className="flex flex-wrap gap-2">
              {VARGA_ORDER.map((code) => (
                <Chip key={code} active={varga === code} onClick={() => setVarga(code)}>
                  {code}
                </Chip>
              ))}
            </div>
          </Row>
          {varga === "D1" ? (
            <Row label="Reference">
              <div className="flex flex-wrap gap-2">
                {CHART_VARIANTS.map((v) => (
                  <Chip key={v.key} active={variant === v.key} onClick={() => setVariant(v.key)}>
                    {v.label}
                  </Chip>
                ))}
              </div>
            </Row>
          ) : null}
          <Row label="Style">
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip key={s.key} active={style === s.key} onClick={() => setStyle(s.key)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Row>
        </div>

        <div className="mt-5">
          {style === "north" ? <NorthIndianChart chart={shown} /> : <SouthIndianChart chart={shown} />}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-vnavy-soft">
          {varga === "D1"
            ? CHART_VARIANTS.find((v) => v.key === variant)?.note
            : `${meta?.name}: ${meta?.theme}. Read this chart for that life area only — the D1 chart still decides whether the promise exists at all.`}
        </p>
      </ProCard>

      <ProCard
        title="Placements"
        hint="Sign, house and the lord who carries the result in this division."
      >
        <DataTable<(typeof shown)["planets"][number]>
          rows={shown.planets}
          rowKey={(r) => r.name}
          columns={[
            { header: "Planet", cell: (r) => r.name },
            { header: "Sign", cell: (r) => `${r.rashi + 1} · ${RASHIS[r.rashi]}` },
            { header: "House", cell: (r) => r.house, align: "right" },
            { header: "Sign lord", cell: (r) => RASHI_LORDS[r.rashi] },
            {
              header: "Degree",
              align: "right",
              cell: (r) =>
                varga === "D1"
                  ? formatDegree(
                      reports.find((x) => x.planet === (r.name as PlanetName))
                        ? chart.planets.find((p) => p.name === r.name)?.degreeInRashi ?? 0
                        : 0,
                    )
                  : "—",
            },
          ]}
        />
      </ProCard>

      <ProCard title="Division strength" hint="Average planetary strength carried into this chart.">
        <StrengthBar value={vargaStrength} />
        <p className="mt-3 text-sm leading-relaxed text-vnavy-soft">
          {vargaStrength >= 70
            ? "The planets carry good condition into this division, so its life area can be built on directly."
            : vargaStrength >= 50
              ? "Workable condition: results in this area follow steady method rather than a single push."
              : "The planets are under pressure here, so this life area needs support, correct timing and patience."}
        </p>
      </ProCard>
    </ProShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-center">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-vnavy-soft">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3 text-xs font-medium transition-colors",
        active ? "border-vnavy bg-vnavy text-white" : "border-vline bg-vsurface text-vnavy-soft hover:text-vnavy",
      )}
    >
      {children}
    </button>
  );
}
