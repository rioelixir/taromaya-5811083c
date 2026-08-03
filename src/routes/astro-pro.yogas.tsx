import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProShell, ProCard, NeedsProfile } from "@/components/astro-pro/pro-shell";
import { DataTable } from "@/components/data-table";
import { useProChart } from "@/lib/astro-pro/profiles";
import { detectYogas, detectDoshas } from "@/lib/vedic-extended";

export const Route = createFileRoute("/astro-pro/yogas")({
  head: () => ({
    meta: [
      { title: "Yogas and Doshas — Taromaya Astrology Pro" },
      {
        name: "description",
        content: "Classical yogas and doshas detected from the birth chart, each with formation, strength, real effect and authentic remedy.",
      },
      { property: "og:title", content: "Yogas and Doshas — Taromaya Astrology Pro" },
      { property: "og:description", content: "Detected yogas and doshas with formation, effect and classical remedies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Yogas,
});

function Yogas() {
  const { active, chart } = useProChart();
  const yogas = useMemo(() => (chart ? detectYogas(chart).filter((y) => y.present) : []), [chart]);
  const doshas = useMemo(() => (chart ? detectDoshas(chart).filter((d) => d.present) : []), [chart]);

  if (!active || !chart) {
    return (
      <ProShell title="Yogas and doshas" subtitle="Combinations found in this chart and what they actually do.">
        <NeedsProfile />
      </ProShell>
    );
  }

  return (
    <ProShell
      title="Yogas and doshas"
      subtitle="Only combinations actually formed in this chart are listed. Each entry names the planets and houses that create it."
      chartName={active.fullName}
    >
      <ProCard title="Supportive combinations" hint={`${yogas.length} yogas formed.`}>
        <DataTable
          rows={yogas}
          rowKey={(r) => r.name}
          empty="No major yoga is formed in this chart."
          columns={[
            { header: "Yoga", cell: (r) => r.name },
            { header: "Type", cell: (r) => r.category },
            { header: "Formation and effect", cell: (r) => r.detail },
          ]}
        />
      </ProCard>

      <ProCard title="Areas needing care" hint={`${doshas.length} doshas found.`}>
        <DataTable
          rows={doshas}
          rowKey={(r) => r.name}
          empty="No classical dosha is active in this chart."
          columns={[
            { header: "Dosha", cell: (r) => r.name },
            { header: "Severity", cell: (r) => r.severity },
            { header: "Formation", cell: (r) => r.detail },
            { header: "Remedy", cell: (r) => r.remedy },
          ]}
        />
        <p className="mt-3 text-sm leading-relaxed text-vnavy-soft">
          A dosha describes pressure in one area of life, not a verdict on the whole chart. Cancellation
          factors, the strength of the house lord and the running Dasha all decide how much of it is felt.
        </p>
      </ProCard>
    </ProShell>
  );
}
