import { createFileRoute } from "@tanstack/react-router";
import { PremiumGate } from "@/components/premium-gate";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { moonPhaseInfo, moonSign } from "@/lib/horoscope";
import { ChevronLeft, ChevronRight, Moon } from "lucide-react";

export const Route = createFileRoute("/moon-calendar")({
  component: () => (<PremiumGate featureName="Moon Calendar"><MoonCalendarPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Moon Phase Calendar — TAROMAYA" },
      { name: "description", content: "A luxury moon phase calendar with illumination, sign, and phase for every day of the month." },
    ],
  }),
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(y: number, m: number) { return new Date(y, m, 1); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

function MoonGlyph({ angle, illumination }: { angle: number; illumination: number }) {
  // angle 0..360; 0/360 = new, 180 = full. Waxing: 0..180, waning: 180..360.
  const waxing = angle < 180;
  const size = 34;
  const r = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;
  // Terminator: ellipse x-radius scales with (1 - 2*illum) sign flip for phase.
  const k = 1 - 2 * illumination; // -1 full, +1 new
  const rx = Math.abs(k) * r;
  const lit = waxing ? "right" : "left";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <clipPath id={`c-${angle.toFixed(2)}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c-${angle.toFixed(2)})`}>
        <circle cx={cx} cy={cy} r={r} fill="#0b0b14" />
        {/* Lit hemisphere */}
        <rect
          x={lit === "right" ? cx : cx - r}
          y={cy - r}
          width={r}
          height={r * 2}
          fill="oklch(0.92 0.05 85)"
        />
        {/* Terminator ellipse to subtract or add curvature */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={r}
          fill={
            (waxing && illumination < 0.5) || (!waxing && illumination < 0.5)
              ? "#0b0b14"
              : "oklch(0.92 0.05 85)"
          }
        />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="oklch(0.82 0.13 85 / 0.5)" strokeWidth="0.75" />
    </svg>
  );
}

function MoonCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<Date>(now);

  const cells = useMemo(() => {
    const first = startOfMonth(year, month);
    const lead = first.getDay();
    const total = daysInMonth(year, month);
    const arr: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(new Date(year, month, d, 12, 0, 0));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long", year: "numeric",
  });

  const sel = moonPhaseInfo(selected);
  const selSign = moonSign(selected);

  return (
    <PageShell
      eyebrow="Lunar Almanac"
      title="Moon Phase Calendar"
      subtitle="Follow the Moon through every day — phase, illumination, and sign at a glance."
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => shift(-1)}
              className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-gold/40 hover:bg-white/5 transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-gold" />
            </button>
            <div className="font-display text-2xl gold-text tracking-widest">{monthLabel}</div>
            <button
              onClick={() => shift(1)}
              className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-gold/40 hover:bg-white/5 transition"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4 text-gold" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[10px] uppercase tracking-widest text-white/40 py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const info = moonPhaseInfo(d);
              const isToday =
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate();
              const isSelected =
                d.getFullYear() === selected.getFullYear() &&
                d.getMonth() === selected.getMonth() &&
                d.getDate() === selected.getDate();
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  className={[
                    "aspect-square rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-between text-center transition",
                    "border",
                    isSelected
                      ? "gold-border bg-gold/10"
                      : isToday
                        ? "border-gold/40 bg-white/5"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/20",
                  ].join(" ")}
                  title={`${d.toDateString()} · ${info.name} · ${Math.round(info.illumination * 100)}%`}
                >
                  <div className={[
                    "text-[10px] sm:text-xs w-full text-left tabular-nums",
                    isSelected ? "text-gold" : "text-white/70",
                  ].join(" ")}>
                    {d.getDate()}
                  </div>
                  <MoonGlyph angle={info.phaseAngle} illumination={info.illumination} />
                  <div className="text-[9px] text-white/50 tabular-nums">
                    {Math.round(info.illumination * 100)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            <div className="scale-[2.2] origin-center">
              <MoonGlyph angle={sel.phaseAngle} illumination={sel.illumination} />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[10px] uppercase tracking-[0.35em] text-gold/80 mb-1">
              {selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="font-display text-3xl gold-text tracking-wide flex items-center justify-center sm:justify-start gap-2">
              {sel.emoji} {sel.name}
            </div>
            <div className="mt-2 text-sm text-white/70">
              Illumination <span className="text-pearl tabular-nums">{Math.round(sel.illumination * 100)}%</span>
              {" · "}
              Phase angle <span className="text-pearl tabular-nums">{sel.phaseAngle.toFixed(1)}°</span>
              {" · "}
              {sel.waxing ? "Waxing" : "Waning"}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs">
              <Moon className="h-3.5 w-3.5 text-white/60" />
              <span className="text-white/80">Moon in {selSign}</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
