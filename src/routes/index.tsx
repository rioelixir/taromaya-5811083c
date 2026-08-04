import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, Sparkles, Star, ArrowRight, Feather } from "lucide-react";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "TAROMAYA — Tarot Board and Numerology" },
      {
        name: "description",
        content:
          "The Taromaya tarot board with admin uploaded decks, mobile numerology intelligence and Kabbalah numerology in one calm platform.",
      },
      { property: "og:title", content: "TAROMAYA — Tarot Board and Numerology" },
      {
        property: "og:description",
        content:
          "Three focused modules: the tarot board, mobile numerology and Kabbalah numerology.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

type Tile = { to: string; label: string; icon: typeof Sparkles; note: string };

const MODULES: Tile[] = [
  { to: "/tarot", label: "Tarot board", icon: Sparkles, note: "Draw, drag and read a full spread." },
  { to: "/mobile-numerology", label: "Mobile numerology", icon: Phone, note: "Analyse any mobile number in depth." },
  { to: "/hebrew-tarot", label: "Kabbalah numerology", icon: Star, note: "Gematria, Tree of Life and Major Arcana." },
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
          ? "Open the tarot board, or run a numerology analysis."
          : branding.heroDescription}
      </p>

      <div className="mt-8 flex flex-wrap gap-3" data-tour="hero-start">
        <Link
          to="/tarot"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="h-5 w-5" />
          Open the tarot board
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      <section className="mt-10" data-tour="quick-actions">
        <h2 className="mb-4 font-display text-xl">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODULES.map(({ to, label, icon: Icon, note }) => (
            <Link
              key={to}
              to={to}
              className="group flex min-h-24 flex-col justify-center gap-2 rounded-2xl border border-border/40 bg-white/70 p-5 hover:bg-white/95 hover:border-primary/40 transition-all"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-base font-medium text-foreground">{label}</div>
              <div className="text-sm text-muted-foreground">{note}</div>
            </Link>
          ))}
        </div>
      </section>

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
    </div>
  );
}
