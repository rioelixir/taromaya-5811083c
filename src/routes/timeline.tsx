import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { BirthInputForm } from "@/components/birth-input-form";
import { computeVimshottari } from "@/lib/vedic-extended";
import {
  findStations, findIngresses, findEclipses, findAspectHits,
  fmtDay, type Station, type Ingress, type EclipseEvent, type TimelineHit,
} from "@/lib/transits-timeline";
import type { PlanetName } from "@/lib/vedic";
import {
  CalendarClock, Sparkles, Moon, Sun, RotateCcw, Zap, Crown, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/timeline")({
  component: () => (<PremiumGate featureName="Predictive Timeline"><TimelinePage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Predictive Timeline — TAROMAYA" },
      { name: "description", content: "Unified life-forecast timeline: Vimshottari Dasha, retrograde stations, ingresses, eclipses, and exact transit-to-natal aspects." },
    ],
  }),
});

type ChartLite = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: Array<{ name: string; longitude: number; rashi: number; house: number; degreeInRashi: number; retrograde: boolean }>;
  meta: { engine: string; engineVersion: string; ayanamsa: string; ayanamsaValue: number };
};

type Birth = {
  year: number; month: number; day: number;
  hour: number; minute: number; seconds?: number;
  tzOffsetHours: number; latitude: number; longitude: number;
};

const NAK_SPAN = 360 / 27;

function TimelinePage() {
  const [chart, setChart] = useState<ChartLite | null>(null);
  const [birth, setBirth] = useState<Birth | null>(null);
  const [years, setYears] = useState(3);

  const data = useMemo(() => {
    if (!chart || !birth) return null;
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 86400000); // include last month
    const end = new Date(now.getTime() + years * 365.25 * 86400000);

    // Vimshottari from Moon (sidereal longitude → nakshatra + deg-in-nak).
    const moon = chart.planets.find(p => p.name === "Moon");
    let dasha = null as ReturnType<typeof computeVimshottari> | null;
    if (moon) {
      const sidLon = ((moon.longitude % 360) + 360) % 360;
      const nakIdx = Math.floor(sidLon / NAK_SPAN);
      const deg = sidLon - nakIdx * NAK_SPAN;
      const birthUtcMs = Date.UTC(
        birth.year, birth.month - 1, birth.day,
        birth.hour, birth.minute, birth.seconds ?? 0,
      ) - birth.tzOffsetHours * 3600 * 1000;
      dasha = computeVimshottari(new Date(birthUtcMs), nakIdx, deg);
    }

    // Natal tropical longitudes (sidereal + ayanamsa).
    const ayan = chart.meta.ayanamsaValue || 0;
    const natal = chart.planets
      .filter(p => ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"].includes(p.name))
      .map(p => ({
        name: p.name as PlanetName,
        longitude: ((p.longitude + ayan) % 360 + 360) % 360,
      }));
    // Also include ascendant as a target.
    const ascLon = ((chart.ascendant.rashi * 30 + chart.ascendant.degreeInRashi + ayan) % 360 + 360) % 360;

    const stations = findStations(start, end);
    const ingresses = findIngresses(start, end)
      .filter(i => ["Jupiter","Saturn","Mars","Venus","Mercury"].includes(i.planet));
    const eclipses = findEclipses(start, end);
    const hits = findAspectHits(
      [...natal, { name: "Ascendant" as unknown as PlanetName, longitude: ascLon }],
      start, end,
      ["Jupiter", "Saturn", "Mars"],
      ["conjunction", "opposition", "square", "trine"],
    );

    return { start, end, dasha, stations, ingresses, eclipses, hits };
  }, [chart, birth, years]);

  return (
    <PageShell
      eyebrow="Predictive"
      title="Life Timeline"
      subtitle="Scroll your years ahead. Dasha, retrogrades, ingresses, eclipses and exact transits — one cinematic strip."
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <BirthInputForm
          onComputed={(c, b) => {
            setChart(c as unknown as ChartLite);
            if (b) setBirth(b as unknown as Birth);
          }}
        />
        <GlassCard title="Horizon" desc="How far ahead should the sky be scanned?">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            Years ahead ({years})
            <input
              type="range" min={1} max={7} value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-2 block w-full accent-gold"
            />
          </label>
          <div className="mt-3 text-[11px] text-muted-foreground">
            Enter birth details on the left. The timeline computes on-device with astronomy-engine — Lahiri sidereal for Dasha, tropical for transits.
          </div>
        </GlassCard>
      </div>

      {data && (
        <div className="mt-10 space-y-8">
          {data.dasha && (
            <DashaStrip
              dasha={data.dasha}
              start={data.start}
              end={data.end}
            />
          )}

          <EventGrid
            stations={data.stations}
            ingresses={data.ingresses}
            eclipses={data.eclipses}
            hits={data.hits}
          />
        </div>
      )}

      {!data && (
        <div className="mt-10 rounded-3xl glass p-8 text-center text-muted-foreground">
          <CalendarClock className="h-6 w-6 mx-auto text-gold mb-3" />
          Compute your kundli to unlock the predictive timeline.
        </div>
      )}
    </PageShell>
  );
}

