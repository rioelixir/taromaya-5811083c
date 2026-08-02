import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles, Star, CalendarDays, Bot, ArrowRight, Sun, Moon, Feather, Headphones,
  Heart, Hash, Sigma, Grid3X3, Music, Compass, Stars, Gauge, CalendarClock, Flame,
  Snowflake, Waves, Triangle, Crown, Briefcase, Coins, Activity, Leaf, Zap,
  Infinity as InfIcon, Home as HomeIcon, LineChart, FileText, Bookmark, BookOpen,
  History, User, Settings, Baby, LayoutGrid, HelpCircle,
} from "lucide-react";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "TAROMAYA — Your Cosmic Portal" },
      {
        name: "description",
        content:
          "Tarot, Vedic astrology, kundli, panchang, numerology and an AI oracle — one calm, luxurious platform.",
      },
      { property: "og:title", content: "TAROMAYA — Your Cosmic Portal" },
      {
        property: "og:description",
        content:
          "Tarot, kundli, kundli matching, panchang, numerology systems and more in one professional consultation platform.",
      },
    ],
  }),
});

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

type Tile = { to: string; label: string; icon: typeof Sparkles; search?: Record<string, string> };

const CORE: Tile[] = [
  { to: "/tarot", label: "Tarot", icon: Sparkles },
  { to: "/kundli", label: "Kundli", icon: Moon },
  { to: "/compatibility", label: "Kundli matching", icon: Heart },
  { to: "/panchang", label: "Panchang", icon: CalendarDays },
];

const NUMBERS: Tile[] = [
  { to: "/numerology", label: "Western numerology", icon: Hash, search: { tab: "report" } },
  { to: "/loshu", label: "Lo Shu grid", icon: Grid3X3 },
  { to: "/vedic-numerology", label: "Vedic numerology", icon: Sigma },
  { to: "/hebrew-tarot", label: "Kabbalah numerology", icon: Star },
];

const MISC: Tile[] = [
  { to: "/dreams", label: "Dreams", icon: Feather },
  { to: "/meditation", label: "Meditation and music", icon: Music },
  { to: "/ai", label: "Ask the guide", icon: Bot },
  { to: "/help", label: "Audio guide", icon: Headphones },
];

