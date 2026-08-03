import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProShell, ProCard, ProStat, StrengthBar, NeedsProfile } from "@/components/astro-pro/pro-shell";
import { useProChart } from "@/lib/astro-pro/profiles";
import { analysePlanets, analyseHouses, chartScore } from "@/lib/astro-pro/analysis";
import { computeVimshottari, detectYogas, detectDoshas, fmtDate } from "@/lib/vedic-extended";
import { NAKSHATRAS, RASHIS, formatDegree } from "@/lib/vedic";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/astro-pro/")({
  head: () => ({
    meta: [
      { title: "Taromaya Astrology Pro — Professional Jyotish Dashboard" },
      {
        name: "description",
        content:
          "A professional Vedic astrology workspace: birth charts, divisional charts, planetary strength, yogas, doshas and Dasha timing with reasoned interpretation.",
      },
      { property: "og:title", content: "Taromaya Astrology Pro — Professional Jyotish Dashboard" },
      {
        property: "og:description",
        content: "Birth charts, divisional charts, planetary strength, yogas, doshas and Dasha timing in one professional workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { active, chart } = useProChart();

  const data = useMemo(() => {
    if (!chart || !active) return null;
    const planets = analysePlanets(chart);
    const houses = analyseHouses(chart, planets);
    const [y, m, d] = active.birthDate.split("-").map(Number);
    const [hh, mm] = active.birthTime.split(":").map(Number);
    const birth = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1, hh ?? 12, mm ?? 0));
    const dasha = computeVimshottari(chart, birth);
    const yogas = detectYogas(chart);
    const doshas = detectDoshas(chart);
    const now = Date.now();
    const maha = dasha.periods.find((p) => p.start.getTime() <= now && p.end.getTime() > now);
    const antar = maha?.antar.find((p) => p.start.getTime() <= now && p.end.getTime() > now);
    const pratyantar = antar?.pratyantar.find((p) => p.start.getTime() <= now && p.end.getTime() > now);
    return { planets, houses, yogas, doshas, maha, antar, pratyantar, score: chartScore(planets) };
  }, [chart, active]);

  if (!active || !chart || !data) {
    return (
      <ProShell
        title="Astrology Pro"
        subtitle="A professional Jyotish workspace built on classical Parashari, Jaimini and KP method."
      >
        <NeedsProfile />
      </ProShell>
    );
  }

  const strongest = [...data.planets].sort((a, b) => b.strength - a.strength)[0];
  const weakest = [...data.planets].sort((a, b) => a.strength - b.strength)[0];

  return (
    <ProShell
      title={`Chart summary — ${active.fullName}`}
      subtitle={`${active.birthDate} at ${active.birthTime}, ${active.place}. Ascendant ${RASHIS[chart.ascendant.rashi]} ${formatDegree(chart.ascendant.degreeInRashi)}.`}
      chartName={active.fullName}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProStat
          label="Ascendant"
          value={`${chart.ascendant.rashi + 1} · ${RASHIS[chart.ascendant.rashi]}`}
          note={formatDegree(chart.ascendant.degreeInRashi)}
          accent
        />
        <ProStat
          label="Birth star"
          value={NAKSHATRAS[chart.moonNakshatra.index] ?? "-"}
          note={`Pada ${chart.moonNakshatra.pada}, lord ${chart.moonNakshatra.lord}`}
        />
        <ProStat label="Chart strength" value={`${data.score} / 100`} note="Average planetary strength" />
        <ProStat
          label="Running period"
          value={data.maha ? `${data.maha.lord} — ${data.antar?.lord ?? ""}` : "—"}
          note={data.pratyantar ? `Pratyantar ${data.pratyantar.lord}, to ${fmtDate(data.pratyantar.end)}` : undefined}
        />
      </div>

      <ProCard
        title="Planetary strength order"
        hint="Composite of sign dignity, mooltrikona, avastha, directional strength and combustion."
        right={
          <Link to="/astro-pro/planets" className="text-xs font-medium text-vgold-deep">
            Full analysis
          </Link>
        }
      >
        <DataTable
          rows={[...data.planets].sort((a, b) => b.strength - a.strength)}
          rowKey={(r) => r.planet}
          columns={[
            { header: "Planet", cell: (r) => r.planet },
            { header: "Sign", cell: (r) => `${r.rashi + 1} · ${r.rashiName}` },
            { header: "House", cell: (r) => r.house, align: "right" },
            { header: "Condition", cell: (r) => r.dignity },
            { header: "Strength", cell: (r) => <StrengthBar value={r.strength} /> },
          ]}
        />
        <p className="mt-3 text-sm leading-relaxed text-vnavy-soft">
          {strongest ? `${strongest.planet} is the strongest support in this chart (${strongest.dignity.toLowerCase()}, house ${strongest.house}), so matters of ${strongest.lifeAreas[0]?.area.toLowerCase()} respond fastest to effort. ` : ""}
          {weakest ? `${weakest.planet} is the weakest link (${weakest.dignity.toLowerCase()}, house ${weakest.house}) and needs deliberate support before its results stabilise.` : ""}
        </p>
      </ProCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <ProCard
          title="Strongest houses"
          hint="Where the chart carries the most weight."
          right={
            <Link to="/astro-pro/houses" className="text-xs font-medium text-vgold-deep">
              All twelve
            </Link>
          }
        >
          <DataTable
            rows={[...data.houses].sort((a, b) => b.strength - a.strength).slice(0, 6)}
            rowKey={(r) => r.house}
            columns={[
              { header: "House", cell: (r) => r.house, align: "right" },
              { header: "Sign", cell: (r) => `${r.sign + 1} · ${r.signName}` },
              { header: "Lord", cell: (r) => r.lord },
              { header: "Score", cell: (r) => <StrengthBar value={r.strength} /> },
            ]}
          />
        </ProCard>

        <ProCard
          title="Detected combinations"
          hint="Classical yogas and doshas found in this chart."
          right={
            <Link to="/astro-pro/yogas" className="text-xs font-medium text-vgold-deep">
              Explanations
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ProStat label="Yogas" value={data.yogas.length} note="Supportive combinations" accent />
            <ProStat label="Doshas" value={data.doshas.length} note="Areas needing care" />
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-vnavy-soft">
            {data.yogas.slice(0, 5).map((y) => (
              <li key={y.name}>
                <span className="font-medium text-vnavy">{y.name}</span> — {y.reason}
              </li>
            ))}
            {data.yogas.length === 0 ? <li>No major yoga is formed in this chart.</li> : null}
          </ul>
        </ProCard>
      </div>

      <ProCard title="Birth record" hint="Every calculation on this platform uses exactly these details.">
        <DataTable
          rows={[
            { k: "Full name", v: active.fullName },
            { k: "Gender", v: active.gender },
            { k: "Date of birth", v: active.birthDate },
            { k: "Time of birth", v: `${active.birthTime}${active.dst ? " (daylight saving applied)" : ""}` },
            { k: "Place", v: active.place },
            { k: "Coordinates", v: `${active.latitude.toFixed(4)}, ${active.longitude.toFixed(4)}` },
            { k: "Time zone", v: `UTC${active.tzOffsetHours >= 0 ? "+" : ""}${active.tzOffsetHours}` },
            { k: "Ayanamsa", v: active.ayanamsa },
            { k: "Ayanamsa value", v: formatDegree(chart.ayanamsa) },
            { k: "Birth time accuracy", v: active.accuracy },
          ]}
          rowKey={(r) => r.k}
          columns={[
            { header: "Field", cell: (r) => r.k },
            { header: "Value", cell: (r) => r.v },
          ]}
        />
      </ProCard>
    </ProShell>
  );
}