function DashaStrip({
  dasha, start, end,
}: {
  dasha: ReturnType<typeof computeVimshottari>;
  start: Date; end: Date;
}) {
  const total = end.getTime() - start.getTime();
  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / total) * 100));
  const now = new Date();
  const nowPct = pct(now);

  const maha = dasha.maha.filter(m => m.end > start && m.start < end);
  const antar = dasha.currentMaha.antar.filter(a => a.end > start && a.start < end);

  const lordHue: Record<string, string> = {
    Sun:     "from-amber-400/40 to-amber-600/20",
    Moon:    "from-slate-200/40 to-slate-400/20",
    Mars:    "from-red-400/40 to-red-600/20",
    Rahu:    "from-indigo-500/40 to-purple-700/20",
    Jupiter: "from-yellow-400/40 to-orange-500/20",
    Saturn:  "from-blue-500/40 to-blue-800/20",
    Mercury: "from-emerald-400/40 to-emerald-600/20",
    Ketu:    "from-fuchsia-500/40 to-fuchsia-800/20",
    Venus:   "from-pink-300/40 to-pink-500/20",
  };

  return (
    <GlassCard
      title="Vimshottari Dasha"
      desc={`Current: ${dasha.currentMaha.lord} → ${dasha.currentAntar.lord} → ${dasha.currentPratyantar.lord}`}
    >
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80">Mahadasha</div>
        <div className="relative h-14 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          {maha.map((m, i) => {
            const left = pct(m.start < start ? start : m.start);
            const right = pct(m.end > end ? end : m.end);
            const width = Math.max(0.5, right - left);
            return (
              <div key={i}
                className={`absolute inset-y-0 bg-gradient-to-br ${lordHue[m.lord] ?? "from-white/20 to-white/5"} border-r border-white/10 flex items-center justify-center text-[10px] tracking-widest text-pearl/90 uppercase`}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                {width > 6 ? m.lord : ""}
              </div>
            );
          })}
          <div className="absolute inset-y-0 w-[2px] bg-gold shadow-[0_0_16px_var(--gold)]" style={{ left: `${nowPct}%` }} />
        </div>

        <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80 pt-2">
          Antardasha of {dasha.currentMaha.lord}
        </div>
        <div className="relative h-10 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          {antar.map((a, i) => {
            const left = pct(a.start < start ? start : a.start);
            const right = pct(a.end > end ? end : a.end);
            const width = Math.max(0.5, right - left);
            return (
              <div key={i}
                className={`absolute inset-y-0 bg-gradient-to-br ${lordHue[a.lord] ?? "from-white/20 to-white/5"} border-r border-white/10 flex items-center justify-center text-[9px] tracking-widest text-pearl/80 uppercase`}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                {width > 4 ? a.lord : ""}
              </div>
            );
          })}
          <div className="absolute inset-y-0 w-[2px] bg-gold shadow-[0_0_16px_var(--gold)]" style={{ left: `${nowPct}%` }} />
        </div>

        <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{fmtDay(start)}</span>
          <span className="text-gold inline-flex items-center gap-1"><Crown className="h-3 w-3" /> today</span>
          <span>{fmtDay(end)}</span>
        </div>
      </div>
    </GlassCard>
  );
}

type Row =
  | { kind: "station"; date: Date; item: Station }
  | { kind: "ingress"; date: Date; item: Ingress }
  | { kind: "eclipse"; date: Date; item: EclipseEvent }
  | { kind: "hit";     date: Date; item: TimelineHit };

