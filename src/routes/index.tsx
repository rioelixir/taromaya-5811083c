import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Sun,
  Moon,
  CalendarDays,
  Bot,
  ArrowRight,
  Flame,
  Star,
  Heart,
  Compass,
  Baby,
  Gem,
  Home as HomeIcon,
  Infinity as InfinityIcon,
  Zap,
  Leaf,
  BookOpen,
  TrendingUp,
  Activity,
  Coins,
} from "lucide-react";
import { StarField } from "@/components/star-field";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "TAROMAYA — Your Cosmic Portal" },
      {
        name: "description",
        content:
          "Enter the cosmic portal — tarot, Vedic astrology, kundli, panchang, numerology and an AI oracle in one luxury platform.",
      },
    ],
  }),
});

function Home() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col">
      <StarField />
      <div className="relative z-10 flex w-full flex-1 flex-col px-4 sm:px-6 lg:px-10 pt-8 lg:pt-12 pb-16">
        <CelestialHero />
        <TodayStrip />
        <TarotDeckGrid />
      </div>
    </div>
  );
}

/* ─────────────────────────  HERO — cosmic seal  ───────────────────────── */

function CelestialHero() {
  const branding = useBranding();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="relative">
      {/* Ornate mandala backdrop */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] max-w-[90vw] max-h-[90vw] opacity-40">
        <Mandala />
      </div>

      <div className="relative text-center py-8 lg:py-14">
        <div className="text-[10px] uppercase tracking-[0.5em] text-gold/80">
          ✦ &nbsp; {today} &nbsp; ✦
        </div>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
          <span className="gold-text">{branding.heroTitle}</span>
        </h1>
        <div className="mt-2 text-xs uppercase tracking-[0.35em] text-pearl/70">
          {branding.heroKicker}
        </div>
        <p className="mx-auto mt-6 max-w-lg text-sm sm:text-base text-muted-foreground">
          {branding.heroDescription}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/tarot"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_40px_-10px_oklch(0.82_0.13_85/0.7)] transition-transform hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4" />
            Draw a card
          </Link>
          <Link
            to="/ai"
            className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm text-pearl hover:bg-white/10"
          >
            <Bot className="h-4 w-4 text-gold" />
            Ask the oracle
          </Link>
          <Link
            to="/kundli"
            className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm text-pearl hover:bg-white/10"
          >
            <Star className="h-4 w-4 text-gold" />
            My kundli
          </Link>
        </div>
      </div>
    </section>
  );
}

function Mandala() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full animate-mandala">
      <defs>
        <radialGradient id="mandala-gold" cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.9 0.12 85)" stopOpacity="0.4" />
          <stop offset="70%" stopColor="oklch(0.82 0.13 85)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="oklch(0.82 0.13 85)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#mandala-gold)" />
      {/* 12 rays for the 12 zodiac */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 360) / 12;
        return (
          <g key={i} transform={`rotate(${a} 200 200)`}>
            <line
              x1="200"
              y1="40"
              x2="200"
              y2="90"
              stroke="oklch(0.82 0.13 85)"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <circle cx="200" cy="35" r="2" fill="oklch(0.9 0.12 85)" />
          </g>
        );
      })}
      {/* Inner rings */}
      <circle cx="200" cy="200" r="150" fill="none" stroke="oklch(0.82 0.13 85 / 0.3)" />
      <circle cx="200" cy="200" r="110" fill="none" stroke="oklch(0.82 0.13 85 / 0.4)" strokeDasharray="2 4" />
      <circle cx="200" cy="200" r="70" fill="none" stroke="oklch(0.82 0.13 85 / 0.5)" />
      {/* Central star */}
      <g transform="translate(200 200)">
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2="0"
            y2={i % 2 === 0 ? -55 : -35}
            stroke="oklch(0.9 0.12 85)"
            strokeOpacity="0.6"
            strokeWidth={i % 2 === 0 ? 1.5 : 0.8}
            transform={`rotate(${(i * 360) / 8})`}
          />
        ))}
        <circle r="8" fill="oklch(0.9 0.12 85)" opacity="0.9" />
        <circle r="14" fill="none" stroke="oklch(0.9 0.12 85)" strokeOpacity="0.6" />
      </g>
    </svg>
  );
}

/* ─────────────────────────  TODAY STRIP  ───────────────────────── */

