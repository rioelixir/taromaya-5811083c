import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProShell, ProCard, NeedsProfile, StrengthBar } from "@/components/astro-pro/pro-shell";
import { DataTable } from "@/components/data-table";
import { useProChart } from "@/lib/astro-pro/profiles";
import { analysePlanets, analyseHouses } from "@/lib/astro-pro/analysis";

export const Route = createFileRoute("/astro-pro/houses")({
  head: () => ({
    meta: [
      { title: "House Analysis — Taromaya Astrology Pro" },
      {
        name: "description",
        content: "All twelve bhavas with sign, lord, occupants, strength score, life events, timing and practical advice.",
      },
      { property: "og:title", content: "House Analysis — Taromaya Astrology Pro" },
      { property: "og:description", content: "All twelve bhavas with lord, occupants, strength, timing and advice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Houses,
});

function Houses() {
  const { active, chart } = useProChart();
  const houses = useMemo(() => {
    if (!chart) return [];
    return analyseHouses(chart, analysePlanets(chart));
  }, [chart]);
  const [open, setOpen] = useState<number | null>(1);

  if (!active || !chart) {
    return (
      <ProShell title="Houses" subtitle="The twelve bhavas and what each one promises.">
        <NeedsProfile />
      </ProShell>
    );
  }

  return (
    <ProShell
      title="House analysis"
      subtitle="Each house is scored from the condition of its lord, the planets sitting in it and the benefic or malefic weight it carries."
      chartName={active.fullName}
    >
      <ProCard title="House strength at a glance">
        <DataTable
          rows={houses}
          rowKey={(r) => r.house}
          columns={[
            { header: "House", cell: (r) => r.house, align: "right" },
            { header: "Sign", cell: (r) => `${r.sign + 1} · ${r.signName}` },
            { header: "Lord", cell: (r) => `${r.lord} (house ${r.lordHouse})` },
            { header: "Occupants", cell: (r) => (r.occupants.length ? r.occupants.map((o) => o.name).join(", ") : "—") },
            { header: "Verdict", cell: (r) => r.verdict },
            { header: "Score", cell: (r) => <StrengthBar value={r.strength} /> },
          ]}
        />
      </ProCard>

      {houses.map((h) => (
        <ProCard key={h.house}>
          <button
            type="button"
            aria-expanded={open === h.house}
            onClick={() => setOpen(open === h.house ? null : h.house)}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
          >
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-vnavy">House {h.house}</h3>
              <p className="mt-0.5 text-sm text-vnavy-soft">{h.meaning}</p>
            </div>
            <div className="w-24 shrink-0 sm:w-36">
              <StrengthBar value={h.strength} />
            </div>
          </button>

          {open === h.house ? (
            <div className="mt-5 border-t border-vline pt-4">
              <DataTable
                rows={[
                  { k: "Sign on the house", v: `${h.sign + 1} · ${h.signName}` },
                  { k: "House lord", v: `${h.lord}, placed in house ${h.lordHouse} with strength ${h.lordStrength}` },
                  {
                    k: "Planets present",
                    v: h.occupants.length
                      ? h.occupants.map((o) => `${o.name} (${o.dignity}, ${o.strength})`).join("; ")
                      : "None — results follow the lord and the aspects it receives",
                  },
                  { k: "Verdict", v: `${h.verdict} (${h.strength} of 100)` },
                  { k: "What works", v: h.positives },
                  { k: "What strains", v: h.challenges },
                  { k: "When it activates", v: h.timing },
                  { k: "Professional advice", v: h.advice },
                  { k: "Supporting remedy", v: h.remedy },
                ]}
                rowKey={(x) => x.k}
                columns={[
                  { header: "Factor", cell: (x) => x.k },
                  { header: "Reading", cell: (x) => x.v },
                ]}
              />
            </div>
          ) : null}
        </ProCard>
      ))}
    </ProShell>
  );
}
