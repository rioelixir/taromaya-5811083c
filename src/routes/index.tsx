import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Stars,
  Moon,
  Sun,
  CalendarDays,
  Hash,
  Heart,
  Bot,
  ArrowRight,
  Flame,
  Compass,
} from "lucide-react";
import { StarField } from "@/components/star-field";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "TAROMAYA — Your Cosmic Dashboard" },
      {
        name: "description",
        content:
          "Today's energy, tarot pull, horoscope, panchang, and planetary transits — personalised by AI.",
      },
    ],
  }),
});

function Home() {
  return (
    <div className="relative">
      <StarField />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 pt-8 lg:pt-12">
        <Hero />
        <QuickGrid />
        <TodayGrid />
        <ModulesGrid />
      </div>
    </div>
  );
}

function Hero() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <section className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl animate-float" />
      <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-galaxy/25 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      <div className="relative">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          {today}
        </div>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
          Welcome to your <span className="gold-text">cosmic day</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
          The universe is speaking. Draw a card, chart the sky, or converse with your
          AI guide to reveal what awaits.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/tarot"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.82_0.13_85/0.5)] transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" />
            Draw today's card
          </Link>
          <Link
            to="/ai"
            className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm text-pearl hover:bg-white/10"
          >
            <Bot className="h-4 w-4 text-gold" />
            Ask the AI guide
          </Link>
        </div>
      </div>
    </section>
  );
}

const quicks = [
  { label: "Lucky Number", value: "7", accent: "text-gold" },
  { label: "Lucky Colour", value: "Indigo", accent: "text-aurora" },
  { label: "Lucky Direction", value: "North-East", accent: "gold-text" },
  { label: "Mood", value: "Reflective", accent: "text-pearl" },
];
function QuickGrid() {
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
      {quicks.map((q) => (
        <div key={q.label} className="glass rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {q.label}
          </div>
          <div className={`mt-2 font-display text-2xl ${q.accent}`}>{q.value}</div>
        </div>
      ))}
    </div>
  );
}

function TodayGrid() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <TarotToday />
      <HoroscopeToday />
      <PanchangToday />
    </div>
  );
}

function TarotToday() {
  return (
    <Link to="/tarot" className="group glass rounded-3xl p-6 overflow-hidden relative">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-gold" /> Today's Tarot
      </div>
      <div className="mt-5 flex items-center gap-5">
        <div className="relative">
          <div className="h-28 w-20 rounded-xl bg-gradient-to-b from-galaxy via-midnight to-cosmic gold-border grid place-items-center animate-float">
            <div className="font-display text-2xl gold-text">XVII</div>
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gold/15 blur-xl -z-10" />
        </div>
        <div>
          <div className="font-display text-2xl text-pearl">The Star</div>
          <div className="text-xs text-muted-foreground mt-1">Hope · Renewal · Faith</div>
          <div className="text-sm mt-3 text-muted-foreground line-clamp-2">
            A luminous phase begins. Trust the quiet guidance appearing in your life.
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-1 text-xs text-gold group-hover:gap-2 transition-all">
        Read interpretation <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

function HoroscopeToday() {
  return (
    <Link to="/horoscope" className="group glass rounded-3xl p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Sun className="h-3.5 w-3.5 text-gold" /> Today's Horoscope
      </div>
      <div className="mt-5">
        <div className="font-display text-2xl text-pearl">Leo · Simha</div>
        <div className="text-xs text-muted-foreground mt-1">Sun in Cancer · 5th house</div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Creative fire rises. A conversation reshapes a lingering doubt. Move with grace,
        speak with restraint — the day rewards subtle courage.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="Love" value={82} />
        <Stat label="Career" value={68} />
        <Stat label="Health" value={74} />
      </div>
    </Link>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-galaxy"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-1 text-xs gold-text">{value}%</div>
    </div>
  );
}

function PanchangToday() {
  const rows: [string, string][] = [
    ["Tithi", "Shukla Saptami"],
    ["Nakshatra", "Rohini"],
    ["Yoga", "Siddha"],
    ["Karana", "Vanija"],
    ["Sunrise", "6:12 AM"],
    ["Sunset", "6:48 PM"],
  ];
  return (
    <Link to="/panchang" className="group glass rounded-3xl p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-gold" /> Panchang
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="text-sm text-pearl mt-0.5">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-gold">
        <Flame className="h-3.5 w-3.5" /> Abhijit Muhurat · 12:04 – 12:56 PM
      </div>
    </Link>
  );
}

const modules = [
  { to: "/tarot", label: "Tarot", desc: "Unlimited spreads, AI meanings", icon: Sparkles },
  { to: "/astrology", label: "Astrology", desc: "Charts, dashas, transits", icon: Stars },
  { to: "/kundli", label: "Kundli", desc: "North & South Indian, D-charts", icon: Moon },
  { to: "/numerology", label: "Numerology", desc: "Life path, destiny, luck", icon: Hash },
  { to: "/compatibility", label: "Compatibility", desc: "Guna Milan · Synastry", icon: Heart },
  { to: "/ai", label: "AI Guide", desc: "Voice · vision · memory", icon: Bot },
];
function ModulesGrid() {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl gold-text">Explore</h2>
        <Link to="/learn" className="text-xs text-muted-foreground hover:text-pearl inline-flex items-center gap-1">
          Learning center <Compass className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-all"
          >
            <div className="h-11 w-11 grid place-items-center rounded-xl bg-gradient-to-br from-gold/20 to-galaxy/15 gold-border">
              <m.icon className="h-5 w-5 text-gold" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg text-pearl truncate">{m.label}</div>
              <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
