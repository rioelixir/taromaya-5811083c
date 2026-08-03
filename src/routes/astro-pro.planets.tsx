import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProShell, ProCard, NeedsProfile, StrengthBar } from "@/components/astro-pro/pro-shell";
import { DataTable } from "@/components/data-table";
import { useProChart } from "@/lib/astro-pro/profiles";
import {
  analysePlanets, KARAKATWA, PLANET_NATURE, type PlanetReport,
} from "@/lib/astro-pro/analysis";
import { computeShadbala } from "@/lib/vedic-deep";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/astro-pro/planets")({
  head: () => ({
    meta: [
      { title: "Planetary Analysis — Taromaya Astrology Pro" },
      {
        name: "description",
        content: "Dignity, mooltrikona, avastha, combustion, friendship, Shadbala and life-area effect for every planet in the birth chart.",
      },
      { property: "og:title", content: "Planetary Analysis — Taromaya Astrology Pro" },
      { property: "og:description", content: "Dignity, avastha, combustion, friendship, Shadbala and life-area effect for every planet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Planets,
});

function Planets() {
  const { active, chart } = useProChart();
  const reports = useMemo(() => (chart ? analysePlanets(chart) : []), [chart]);
  const shadbala = useMemo(() => (chart ? computeShadbala(chart) : []), [chart]);
  const [open, setOpen] = useState<string | null>(null);

  if (!active || !chart) {
    return (
      <ProShell title="Planets" subtitle="Condition, strength and effect of each graha.">
        <NeedsProfile />
      </ProShell>
    );
  }

  return (
    <ProShell
      title="Planetary analysis"
      subtitle="Each verdict below is derived from the computed chart: sign dignity, mooltrikona span, avastha, directional strength, combustion and functional nature by lagna."
      chartName={active.fullName}
    >
      <ProCard title="Positions and condition">
        <DataTable
          rows={reports}
          rowKey={(r) => r.planet}
          columns={[
            { header: "Planet", cell: (r) => r.planet },
            { header: "Sign", cell: (r) => `${r.rashi + 1} · ${r.rashiName}` },
            { header: "Degree", cell: (r) => r.degree, align: "right" },
            { header: "House", cell: (r) => r.house, align: "right" },
            { header: "Nakshatra", cell: (r) => `${r.nakshatra} ${r.pada}` },
            { header: "Motion", cell: (r) => r.motion },
            { header: "Condition", cell: (r) => r.dignity },
            { header: "Avastha", cell: (r) => r.avastha },
            { header: "Strength", cell: (r) => <StrengthBar value={r.strength} /> },
          ]}
        />
      </ProCard>

      <ProCard title="Shadbala" hint="Six-fold strength in virupas, the classical measure of a planet's capacity to deliver.">
        <DataTable
          rows={shadbala}
          rowKey={(r) => r.planet}
          columns={[
            { header: "Planet", cell: (r) => r.planet },
            { header: "Sthana", cell: (r) => Math.round(r.sthana), align: "right" },
            { header: "Dig", cell: (r) => Math.round(r.dig), align: "right" },
            { header: "Kala", cell: (r) => Math.round(r.kala), align: "right" },
            { header: "Chesta", cell: (r) => Math.round(r.chesta), align: "right" },
            { header: "Naisargika", cell: (r) => Math.round(r.naisargika), align: "right" },
            { header: "Drik", cell: (r) => Math.round(r.drig), align: "right" },
            { header: "Total", cell: (r) => Math.round(r.total), align: "right" },
          ]}
        />
      </ProCard>

      <div className="space-y-4">
        {reports.map((r) => (
          <PlanetPanel
            key={r.planet}
            report={r}
            open={open === r.planet}
            onToggle={() => setOpen(open === r.planet ? null : r.planet)}
          />
        ))}
      </div>
    </ProShell>
  );
}

function PlanetPanel({
  report: r,
  open,
  onToggle,
}: {
  report: PlanetReport;
  open: boolean;
  onToggle: () => void;
}) {
  const nature = PLANET_NATURE[r.planet];
  return (
    <ProCard>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
      >
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-vnavy">{r.planet}</h3>
          <p className="mt-0.5 text-sm text-vnavy-soft">
            House {r.house} · sign {r.rashi + 1} {r.rashiName} · {r.dignity}
            {r.retrograde ? " · retrograde" : ""}
            {r.combust ? " · combust" : ""}
          </p>
        </div>
        <div className="w-24 shrink-0 sm:w-36">
          <StrengthBar value={r.strength} />
        </div>
      </button>

      {open ? (
        <div className="mt-5 space-y-4 border-t border-vline pt-4">
          <DataTable
            rows={[
              { k: "Karakatwa", v: KARAKATWA[r.planet] },
              { k: "Element and gender", v: `${nature.element}, ${nature.gender}, direction ${nature.direction}` },
              { k: "Houses owned", v: r.ownsHouses.length ? r.ownsHouses.join(", ") : "None (shadowy planet)" },
              { k: "Natural nature", v: r.naturalBenefic ? "Natural benefic" : "Natural malefic" },
              { k: "Functional nature", v: `${r.functional} for this ascendant` },
              { k: "Permanent friendship", v: r.permanentRelation },
              { k: "Temporary friendship", v: r.temporaryRelation },
              { k: "Directional strength", v: `${r.digBala} of 60 virupas` },
              { k: "Nakshatra and pada", v: `${r.nakshatra}, pada ${r.pada}` },
              { k: "Avastha", v: r.avastha },
            ]}
            rowKey={(x) => x.k}
            columns={[
              { header: "Factor", cell: (x) => x.k },
              { header: "Reading", cell: (x) => x.v },
            ]}
          />

          <DataTable
            caption="Life areas governed"
            rows={r.lifeAreas}
            rowKey={(x) => x.area}
            columns={[
              { header: "Area", cell: (x) => x.area },
              { header: "What this planet decides", cell: (x) => x.note },
            ]}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Note title="How it supports" body={r.positive} tone="good" />
            <Note title="Where it strains" body={r.negative} tone="warn" />
          </div>
          <Note title="Suggested remedy" body={r.remedy} />
        </div>
      ) : null}
    </ProCard>
  );
}

function Note({ title, body, tone }: { title: string; body: string; tone?: "good" | "warn" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "good"
          ? "border-vgold/50 bg-vgold/10"
          : tone === "warn"
            ? "border-vline bg-vmist"
            : "border-vline bg-vsurface",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-vnavy-soft">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-vnavy">{body}</p>
    </div>
  );
}
