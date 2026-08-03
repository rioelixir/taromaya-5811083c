import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProShell, ProCard, ProStat, NeedsProfile } from "@/components/astro-pro/pro-shell";
import { DataTable } from "@/components/data-table";
import { useProChart } from "@/lib/astro-pro/profiles";
import {
  computeVimshottari, computeAshtottari, computeYogini, fmtDate, type DashaTree,
} from "@/lib/vedic-extended";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/astro-pro/dashas")({
  head: () => ({
    meta: [
      { title: "Dasha Periods — Taromaya Astrology Pro" },
      {
        name: "description",
        content: "Vimshottari, Ashtottari and Yogini Dasha with Mahadasha, Antardasha and Pratyantardasha timing for the birth chart.",
      },
      { property: "og:title", content: "Dasha Periods — Taromaya Astrology Pro" },
      { property: "og:description", content: "Vimshottari, Ashtottari and Yogini timing down to Pratyantardasha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashas,
});

const SYSTEMS = [
  { key: "vimshottari", label: "Vimshottari" },
  { key: "ashtottari", label: "Ashtottari" },
  { key: "yogini", label: "Yogini" },
] as const;

type SystemKey = (typeof SYSTEMS)[number]["key"];

function Dashas() {
  const { active, chart } = useProChart();
  const [system, setSystem] = useState<SystemKey>("vimshottari");

  const tree: DashaTree | null = useMemo(() => {
    if (!chart || !active) return null;
    const [y, m, d] = active.birthDate.split("-").map(Number);
    const [hh, mm] = active.birthTime.split(":").map(Number);
    const birth = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1, hh ?? 12, mm ?? 0));
    const moon = chart.planets.find((p) => p.name === "Moon");
    const degInNak = moon ? moon.longitude % (360 / 27) : 0;
    const idx = chart.moonNakshatra.index;
    if (system === "ashtottari") return computeAshtottari(birth, idx, degInNak);
    if (system === "yogini") return computeYogini(birth, idx, degInNak);
    return computeVimshottari(birth, idx, degInNak);
  }, [chart, active, system]);

  if (!active || !chart || !tree) {
    return (
      <ProShell title="Dasha periods" subtitle="When the chart's promises come due.">
        <NeedsProfile />
      </ProShell>
    );
  }

  return (
    <ProShell
      title="Dasha periods"
      subtitle="A planet delivers its result when its period runs. Read the running Mahadasha first, then the Antardasha for the theme of the year."
      chartName={active.fullName}
    >
      <ProCard title="Dasha system">
        <div className="flex flex-wrap gap-2">
          {SYSTEMS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSystem(s.key)}
              className={cn(
                "min-h-9 rounded-full border px-4 text-xs font-medium",
                system === s.key
                  ? "border-vnavy bg-vnavy text-white"
                  : "border-vline bg-vsurface text-vnavy-soft",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </ProCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <ProStat
          label="Mahadasha"
          value={tree.currentMaha.lord}
          note={`${fmtDate(tree.currentMaha.start)} to ${fmtDate(tree.currentMaha.end)}`}
          accent
        />
        <ProStat
          label="Antardasha"
          value={tree.currentAntar.lord}
          note={`${fmtDate(tree.currentAntar.start)} to ${fmtDate(tree.currentAntar.end)}`}
        />
        <ProStat
          label="Pratyantardasha"
          value={tree.currentPratyantar.lord}
          note={`${fmtDate(tree.currentPratyantar.start)} to ${fmtDate(tree.currentPratyantar.end)}`}
        />
      </div>

      <ProCard title="Mahadasha timeline">
        <DataTable
          rows={tree.maha}
          rowKey={(r) => `${r.lord}-${r.start.toISOString()}`}
          rowClassName={(r) => (r.lord === tree.currentMaha.lord && r.start === tree.currentMaha.start ? "bg-vgold/10" : "")}
          columns={[
            { header: "Lord", cell: (r) => r.lord },
            { header: "From", cell: (r) => fmtDate(r.start) },
            { header: "To", cell: (r) => fmtDate(r.end) },
            { header: "Years", cell: (r) => r.years.toFixed(1), align: "right" },
          ]}
        />
      </ProCard>

      <ProCard title="Antardasha inside the running Mahadasha">
        <DataTable
          rows={tree.currentMaha.antar}
          rowKey={(r) => `${r.lord}-${r.start.toISOString()}`}
          rowClassName={(r) => (r.start === tree.currentAntar.start ? "bg-vgold/10" : "")}
          columns={[
            { header: "Lord", cell: (r) => r.lord },
            { header: "From", cell: (r) => fmtDate(r.start) },
            { header: "To", cell: (r) => fmtDate(r.end) },
          ]}
        />
      </ProCard>

      <ProCard title="Pratyantardasha inside the running Antardasha">
        <DataTable
          rows={tree.currentAntar.pratyantar}
          rowKey={(r) => `${r.lord}-${r.start.toISOString()}`}
          rowClassName={(r) => (r.start === tree.currentPratyantar.start ? "bg-vgold/10" : "")}
          columns={[
            { header: "Lord", cell: (r) => r.lord },
            { header: "From", cell: (r) => fmtDate(r.start) },
            { header: "To", cell: (r) => fmtDate(r.end) },
          ]}
        />
      </ProCard>
    </ProShell>
  );
}