function TodayStrip() {
  const items = [
    { icon: Sun, label: "Sun", value: "Cancer 24°" },
    { icon: Moon, label: "Moon", value: "Rohini · Taurus" },
    { icon: Star, label: "Nakshatra", value: "Rohini" },
    { icon: Sparkles, label: "Tithi", value: "Shukla Saptami" },
    { icon: Flame, label: "Abhijit", value: "12:04 – 12:56" },
    { icon: Compass, label: "Direction", value: "North-East" },
  ];
  return (
    <div className="mt-4 glass rounded-2xl p-3 sm:p-4">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 rounded-xl bg-white/[0.02] px-2 sm:px-3 py-2">
            <it.icon className="h-4 w-4 text-gold shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">
                {it.label}
              </div>
              <div className="text-xs sm:text-sm text-pearl truncate">{it.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────  TAROT-CARD MODULE GRID  ───────────────────────── */

type Tile = {
  to: string;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  roman: string;
};

const CORE: Tile[] = [
  { to: "/tarot", title: "Tarot", subtitle: "The Oracle", icon: Sparkles, roman: "I" },
  { to: "/kundli", title: "Kundli", subtitle: "Birth Chart", icon: Star, roman: "II" },
  { to: "/horoscope", title: "Horoscope", subtitle: "Daily · Yearly", icon: Sun, roman: "III" },
  { to: "/panchang", title: "Panchang", subtitle: "Vedic Almanac", icon: CalendarDays, roman: "IV" },
  { to: "/numerology", title: "Numerology", subtitle: "Number Wisdom", icon: InfinityIcon, roman: "V" },
  { to: "/compatibility", title: "Match", subtitle: "Synastry · Guna", icon: Heart, roman: "VI" },
  { to: "/moon-calendar", title: "Moon", subtitle: "Lunar Phases", icon: Moon, roman: "VII" },
  { to: "/ai", title: "AI Guide", subtitle: "Cosmic Oracle", icon: Bot, roman: "VIII" },
];

const DEEP: Tile[] = [
  { to: "/dharma", title: "Dharma", subtitle: "Life Purpose", icon: InfinityIcon, roman: "IX" },
  { to: "/karma", title: "Karma", subtitle: "Past-Life Read", icon: InfinityIcon, roman: "X" },
  { to: "/chakra", title: "Chakras", subtitle: "Energy Body", icon: Zap, roman: "XI" },
  { to: "/ayurveda", title: "Ayurveda", subtitle: "Prakriti Dosha", icon: Leaf, roman: "XII" },
  { to: "/vastu", title: "Vastu", subtitle: "Sacred Space", icon: HomeIcon, roman: "XIII" },
  { to: "/sadesati", title: "Sade Sati", subtitle: "Saturn Cycle", icon: TrendingUp, roman: "XIV" },
  { to: "/mangal-dosha", title: "Mangal", subtitle: "Mars Dosha", icon: Flame, roman: "XV" },
  { to: "/kaalsarp", title: "Kaal Sarp", subtitle: "Serpent Axis", icon: InfinityIcon, roman: "XVI" },
  { to: "/yantra", title: "Yantra", subtitle: "Sacred Geometry", icon: Star, roman: "XVII" },
  { to: "/remedies", title: "Remedies", subtitle: "Gems · Mantras", icon: Gem, roman: "XVIII" },
  { to: "/baby-names", title: "Baby Names", subtitle: "Nakshatra Names", icon: Baby, roman: "XIX" },
  { to: "/festivals", title: "Festivals", subtitle: "Vrat Calendar", icon: BookOpen, roman: "XX" },
];

const LIFE: Tile[] = [
  { to: "/career", title: "Career", subtitle: "10th House", icon: TrendingUp, roman: "XXI" },
  { to: "/health", title: "Health", subtitle: "Vitality Map", icon: Activity, roman: "XXII" },
  { to: "/finance", title: "Finance", subtitle: "Dhana Yoga", icon: Coins, roman: "XXIII" },
  { to: "/life-dashboard", title: "Life", subtitle: "Full Dashboard", icon: Compass, roman: "XXIV" },
];

function TarotDeckGrid() {
  return (
    <div className="mt-10 space-y-10">
      <TileSection title="The Portal" subtitle="Daily Rituals" tiles={CORE} />
      <TileSection title="The Deep" subtitle="Jyotish Wisdom" tiles={DEEP} />
      <TileSection title="Life Path" subtitle="Practical Guidance" tiles={LIFE} />
    </div>
  );
}

function TileSection({
  title,
  subtitle,
  tiles,
}: {
  title: string;
  subtitle: string;
  tiles: Tile[];
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-gold/70">{subtitle}</div>
          <h2 className="font-display text-2xl sm:text-3xl gold-text">{title}</h2>
        </div>
        <div className="hidden sm:block h-px flex-1 mx-6 bg-gradient-to-r from-gold/40 to-transparent" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <TarotTile key={t.to} tile={t} />
        ))}
      </div>
    </section>
  );
}

function TarotTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <Link
      to={tile.to}
      className="group relative aspect-[3/4.4] rounded-2xl tarot-tile transition-transform hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_oklch(0.82_0.13_85/0.35)]"
    >
      {/* Inner gold frame */}
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-gold/25" />
      {/* Corners */}
      <span className="absolute top-3 left-3 text-[9px] font-display text-gold/70 tracking-widest">
        {tile.roman}
      </span>
      <span className="absolute top-3 right-3 text-[9px] font-display text-gold/70 tracking-widest rotate-180">
        {tile.roman}
      </span>

      {/* Center emblem */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-gold/40 grid place-items-center bg-gradient-to-b from-galaxy/40 to-cosmic">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-gold" />
          </div>
        </div>
        <div className="mt-4 font-display text-lg sm:text-xl text-pearl leading-tight">
          {tile.title}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {tile.subtitle}
        </div>
      </div>

      {/* Bottom flourish */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-gold/60 text-xs">
        <span className="h-px w-4 bg-gold/40" />
        ✦
        <span className="h-px w-4 bg-gold/40" />
      </div>

      {/* Reveal arrow */}
      <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-3.5 w-3.5 text-gold" />
      </div>
    </Link>
  );
}
