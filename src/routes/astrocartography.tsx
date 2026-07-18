import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { PremiumGate } from "@/components/premium-gate";
import {
  computeAstrocartography,
  acgInfluenceAt,
  PLANET_COLORS,
  PLANET_THEMES,
  ACG_CITIES,
  type AcgResult,
  type AcgLineKind,
} from "@/lib/astrocartography";
import {
  computeParans,
  computeLocalSpace,
  recommendCities,
  INTENTION_LABEL,
  type Intention,
} from "@/lib/astrocartography-deep";
import type { BirthInput } from "@/lib/progressions";
import type { PlanetName } from "@/lib/vedic";
import { Globe2, MapPin, Sparkles, Crosshair, Compass, Trophy } from "lucide-react";


export const Route = createFileRoute("/astrocartography")({
  component: () => (
    <PremiumGate featureName="Astrocartography">
      <AcgPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Astrocartography — TAROMAYA" },
      { name: "description", content: "Map your natal planets onto the world — see where the Sun rises on your Ascendant, where Jupiter culminates, and which locations amplify each theme in your life." },
    ],
  }),
});

const DEFAULT_BIRTH: BirthInput = {
  year: 1995, month: 6, day: 15, hour: 10, minute: 30,
  tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
};

const PLANETS: PlanetName[] = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Rahu","Ketu"];
const KINDS: AcgLineKind[] = ["MC","IC","ASC","DSC"];

const KIND_LABEL: Record<AcgLineKind, string> = {
  MC: "Culminating (MC)", IC: "Anti-culminating (IC)",
  ASC: "Rising (ASC)", DSC: "Setting (DSC)",
};

const MAP_W = 1000;
const MAP_H = 500;
const lonToX = (lon: number) => ((lon + 180) / 360) * MAP_W;
const latToY = (lat: number) => ((90 - lat) / 180) * MAP_H;

