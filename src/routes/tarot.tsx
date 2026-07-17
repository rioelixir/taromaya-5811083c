import { createFileRoute } from "@tanstack/react-router";
import { PageShell, ComingSoonGrid } from "@/components/page-shell";

const spreads = [
  "One Card",
  "Three Card",
  "Five Card",
  "Seven Card",
  "Celtic Cross",
  "Relationship",
  "Career",
  "Finance",
  "Health",
  "Love",
  "Decision",
  "Past · Present · Future",
  "Year Ahead",
  "Custom Spread Builder",
];

export const Route = createFileRoute("/tarot")({
  component: TarotPage,
  head: () => ({
    meta: [
      { title: "Tarot — TAROMAYA" },
      { name: "description", content: "Premium AI tarot with unlimited spreads, meanings, and journal." },
    ],
  }),
});

function TarotPage() {
  return (
    <PageShell
      eyebrow="Tarot"
      title="Draw your cards"
      subtitle="Choose a spread. The deck shuffles with intention, and AI interprets each card in your context."
    >
      <ComingSoonGrid items={spreads} />
    </PageShell>
  );
}
