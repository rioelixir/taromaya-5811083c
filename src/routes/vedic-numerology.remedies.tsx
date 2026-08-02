import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { VedicShell, VCard, StatTile } from "@/components/vedic/vedic-shell";
import { useProfiles } from "@/lib/vedic-num/profiles";
import { dashboardSnapshot } from "@/lib/vedic-num/dashboard";
import { practicalGuidance } from "@/lib/numerology-dasha";

export const Route = createFileRoute("/vedic-numerology/remedies")({
  component: RemediesPage,
  head: () => ({
    meta: [
      { title: "Numerology Remedies — TAROMAYA" },
      { name: "description", content: "Practical numerology remedies for your driver and conductor numbers: gems, mantras, colours, favourable days and daily habits, with no superstition attached." },
      { property: "og:title", content: "Numerology Remedies — TAROMAYA" },
      { property: "og:description", content: "Gems, mantras, colours and daily practices matched to your numbers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RemediesPage() {
  const { active } = useProfiles();
  const birthDate = active?.birthDate ?? "";
  const snap = useMemo(
    () => dashboardSnapshot(birthDate, active?.fullName ?? ""),
    [birthDate, active?.fullName],
  );
  const guidance = useMemo(() => {
    if (!birthDate) return [];
    try { return practicalGuidance(birthDate); } catch { return []; }
  }, [birthDate]);

  if (!snap.ok) {
    return (
      <VedicShell title="Remedies">
        <VCard title="Add a profile to see your remedies">
          <p className="text-sm text-vnavy-soft">Save a name and birth date on the Profile tab.</p>
        </VCard>
      </VedicShell>
    );
  }

  return (
    <VedicShell
      title="Remedies"
      subtitle="Supportive practices matched to your ruling planet. These are habits and reminders, not guarantees."
    >
      <VCard title="Your supports">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile accent label="Ruling planet" value={snap.luckyPlanet} />
          <StatTile label="Gems" value={snap.gems.join(", ") || "—"} />
          <StatTile label="Colours" value={snap.luckyColours.join(", ") || "—"} />
          <StatTile label="Metal" value={snap.luckyMetal} />
        </div>
      </VCard>

      <VCard title="Mantras" hint="Repeat eleven times, at the same hour, for a full week before judging the effect.">
        <ul className="space-y-2 text-sm leading-relaxed text-vnavy">
          {snap.mantras.map((m) => (
            <li key={m} className="rounded-xl border border-vline bg-vmist p-3">{m}</li>
          ))}
        </ul>
      </VCard>

      {guidance.length > 0 ? (
        <VCard title="Daily practice" hint="Drawn from the period ruling you right now.">
          <ul className="space-y-2 text-sm leading-relaxed text-vnavy-soft">
            {guidance.map((g) => (
              <li key={g.area} className="rounded-xl border border-vline bg-vmist p-3">
                <span className="font-semibold text-vnavy">{g.area}. </span>
                {g.advice}
              </li>
            ))}
          </ul>
        </VCard>
      ) : null}
    </VedicShell>
  );
}
