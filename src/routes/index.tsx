import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Star, CalendarDays, Bot, ArrowRight, LayoutGrid, Sun, Moon, Feather, BookOpen } from "lucide-react";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { TutorialModule } from "@/components/tutorial-module";

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
    ],
  }),
});

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

function Home() {
  const branding = useBranding();
  const { user } = useAuth();
  const first =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <div className="container-page pt-20 sm:pt-24 pb-12">
      {/* Greeting */}
      <div className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
        {today()}
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

      {/* Primary CTA */}
      <div className="mt-8 flex flex-wrap gap-3" data-tour="hero-start">
        <Link
          to="/tarot"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Start a reading
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/ai"
          className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-white/60 px-6 py-3 text-sm text-foreground hover:bg-white/90 transition"
        >
          <Bot className="h-4 w-4 text-primary" />
          Ask the oracle
        </Link>
      </div>


      {/* Quick actions — 4 large tiles */}
      <section className="mt-12" data-tour="quick-actions">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Quick actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <QuickTile to="/tarot" label="Tarot" hint="Draw a card" icon={Sparkles} />
          <QuickTile to="/kundli" label="Kundli" hint="Your birth chart" icon={Star} />
          <QuickTile to="/panchang" label="Panchang" hint="Today's almanac" icon={CalendarDays} />
          <QuickTile to="/ai" label="AI Guide" hint="Ask anything" icon={Bot} />
        </div>
      </section>

      {/* Today */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl">Today</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InfoTile icon={Sun} label="Sun" value="Cancer 24°" />
          <InfoTile icon={Moon} label="Moon" value="Rohini · Taurus" />
          <InfoTile icon={Sparkles} label="Tithi" value="Shukla Saptami" />
        </div>
      </section>

      {/* Guides — visible to everyone */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl">Guides</h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <button
            type="button"
            data-tour="guides"
            onClick={() => window.dispatchEvent(new Event("taromaya:open-authors-note"))}
            className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 text-left hover:bg-white/95 hover:border-primary/40 transition-all"
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition shrink-0">
              <Feather className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground">Author's Note</div>
              <div className="text-xs text-muted-foreground">A message from Giaa Sharma</div>
            </div>
          </button>

          <Link
            to="/codex"
            className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 text-left hover:bg-white/95 hover:border-primary/40 transition-all"
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground">Occult Codex</div>
              <div className="text-xs text-muted-foreground">Every module taught in 25 layers — ELI10 to master</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
          </Link>
        </div>

      </section>

      {/* Explore all */}
      <section className="mt-10">
        <button
          type="button"
          data-tour="explore-all"
          onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Open menu"]')?.click()}
          className="w-full flex items-center justify-between rounded-2xl border border-border/40 bg-white/60 px-5 py-4 text-left hover:bg-white/90 transition"
        >
          <div>
            <div className="font-display text-lg">Explore all modules</div>
            <div className="text-sm text-muted-foreground">
              Kundli, panchang, numerology, doshas, remedies, transits and more.
            </div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            <LayoutGrid className="h-5 w-5" />
          </div>
        </button>
      </section>
    </div>
  );
}

function QuickTile({
  to,
  label,
  hint,
  icon: Icon,
}: {
  to: string;
  label: string;
  hint: string;
  icon: typeof Sparkles;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 hover:bg-white/95 hover:border-primary/40 transition-all"
    >
      <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
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
