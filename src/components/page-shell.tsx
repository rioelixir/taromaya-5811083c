import type { ReactNode } from "react";
import { StarField } from "@/components/star-field";
import { AIInterpretation } from "@/components/ai-interpretation";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  aiModule,
  aiSnapshot,
  aiIntent,
  hideAI,
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
}) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col">
      <StarField />
      <div className="relative z-10 flex w-full flex-1 flex-col px-4 sm:px-6 lg:px-10 pt-16 lg:pt-12 pb-16">
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
}: {
  title?: string;
  desc?: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-6">
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
