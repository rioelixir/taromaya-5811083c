import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { VedicShell, VCard, StatTile } from "@/components/vedic/vedic-shell";
import { useProfiles } from "@/lib/vedic-num/profiles";
import { multiYearForecast, mahadashaTimeline, personalCycles } from "@/lib/numerology-dasha";

export const Route = createFileRoute("/vedic-numerology/reports")({
  component: ReportsPage,
  head: () => ({
    meta: [
      { title: "Numerology Reports and Timeline — TAROMAYA" },
      { name: "description", content: "A ten year numerology forecast, your personal year themes for career, money, health and relationships, and the full Mahadasha timeline." },
      { property: "og:title", content: "Numerology Reports and Timeline — TAROMAYA" },
      { property: "og:description", content: "Ten year forecast and Mahadasha timeline calculated from your birth date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const year = (d: Date) => d.getFullYear();

function ReportsPage() {
  const { active } = useProfiles();
  const birthDate = active?.birthDate ?? "";

  const cycles = useMemo(() => {
    if (!birthDate) return null;
    try { return personalCycles(birthDate); } catch { return null; }
  }, [birthDate]);
  const forecast = useMemo(() => {
    if (!birthDate) return [];
    try { return multiYearForecast(birthDate, new Date().getFullYear(), 10); } catch { return []; }
  }, [birthDate]);
  const timeline = useMemo(() => {
    if (!birthDate) return [];
    try { return mahadashaTimeline(birthDate, 100); } catch { return []; }
  }, [birthDate]);

  return (
    <VedicShell title="Reports" subtitle="Your year themes, the decade ahead and the Dasha ladder from birth.">
      {cycles ? (
        <VCard title={`Personal year ${cycles.personalYear}`} hint={cycles.theme}>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Career" value={cycles.personalYear} note={cycles.career} />
            <StatTile label="Money" value={cycles.personalYear} note={cycles.money} />
            <StatTile label="Health" value={cycles.personalYear} note={cycles.health} />
            <StatTile label="Relationships" value={cycles.personalYear} note={cycles.relationship} />
          </div>
        </VCard>
      ) : (
        <VCard title="Add a profile to generate reports">
          <p className="text-sm text-vnavy-soft">Save a name and birth date on the Profile tab.</p>
        </VCard>
      )}

      {forecast.length > 0 ? (
        <VCard title="Ten year forecast">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.16em] text-vnavy-soft">
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2 pr-4">Personal year</th>
                  <th className="py-2">Theme</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((row) => (
                  <tr key={row.year} className="border-t border-vline align-top">
                    <td className="py-3 pr-4 font-semibold text-vnavy">{row.year}</td>
                    <td className="py-3 pr-4 text-vgold-deep">{row.personalYear}</td>
                    <td className="py-3 text-vnavy-soft">{row.headline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </VCard>
      ) : null}

      {timeline.length > 0 ? (
        <VCard title="Mahadasha timeline">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.16em] text-vnavy-soft">
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Planet</th>
                  <th className="py-2">Focus</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((p) => (
                  <tr key={`${p.lord}-${p.start.toISOString()}`} className="border-t border-vline align-top">
                    <td className="py-3 pr-4 font-semibold text-vnavy">{year(p.start)} to {year(p.end)}</td>
                    <td className="py-3 pr-4 text-vgold-deep">{p.planet}</td>
                    <td className="py-3 text-vnavy-soft">{p.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </VCard>
      ) : null}
    </VedicShell>
  );
}
