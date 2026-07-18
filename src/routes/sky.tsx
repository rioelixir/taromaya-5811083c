import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Moon, RotateCcw, Sparkles, ArrowRightLeft, MapPin } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { liveSkySnapshot, signName } from "@/lib/live-sky";
import { PLANET_GLYPHS, RASHIS, type PlanetName } from "@/lib/vedic";
import { SkyAlertPrefs, type SkyLocation } from "@/components/sky-alert-prefs";

export const Route = createFileRoute("/sky")({
  component: SkyPage,
  head: () => ({
    meta: [
      { title: "Live Sky — TAROMAYA" },
      { name: "description", content: "Real-time planetary positions, moon phase, retrogrades, and upcoming ingresses." },
    ],
  }),
});

const SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

const PLANET_COLOR: Record<PlanetName, string> = {
  Sun: "#f5c66b", Moon: "#e8ecff", Mars: "#ff6b6b", Mercury: "#a2f0ff",
  Jupiter: "#f0b25b", Venus: "#f7b7d1", Saturn: "#c9b9ff",
  Rahu: "#7fe8c9", Ketu: "#c98bff",
};

function SkyPage() {
  const [tick, setTick] = useState(0);
  const [loc, setLoc] = useState<SkyLocation>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("taromaya:sky-loc") : null;
    if (raw) { try { return JSON.parse(raw); } catch { /* ignore */ } }
    return {
      timezone: (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC",
      latitude: null, longitude: null, place: null,
    };
  });
  const onLocationChange = useCallback((next: SkyLocation) => {
    setLoc(next);
    try { localStorage.setItem("taromaya:sky-loc", JSON.stringify(next)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const snap = useMemo(() => liveSkySnapshot(new Date()), [tick]);
  const now = snap.now;
  const tz = loc.timezone || "UTC";

  const locLabel = loc.place ? loc.place : (loc.latitude != null && loc.longitude != null
    ? `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`
    : "Set your location");

  return (
    <PageShell
      eyebrow="Live Sky"
      title="The Heavens, Right Now"
      subtitle={`${fmtLocal(now, tz, { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })} · updates every 30 seconds`}
    >
      <div className="flex w-full flex-col gap-6">

        <div className="glass rounded-3xl px-5 py-3 flex items-center justify-between flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-2 text-pearl">
            <MapPin className="h-4 w-4 text-gold" />
            <span className="font-display">{locLabel}</span>
            <span className="text-muted-foreground text-xs">· {tz}</span>
          </div>
          <a href="#sky-prefs" className="text-xs text-gold hover:underline">Personalize ↓</a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="glass rounded-3xl p-4 sm:p-8">
            <SkyWheel snap={snap} />
          </section>

          <aside className="flex flex-col gap-4">
            <MoonCard moon={snap.moon} tz={tz} />
            <RetroCard retros={snap.retros} tz={tz} />
          </aside>
        </div>

        <IngressList ingresses={snap.ingresses} tz={tz} />
        <PlanetTable snap={snap} />

        <div id="sky-prefs">
          <SkyAlertPrefs onLocationChange={onLocationChange} />
        </div>
      </div>
    </PageShell>
  );
}

function SkyWheel({ snap }: { snap: ReturnType<typeof liveSkySnapshot> }) {
  const size = 640;
  const cx = size / 2, cy = size / 2;
  const rOuter = 300, rZodiac = 260, rPlanet = 210, rInner = 140;

  const planets = snap.sky.tropicalPlanets;

  // Deconflict planet radial positions when close in longitude
  const positions = deconflict(planets.map((p) => p.tropicalLongitude));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
      <defs>
        <radialGradient id="skyBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0b0a1a" />
          <stop offset="60%" stopColor="#050510" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c66b" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a074ff" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={rOuter} fill="url(#skyBg)" />
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="url(#ring)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(245,198,107,0.25)" strokeWidth={1} />

      {/* Zodiac sectors */}
      {RASHIS.map((_, i) => {
        const a1 = (i * 30 - 90) * (Math.PI / 180);
        const a2 = ((i + 1) * 30 - 90) * (Math.PI / 180);
        const amid = (a1 + a2) / 2;
        const x1 = cx + rOuter * Math.cos(a1), y1 = cy + rOuter * Math.sin(a1);
        const x2 = cx + rInner * Math.cos(a1), y2 = cy + rInner * Math.sin(a1);
        const gx = cx + (rZodiac - 12) * Math.cos(amid);
        const gy = cy + (rZodiac - 12) * Math.sin(amid);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central"
              fill="#f5c66b" fontSize={22} fontFamily="serif">{SIGN_GLYPH[i]}</text>
          </g>
        );
      })}

      {/* Degree ticks every 5° */}
      {Array.from({ length: 72 }).map((_, i) => {
        const a = (i * 5 - 90) * (Math.PI / 180);
        const r1 = rOuter;
        const r2 = rOuter - (i % 6 === 0 ? 12 : 5);
        return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
          x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
          stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />;
      })}

      {/* Planets */}
      {planets.map((p, i) => {
        const lon = positions[i];
        const a = (lon - 90) * (Math.PI / 180);
        const r = rPlanet;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        const color = PLANET_COLOR[p.name];
        const trueA = (p.tropicalLongitude - 90) * (Math.PI / 180);
        const tickInner = rZodiac - 4;
        const tickOuter = rZodiac + 4;
        return (
          <g key={p.name}>
            <line
              x1={cx + tickInner * Math.cos(trueA)} y1={cy + tickInner * Math.sin(trueA)}
              x2={cx + tickOuter * Math.cos(trueA)} y2={cy + tickOuter * Math.sin(trueA)}
              stroke={color} strokeWidth={1.5}
            />
            <line x1={cx + tickOuter * Math.cos(trueA)} y1={cy + tickOuter * Math.sin(trueA)}
              x2={x} y2={y} stroke={color} strokeOpacity={0.35} strokeWidth={0.5} />
            <circle cx={x} cy={y} r={16} fill="rgba(10,8,25,0.85)" stroke={color} strokeWidth={1.2} />
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
              fill={color} fontSize={18}>{PLANET_GLYPHS[p.name]}</text>
            {p.retrograde && (
              <text x={x + 13} y={y - 10} fill="#ff9b9b" fontSize={9} fontWeight={700}>R</text>
            )}
          </g>
        );
      })}

      {/* Centre label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#f5c66b" fontSize={14} letterSpacing={3}>NOW</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#e8ecff" fontSize={11} opacity={0.7}>
        Tropical · Geocentric
      </text>
    </svg>
  );
}

function deconflict(lons: number[]): number[] {
  // Nudge overlapping longitudes apart for label placement (visual only).
  const out = lons.slice();
  const order = out.map((_, i) => i).sort((a, b) => out[a] - out[b]);
  for (let k = 0; k < 5; k++) {
    for (let i = 1; i < order.length; i++) {
      const a = order[i - 1], b = order[i];
      let diff = out[b] - out[a];
      if (diff < 5) {
        out[a] -= (5 - diff) / 2;
        out[b] += (5 - diff) / 2;
      }
    }
  }
  return out;
}

function MoonCard({ moon, tz }: { moon: ReturnType<typeof liveSkySnapshot>["moon"]; tz: string }) {
  const pct = Math.round(moon.illumination * 100);
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Moon className="h-3.5 w-3.5 text-gold" /> Moon Phase
      </div>
      <div className="mt-4 flex items-center gap-4">
        <MoonSVG angle={moon.angle} />
        <div>
          <div className="font-display text-2xl text-pearl">{moon.name}</div>
          <div className="text-xs text-muted-foreground mt-1">{pct}% illuminated</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <Cell label="Next New" value={fmtDateTz(moon.nextNew, tz)} />
        <Cell label="Next Full" value={fmtDateTz(moon.nextFull, tz)} />
      </div>
    </div>
  );
}

function MoonSVG({ angle }: { angle: number }) {
  // Simple crescent based on phase angle
  const illum = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  const waxing = angle < 180;
  const r = 30;
  const rx = Math.abs(r * Math.cos((angle * Math.PI) / 180));
  return (
    <svg viewBox="-40 -40 80 80" className="h-16 w-16">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5c66b" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f5c66b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={38} fill="url(#moonGlow)" />
      <circle r={r} fill="#1a1830" />
      <path
        d={
          illum > 0.5
            ? `M 0 ${-r} A ${r} ${r} 0 1 ${waxing ? 1 : 0} 0 ${r} A ${rx} ${r} 0 1 ${waxing ? 0 : 1} 0 ${-r} Z`
            : `M 0 ${-r} A ${r} ${r} 0 0 ${waxing ? 1 : 0} 0 ${r} A ${rx} ${r} 0 0 ${waxing ? 1 : 0} 0 ${-r} Z`
        }
        fill="#f5f0e0"
      />
    </svg>
  );
}

function RetroCard({ retros }: { retros: ReturnType<typeof liveSkySnapshot>["retros"] }) {
  const active = retros.filter((r) => r.retrograde);
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5 text-gold" /> Retrogrades
      </div>
      {active.length === 0 ? (
        <div className="mt-4 text-sm text-muted-foreground">
          All personal planets are direct. Momentum favours forward motion.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {active.map((r) => (
            <li key={r.planet} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-pearl">
                <span className="text-gold text-lg">{PLANET_GLYPHS[r.planet]}</span> {r.planet} ℞
              </span>
              <span className="text-xs text-muted-foreground">
                turns direct {r.nextStation ? fmtDate(r.nextStation) : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 border-t border-white/5 pt-3 space-y-1.5">
        {retros.filter((r) => !r.retrograde).map((r) => (
          <div key={r.planet} className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{PLANET_GLYPHS[r.planet]} {r.planet} direct</span>
            <span>next ℞ {r.nextStation ? fmtDate(r.nextStation) : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IngressList({ ingresses }: { ingresses: ReturnType<typeof liveSkySnapshot>["ingresses"] }) {
  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <ArrowRightLeft className="h-3.5 w-3.5 text-gold" /> Upcoming Ingresses (90d)
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ingresses.map((ing) => (
          <div key={ing.planet + ing.when.toISOString()} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl text-gold">{PLANET_GLYPHS[ing.planet]}</span>
              <div>
                <div className="font-display text-lg text-pearl">{ing.planet}</div>
                <div className="text-[11px] text-muted-foreground">
                  {signName(ing.fromSign)} → <span className="gold-text">{signName(ing.toSign)}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {ing.when.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanetTable({ snap }: { snap: ReturnType<typeof liveSkySnapshot> }) {
  return (
    <section className="glass rounded-3xl p-6 overflow-x-auto">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-gold" /> Planetary Positions
      </div>
      <table className="mt-4 w-full text-sm">
        <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="text-left py-2">Planet</th>
            <th className="text-left">Sign</th>
            <th className="text-right">Longitude</th>
            <th className="text-right">Motion</th>
          </tr>
        </thead>
        <tbody>
          {snap.sky.tropicalPlanets.map((p) => {
            const sign = Math.floor(p.tropicalLongitude / 30);
            const deg = p.tropicalLongitude - sign * 30;
            return (
              <tr key={p.name} className="border-t border-white/5">
                <td className="py-2 flex items-center gap-2">
                  <span className="text-lg" style={{ color: PLANET_COLOR[p.name] }}>{PLANET_GLYPHS[p.name]}</span>
                  <span className="text-pearl">{p.name}</span>
                </td>
                <td>{signName(sign)} <span className="text-muted-foreground">{SIGN_GLYPH[sign]}</span></td>
                <td className="text-right font-mono">{deg.toFixed(2)}°</td>
                <td className="text-right">
                  {p.retrograde
                    ? <span className="text-red-300">Retrograde ℞</span>
                    : <span className="text-emerald-300/80">Direct</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-pearl">{value}</div>
    </div>
  );
}

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