const MORE: { label: string; items: Tile[] }[] = [
  {
    label: "Vedic astrology",
    items: [
      { to: "/astrology", label: "Chart analysis", icon: Stars },
      { to: "/avakhada", label: "Avakhada details", icon: Stars },
      { to: "/strength", label: "Planetary strength", icon: Gauge },
      { to: "/muhurat", label: "Muhurat", icon: CalendarClock },
      { to: "/varshphal", label: "Annual forecast", icon: Sun },
      { to: "/prashna", label: "Prashna", icon: CalendarClock },
      { to: "/deep-jyotish", label: "Advanced Jyotish", icon: Stars },
      { to: "/nakshatra", label: "Birth nakshatra", icon: Stars },
      { to: "/nakshatra-location", label: "Nakshatra by place", icon: Compass },
      { to: "/nadi", label: "Nadi astrology", icon: Hash },
    ],
  },
  {
    label: "Doshas and remedies",
    items: [
      { to: "/remedies", label: "Remedies", icon: Flame },
      { to: "/sadesati", label: "Sade Sati", icon: Snowflake },
      { to: "/kaalsarp", label: "Kaal Sarp analysis", icon: Waves },
      { to: "/mangal-dosha", label: "Mangal Dosha", icon: Flame },
      { to: "/yantra", label: "Yantra guidance", icon: Triangle },
      { to: "/dharma", label: "Dharma and life path", icon: Crown },
    ],
  },
  {
    label: "Life and guidance",
    items: [
      { to: "/horoscope", label: "Daily horoscope", icon: Sun },
      { to: "/career", label: "Career and education", icon: Briefcase },
      { to: "/finance", label: "Finances", icon: Coins },
      { to: "/health", label: "Health", icon: Activity },
      { to: "/ayurveda", label: "Ayurvedic constitution", icon: Leaf },
      { to: "/chakra", label: "Chakra assessment", icon: Zap },
      { to: "/karma", label: "Karmic analysis", icon: InfIcon },
      { to: "/vastu", label: "Vastu", icon: HomeIcon },
      { to: "/life-dashboard", label: "Life dashboard", icon: LayoutGrid },
      { to: "/baby-names", label: "Baby names", icon: Baby },
      { to: "/calculators", label: "Calculators", icon: Hash },
      { to: "/festivals", label: "Festival calendar", icon: Flame },
    ],
  },
  {
    label: "Transits and forecasts",
    items: [
      { to: "/transits", label: "Current transits", icon: LineChart },
      { to: "/vedic-transits", label: "Vedic transits", icon: Moon },
      { to: "/timeline", label: "Forecast timeline", icon: CalendarClock },
      { to: "/moon-calendar", label: "Lunar calendar", icon: Moon },
      { to: "/sky", label: "Live sky", icon: Stars },
      { to: "/reports", label: "Full reports", icon: FileText },
    ],
  },
  {
    label: "Library and account",
    items: [
      { to: "/saved", label: "Saved charts", icon: Bookmark },
      { to: "/bookmarks", label: "Bookmarks", icon: BookOpen },
      { to: "/history", label: "Reading history", icon: History },
      { to: "/blog", label: "Articles", icon: BookOpen },
      { to: "/faq", label: "Frequently asked questions", icon: HelpCircle },
      { to: "/birth-details", label: "Birth details", icon: User },
      { to: "/profile", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function Home() {
  const branding = useBranding();
  const [dateLine, setDateLine] = useState("");
  useEffect(() => setDateLine(today()), []);
  const { user } = useAuth();
  const first =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <div className="container-page pt-20 sm:pt-24 pb-12">
      <div className="min-h-[1rem] text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
        {dateLine}
      </div>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight">
        <span className="gold-text">
          {first ? `Welcome back, ${first}.` : branding.heroTitle}
        </span>
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground">
        {first
          ? "Draw a card, cast a chart, or ask the oracle a question."
          : branding.heroDescription}
      </p>

      <div className="mt-8 flex flex-wrap gap-3" data-tour="hero-start">
        <Link
          to="/tarot"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="h-5 w-5" />
          Draw a card
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          to="/ai"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border/50 bg-white/60 px-6 py-3 text-base text-foreground hover:bg-white/90 transition"
        >
          <Bot className="h-5 w-5 text-primary" />
          Ask a question
        </Link>
      </div>

      <TileSection title="Core readings" tiles={CORE} tour="quick-actions" />
      <TileSection title="Numerology systems" tiles={NUMBERS} />
      <TileSection title="Miscellaneous" tiles={MISC} />

      {/* Today */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl">Today</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InfoTile icon={Sun} label="Sun" value="Cancer 24°" />
          <InfoTile icon={Moon} label="Moon" value="Rohini · Taurus" />
          <InfoTile icon={Sparkles} label="Tithi" value="Shukla Saptami" />
        </div>
      </section>

      {/* Guides */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl">Guides</h2>
        <button
          type="button"
          data-tour="guides"
          onClick={() => window.dispatchEvent(new Event("taromaya:open-authors-note"))}
          className="group flex w-full min-h-16 items-center gap-4 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 text-left hover:bg-white/95 hover:border-primary/40 transition-all"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
            <Feather className="h-6 w-6" />
          </div>
          <div className="min-w-0 text-base font-medium text-foreground">Author's note</div>
        </button>
      </section>

      {/* All remaining modules, listed in full on the page */}
      <section className="mt-12" data-tour="explore-all">
        <h2 className="mb-1 font-display text-xl">All modules</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Everything in Taromaya, right here on this page.
        </p>
        <div className="space-y-8">
          {MORE.map((group) => (
            <div key={group.label}>
              <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {group.label}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.items.map((item) => (
                  <ModuleLink key={item.to + item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TileSection({
  title,
  tiles,
  tour,
}: {
  title: string;
  tiles: Tile[];
  tour?: string;
}) {
  return (
    <section className="mt-10" data-tour={tour}>
      <h2 className="mb-4 font-display text-xl">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map(({ to, label, icon: Icon, search }) => (
          <Link
            key={to + label}
            to={to}
            search={search as never}
            className="group flex min-h-28 flex-col items-start justify-center gap-3 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 hover:bg-white/95 hover:border-primary/40 transition-all"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition">
              <Icon className="h-6 w-6" />
            </div>
            <div className="text-base font-medium text-foreground">{label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ModuleLink({ to, label, icon: Icon, search }: Tile) {
  return (
    <Link
      to={to}
      search={search as never}
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-border/40 bg-white/70 px-4 py-3 hover:bg-white/95 hover:border-primary/40 transition-all"
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <span className="min-w-0 text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-white/70 px-4 py-3">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="text-sm text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}
