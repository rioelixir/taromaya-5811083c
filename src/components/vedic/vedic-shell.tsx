import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calculator, FileText, HeartHandshake, User } from "lucide-react";
import type { ReactNode } from "react";
import { UniversalInput } from "@/components/universal-input";
import { greeting } from "@/lib/vedic-num/dashboard";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/vedic-numerology", label: "Home", icon: Home, exact: true },
  { to: "/vedic-numerology/calculator", label: "Calculator", icon: Calculator },
  { to: "/vedic-numerology/reports", label: "Reports", icon: FileText },
  { to: "/vedic-numerology/remedies", label: "Remedies", icon: HeartHandshake },
  { to: "/vedic-numerology/profile", label: "Profile", icon: User },
];


/** Premium glass panel used everywhere inside the Vedic product. */
export function VCard({
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
    <section className={cn("vglass rise-in p-5 sm:p-6", className)}>
      {title ? (
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-vnavy sm:text-lg">{title}</h2>
            {hint ? <p className="mt-1 text-sm text-vnavy-soft">{hint}</p> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** A single large number with its label and planet. */
export function StatTile({
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
        "rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5",
        accent
          ? "border-vgold/50 bg-vgold/10"
          : "border-vline bg-vmist",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-vnavy-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-vnavy sm:text-3xl">{value}</p>
      {note ? <p className="mt-1 text-xs leading-relaxed text-vnavy-soft">{note}</p> : null}
    </div>
  );
}

export function VedicShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-vmist text-vnavy">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-vgold) 16%, transparent), transparent)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 pb-32 pt-8 sm:px-6">
        <header className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-vgold-deep">
            {greeting()} · Vedic numerology
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-vnavy sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-vnavy-soft">{subtitle}</p> : null}
        </header>

        <UniversalInput module="Vedic numerology">
          <div className="space-y-5">{children}</div>
        </UniversalInput>
      </div>

      <nav
        aria-label="Vedic numerology sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-vline bg-vsurface/90 backdrop-blur-xl"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-vgold-deep" : "text-vnavy-soft hover:text-vnavy",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", active && "drop-shadow")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