function AcgPage() {
  const [birth, setBirth] = useState<BirthInput>(DEFAULT_BIRTH);
  const [enabledPlanets, setEnabledPlanets] = useState<Set<PlanetName>>(
    new Set(["Sun","Moon","Venus","Jupiter","Saturn"]),
  );
  const [enabledKinds, setEnabledKinds] = useState<Set<AcgLineKind>>(new Set(KINDS));
  const [pin, setPin] = useState<{ lat: number; lon: number; name?: string } | null>(null);
  const [intent, setIntent] = useState<Intention>("love");
  const [showParans, setShowParans] = useState(true);
  const [showLocalSpace, setShowLocalSpace] = useState(false);

  const result: AcgResult = useMemo(() => computeAstrocartography(birth), [birth]);
  const parans = useMemo(
    () =>
      computeParans(result).filter(
        (p) =>
          enabledPlanets.has(p.a.planet) &&
          enabledPlanets.has(p.b.planet) &&
          enabledKinds.has(p.a.kind) &&
          enabledKinds.has(p.b.kind),
      ),
    [result, enabledPlanets, enabledKinds],
  );
  const localSpace = useMemo(
    () => (pin && showLocalSpace ? computeLocalSpace(birth, { lat: pin.lat, lon: pin.lon }) : []),
    [birth, pin, showLocalSpace],
  );
  const bestCities = useMemo(() => recommendCities(result, ACG_CITIES, intent, 5), [result, intent]);

  const influences = useMemo(() => {
    if (!pin) return [];
    return acgInfluenceAt(result, pin.lat, pin.lon, 3.5).filter(
      (h) => enabledPlanets.has(h.planet) && enabledKinds.has(h.kind),
    );
  }, [pin, result, enabledPlanets, enabledKinds]);


  const togglePlanet = (p: PlanetName) => {
    setEnabledPlanets((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });
  };
  const toggleKind = (k: AcgLineKind) => {
    setEnabledKinds((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  };

  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MAP_W;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_H;
    const lon = (x / MAP_W) * 360 - 180;
    const lat = 90 - (y / MAP_H) * 180;
    setPin({ lat, lon });
  };

  return (
    <PageShell
      eyebrow="Phase 14 · Relocational Astrology"
      title="Astrocartography"
      subtitle="Where in the world your natal planets sit on the angles. Standing on a line dramatically amplifies that planet's theme in your life."
    >
      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        {/* Left column: inputs + toggles + influence readout */}
        <div className="space-y-6">
          <GlassCard title="Birth data" desc="Ecliptic longitudes are computed at your birth moment; the map is planet-vs-Earth-rotation, so location shifts nothing.">
            <BirthForm value={birth} onChange={setBirth} />
          </GlassCard>

          <GlassCard title="Planets">
            <div className="grid grid-cols-3 gap-2">
              {PLANETS.map((p) => {
                const on = enabledPlanets.has(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlanet(p)}
                    className={[
                      "rounded-xl px-2 py-2 text-xs border transition-all",
                      on ? "bg-white/5 border-white/20 text-pearl" : "border-white/5 text-muted-foreground opacity-60",
                    ].join(" ")}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                      style={{ background: PLANET_COLORS[p] }}
                    />
                    {p}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {KINDS.map((k) => {
                const on = enabledKinds.has(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleKind(k)}
                    className={[
                      "rounded-xl px-2 py-2 text-[11px] border",
                      on ? "bg-white/5 border-white/20 text-pearl" : "border-white/5 text-muted-foreground opacity-60",
                    ].join(" ")}
                  >
                    {KIND_LABEL[k]}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard title="Anchor cities">
            <div className="flex flex-wrap gap-1.5">
              {ACG_CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setPin({ lat: c.lat, lon: c.lon, name: c.name })}
                  className="text-[11px] px-2 py-1 rounded-full border border-white/10 hover:bg-white/5 text-pearl/90"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard
            title={pin ? (pin.name ?? `${pin.lat.toFixed(2)}°, ${pin.lon.toFixed(2)}°`) : "Tap the map"}
            desc={pin ? "Lines within ~3° of this location — the closer the line, the stronger the influence." : "Click anywhere on the world map, or pick an anchor city."}
          >
            {pin ? (
              influences.length === 0 ? (
                <div className="text-sm text-muted-foreground">No active lines within orb here. Try zooming or a different location.</div>
              ) : (
                <ul className="space-y-2">
                  {influences.map((h, i) => {
                    const th = PLANET_THEMES[h.planet];
                    const isAngle = h.kind === "ASC" || h.kind === "MC";
                    return (
                      <li key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PLANET_COLORS[h.planet] }} />
                          <span className="font-medium text-pearl">{h.planet}</span>
                          <span className="text-[11px] uppercase tracking-widest text-gold/80">{h.kind}</span>
                          <span className="ml-auto text-[11px] text-muted-foreground">{h.distanceDeg.toFixed(1)}° off</span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">{th.keyword}</div>
                        <div className="mt-1.5 text-xs text-pearl/90">
                          {h.kind === "ASC" ? th.asc : h.kind === "MC" ? th.mc : isAngle ? th.mc : th.asc}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" /> Awaiting a location…
              </div>
            )}
          </GlassCard>
        </div>

        {/* Map */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="h-4 w-4 text-gold" />
            <div className="font-display text-lg text-pearl">World lines</div>
            <div className="ml-auto text-[11px] text-muted-foreground">Equirectangular · click to pin</div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-cosmic/50">
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="w-full h-auto block cursor-crosshair"
              onClick={onMapClick}
              role="img"
              aria-label="World astrocartography map"
            >
              {/* Ocean background */}
              <defs>
                <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a1230" />
                  <stop offset="100%" stopColor="#050a1a" />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="url(#ocean)" />

              {/* Grid */}
              <g stroke="rgba(255,255,255,0.06)" strokeWidth={0.6}>
                {Array.from({ length: 13 }, (_, i) => i * 30 - 180).map((lon) => (
                  <line key={"v" + lon} x1={lonToX(lon)} x2={lonToX(lon)} y1={0} y2={MAP_H} />
                ))}
                {Array.from({ length: 7 }, (_, i) => i * 30 - 90).map((lat) => (
                  <line key={"h" + lat} x1={0} x2={MAP_W} y1={latToY(lat)} y2={latToY(lat)} />
                ))}
                {/* Equator emphasised */}
                <line x1={0} x2={MAP_W} y1={latToY(0)} y2={latToY(0)} stroke="rgba(245,197,66,0.25)" />
              </g>

              {/* Lines */}
              {result.segments
                .filter((s) => enabledPlanets.has(s.planet) && enabledKinds.has(s.kind))
                .map((s, i) => {
                  const d = s.points
                    .map(([lon, lat], idx) => `${idx === 0 ? "M" : "L"} ${lonToX(lon).toFixed(1)} ${latToY(lat).toFixed(1)}`)
                    .join(" ");
                  const dash = s.kind === "IC" || s.kind === "DSC" ? "4 4" : "none";
                  return (
                    <path
                      key={i}
                      d={d}
                      fill="none"
                      stroke={PLANET_COLORS[s.planet]}
                      strokeWidth={s.kind === "MC" || s.kind === "ASC" ? 1.6 : 1.2}
                      strokeDasharray={dash}
                      opacity={0.85}
                    />
                  );
                })}

              {/* Anchor city dots */}
              {ACG_CITIES.map((c) => (
                <g key={c.name}>
                  <circle cx={lonToX(c.lon)} cy={latToY(c.lat)} r={2.2} fill="rgba(255,255,255,0.65)" />
                </g>
              ))}

              {/* Pin */}
              {pin && (
                <g>
                  <circle cx={lonToX(pin.lon)} cy={latToY(pin.lat)} r={6} fill="none" stroke="#F5C542" strokeWidth={1.6} />
                  <circle cx={lonToX(pin.lon)} cy={latToY(pin.lat)} r={2.4} fill="#F5C542" />
                </g>
              )}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="inline-block h-[2px] w-6 bg-white/60" /> Solid = MC / ASC (angular)</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-[2px] w-6 bg-white/30" style={{ borderTop: "2px dashed rgba(255,255,255,0.6)" }} /> Dashed = IC / DSC</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm">
              <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-gold" /><span className="font-medium text-pearl">How to read</span></div>
              <p className="text-muted-foreground">
                MC lines mark places where a planet was straight overhead at your birth — its career/reputation theme dominates there. IC lines mark the opposite meridian: home, roots, inner life. ASC lines run where the planet was rising, DSC where it was setting.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm">
              <div className="font-medium text-pearl mb-1">Orb</div>
              <p className="text-muted-foreground">A location within ~3° of a line still feels its pull; the closer, the sharper. Multiple planets crossing near one place is called a "power spot".</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}

function BirthForm({ value, onChange }: { value: BirthInput; onChange: (v: BirthInput) => void }) {
  const set = <K extends keyof BirthInput>(k: K, v: BirthInput[K]) => onChange({ ...value, [k]: v });
  const num = (v: string) => (v === "" ? 0 : Number(v));
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <Field label="Year"><input type="number" className="acg-input" value={value.year} onChange={(e) => set("year", num(e.target.value))} /></Field>
      <Field label="Month"><input type="number" min={1} max={12} className="acg-input" value={value.month} onChange={(e) => set("month", num(e.target.value))} /></Field>
      <Field label="Day"><input type="number" min={1} max={31} className="acg-input" value={value.day} onChange={(e) => set("day", num(e.target.value))} /></Field>
      <Field label="Hour"><input type="number" min={0} max={23} className="acg-input" value={value.hour} onChange={(e) => set("hour", num(e.target.value))} /></Field>
      <Field label="Minute"><input type="number" min={0} max={59} className="acg-input" value={value.minute} onChange={(e) => set("minute", num(e.target.value))} /></Field>
      <Field label="TZ (hours)"><input type="number" step={0.25} className="acg-input" value={value.tzOffsetHours} onChange={(e) => set("tzOffsetHours", num(e.target.value))} /></Field>
      <Field label="Latitude"><input type="number" step={0.0001} className="acg-input" value={value.latitude} onChange={(e) => set("latitude", num(e.target.value))} /></Field>
      <Field label="Longitude"><input type="number" step={0.0001} className="acg-input" value={value.longitude} onChange={(e) => set("longitude", num(e.target.value))} /></Field>
      <style>{`.acg-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:0.6rem;padding:.35rem .55rem;color:#F5F2E7;width:100%}`}</style>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
