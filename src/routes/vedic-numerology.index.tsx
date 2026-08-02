import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarDays, Sparkles, Compass, Gem, ArrowRight } from "lucide-react";
import { VedicShell, VCard, StatTile } from "@/components/vedic/vedic-shell";
import { useProfiles } from "@/lib/vedic-num/profiles";
import { dashboardSnapshot } from "@/lib/vedic-num/dashboard";

export const Route = createFileRoute("/vedic-numerology/")({
  component: VedicHome,
  head: () => ({
    meta: [
      { title: "Vedic Numerology Dashboard — TAROMAYA" },
      { name: "description", content: "Your driver and conductor numbers, personal and universal day, lucky factors and the ruling numerology period, all calculated from your birth date." },
      { property: "og:title", content: "Vedic Numerology Dashboard — TAROMAYA" },
      { property: "og:description", content: "Daily numerology guidance with driver, conductor, personal cycles and the active Dasha period." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;

function VedicHome() {
  const { active } = useProfiles();
  const snap = useMemo(
    () => dashboardSnapshot(active?.birthDate ?? "", active?.fullName ?? ""),
    [active?.birthDate, active?.fullName],
  );

  if (!snap.ok) {
    return (
      <VedicShell
        title="Your numerology dashboard"
        subtitle="Add a profile once and this dashboard reads your numbers for every day that follows."
      >
        <VCard title="No profile yet" hint="Speak or type a name and a birth date in the box above, then save it as a profile.">
          <Link
            to="/vedic-numerology/profile"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-vnavy px-6 text-sm font-medium text-vsurface"
          >
            Create a profile <ArrowRight className="h-4 w-4" />
          </Link>
        </VCard>
      </VedicShell>
    );
  }

  return (
    <VedicShell
      title={active?.fullName ? `${active.fullName}` : "Your numerology dashboard"}
      subtitle={snap.summary}
    >
      <VCard title="Your core numbers" hint="Driver rules your temperament, conductor rules your destiny, and the name number rules how the world receives you.">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile accent label="Driver (Mulank)" value={snap.driver} note={`Ruled by ${snap.luckyPlanet}`} />
          <StatTile label="Conductor (Bhagyank)" value={snap.conductor} />
          <StatTile label="Name number" value={snap.nameNumber ?? "—"} />
        </div>
      </VCard>

      <VCard title="Today" hint={`${fmt(new Date())} · what the day is asking of you`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile accent label="Personal day" value={snap.personalDay} />
          <StatTile label="Personal month" value={snap.personalMonth} />
          <StatTile label="Personal year" value={snap.personalYear} note={snap.yearTheme} />
        </div>
        <div className="mt-4 rounded-2xl border border-vgold/40 bg-vgold/10 p-4">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-vgold-deep">
            <Sparkles className="h-4 w-4" /> Guidance for today
          </p>
          <p className="mt-2 text-sm leading-relaxed text-vnavy">{snap.advice}</p>
          <p className="mt-2 text-sm italic leading-relaxed text-vnavy-soft">{snap.motivation}</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatTile label="Universal day" value={snap.universalDay} />
          <StatTile label="Universal month" value={snap.universalMonth} />
          <StatTile label="Universal year" value={snap.universalYear} />
        </div>
      </VCard>

      <VCard title="Lucky factors" hint="Derived from your driver and conductor numbers, not from generic lists.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Lucky numbers" value={snap.luckyNumbers.join(", ") || "—"} />
          <StatTile label="Lucky day" value={snap.luckyDay} />
          <StatTile label="Lucky colour" value={snap.luckyColour} note={snap.luckyColours.join(", ")} />
          <StatTile label="Lucky metal" value={snap.luckyMetal} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatTile label="Favourable direction" value={snap.luckyDirection} />
          <StatTile label="Favourable hours" value={snap.luckyTime} />
          <StatTile label="Ruling planet" value={snap.luckyPlanet} />
        </div>
      </VCard>

      {snap.maha ? (
        <VCard title="Ruling period" hint="The numerology Dasha ladder active for you right now.">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              accent
              label="Mahadasha"
              value={snap.maha.planet}
              note={`${fmt(snap.maha.start)} to ${fmt(snap.maha.end)}`}
            />
            {snap.antar ? (
              <StatTile label="Antardasha" value={snap.antar.planet} note={`${fmt(snap.antar.start)} to ${fmt(snap.antar.end)}`} />
            ) : null}
            {snap.pratyantar ? (
              <StatTile label="Pratyantardasha" value={snap.pratyantar.planet} note={`${fmt(snap.pratyantar.start)} to ${fmt(snap.pratyantar.end)}`} />
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-vnavy-soft">{snap.maha.focus}</p>
        </VCard>
      ) : null}

      <VCard title="Go deeper">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/vedic-numerology/calculator"
            className="flex min-h-20 items-center gap-3 rounded-2xl border border-vline bg-vmist p-4 text-sm font-medium text-vnavy hover:border-vgold/50"
          >
            <Compass className="h-5 w-5 text-vgold-deep" /> All calculators
          </Link>
          <Link
            to="/vedic-numerology/reports"
            className="flex min-h-20 items-center gap-3 rounded-2xl border border-vline bg-vmist p-4 text-sm font-medium text-vnavy hover:border-vgold/50"
          >
            <CalendarDays className="h-5 w-5 text-vgold-deep" /> Reports and timeline
          </Link>
          <Link
            to="/vedic-numerology/remedies"
            className="flex min-h-20 items-center gap-3 rounded-2xl border border-vline bg-vmist p-4 text-sm font-medium text-vnavy hover:border-vgold/50"
          >
            <Gem className="h-5 w-5 text-vgold-deep" /> Remedies
          </Link>
        </div>
      </VCard>
    </VedicShell>
  );
}
