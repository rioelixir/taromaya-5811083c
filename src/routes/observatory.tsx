import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Telescope, Eclipse, RotateCcw, ArrowRightLeft, Sparkles } from "lucide-react";
import { StarField } from "@/components/star-field";
import {
  findEclipses,
  findStations,
  findIngresses,
  fmtDay,
  type EclipseEvent,
  type Station,
  type Ingress,
} from "@/lib/transits-timeline";

export const Route = createFileRoute("/observatory")({
  component: ObservatoryPage,
  head: () => ({
    meta: [
      { title: "Observatory — Eclipses & Retrogrades | TAROMAYA" },
      {
        name: "description",
        content:
          "Live celestial observatory: upcoming and recent solar & lunar eclipses, planetary retrograde windows, and sign ingresses.",
      },
    ],
  }),
});

type Tab = "eclipses" | "retrogrades" | "ingresses";

const PLANET_COLORS: Record<string, string> = {
  Mercury: "from-emerald-300 to-emerald-500",
  Venus: "from-pink-300 to-rose-400",
  Mars: "from-red-400 to-orange-500",
  Jupiter: "from-amber-300 to-yellow-500",
  Saturn: "from-slate-300 to-slate-500",
  Sun: "from-yellow-300 to-amber-500",
  Moon: "from-indigo-200 to-indigo-400",
};

function ObservatoryPage() {
  const [tab, setTab] = useState<Tab>("eclipses");
  const [horizonYears, setHorizonYears] = useState(3);
  const [lookbackMonths, setLookbackMonths] = useState(6);

  const { eclipses, stations, ingresses } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - lookbackMonths * 30 * 86400000);
    const end = new Date(now.getTime() + horizonYears * 365 * 86400000);
    return {
      eclipses: findEclipses(start, end),
      stations: findStations(start, end),
      ingresses: findIngresses(start, end),
    };
  }, [horizonYears, lookbackMonths]);

  // Pair retrograde/direct into shadow windows per planet.
  const retroWindows = useMemo(() => {
    const byPlanet = new Map<string, Station[]>();
    for (const s of stations) {
      if (!byPlanet.has(s.planet)) byPlanet.set(s.planet, []);
      byPlanet.get(s.planet)!.push(s);
    }
    const windows: {
      planet: string;
      start: Date;
      end: Date;
      startSign: string;
      endSign: string;
    }[] = [];
    for (const [planet, list] of byPlanet) {
      const sorted = [...list].sort((a, b) => a.date.getTime() - b.date.getTime());
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].kind === "retrograde" && sorted[i + 1].kind === "direct") {
          windows.push({
            planet,
            start: sorted[i].date,
            end: sorted[i + 1].date,
            startSign: sorted[i].sign,
            endSign: sorted[i + 1].sign,
          });
        }
      }
    }
    return windows.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [stations]);

  return (
    <div className="relative flex min-h-dvh w-full flex-col">
      <StarField />
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-full gold-border bg-gold/10">
            <Telescope className="h-6 w-6 text-gold" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-gold/80">
            Phase 15 · Live Observatory
          </div>
          <h1 className="font-display text-4xl sm:text-5xl gold-text">
            Eclipses & Retrogrades
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            A living register of the sky's most-watched moments — every solar &
            lunar eclipse, every retrograde shadow window, and every sign ingress
            across your chosen horizon.
          </p>
        </header>

        <div className="glass rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4 justify-center">
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            Lookback
            <select
              value={lookbackMonths}
              onChange={(e) => setLookbackMonths(Number(e.target.value))}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-pearl text-xs"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>1 year</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            Horizon
            <select
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-pearl text-xs"
            >
              <option value={1}>1 year</option>
              <option value={2}>2 years</option>
              <option value={3}>3 years</option>
              <option value={5}>5 years</option>
              <option value={7}>7 years</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <TabButton active={tab === "eclipses"} onClick={() => setTab("eclipses")} icon={Eclipse}>
            Eclipses <span className="ml-1 text-gold/80">{eclipses.length}</span>
          </TabButton>
          <TabButton active={tab === "retrogrades"} onClick={() => setTab("retrogrades")} icon={RotateCcw}>
            Retrogrades <span className="ml-1 text-gold/80">{retroWindows.length}</span>
          </TabButton>
          <TabButton active={tab === "ingresses"} onClick={() => setTab("ingresses")} icon={ArrowRightLeft}>
            Ingresses <span className="ml-1 text-gold/80">{ingresses.length}</span>
          </TabButton>
        </div>

        {tab === "eclipses" && <EclipsePanel events={eclipses} />}
        {tab === "retrogrades" && <RetroPanel windows={retroWindows} />}
        {tab === "ingresses" && <IngressPanel items={ingresses} />}
      </div>
    </PageShell>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Telescope;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-all",
        active
          ? "bg-gradient-to-r from-gold/25 to-galaxy/20 text-pearl gold-border"
          : "border border-white/10 text-muted-foreground hover:text-pearl hover:bg-white/5",
      ].join(" ")}
    >
      <Icon className={active ? "h-4 w-4 text-gold" : "h-4 w-4"} />
      {children}
    </button>
  );
}

