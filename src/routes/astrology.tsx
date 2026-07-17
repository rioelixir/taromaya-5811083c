import { createFileRoute } from "@tanstack/react-router";
import { PageShell, ComingSoonGrid } from "@/components/page-shell";

const modules = [
  "Birth Chart",
  "North Indian Chart",
  "South Indian Chart",
  "Western Chart",
  "Divisional Charts (D1–D60)",
  "Navamsa · D9",
  "Vimshottari Dasha",
  "Yogini Dasha",
  "Ashtakavarga",
  "Shadbala",
  "Current Transits",
  "Retrograde Analysis",
  "KP Astrology",
  "Jaimini",
  "Lal Kitab",
  "Doshas · Manglik · Kaal Sarp",
  "Yogas",
  "Remedies · Gemstones · Rudraksha",
];

export const Route = createFileRoute("/astrology")({
  component: () => (
    <PageShell
      eyebrow="Astrology"
      title="Vedic & Western"
      subtitle="Complete astrological system with charts, dashas, transits, doshas, and remedies."
    >
      <ComingSoonGrid items={modules} />
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Astrology — TAROMAYA" }] }),
});
