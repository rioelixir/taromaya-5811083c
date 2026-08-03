import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard, Orbit, CircleDot, Home as HomeIcon, Sparkles, Clock, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Taromaya Astrology Pro — its own light, gold-and-ink shell.
 * A quiet top bar names the active chart, a scrollable tab rail holds the
 * modules, and everything below sits on white cards with generous radii.
 * ------------------------------------------------------------------ */

type NavTo =
  | "/astro-pro"
  | "/astro-pro/charts"
  | "/astro-pro/planets"
  | "/astro-pro/houses"
  | "/astro-pro/yogas"
  | "/astro-pro/dashas"
  | "/astro-pro/profiles";

const NAV: { to: NavTo; label: string; icon: typeof Orbit; exact?: boolean }[] = [
  { to: "/astro-pro", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/astro-pro/charts", label: "Charts", icon: Orbit },
  { to: "/astro-pro/planets", label: "Planets", icon: CircleDot },
  { to: "/astro-pro/houses", label: "Houses", icon: HomeIcon },
  { to: "/astro-pro/yogas", label: "Yogas", icon: Sparkles },
  { to: "/astro-pro/dashas", label: "Periods", icon: Clock },
  { to: "/astro-pro/profiles", label: "Profiles", icon: Users },
];

/** Standard card for every panel in the platform. */
export function ProCard({
  title,
  hint,
  right,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-vline bg-vsurface p-5 shadow-[0_10px_36px_-24px_rgba(20,30,60,0.45)] sm:p-6",
        className,
      )}
    >
      {title ? (
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-vnavy sm:text-lg">{title}</h2>
            {hint ? <p className="mt-1 text-sm leading-relaxed text-vnavy-soft">{hint}</p> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** A single figure with its label. */
export function ProStat({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent ? "border-vgold/55 bg-vgold/10" : "border-vline bg-vmist",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-vnavy-soft">{label}</p>
      <p className="mt-1 text-xl font-semibold text-vnavy sm:text-2xl">{value}</p>
      {note ? <p className="mt-1 text-xs leading-relaxed text-vnavy-soft">{note}</p> : null}
    </div>
  );
}

/** Horizontal strength meter, 0..100. */
export function StrengthBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-vline">
        <div
          className="h-full rounded-full bg-vgold-deep"
          style={{ width: `${Math.max(3, Math.min(100, value))}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-vnavy">{value}</span>
    </div>
  );
}

export function ProShell({
  title,
  subtitle,
  chartName,
  children,
}: {
  title: string;
  subtitle?: string;
  chartName?: string | null;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-vmist text-vnavy">
      <header className="sticky top-0 z-30 border-b border-vline bg-vsurface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/astro-pro" className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-vgold-deep">
              Taromaya
            </p>
            <p className="truncate text-sm font-semibold tracking-tight">Astrology Pro</p>
          </Link>
          <Link
            to="/astro-pro/profiles"
            className="max-w-[55%] truncate rounded-full border border-vline bg-vmist px-3 py-1.5 text-xs font-medium text-vnavy"
          >
            {chartName ? chartName : "Add a birth profile"}
          </Link>
        </div>
        <nav aria-label="Astrology Pro sections" className="border-t border-vline/70">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 sm:px-5">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <li key={item.to} className="shrink-0">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                      active
                        ? "bg-vnavy text-white"
                        : "text-vnavy-soft hover:bg-vmist hover:text-vnavy",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-vnavy-soft">{subtitle}</p>
          ) : null}
        </div>
        <div className="space-y-5">{children}</div>
      </main>
    </div>
  );
}

/** Shown whenever no birth profile exists yet. */
export function NeedsProfile() {
  return (
    <ProCard title="No chart selected" hint="Add a birth profile to open every module of the platform.">
      <Link
        to="/astro-pro/profiles"
        className="inline-flex min-h-11 items-center rounded-full bg-vnavy px-5 text-sm font-medium text-white"
      >
        Add a birth profile
      </Link>
    </ProCard>
  );
}
