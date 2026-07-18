import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli, type KundliChart } from "@/lib/vedic";
import { REMEDY_CATALOG, prioritiseRemedies, type PlanetKey } from "@/lib/remedies";
import { prescribeGemstone, rudrakshaFor, yantraFor, planJapa, GRAMS_PER_RATTI } from "@/lib/remedies-deep";
import { Flame, Sparkles, Gem, Coins, Circle, ScrollText } from "lucide-react";

export const Route = createFileRoute("/remedies")({
  component: () => (<PremiumGate featureName="Remedies"><RemediesPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Vedic Remedies — TAROMAYA" },
      { name: "description", content: "Personalised Vedic upayas — mantras, gemstones, yantras, charity, and fasting tailored to your chart's afflicted planets." },
    ],
  }),
});

const PLANETS: PlanetKey[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];

function RemediesPage() {
  const [birth, setBirth] = useState({
    date: "1990-01-15", time: "10:30", tz: "5.5",
    lat: "28.6139", lon: "77.2090", place: "New Delhi",
  });
  const [showChart, setShowChart] = useState(false);
  const [selected, setSelected] = useState<PlanetKey>("Saturn");

  const chart: KundliChart | null = useMemo(() => {
    if (!showChart) return null;
    const [y, m, d] = birth.date.split("-").map(Number);
    const [hh, mm] = birth.time.split(":").map(Number);
    return computeKundli({
      year: y, month: m, day: d, hour: hh, minute: mm,
      tzOffsetHours: Number(birth.tz),
      latitude: Number(birth.lat), longitude: Number(birth.lon),
    });
  }, [birth, showChart]);

  const priority = useMemo(() => (chart ? prioritiseRemedies(chart) : []), [chart]);
  const remedy = REMEDY_CATALOG[selected];

  return (
    <PageShell
      eyebrow="Vedic Remedies"
      title="Upayas for your chart"
      subtitle="Mantras · Gemstones · Yantras · Charity · Fasting — the classical toolkit to soften afflicted grahas."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <GlassCard title="Your birth data" desc="Optional — used to prioritise which planets need remedies most.">
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Date
              <input type="date" value={birth.date} onChange={(e) => setBirth({...birth, date: e.target.value})}
                className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Time
                <input type="time" value={birth.time} onChange={(e) => setBirth({...birth, time: e.target.value})}
                  className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
              </label>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                TZ (h)
                <input value={birth.tz} onChange={(e) => setBirth({...birth, tz: e.target.value})}
                  className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Latitude
                <input value={birth.lat} onChange={(e) => setBirth({...birth, lat: e.target.value})}
                  className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
              </label>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Longitude
                <input value={birth.lon} onChange={(e) => setBirth({...birth, lon: e.target.value})}
                  className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
              </label>
            </div>
            <button
              onClick={() => setShowChart(true)}
              className="mt-2 rounded-2xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-2.5 hover:brightness-110"
            >
              Analyse my chart
            </button>
          </div>
        </GlassCard>

        <GlassCard title="Priority planets" desc={priority.length ? "Your chart flags these grahas for attention." : "Universal remedies — pick any planet below."}>
          {priority.length ? (
            <div className="space-y-2">
              {priority.slice(0, 4).map((p) => (
                <button
                  key={p.planet}
                  onClick={() => setSelected(p.planet)}
                  className={`w-full text-left rounded-xl px-4 py-3 border transition ${
                    selected === p.planet ? "border-gold/60 bg-gold/[0.06]" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg text-pearl">{p.planet}</span>
                    <span className="text-[10px] uppercase tracking-widest text-gold/80">Priority · {p.score}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.reasons.join(" · ") || "Baseline strength"}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Enter your birth details on the left, or choose any planet below to explore its universal upayas.</div>
          )}
        </GlassCard>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {PLANETS.map((p) => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              selected === p ? "border-gold/60 bg-gold/[0.08] text-pearl" : "border-white/10 text-muted-foreground hover:text-pearl"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
            <Sparkles className="h-3.5 w-3.5" /> Mantra & Deity
          </div>
          <div className="mt-4 space-y-4">
            <Row label="Deity" value={remedy.deity} />
            <Row label="Beej Mantra" value={remedy.beejMantra} mono />
            <Row label="Daily japa" value={`${remedy.beejCount.toLocaleString()} times (over ${remedy.duration})`} />
            <Row label="Vedic Mantra" value={remedy.vedicMantra} />
            <Row label="Temple" value={remedy.temple} />
            <Row label="Yantra" value={remedy.yantra} />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
            <Gem className="h-3.5 w-3.5" /> Gemstone
          </div>
          <div className="mt-4 space-y-4">
            <Row label="Primary" value={remedy.gemstone.primary} />
            <Row label="Substitute" value={remedy.gemstone.substitute} />
            <div className="grid grid-cols-3 gap-3">
              <Mini label="Metal" value={remedy.gemstone.metal} />
              <Mini label="Finger" value={remedy.gemstone.finger} />
              <Mini label="Wear" value={remedy.gemstone.day} />
            </div>
            <Row label="Colour" value={remedy.color} />
            <Row label="Day" value={remedy.day} />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
            <Flame className="h-3.5 w-3.5" /> Fasting & diet
          </div>
          <div className="mt-4 space-y-4">
            <Row label="Fast" value={remedy.fast} />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Food</div>
              <ul className="list-disc list-inside text-sm text-pearl/90 space-y-1">
                {remedy.food.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Behaviour</div>
              <ul className="list-disc list-inside text-sm text-pearl/90 space-y-1">
                {remedy.behaviour.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
            <Coins className="h-3.5 w-3.5" /> Charity (Daan)
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Items to donate</div>
              <div className="flex flex-wrap gap-2">
                {remedy.charity.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full text-xs border border-white/10 bg-white/[0.02] text-pearl">{c}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">To whom</div>
              <ul className="list-disc list-inside text-sm text-pearl/90 space-y-1">
                {remedy.donation.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>

      <DeepRemedyPanel planet={selected} />
    </PageShell>
  );
}

function DeepRemedyPanel({ planet }: { planet: PlanetKey }) {
  const [bodyWeight, setBodyWeight] = useState<number>(65);
  const [deficit, setDeficit] = useState<number>(0.5);
  const [dailyMalas, setDailyMalas] = useState<number>(2);

  const gem = useMemo(
    () => prescribeGemstone(planet, { bodyWeightKg: bodyWeight, deficit }),
    [planet, bodyWeight, deficit],
  );
  const rudras = useMemo(() => rudrakshaFor(planet), [planet]);
  const yantra = useMemo(() => yantraFor(planet), [planet]);
  const japa = useMemo(
    () =>
      planJapa({
        totalJapa: yantra?.japaCount ?? 11000,
        dailyMalas,
        planet,
      }),
    [yantra, dailyMalas, planet],
  );

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Gemstone Ratti */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Gem className="w-4 h-4 text-gold" />
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Gemstone · Ratti Calculator
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Body weight (kg): {bodyWeight}
            </div>
            <input
              type="range" min={30} max={140} value={bodyWeight}
              onChange={(e) => setBodyWeight(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Planetary deficit: {(deficit * 100).toFixed(0)}%
            </div>
            <input
              type="range" min={0} max={1} step={0.05} value={deficit}
              onChange={(e) => setDeficit(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <div className="text-lg font-semibold text-pearl">{gem.gem}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {gem.metal} · {gem.finger} finger · {gem.day} · {gem.time}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Mini label="Ratti" value={String(gem.ratti)} />
            <Mini label="Carats" value={String(gem.carats)} />
            <Mini label="Grams" value={String(gem.grams)} />
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Classical range {gem.minRatti}-{gem.maxRatti} ratti · 1 ratti = {GRAMS_PER_RATTI} g
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Activation
            </div>
            <ol className="text-sm text-pearl/85 space-y-1 list-decimal list-inside">
              {gem.activationRitual.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
            <div className="mt-2 text-xs text-gold/90 font-mono">
              {gem.mantra} × {gem.mantraCount}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Rudraksha */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Circle className="w-4 h-4 text-gold" />
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Rudraksha · Mukhi Mapping
          </div>
        </div>
        <div className="space-y-3">
          {rudras.map((r) => (
            <div key={r.mukhi} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-baseline gap-2">
                <div className="text-lg text-pearl font-semibold">{r.mukhi}-Mukhi</div>
                <div className="text-xs text-muted-foreground">{r.ruling}</div>
                <div className="ml-auto text-[10px] uppercase tracking-widest text-gold">
                  {r.wearOn}
                </div>
              </div>
              <div className="mt-1 text-sm text-pearl/85">{r.benefit}</div>
              <div className="mt-2 text-xs font-mono text-gold/90">
                {r.mantra} × {r.count}
              </div>
            </div>
          ))}
          {rudras.length === 0 && (
            <div className="text-sm text-muted-foreground">No specific mukhi mapped.</div>
          )}
        </div>
      </GlassCard>

      {/* Yantra */}
      {yantra && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-4 h-4 text-gold" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Yantra
            </div>
          </div>
          <div className="text-lg text-pearl font-semibold">{yantra.name}</div>
          <div className="text-sm text-pearl/85 mt-1">{yantra.purpose}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Mini label="Metal" value={yantra.metal} />
            <Mini label="Face" value={yantra.faceDirection} />
            <Mini label="Install" value={yantra.installOn} />
            <Mini label="Japa" value={yantra.japaCount.toLocaleString()} />
          </div>
          <div className="mt-3 text-xs font-mono text-gold/90">
            {yantra.activationMantra}
          </div>
        </GlassCard>
      )}

      {/* Japa scheduler */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gold" />
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Japa Sadhana Plan
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          Daily malas (108 beads each): {dailyMalas}
        </div>
        <input
          type="range" min={1} max={16} value={dailyMalas}
          onChange={(e) => setDailyMalas(Number(e.target.value))}
          className="w-full accent-gold"
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Mini label="Total japa" value={japa.totalJapa.toLocaleString()} />
          <Mini label="Daily japa" value={japa.dailyJapa.toLocaleString()} />
          <Mini label="Days to complete" value={String(japa.daysToComplete)} />
          <Mini label="Minutes / day" value={`~${japa.minutesPerDay}`} />
          <Mini label="Best time" value={japa.bestTime} />
          <Mini label="Face" value={japa.bestDirection} />
        </div>
      </GlassCard>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-pearl ${mono ? "font-mono text-sm" : "text-sm"}`}>{value}</div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-pearl">{value}</div>
    </div>
  );
}
