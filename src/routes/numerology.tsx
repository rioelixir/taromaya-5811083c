import { createFileRoute } from "@tanstack/react-router";
import { PageShell, ComingSoonGrid } from "@/components/page-shell";

const items = [
  "Life Path Number",
  "Destiny Number",
  "Soul Urge",
  "Personality",
  "Expression",
  "Birthday Number",
  "Maturity Number",
  "Personal Year",
  "Personal Month",
  "Compatibility",
  "Lucky Number",
  "Lucky Colour",
  "Lucky Dates",
];

export const Route = createFileRoute("/numerology")({
  component: () => (
    <PageShell
      eyebrow="Numerology"
      title="The vibration of numbers"
      subtitle="Reveal the numeric patterns that shape your path, personality, and cycles."
    >
      <ComingSoonGrid items={items} />
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "Numerology — TAROMAYA" }] }),
});
