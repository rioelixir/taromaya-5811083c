import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import * as A from "astronomy-engine";
import { PageShell, GlassCard } from "@/components/page-shell";
import { PlacePicker } from "@/components/place-picker";
import { SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import { computeWesternChart } from "@/lib/western";
import { dms } from "@/lib/western-tables";
import { moonPhaseCalendar } from "@/lib/western-predictive";

export const Route = createFileRoute("/calculators")({
  component: CalculatorsPage,
  head: () => ({
    meta: [
      { title: "Astrology Calculators — TAROMAYA" },
      { name: "description", content: "Rising sign calculator, Moon phase calculator, love compatibility and the classic Flames calculator, all computed from real ephemeris data." },
      { property: "og:title", content: "Astrology Calculators — TAROMAYA" },
      { property: "og:description", content: "Rising sign, Moon phase, love compatibility and Flames — calculated precisely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FIELD = "mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-base text-pearl outline-none focus:border-gold/50";
const LABEL = "block text-[11px] uppercase tracking-widest text-muted-foreground";
const BTN = "rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-3 text-sm font-medium text-primary-foreground min-h-[44px]";

function CalculatorsPage() {
  return (
    <PageShell
      eyebrow="Calculators"
      title="Precise calculators"
      subtitle="Rising sign, Moon phase, love compatibility and the classic Flames game — each computed, not guessed."
      aiModule="Calculators"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <AscendantCalculator />
        <MoonPhaseCalculator />
        <LoveCalculator />
        <FlamesCalculator />
      </div>
    </PageShell>
  );
}

// ── Rising sign ─────────────────────────────────────────────────────────────
function AscendantCalculator() {
  const [date, setDate] = useState("1995-06-15");
  const [time, setTime] = useState("07:45");
  const [place, setPlace] = useState({ lat: 28.6139, lon: 77.209, tz: 5.5, label: "New Delhi, India" });
  const [out, setOut] = useState<{ asc: number; mc: number; sun: number; moon: number } | null>(null);

  const run = () => {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const chart = computeWesternChart({
      year: y, month: m, day: d, hour: hh, minute: mm,
      tzOffsetHours: place.tz, latitude: place.lat, longitude: place.lon,
    });
    setOut({
      asc: chart.tropicalAscendant, mc: chart.midheaven,
      sun: chart.tropicalPlanets.find((p) => p.name === "Sun")!.tropicalLongitude,
      moon: chart.tropicalPlanets.find((p) => p.name === "Moon")!.tropicalLongitude,
    });
  };

  const row = (label: string, lon: number) => {
    const s = Math.floor(lon / 30);
    return (
      <div key={label} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm text-pearl">{SIGN_GLYPHS[s]} {SIGN_NAMES[s]} <span className="font-mono text-xs">{dms(lon - s * 30).text}</span></span>
      </div>
    );
  };

  return (
    <GlassCard title="Rising sign calculator">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL}>Date of birth (YYYY-MM-DD)
          <input value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
        </label>
        <label className={LABEL}>Time of birth (24 hour)
          <input value={time} onChange={(e) => setTime(e.target.value)} className={FIELD} />
        </label>
      </div>
      <div className="mt-3">
        <PlacePicker
          value={{ lat: String(place.lat), lon: String(place.lon), tz: String(place.tz), place: place.label }}
          onChange={(p) => setPlace({ lat: Number(p.lat), lon: Number(p.lon), tz: Number(p.tz), label: p.place ?? "" })}
        />
      </div>
      <button onClick={run} className={`${BTN} mt-4`}>Calculate rising sign</button>
      {out && (
        <div className="mt-4 space-y-2">
          {row("Rising sign (Ascendant)", out.asc)}
          {row("Midheaven", out.mc)}
          {row("Sun sign", out.sun)}
          {row("Moon sign", out.moon)}
          <p className="text-xs text-muted-foreground">
            The rising sign changes roughly every two hours, so an accurate birth time matters more here than anywhere else in the chart.
          </p>
        </div>
      )}
    </GlassCard>
  );
}

// ── Moon phase ──────────────────────────────────────────────────────────────
function MoonPhaseCalculator() {
  const today = new Date();
  const [date, setDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  );
  const result = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    const when = new Date(y, m - 1, d, 12);
    const angle = A.MoonPhase(when);
    const illum = A.Illumination(A.Body.Moon, when).phase_fraction;
    const cal = moonPhaseCalendar(when, 1);
    const lastNew = A.SearchMoonPhase(0, new Date(when.getTime() - 32 * 86400000), 34);
    const age = lastNew ? (when.getTime() - lastNew.date.getTime()) / 86400000 : 0;
    const next = moonPhaseCalendar(when, 30).changes.slice(0, 4);
    return { angle, illum, name: cal.days[0].phaseName, age, next };
  }, [date]);

  return (
    <GlassCard title="Moon phase calculator">
      <label className={LABEL}>Date (YYYY-MM-DD)
        <input value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
      </label>
      {result && (
        <div className="mt-4 space-y-2">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-display text-xl gold-text">{result.name}</div>
            <div className="text-sm text-muted-foreground">
              Illumination {Math.round(result.illum * 100)} percent · phase angle {result.angle.toFixed(1)} degrees · Moon age {result.age.toFixed(1)} days
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Next exact phase changes</div>
          {result.next.map((c, i) => (
            <div key={i} className="flex justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span>{c.name}</span>
              <span className="text-muted-foreground font-mono">
                {c.date.getFullYear()}-{String(c.date.getMonth() + 1).padStart(2, "0")}-{String(c.date.getDate()).padStart(2, "0")} {String(c.date.getHours()).padStart(2, "0")}:{String(c.date.getMinutes()).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ── Love compatibility (sign element and modality based) ────────────────────
const ELEMENT_OF = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];
const MODE_OF = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2];

function loveScore(a: number, b: number) {
  const sameElement = ELEMENT_OF[a] === ELEMENT_OF[b];
  const compatible =
    (ELEMENT_OF[a] === 0 && ELEMENT_OF[b] === 2) || (ELEMENT_OF[a] === 2 && ELEMENT_OF[b] === 0) ||
    (ELEMENT_OF[a] === 1 && ELEMENT_OF[b] === 3) || (ELEMENT_OF[a] === 3 && ELEMENT_OF[b] === 1);
  const sameMode = MODE_OF[a] === MODE_OF[b];
  let dist = Math.abs(a - b) % 12;
  if (dist > 6) dist = 12 - dist;
  let score = 55;
  if (sameElement) score += 22;
  else if (compatible) score += 16;
  else score -= 6;
  if (dist === 0) score += 6;
  if (dist === 4) score += 10;
  if (dist === 6) score += 4;
  if (dist === 3) score -= 10;
  if (dist === 1) score -= 4;
  if (sameMode && dist !== 0) score -= 6;
  score = Math.max(28, Math.min(97, score));
  const note = dist === 6
    ? "An opposition pairing: strong attraction built on complementary opposites. It works when both stop trying to convert the other."
    : dist === 4
      ? "A trine pairing: easy temperament match, low friction, and a shared sense of pace."
      : dist === 3
        ? "A square pairing: high energy and real friction. Growth is genuine here, but it demands explicit agreements."
        : dist === 0
          ? "A same-sign pairing: instant recognition, with the risk that both share the same blind spot."
          : "A mixed pairing: workable, with success resting on communication habits rather than natural ease.";
  return { score, note };
}

function LoveCalculator() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(4);
  const res = loveScore(a, b);
  return (
    <GlassCard title="Love compatibility calculator">
      <div className="grid gap-3 sm:grid-cols-2">
        {[[a, setA, "Your sign"], [b, setB, "Their sign"]].map(([val, set, label], i) => (
          <label key={i} className={LABEL}>{label as string}
            <select value={val as number} onChange={(e) => (set as (n: number) => void)(Number(e.target.value))} className={FIELD}>
              {SIGN_NAMES.map((s, idx) => <option key={s} value={idx}>{s}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-white/5 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl gold-text">{res.score} percent</span>
          <span className="text-xs text-muted-foreground">{SIGN_NAMES[a]} with {SIGN_NAMES[b]}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${res.score}%` }} />
        </div>
        <p className="mt-3 text-sm text-pearl/90">{res.note}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Sign to sign comparison is a starting point. For a full reading, cast both charts and compare Moon, Venus and the seventh house.
        </p>
      </div>
    </GlassCard>
  );
}

// ── Flames ──────────────────────────────────────────────────────────────────
const FLAMES = ["Friends", "Lovers", "Affectionate", "Marriage", "Enemies", "Siblings"] as const;
const FLAMES_NOTE: Record<string, string> = {
  Friends: "A steady, low-pressure bond that lasts because nothing is being forced.",
  Lovers: "Strong mutual attraction and an emotionally charged connection.",
  Affectionate: "Warm, caring closeness — protective rather than romantic.",
  Marriage: "A long-term, commitment-shaped connection.",
  Enemies: "Friction and competition; the relationship needs distance or honesty.",
  Siblings: "Familiar, teasing loyalty of the kind family shares.",
};

function flames(n1: string, n2: string) {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "").split("");
  const a = clean(n1), b = clean(n2);
  for (let i = 0; i < a.length; i++) {
    const j = b.indexOf(a[i]);
    if (j >= 0) { a[i] = ""; b[j] = ""; }
  }
  const count = a.filter(Boolean).length + b.filter(Boolean).length;
  if (count === 0) return null;
  const letters = [...FLAMES];
  let idx = 0;
  while (letters.length > 1) {
    idx = (idx + count - 1) % letters.length;
    letters.splice(idx, 1);
  }
  return { result: letters[0], count };
}

function FlamesCalculator() {
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const out = n1.trim() && n2.trim() ? flames(n1, n2) : null;
  return (
    <GlassCard title="Flames calculator">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL}>First name
          <input value={n1} onChange={(e) => setN1(e.target.value)} placeholder="Riaa" className={FIELD} />
        </label>
        <label className={LABEL}>Second name
          <input value={n2} onChange={(e) => setN2(e.target.value)} placeholder="Arjun" className={FIELD} />
        </label>
      </div>
      {out ? (
        <div className="mt-4 rounded-xl bg-white/5 p-4">
          <div className="font-display text-2xl gold-text">{out.result}</div>
          <div className="text-xs text-muted-foreground">Unmatched letters counted: {out.count}</div>
          <p className="mt-2 text-sm text-pearl/90">{FLAMES_NOTE[out.result]}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {n1.trim() && n2.trim()
            ? "Every letter cancelled out, so the classic game gives no result. Change a spelling and try again."
            : "Enter both names to play the classic Flames game."}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Flames is a traditional letter game, offered for fun rather than as an astrological judgement.</p>
    </GlassCard>
  );
}