function EventGrid({
  stations, ingresses, eclipses, hits,
}: {
  stations: Station[]; ingresses: Ingress[]; eclipses: EclipseEvent[]; hits: TimelineHit[];
}) {
  const [filter, setFilter] = useState<"all" | "station" | "ingress" | "eclipse" | "hit">("all");

  const rows: Row[] = useMemo(() => {
    const all: Row[] = [
      ...stations.map(s => ({ kind: "station" as const, date: s.date, item: s })),
      ...ingresses.map(i => ({ kind: "ingress" as const, date: i.date, item: i })),
      ...eclipses.map(e => ({ kind: "eclipse" as const, date: e.date, item: e })),
      ...hits.map(h => ({ kind: "hit" as const, date: h.date, item: h })),
    ];
    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [stations, ingresses, eclipses, hits]);

  const filtered = filter === "all" ? rows : rows.filter(r => r.kind === filter);

  const counts = {
    all: rows.length,
    station: stations.length,
    ingress: ingresses.length,
    eclipse: eclipses.length,
    hit: hits.length,
  };

  const chips: { key: typeof filter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "all", label: "All", icon: Sparkles },
    { key: "ingress", label: "Ingresses", icon: ArrowRight },
    { key: "station", label: "Retrogrades", icon: RotateCcw },
    { key: "eclipse", label: "Eclipses", icon: Moon },
    { key: "hit", label: "Transits", icon: Zap },
  ];

  const now = new Date();

  return (
    <GlassCard title="Events" desc={`${rows.length} celestial events within the horizon`}>
      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map(c => {
          const active = filter === c.key;
          return (
            <button key={c.key} onClick={() => setFilter(c.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border transition-all ${
                active ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground hover:border-white/25"
              }`}>
              <c.icon className="h-3 w-3" />
              {c.label}
              <span className="ml-1 text-[10px] opacity-70">{counts[c.key]}</span>
            </button>
          );
        })}
      </div>

      <ol className="relative border-l border-white/10 pl-6 space-y-3">
        {filtered.slice(0, 200).map((r, i) => {
          const past = r.date < now;
          return (
            <li key={i} className={`relative ${past ? "opacity-60" : ""}`}>
              <span className="absolute -left-[29px] top-2 h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_var(--gold)]" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-mono text-[11px] text-muted-foreground w-24 shrink-0">{fmtDay(r.date)}</span>
                <EventBody row={r} />
              </div>
            </li>
          );
        })}
        {filtered.length > 200 && (
          <li className="text-[11px] text-muted-foreground pl-1">+{filtered.length - 200} more events beyond this view.</li>
        )}
      </ol>
    </GlassCard>
  );
}

function EventBody({ row }: { row: Row }) {
  switch (row.kind) {
    case "station": {
      const s = row.item;
      return (
        <span className="text-sm text-pearl inline-flex items-center gap-2">
          <RotateCcw className={`h-3.5 w-3.5 ${s.kind === "retrograde" ? "text-red-300" : "text-emerald-300"}`} />
          <b>{s.planet}</b> turns <span className={s.kind === "retrograde" ? "text-red-200" : "text-emerald-200"}>{s.kind}</span> at {s.longitude.toFixed(2)}° {s.sign}
        </span>
      );
    }
    case "ingress": {
      const g = row.item;
      return (
        <span className="text-sm text-pearl inline-flex items-center gap-2">
          <ArrowRight className="h-3.5 w-3.5 text-gold" />
          <b>{g.planet}</b> enters <b>{g.toSign}</b> <span className="text-muted-foreground">(from {g.fromSign})</span>
        </span>
      );
    }
    case "eclipse": {
      const e = row.item;
      return (
        <span className="text-sm text-pearl inline-flex items-center gap-2">
          {e.kind === "solar" ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-slate-300" />}
          <b className="capitalize">{e.kind} eclipse</b> <span className="text-muted-foreground">({e.variety})</span>
        </span>
      );
    }
    case "hit": {
      const h = row.item;
      const glyph: Record<string, string> = { conjunction: "☌", opposition: "☍", square: "□", trine: "△", sextile: "✶" };
      return (
        <span className="text-sm text-pearl inline-flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-gold" />
          <b>{h.transit}</b> {glyph[h.type] ?? h.type} natal <b>{h.natal}</b>
          <span className="text-muted-foreground text-[11px]">{h.type}</span>
        </span>
      );
    }
  }
}
