import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { YANTRAS, MAGIC_SQUARES, type YantraKey } from "@/lib/yantra";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/yantra")({
  component: () => (
    <PremiumGate featureName="Yantra Studio">
      <YantraPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Yantra Studio — TAROMAYA" },
      { name: "description", content: "Sacred geometry generator — Sri Yantra and 9-graha yantras with mantras, gazing timer and classical magic squares." },
    ],
  }),
});

function SriYantra({ color }: { color: string }) {
  // Simplified Sri Yantra: 4 upward + 5 downward interlocking triangles inside
  // a lotus ring and outer bhupura. Not a full geomantic Sri Yantra, but a
  // recognisable meditation glyph.
  const s = 320;
  const c = s / 2;
  const R = 130;
  const tri = (rot: number, size: number, up: boolean) => {
    const points: string[] = [];
    for (let i = 0; i < 3; i++) {
      const ang = ((up ? -90 : 90) + i * 120 + rot) * (Math.PI / 180);
      points.push(`${c + Math.cos(ang) * size},${c + Math.sin(ang) * size}`);
    }
    return points.join(" ");
  };
  return (
    <svg viewBox={`0 0 ${s} ${s}`} className="w-full max-w-[360px] mx-auto">
      <defs>
        <radialGradient id="yg" cx="50%" cy="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={c-R-20} y={c-R-20} width={(R+20)*2} height={(R+20)*2} fill="none" stroke={color} strokeOpacity="0.5" />
      <circle cx={c} cy={c} r={R+8} fill="url(#yg)" stroke={color} strokeOpacity="0.6" />
      {/* 8-petal lotus ring */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a1 = (i / 16) * Math.PI * 2;
        const a2 = ((i + 1) / 16) * Math.PI * 2;
        const x1 = c + Math.cos(a1) * (R - 6);
        const y1 = c + Math.sin(a1) * (R - 6);
        const x2 = c + Math.cos(a2) * (R - 6);
        const y2 = c + Math.sin(a2) * (R - 6);
        const mx = c + Math.cos((a1 + a2) / 2) * (R + 6);
        const my = c + Math.sin((a1 + a2) / 2) * (R + 6);
        return <path key={i} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={color} strokeOpacity="0.35" />;
      })}
      {/* Interlocking triangles */}
      {[0.9, 0.72, 0.55, 0.38].map((k, i) => (
        <polygon key={`u${i}`} points={tri(0, R * k, true)} fill="none" stroke={color} strokeOpacity={0.7 - i * 0.1} strokeWidth={1.2} />
      ))}
      {[0.85, 0.68, 0.5, 0.34, 0.2].map((k, i) => (
        <polygon key={`d${i}`} points={tri(0, R * k, false)} fill="none" stroke={color} strokeOpacity={0.7 - i * 0.1} strokeWidth={1.2} />
      ))}
      {/* Bindu */}
      <circle cx={c} cy={c} r={4} fill={color} />
    </svg>
  );
}

function MagicSquare({ grid, color }: { grid: number[][]; color: string }) {
  const s = 320;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} className="w-full max-w-[360px] mx-auto">
      <rect x={20} y={20} width={s-40} height={s-40} fill="none" stroke={color} strokeOpacity="0.6" />
      {[1,2].map((i) => (
        <g key={i}>
          <line x1={20 + i*(s-40)/3} y1={20} x2={20 + i*(s-40)/3} y2={s-20} stroke={color} strokeOpacity="0.3" />
          <line x1={20} y1={20 + i*(s-40)/3} x2={s-20} y2={20 + i*(s-40)/3} stroke={color} strokeOpacity="0.3" />
        </g>
      ))}
      {grid.flatMap((row, r) =>
        row.map((n, k) => (
          <text key={`${r}-${k}`}
            x={20 + (k + 0.5) * (s-40)/3}
            y={20 + (r + 0.6) * (s-40)/3}
            textAnchor="middle" fontSize="42"
            className="font-display fill-pearl"
          >{n}</text>
        )),
      )}
    </svg>
  );
}

function YantraPage() {
  const [key, setKey] = useState<YantraKey>("Sri");
  const meta = YANTRAS[key];
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const tRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      tRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (tRef.current) {
      clearInterval(tRef.current);
      tRef.current = null;
    }
    return () => { if (tRef.current) clearInterval(tRef.current); };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <PageShell
      eyebrow="Yantra Studio"
      title="Sacred geometry for gaze meditation"
      subtitle="A generator of Sri Yantra and the 9 planetary yantras — each with its classical mantra, deity, and Vedic magic square. Set your gaze on the bindu and let the field open."
    >
      <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-10">
        {(Object.keys(YANTRAS) as YantraKey[]).map((k) => (
          <button key={k} onClick={() => setKey(k)}
            className={`glass rounded-xl py-3 px-2 text-center transition
              ${key === k ? "ring-2 ring-gold text-gold" : "text-pearl hover:text-gold"}`}>
            <div className="text-xl font-display">{YANTRAS[k].glyph}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{k}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassCard title={meta.name}>
          {key === "Sri" ? <SriYantra color={meta.color} /> : <MagicSquare grid={MAGIC_SQUARES[key]} color={meta.color} />}
        </GlassCard>

        <div className="space-y-4">
          <div className="glass rounded-3xl p-6 space-y-3">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Deity</div>
            <div className="font-display text-3xl gold-text">{meta.deity}</div>
            <div className="text-sm text-muted-foreground italic">{meta.benefit}</div>
            <div className="pt-3 border-t border-white/5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Mantra</div>
              <div className="text-lg text-pearl mt-1">{meta.mantra}</div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Trataka gaze timer</div>
            </div>
            <div className="font-display text-6xl text-center gold-text tracking-wider">{mm}:{ss}</div>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={() => setRunning((r) => !r)}
                className="glass rounded-xl px-4 py-2 text-sm text-pearl hover:text-gold flex items-center gap-2">
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "Pause" : "Begin"}
              </button>
              <button onClick={() => { setRunning(false); setSeconds(0); }}
                className="glass rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-pearl flex items-center gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Fix your gaze on the bindu without blinking. Recommended: 11 minutes at dawn or dusk.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
