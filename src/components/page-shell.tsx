import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Home, ChevronUp, ChevronDown, Check, Sparkles, LayoutGrid } from "lucide-react";
import { StarField } from "@/components/star-field";
import { BackButton } from "@/components/back-button";
import { AIInterpretation } from "@/components/ai-interpretation";
import { AskBox } from "@/components/ask-box";



import { LanguageSwitcher } from "@/components/language-switcher";
import { useBirthProfile } from "@/hooks/use-birth-profile";
import { useAuth } from "@/hooks/use-auth";

function BirthStatusChip() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useBirthProfile();
  if (!user || isLoading) return null;
  if (profile) {
    return (
      <Link
        to="/birth-details"
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/15 transition"
        title="Every module autofills from your saved details"
      >
        <Check className="h-3 w-3" /> Using saved details
      </Link>
    );
  }
  return (
    <Link
      to="/birth-details"
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/15 transition"
      title="Save your birth details once — every module will autofill"
    >
      <Sparkles className="h-3 w-3" /> Save birth details
    </Link>
  );
}

function PageNav({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <BackButton />

      <div className="flex items-center gap-2 flex-wrap justify-end" data-no-translate>
        <BirthStatusChip />
        <LanguageSwitcher compact />
        <button
          onClick={onToggle}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl glass gold-border px-3 text-sm text-pearl hover:bg-white/10 transition"
          aria-label={collapsed ? "Show the page title" : "Hide the page title"}
        >
          {collapsed ? <ChevronDown className="h-5 w-5 text-gold" /> : <ChevronUp className="h-5 w-5 text-gold" />}
          <span className="hidden sm:inline">{collapsed ? "Show" : "Focus"}</span>
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event("taromaya:open-menu"))}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl glass gold-border px-3 text-sm text-pearl hover:bg-white/10 transition"
          aria-label="See everything"
        >
          <LayoutGrid className="h-5 w-5 text-gold" /> <span className="hidden sm:inline">All</span>
        </button>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl glass gold-border px-3 text-sm text-pearl hover:bg-white/10 transition"
          aria-label="Home"
        >
          <Home className="h-5 w-5 text-gold" /> Home
        </Link>
      </div>

    </div>
  );
}

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  aiModule,
  aiSnapshot,
  aiIntent,
  hideAI,
  hideVoice,
}: {


  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Module name for the AI Interpretation panel; defaults to `title`. */
  aiModule?: string;
  /** Page-specific facts to ground the AI reading in. */
  aiSnapshot?: string;
  /** Optional extra user intent for the AI reading. */
  aiIntent?: string;
  /** Set to true on utility pages (auth, terms, admin) to hide the AI panel. */
  hideAI?: boolean;
  /** Set to true to hide the speak-first panel (auth, terms, admin). */
  hideVoice?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  // This page already shows its own Back button, so hide the global floating one.
  useEffect(() => {
    document.documentElement.classList.add("has-pageshell-back");
    return () => document.documentElement.classList.remove("has-pageshell-back");
  }, []);

  return (
    <div className="relative flex min-h-dvh w-full flex-col">
      <StarField />
      <div className={`relative z-10 flex w-full flex-1 flex-col px-4 sm:px-6 lg:px-10 pb-16 ${collapsed ? "pt-4" : "pt-16 lg:pt-12"}`}>
        <PageNav
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
        {!collapsed && (
          <header className="mb-6 sm:mb-8">
            {eyebrow && (
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.35em] text-muted-foreground">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl leading-tight break-words">
              <span className="gold-text">{title}</span>
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
                {subtitle}
              </p>
            )}
          </header>
        )}
        
        {!hideVoice && <AskBox module={aiModule ?? title} />}
        {children}

        {!hideAI && (
          <AIInterpretation
            module={aiModule ?? title}
            snapshot={aiSnapshot}
            intent={aiIntent}
          />
        )}
      </div>
    </div>
  );
}


export function GlassCard({
  title,
  desc,
  children,
  className,
}: {
  title?: string;
  desc?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["glass rounded-3xl p-6", className].filter(Boolean).join(" ")}>
      {title && <div className="font-display text-xl text-pearl">{title}</div>}
      {desc && <div className="mt-1 text-sm text-muted-foreground">{desc}</div>}
      {children && <div className={title ? "mt-4" : ""}>{children}</div>}
    </div>
  );
}

export function ComingSoonGrid({ items }: { items: readonly string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((label) => (
        <div
          key={label}
          className="glass rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.06] transition-colors"
        >
          <span className="text-pearl">{label}</span>
          <span className="text-[10px] uppercase tracking-widest text-gold/80">Soon</span>
        </div>
      ))}
    </div>
  );
}
