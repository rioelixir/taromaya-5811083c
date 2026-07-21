import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { TeachMe } from "@/components/teach-me";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/codex")({
  component: CodexPage,
  head: () => ({
    meta: [
      { title: "Occult Codex · Taromaya" },
      {
        name: "description",
        content:
          "A living teaching library. Every Taromaya module explained across 25 layers — from ELI10 to master-level occult symbolism.",
      },
    ],
  }),
});

type CodexEntry = {
  module: string;
  eyebrow: string;
  blurb: string;
  href?: string;
};

const ENTRIES: readonly CodexEntry[] = [
  { module: "Tarot", eyebrow: "Divination", blurb: "78-card mirror. Archetypes, court, elemental suits, dignities.", href: "/tarot" },
  { module: "Kundli (Vedic Chart)", eyebrow: "Jyotisha", blurb: "Lagna, houses, nakshatras, dashas — the map of this life.", href: "/kundli" },
  { module: "Nakshatra", eyebrow: "Lunar mansions", blurb: "27 star-portals, their deities, pada, and soul-flavor.", href: "/nakshatra-location" },
  { module: "Dasha (Vimshottari)", eyebrow: "Time-lord cycles", blurb: "Which planet is scripting your current chapter, and why.", href: "/deep-jyotish" },
  { module: "KP System", eyebrow: "Sub-lord precision", blurb: "Placidus + sub-lords for razor-sharp timing questions.", href: "/deep-jyotish" },
  { module: "Jaimini & Chara Dasha", eyebrow: "Karaka wisdom", blurb: "Atmakaraka, Arudha, and dasha by sign — the soul's script.", href: "/deep-jyotish" },
  { module: "Western Natal Chart", eyebrow: "Tropical", blurb: "Sun-Moon-Rising, aspects, elements, modalities.", href: "/astrology" },
  { module: "Transits & Progressions", eyebrow: "Sky today", blurb: "How today's planets touch your natal placements.", href: "/transits" },
  { module: "Synastry & Compatibility", eyebrow: "Relationships", blurb: "Chart-on-chart resonance, Ashtakoota, elemental match.", href: "/synastry" },
  { module: "Horoscope", eyebrow: "Daily → yearly", blurb: "Reading transits through your specific lagna & moon.", href: "/horoscope" },
  { module: "Numerology (Pythagorean + Chaldean)", eyebrow: "Number mysticism", blurb: "Life-Path, Destiny, Soul-Urge, karmic debts.", href: "/numerology" },
  { module: "Lo Shu Grid", eyebrow: "Vedic magic square", blurb: "Missing numbers, arrows, planes — the psychic blueprint.", href: "/numerology" },
  { module: "Name & Mobile Spelling", eyebrow: "Vibrational check", blurb: "Does your name & phone match your birth frequency?", href: "/numerology" },
  { module: "Panchang", eyebrow: "Vedic day", blurb: "Tithi, Vaar, Nakshatra, Yoga, Karana — the day's fabric.", href: "/panchang" },
  { module: "Muhurat", eyebrow: "Auspicious time", blurb: "Choosing windows for weddings, travel, launches, healing.", href: "/muhurat" },
  { module: "Festivals & Vrat", eyebrow: "Sacred calendar", blurb: "Why each festival lands where it does in the sky.", href: "/festivals" },
  { module: "Moon Phase Calendar", eyebrow: "Lunar rhythm", blurb: "Waxing, waning, eclipses, and your emotional weather.", href: "/moon-calendar" },
  { module: "Mangal Dosha", eyebrow: "Mars blemish", blurb: "What it is, what it isn't, and how to work with it kindly.", href: "/mangal-dosha" },
  { module: "Sade Sati (Saturn 7.5)", eyebrow: "Saturn transit", blurb: "The gardener years — pruning, patience, mastery.", href: "/sade-sati" },
  { module: "Kaal Sarp", eyebrow: "Dosha", blurb: "Rahu-Ketu axis myth vs. actual chart mechanics.", href: "/kaal-sarp" },
  { module: "Ashtakavarga & Shadbala", eyebrow: "Chart strength", blurb: "Numeric bindu system + six-fold planet strength.", href: "/kundli" },
  { module: "Lal Kitab", eyebrow: "Red book remedies", blurb: "Grandmother-wisdom remedies rooted in house logic.", href: "/lal-kitab" },
  { module: "Prashna (Horary)", eyebrow: "Question chart", blurb: "The moment you ask *is* the chart.", href: "/prashna" },
  { module: "Astrocartography", eyebrow: "Planets on land", blurb: "Where on Earth each of your planets rises, sets, culminates.", href: "/astrocartography" },
  { module: "Chinese Zodiac", eyebrow: "Bazi lite", blurb: "12 animals, 5 elements, yin-yang year-flavor.", href: "/chinese-zodiac" },
  { module: "Ayurveda Prakriti", eyebrow: "Dosha type", blurb: "Vata, Pitta, Kapha — the constitution you were born with.", href: "/ayurveda" },
  { module: "Chakras", eyebrow: "Subtle body", blurb: "7 wheels — location, seed sound, deity, imbalance signs.", href: "/chakras" },
  { module: "Karma & Past Life", eyebrow: "Rahu-Ketu, 12H", blurb: "Reading past-life clues from chart signatures.", href: "/karma" },
  { module: "Vastu", eyebrow: "Sacred space", blurb: "Directions, elements, and how your home shapes you.", href: "/vastu" },
  { module: "Yantra Studio", eyebrow: "Sacred geometry", blurb: "How yantras work — grid, bindu, invocation.", href: "/yantra" },
  { module: "Dharma & Ishta Devata", eyebrow: "Chosen deity", blurb: "Finding the deity your chart naturally responds to.", href: "/dharma" },
  { module: "Career, Health, Finance", eyebrow: "Life domains", blurb: "10th, 6th, 2nd/11th house readings, kindly.", href: "/career" },
  { module: "Baby Names", eyebrow: "Naming ceremony", blurb: "Nakshatra pada syllable + numerology harmony.", href: "/baby-names" },
] as const;

function CodexPage() {
  return (
    <PageShell
      eyebrow="Occult Codex"
      title="The Living Library"
      subtitle="Every module in Taromaya, taught across 25 layers — ELI10 to master. Tap 'Teach me' on any card to open a personalised lesson grounded in your chart."
      aiModule="Occult Codex"
      aiIntent="Give the reader a map of the whole app: how modules relate, what to learn first, and a 7-step roadmap from beginner to adept."
    >
      <div className="mb-6 glass rounded-3xl p-5 border border-primary/20">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <div className="font-display text-lg text-primary">How to use the Codex</div>
            <p className="mt-1 text-foreground/90">
              Every lesson is written in <strong>your</strong> voice, from <strong>your</strong> chart. Tap <em>Teach me</em>
              on any tile below (or in the top-right of any module page) to open a 25-section teaching — from ELI10 to master
              scholar, with symbols, psychology, spirituality, journal prompts, quizzes, and a roadmap.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENTRIES.map((e) => (
          <GlassCard key={e.module} className="flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-primary">{e.eyebrow}</div>
              <div className="mt-1 font-display text-lg gold-text">{e.module}</div>
              <p className="mt-2 text-sm text-foreground/85">{e.blurb}</p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TeachMe module={e.module} />
              {e.href && (
                <Link
                  to={e.href}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 px-3 py-2 text-xs text-primary hover:bg-primary/10 transition"
                >
                  Open module →
                </Link>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}
