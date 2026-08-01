import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Star, CalendarDays, Bot, ArrowRight, LayoutGrid, Sun, Moon, Feather, Headphones, Heart, Hash, Sigma } from "lucide-react";
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
  // Shown after the page loads so the date always matches the reader's own clock.
  const [dateLine, setDateLine] = useState("");
  useEffect(() => setDateLine(today()), []);
  const { user } = useAuth();
  const first =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <div className="container-page pt-20 sm:pt-24 pb-12">
      {/* Greeting */}
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

      {/* Primary CTA */}
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


      {/* Quick actions — 4 large tiles */}
      <section className="mt-12" data-tour="quick-actions">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Start here</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <QuickTile to="/tarot" label="Tarot cards" icon={Sparkles} />
          <QuickTile to="/kundli" label="Birth chart" icon={Star} />
          <QuickTile to="/panchang" label="Today's sky" icon={CalendarDays} />
          <QuickTile to="/ai" label="Ask the guide" icon={Bot} />
        </div>
      </section>

      {/* Matching & numbers */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl">Matching and numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link
            to="/numerology"
            search={{ tab: "compat" }}
            className="group flex min-h-16 items-center gap-4 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 hover:bg-white/95 hover:border-primary/40 transition-all"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
              <Heart className="h-6 w-6" />
            </div>
            <div className="min-w-0 text-base font-medium text-foreground">Kundli matching</div>
          </Link>
          <Link
            to="/numerology"
            search={{ tab: "report" }}
            className="group flex min-h-16 items-center gap-4 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 hover:bg-white/95 hover:border-primary/40 transition-all"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
              <Hash className="h-6 w-6" />
            </div>
            <div className="min-w-0 text-base font-medium text-foreground">My numbers</div>
          </Link>
          <Link
            to="/numerology"
            search={{ tab: "vedic" }}
            className="group flex min-h-16 items-center gap-4 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 hover:bg-white/95 hover:border-primary/40 transition-all"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
              <Sigma className="h-6 w-6" />
            </div>
            <div className="min-w-0 text-base font-medium text-foreground">Vedic numbers</div>
          </Link>
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

      {/* Help — audio guides for every module */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl">Need help? Just listen</h2>
        <Link
          to="/help"
          className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5 hover:bg-white/95 hover:border-primary/40 transition-all"
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition shrink-0">
            <Headphones className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground">Help — listen and learn</div>
            <div className="text-xs text-muted-foreground">
              A short audio guide for every module. Press play and we explain it in easy words.
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
        </Link>
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
