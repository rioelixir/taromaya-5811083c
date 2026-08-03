import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Fades a block up the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setShown(true);
      },
      { rootMargin: "-40px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MnSection({
  id,
  eyebrow,
  title,
  lead,
  children,
  tinted,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  children: ReactNode;
  tinted?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("px-5 py-16 sm:px-8 sm:py-24", tinted && "mn-wash")}
    >
      <div className="mx-auto w-full max-w-6xl">
        {(eyebrow || title || lead) && (
          <Reveal className="mb-10 max-w-2xl sm:mb-14">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-mnindigo">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-3 text-[26px] font-semibold leading-[1.2] tracking-tight text-mnink sm:text-4xl">
                {title}
              </h2>
            )}
            {lead && (
              <p className="mt-4 text-[15px] leading-relaxed text-mnink-soft">{lead}</p>
            )}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

export function MnCard({
  className,
  children,
  glass,
}: {
  className?: string;
  children: ReactNode;
  glass?: boolean;
}) {
  return (
    <div className={cn(glass ? "mnglass" : "mncard", "p-6", className)}>{children}</div>
  );
}

/** Horizontal strength bar with an indigo to gold fill. */
export function MnMeter({
  label,
  value,
  tone = "indigo",
}: {
  label: string;
  value: number;
  tone?: "indigo" | "gold" | "emerald";
}) {
  const fill =
    tone === "gold"
      ? "bg-gradient-to-r from-mngold/70 to-mngold"
      : tone === "emerald"
        ? "bg-gradient-to-r from-mnemerald/60 to-mnemerald"
        : "bg-gradient-to-r from-mnindigo-soft to-mnindigo";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-mnink-soft">{label}</span>
        <span className="text-[13px] font-semibold text-mnink">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-mnline">
        <div
          className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", fill)}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

/** Circular progress dial. */
export function MnDial({
  value,
  label,
  caption,
  size = 132,
}: {
  value: number;
  label: string;
  caption?: string;
  size?: number;
}) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} ${pct} percent`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-mnline)" strokeWidth="9" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-mnindigo)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <text
          x="50%"
          y="49%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-mnink"
          style={{ fontSize: size * 0.24, fontWeight: 600 }}
        >
          {pct}
        </text>
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          className="fill-mnink-soft"
          style={{ fontSize: size * 0.1, letterSpacing: 1.4 }}
        >
          {label.toUpperCase()}
        </text>
      </svg>
      {caption && <p className="text-xs text-mnink-soft">{caption}</p>}
    </div>
  );
}

export function MnPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-mnline bg-mnsurface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-mnink-soft">
      {children}
    </span>
  );
}

export function MnButton({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
        variant === "primary"
          ? "bg-mnindigo text-white shadow-[0_16px_34px_-18px_oklch(0.515_0.215_275/0.75)] hover:brightness-110"
          : "border border-mnline bg-mnsurface text-mnink hover:border-mnindigo/40 hover:text-mnindigo",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Hand-built phone mock with a live numerology dashboard inside. */
export function PhoneShowpiece() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--color-mnindigo)_18%,transparent),transparent_66%)] blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -right-6 top-10 -z-10 h-40 w-40 rounded-full border border-mngold/40"
        style={{ animation: "mn-orbit 18s linear infinite" }}
      />
      <div className="rounded-[38px] border border-mnline bg-mnsurface p-3 shadow-[0_50px_90px_-50px_oklch(0.3_0.08_275/0.6)]">
        <div className="overflow-hidden rounded-[30px] bg-gradient-to-b from-mnbg to-mnsurface p-5">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-mnline" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-mnindigo">Energy score</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-semibold leading-none text-mnink">87</span>
            <span className="pb-1 text-xs text-mnemerald">Favourable</span>
          </div>
          <div className="mt-5 flex justify-center">
            <MnDial value={87} label="vibration" size={116} />
          </div>
          <div className="mt-5 space-y-3">
            <MnMeter label="Communication" value={92} />
            <MnMeter label="Finance" value={78} tone="gold" />
            <MnMeter label="Harmony" value={71} tone="emerald" />
          </div>
          <div className="mt-5 grid grid-cols-5 gap-1.5">
            {[9, 8, 7, 3, 1, 5, 6, 2, 4, 9].map((d, i) => (
              <div
                key={`${d}-${i}`}
                className="grid aspect-square place-items-center rounded-lg text-[11px] font-semibold"
                style={{
                  background: `color-mix(in oklab, var(--color-mnindigo) ${8 + d * 5}%, white)`,
                  color: d > 5 ? "white" : "var(--color-mnink)",
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