function eclipseTone(v: string) {
  const s = v.toLowerCase();
  if (s.includes("total")) return "from-red-400 to-rose-600";
  if (s.includes("annular")) return "from-amber-300 to-orange-500";
  if (s.includes("penumbral")) return "from-slate-300 to-slate-500";
  return "from-indigo-300 to-purple-500";
}

function daysFromNow(d: Date) {
  const diff = Math.round((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "today";
  if (diff > 0) return `in ${diff} day${diff === 1 ? "" : "s"}`;
  return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`;
}

function EclipsePanel({ events }: { events: EclipseEvent[] }) {
  if (!events.length) {
    return <EmptyState label="No eclipses in the selected window." />;
  }
  const now = Date.now();
  const nextIdx = events.findIndex((e) => e.date.getTime() >= now);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {events.map((e, i) => {
        const isNext = i === nextIdx;
        return (
          <div
            key={i}
            className={[
              "glass rounded-2xl p-5 relative overflow-hidden",
              isNext ? "gold-border ring-1 ring-gold/40" : "",
            ].join(" ")}
          >
            <div className={`absolute -top-14 -right-14 h-40 w-40 rounded-full bg-gradient-to-br ${eclipseTone(e.variety)} opacity-25 blur-2xl`} />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {e.kind === "solar" ? "Solar eclipse" : "Lunar eclipse"}
                </div>
                <div className="font-display text-2xl text-pearl capitalize mt-1">
                  {e.variety}
                </div>
              </div>
              {isNext && (
                <span className="text-[10px] uppercase tracking-widest text-gold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Next
                </span>
              )}
            </div>
            <div className="relative z-10 mt-3 text-sm text-pearl">{fmtDay(e.date)}</div>
            <div className="relative z-10 text-xs text-muted-foreground">
              {daysFromNow(e.date)}
              {typeof e.obscuration === "number" && (
                <> · obscuration {(e.obscuration * 100).toFixed(0)}%</>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RetroPanel({
  windows,
}: {
  windows: {
    planet: string;
    start: Date;
    end: Date;
    startSign: string;
    endSign: string;
  }[];
}) {
  if (!windows.length) return <EmptyState label="No retrograde windows found." />;
  const now = Date.now();
  return (
    <div className="space-y-3">
      {windows.map((w, i) => {
        const active = now >= w.start.getTime() && now <= w.end.getTime();
        const days = Math.round((w.end.getTime() - w.start.getTime()) / 86400000);
        const grad = PLANET_COLORS[w.planet] ?? "from-white/40 to-white/10";
        return (
          <div
            key={i}
            className={[
              "glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4",
              active ? "gold-border ring-1 ring-gold/40" : "",
            ].join(" ")}
          >
            <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${grad} grid place-items-center shrink-0`}>
              <RotateCcw className="h-5 w-5 text-cosmic" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-display text-xl text-pearl">{w.planet} Retrograde</div>
                {active && (
                  <span className="text-[10px] uppercase tracking-widest text-gold px-2 py-0.5 rounded-full bg-gold/15">
                    In effect
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {fmtDay(w.start)} → {fmtDay(w.end)} · {days} days
              </div>
              <div className="text-xs text-muted-foreground">
                Shadow: {w.startSign}
                {w.startSign !== w.endSign ? ` → ${w.endSign}` : ""}
              </div>
            </div>
            <div className="text-xs text-muted-foreground sm:text-right sm:min-w-[7rem]">
              {active
                ? `ends ${daysFromNow(w.end)}`
                : now < w.start.getTime()
                ? `begins ${daysFromNow(w.start)}`
                : `ended ${daysFromNow(w.end)}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IngressPanel({ items }: { items: Ingress[] }) {
  if (!items.length) return <EmptyState label="No sign ingresses in this window." />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((ing, i) => {
        const grad = PLANET_COLORS[ing.planet] ?? "from-white/40 to-white/10";
        return (
          <div key={i} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${grad} grid place-items-center shrink-0`}>
              <ArrowRightLeft className="h-4 w-4 text-cosmic" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-pearl truncate">
                {ing.planet} · {ing.fromSign} → <span className="text-gold">{ing.toSign}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {fmtDay(ing.date)} · {daysFromNow(ing.date)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
