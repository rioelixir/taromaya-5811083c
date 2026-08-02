import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { HebrewTarotPanel } from "@/components/numerology-pro-panels";

export const Route = createFileRoute("/hebrew-tarot")({
  component: HebrewTarotPage,
  head: () => ({
    meta: [
      { title: "Hebrew Letters and Tarot — TAROMAYA" },
      { name: "description", content: "Gematria of your name mapped onto the 22 Hebrew letters, the paths of the Tree of Life and their Major Arcana cards, with the full working shown." },
      { property: "og:title", content: "Hebrew Letters and Tarot — TAROMAYA" },
      { property: "og:description", content: "Name gematria, ruling Tree of Life path and the Major Arcana card that governs it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function HebrewTarotPage() {
  const [fullName, setFullName] = useState("");

  return (
    <PageShell
      eyebrow="Gematria · Tree of Life · Major Arcana"
      title="Hebrew letters and tarot"
      subtitle="Your name is transliterated into Hebrew letters, summed in gematria and placed on one of the 22 paths of the Tree of Life — each path carrying one Major Arcana card."
      aiModule="Hebrew and tarot"
      aiSnapshot={fullName ? `Name analysed in Hebrew gematria: ${fullName}` : undefined}
    >
      <GlassCard title="Your name">
        <label className="block text-sm uppercase tracking-[0.25em] text-gold/80" htmlFor="hebrew-name">
          Full name
        </label>
        <input
          id="hebrew-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter the full name as written"
          className="mt-2 w-full min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-pearl outline-none focus:border-gold/50"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          The pairs SH, CH, TZ and TH are matched as single Hebrew letters, as in standard transliteration.
        </p>
      </GlassCard>

      <div className="mt-6">
        <HebrewTarotPanel fullName={fullName} />
      </div>
    </PageShell>
  );
}
