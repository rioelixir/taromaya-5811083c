import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import {
  DIRECTIONS, DIR_META, ROOM_IDEAL, analyzeVastu,
  type Direction, type Room, type Placement,
} from "@/lib/vastu";
import { Compass, Home, AlertTriangle, Sparkles, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/vastu")({
  component: () => (
    <PremiumGate featureName="Vastu Compass">
      <VastuPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Vastu Compass — TAROMAYA" },
      {
        name: "description",
        content:
          "Analyze your home's Vastu Shastra alignment with an interactive compass, room-by-room diagnosis, dosha score and personalised remedies.",
      },
    ],
  }),
});

const ROOMS: Room[] = [
  "Entrance","Kitchen","Master Bedroom","Children Bedroom",
  "Pooja Room","Living Room","Study","Toilet",
  "Water Tank","Cash Locker","Staircase","Dining",
];

const DEFAULT_PLACEMENTS: Placement[] = [
  { room: "Entrance", direction: "N" },
  { room: "Kitchen", direction: "SE" },
  { room: "Master Bedroom", direction: "SW" },
  { room: "Pooja Room", direction: "NE" },
  { room: "Toilet", direction: "NW" },
  { room: "Living Room", direction: "E" },
];

function CompassRose({ facing, highlight }: { facing: Direction; highlight?: Direction }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      <defs>
        <radialGradient id="vastuBg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(212,175,55,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#vastuBg)" stroke="rgba(212,175,55,0.35)" />
      <circle cx={cx} cy={cy} r={r * 0.66} fill="none" stroke="rgba(255,255,255,0.08)" />
      <circle cx={cx} cy={cy} r={r * 0.33} fill="none" stroke="rgba(255,255,255,0.06)" />
      {DIRECTIONS.map((d) => {
        const meta = DIR_META[d];
        const ang = (meta.angle - 90) * (Math.PI / 180);
        const x = cx + Math.cos(ang) * (r - 22);
        const y = cy + Math.sin(ang) * (r - 22);
        const isFacing = d === facing;
        const isHi = d === highlight;
        return (
          <g key={d}>
            {isHi && (
              <circle cx={x} cy={y} r={22} fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.6)" />
            )}
            <text
              x={x} y={y}
              textAnchor="middle" dominantBaseline="central"
              className={`font-display ${isFacing ? "fill-gold" : "fill-pearl/80"}`}
              fontSize={isFacing ? 16 : 13}
            >
              {d}
            </text>
            <text
              x={x} y={y + 14}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={8}
            >
              {meta.deity}
            </text>
          </g>
        );
      })}
      {/* Facing arrow */}
      {(() => {
        const ang = (DIR_META[facing].angle - 90) * (Math.PI / 180);
        const x2 = cx + Math.cos(ang) * (r - 46);
        const y2 = cy + Math.sin(ang) * (r - 46);
        return (
          <>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(212,175,55,0.9)" strokeWidth={2} />
            <circle cx={x2} cy={y2} r={5} fill="#D4AF37" />
            <circle cx={cx} cy={cy} r={5} fill="#D4AF37" />
          </>
        );
      })()}
    </svg>
  );
}

function VastuPage() {
  const [facing, setFacing] = useState<Direction>("N");
  const [placements, setPlacements] = useState<Placement[]>(DEFAULT_PLACEMENTS);
  const [hover, setHover] = useState<Direction | undefined>(undefined);

  const report = useMemo(() => analyzeVastu(facing, placements), [facing, placements]);

  function updatePlacement(idx: number, dir: Direction) {
    setPlacements((prev) => prev.map((p, i) => (i === idx ? { ...p, direction: dir } : p)));
  }

  function toggleRoom(room: Room) {
    setPlacements((prev) => {
      const existing = prev.findIndex((p) => p.room === room);
      if (existing >= 0) return prev.filter((_, i) => i !== existing);
      return [...prev, { room, direction: ROOM_IDEAL[room][0] ?? "N" }];
    });
  }

  return (
    <PageShell
      eyebrow="Vastu Shastra"
      title="The Vastu Purusha of your home"
      subtitle="An interactive Ashta-Dikpalaka compass with room-by-room dosha diagnosis, an alignment score and personalised remedies drawn from classical Vastu Shastra."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <GlassCard title="Compass">
          <CompassRose facing={facing} highlight={hover} />
          <div className="mt-4">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Home is facing
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setFacing(d)}
                  onMouseEnter={() => setHover(d)}
                  onMouseLeave={() => setHover(undefined)}
                  className={`rounded-xl px-2 py-2 text-xs font-display transition
                    ${facing === d
                      ? "bg-gradient-to-br from-gold/40 to-amber-300/20 ring-1 ring-gold text-gold"
                      : "glass text-pearl hover:ring-1 hover:ring-gold/40"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Vastu score</div>
                <div className="mt-1 font-display text-6xl gold-text">
                  {report.score}<span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{report.facingNote}</p>
              </div>
              <div className="h-16 w-16 rounded-full grid place-items-center gold-border">
                <Home className="h-6 w-6 text-gold" />
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-300 to-emerald-400 transition-all"
                style={{ width: `${report.score}%` }}
              />
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Rooms</div>
            </div>
            <div className="grid gap-2 mb-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Include rooms</div>
              <div className="flex flex-wrap gap-2">
                {ROOMS.map((r) => {
                  const active = placements.some((p) => p.room === r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRoom(r)}
                      className={`text-xs px-2.5 py-1 rounded-full transition
                        ${active ? "bg-gold/20 text-gold ring-1 ring-gold/60" : "glass text-muted-foreground hover:text-pearl"}`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2">
              {placements.map((p, i) => (
                <div key={p.room} className="flex items-center gap-3">
                  <span className="text-sm text-pearl w-40 truncate">{p.room}</span>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {DIRECTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => updatePlacement(i, d)}
                        onMouseEnter={() => setHover(d)}
                        onMouseLeave={() => setHover(undefined)}
                        className={`text-[10px] font-display px-2 py-1 rounded-md transition
                          ${p.direction === d
                            ? "bg-gradient-to-br from-gold/40 to-amber-300/20 text-gold ring-1 ring-gold"
                            : "text-muted-foreground/70 hover:text-pearl"}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {report.findings.map((f, i) => {
          const Icon = f.status === "Dosha" ? AlertTriangle : f.status === "Ideal" ? CheckCircle2 : Circle;
          const tone = f.status === "Dosha" ? "text-rose-300" : f.status === "Ideal" ? "text-emerald-300" : "text-muted-foreground";
          return (
            <div key={i} className="glass rounded-2xl p-4 flex items-start gap-3">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tone}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-pearl font-medium">{f.room}</span>
                  <span className={`text-[10px] uppercase tracking-widest ${tone}`}>
                    {f.direction} · {f.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {DIR_META[f.direction].deity} · {DIR_META[f.direction].element}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/90 mt-1">{f.note}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-gold" />
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Remedies</div>
        </div>
        <ul className="space-y-2 text-sm text-pearl">
          {report.remedies.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gold">•</span>
              <span className="text-muted-foreground/90">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
