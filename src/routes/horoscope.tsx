import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Explain } from "@/components/explain";
import { ConfidenceNote } from "@/components/confidence-note";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import { CHINESE_ANIMALS, CHINESE_TRAITS, CHINESE_COMPATIBLE, chineseSign } from "@/lib/chinese-zodiac";
import { aiReading } from "@/lib/ai-cache";
import { analyseSadeSati } from "@/lib/dosha-windows";
import { Loader2, Sparkles, Flame, Moon as MoonIcon, Star } from "lucide-react";
import {
  tarotCardOfTheDay, cardGuidance, moonPhaseInfo, sunSign, moonSign,
  nakshatraOfDay, rashiphalScores, currentTransitsIntoRashi, planetsFromMoon,
  chineseYearForecast, rashiLord, SIGN_ELEMENT, SIGN_MODALITY, SIGN_RULER,
} from "@/lib/horoscope";
import { RASHIS, NAKSHATRAS } from "@/lib/vedic";
import { SignDomainPanel, ChineseDomainPanel, NumeroscopePanel } from "@/components/horoscope-domains-panel";


export const Route = createFileRoute("/horoscope")({
  component: () => (<PremiumGate featureName="Horoscope"><HoroscopePage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Horoscope — Daily, Weekly, Monthly, Yearly · Vedic Rashiphal · Nakshatra · Chinese — TAROMAYA" },
      { name: "description", content: "Daily/Weekly/Monthly/Yearly horoscope, Vedic Rashiphal with Sade Sati status, Nakshatra of the day, and Chinese year forecast." },
    ],
  }),
});

type Period = "Daily" | "Weekly" | "Monthly" | "Yearly";
const PERIODS: Period[] = ["Daily", "Weekly", "Monthly", "Yearly"];
type Tab = "western" | "vedic" | "nakshatra" | "chinese" | "numeroscope";

function seedFor(sign: string, period: Period, date: Date): number {
  const key = `${sign}-${period}-${date.getFullYear()}-${
    period === "Daily" ? date.getMonth() + "-" + date.getDate()
    : period === "Weekly" ? Math.floor(date.getDate() / 7)
    : period === "Monthly" ? date.getMonth()
    : 0
  }`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}
const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
};

const LUCKY_COLORS = ["Gold","Deep Violet","Emerald","Sapphire Blue","Coral","Pearl White","Rose Quartz","Silver","Ruby","Turquoise","Onyx","Ivory"];
const DIRECTIONS = ["North","North-East","East","South-East","South","South-West","West","North-West"];
const GEMSTONES = ["Ruby","Pearl","Coral","Emerald","Yellow Sapphire","Diamond","Blue Sapphire","Hessonite","Cat's Eye"];

const SCORE_KEYS = ["Love","Career","Health","Wealth","Emotions","Luck"] as const;

function HoroscopePage() {
  const [tab, setTab] = useState<Tab>("western");
  const [period, setPeriod] = useState<Period>("Daily");
  const [sign, setSign] = useState<string | null>(null);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState<string | null>(null);

  const ai = useServerFn(aiReading);
  const today = useMemo(() => new Date(), []);

  const cacheKey = (s: string, p: Period, mode: string) => `${mode}-${p}-${s}-${today.toDateString()}`;

  const luck = (s: string) => {
    const seed = seedFor(s, period, today);
    const r = rng(seed);
    const scores: Record<string, number> = {};
    for (const k of SCORE_KEYS) scores[k] = Math.round(50 + r() * 50);
    return {
      scores,
      luckyNumber: Math.floor(r() * 99) + 1,
      luckyColor: LUCKY_COLORS[Math.floor(r() * LUCKY_COLORS.length)],
      direction: DIRECTIONS[Math.floor(r() * 8)],
      gemstone: GEMSTONES[Math.floor(r() * GEMSTONES.length)],
    };
  };

  const generateFor = async (s: string, mode: string, extra: string): Promise<string> => {
    const key = cacheKey(s, period, mode);
    if (readings[key]) return readings[key];
    const l = luck(s);
    const res = await ai({
      data: {
        system: "You are a poetic modern astrologer. Write elegant, uplifting, specific horoscopes. Markdown allowed. Never hedged.",
        prompt: `Write the ${period.toLowerCase()} ${mode === "vedic" ? "Vedic moon-sign (Rashiphal)" : "sun-sign"} horoscope for ${s} for ${today.toDateString()}.
Include sections: Overview, Love & Relationships, Career & Money, Health & Wellbeing, Guidance.
${extra}
Reference: lucky number ${l.luckyNumber}, colour ${l.luckyColor}, direction ${l.direction}, gemstone ${l.gemstone}.
About 380 words.`,
      },
    });
    setReadings((prev) => ({ ...prev, [key]: res.text }));
    return res.text;
  };

  const generateReading = async (s: string, mode: string, extra = "") => {
    setSign(s); setLoading(true);
    try { await generateFor(s, mode, extra); } finally { setLoading(false); }
  };

  const currentMode = tab === "vedic" ? "vedic" : "western";
  const currentReading = sign ? readings[cacheKey(sign, period, currentMode)] : null;

  return (
    <PageShell
      eyebrow="Horoscope"
      title="Read the sky"
      subtitle="Western Sun-sign, Vedic Rashiphal, Nakshatra of the day, and Chinese year forecast — Daily / Weekly / Monthly / Yearly."
    >
      <CosmicRibbon today={today} onPickWestern={(s) => { setTab("western"); generateReading(s, "western"); }} onPickVedic={(s) => { setTab("vedic"); generateReading(s, "vedic", "Include Nakshatra & Moon influence."); }} />

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["western","vedic","nakshatra","chinese","numeroscope"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
              tab === t ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground hover:text-pearl"
            }`}
          >
            {t === "western" ? "Western" : t === "vedic" ? "Vedic Rashiphal" : t === "nakshatra" ? "Nakshatra" : t === "chinese" ? "Chinese" : "Numeroscope"}
          </button>
        ))}

      </div>

      {(tab === "western" || tab === "vedic") && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                  period === p ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground hover:text-pearl"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={async () => {
              setBatchLoading("all");
              try {
                const signs = tab === "vedic" ? RASHIS : SIGN_NAMES;
                for (const s of signs) {
                  setBatchLoading(s);
                  await generateFor(s, currentMode, tab === "vedic" ? "Include Vedic Moon influence." : "");
                }
              } finally { setBatchLoading(null); }
            }}
            disabled={batchLoading !== null}
            className="rounded-full bg-gradient-to-r from-gold to-gold-soft text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-60"
          >
            {batchLoading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {batchLoading === "all" ? "Starting…" : batchLoading}</>
              : <><Sparkles className="w-3.5 h-3.5" /> Create all 12</>}
          </button>
        </div>
      )}

      {tab === "western" && (
        <WesternGrid onSelect={(s) => generateReading(s, "western")} luck={luck} readings={readings} cacheKey={cacheKey} period={period} />
      )}
      {tab === "vedic" && (
        <VedicGrid today={today} onSelect={(s) => generateReading(s, "vedic", "Include Vedic Moon influence.")} luck={luck} readings={readings} cacheKey={cacheKey} period={period} />
      )}
      {tab === "nakshatra" && <NakshatraTab today={today} />}
      {tab === "chinese" && <ChineseTab today={today} onSelect={(a) => { setTab("western"); generateReading(a, "western"); }} />}
      {tab === "numeroscope" && <NumeroscopePanel now={today} />}


      {sign && (tab === "western" || tab === "vedic") && (
        <div className="mt-8 space-y-4">
          <SignDomainPanel
            signIndex={(tab === "vedic" ? (RASHIS as readonly string[]) : (SIGN_NAMES as readonly string[])).indexOf(sign)}
            system={tab === "vedic" ? "vedic" : "western"}
            period={period}
            now={today}
          />
          <GlassCard>
            <div className="flex items-center justify-between mb-3 gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Extended narrative · {period}</div>
                <div className="font-display text-2xl gold-text">{sign}</div>
              </div>
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing the detailed reading…
              </div>
            )}
            {currentReading && (
              <div className="text-[15px] leading-relaxed text-pearl/90 whitespace-pre-wrap">{currentReading}</div>
            )}
          </GlassCard>
        </div>
      )}


      <ConfidenceNote noteKey="horoscope" className="mt-6" />
    </PageShell>
  );
}

function WesternGrid({ onSelect, luck, readings, cacheKey, period }: {
  onSelect: (sign: string) => void;
  luck: (s: string) => { scores: Record<string, number>; luckyNumber: number; luckyColor: string; direction: string; gemstone: string };
  readings: Record<string, string>;
  cacheKey: (s: string, p: Period, m: string) => string;
  period: Period;
}) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {SIGN_NAMES.map((s, i) => {
        const l = luck(s);
        const cached = !!readings[cacheKey(s, period, "western")];
        return (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={`glass rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5 hover:bg-white/[0.06] ${cached ? "gold-border" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{SIGN_ELEMENT[i]} · {SIGN_MODALITY[i]}</div>
                <div className="mt-1 font-display text-xl text-pearl">{s}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Ruler: {SIGN_RULER[i]}</div>
              </div>
              <div className="text-3xl gold-text font-serif">{SIGN_GLYPHS[i]}</div>
            </div>
            <div className="mt-3 space-y-1.5">
              {SCORE_KEYS.map((k) => (
                <div key={k}>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{k}</span><span>{l.scores[k]}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${l.scores[k]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              <span>#{l.luckyNumber}</span><span>· {l.luckyColor}</span><span>· {l.direction}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function VedicGrid({ today, onSelect, readings, cacheKey, period }: {
  today: Date;
  onSelect: (rashi: string) => void;
  luck: (s: string) => { scores: Record<string, number>; luckyNumber: number; luckyColor: string; direction: string; gemstone: string };
  readings: Record<string, string>;
  cacheKey: (s: string, p: Period, m: string) => string;
  period: Period;
}) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {RASHIS.map((r, i) => {
        const scores = rashiphalScores(i, today);
        const transits = currentTransitsIntoRashi(i, today);
        const sade = analyseSadeSati(i, today);
        const cached = !!readings[cacheKey(r, period, "vedic")];
        const fromMoon = planetsFromMoon(i, today);
        return (
          <button
            key={r}
            onClick={() => onSelect(r)}
            className={`glass rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5 hover:bg-white/[0.06] ${cached ? "gold-border" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lord: {rashiLord(i)}</div>
                <div className="mt-1 font-display text-xl text-pearl">{r}</div>
                <div className="text-[10px] text-muted-foreground">Rashi {i + 1}</div>
              </div>
              {sade.active && (
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-amber-200">
                  Sade Sati · {sade.currentPhase}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {(["Love","Career","Wealth","Health","Emotions","Luck"] as const).map((k) => (
                <div key={k} className="rounded-lg border border-white/5 p-1.5">
                  <div className="text-[9px] text-muted-foreground">{k}</div>
                  <div className="text-xs text-pearl">{scores[k]}%</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1 text-[9px]">
              {transits.length === 0 && <span className="text-muted-foreground">No transits currently in this rashi.</span>}
              {transits.map((t) => (
                <span key={t.planet} className="rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-gold">
                  {t.planet} here
                </span>
              ))}
            </div>

            <div className="mt-2 text-[9px] text-muted-foreground line-clamp-1">
              From Moon → Jup: H{fromMoon.Jupiter} · Sat: H{fromMoon.Saturn} · Sun: H{fromMoon.Sun}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function NakshatraTab({ today }: { today: Date }) {
  const nak = nakshatraOfDay(today);
  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-start justify-between">
          <div>
            <Explain term="nakshatra" className="text-[10px] uppercase tracking-widest text-muted-foreground">Nakshatra of the day</Explain>
            <div className="font-display text-3xl gold-text mt-1">{nak.name}</div>
            <div className="text-xs text-muted-foreground">Pada {nak.pada} · Ruled by {nak.lord} · Deity {nak.deity}</div>
          </div>
          <Star className="w-6 h-6 text-gold" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-white/5 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Symbol</div>
            <div className="text-pearl mt-1">{nak.symbol}</div>
          </div>
          <div className="rounded-lg border border-white/5 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Moon longitude</div>
            <div className="text-pearl mt-1">{nak.moonLon.toFixed(2)}° sidereal</div>
          </div>
          <div className="rounded-lg border border-white/5 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pada dasha lord</div>
            <div className="text-pearl mt-1">{nak.lord}</div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
        {NAKSHATRAS.map((n, i) => (
          <div key={n} className={`glass rounded-xl p-3 ${i === nak.index ? "gold-border" : ""}`}>
            <div className="text-[9px] text-muted-foreground">#{i + 1}</div>
            <div className="text-xs text-pearl mt-0.5 truncate">{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChineseTab({ today, onSelect }: { today: Date; onSelect: (animal: string) => void }) {
  const [birthYear, setBirthYear] = useState<number>(1996);
  const currentYear = today.getFullYear();
  const forecast = useMemo(() => {
    const person = chineseSign(birthYear).animal;
    return chineseYearForecast(person, currentYear);
  }, [birthYear, currentYear]);
  const personSign = chineseSign(birthYear);
  const CLASH: Record<string, string> = {
    Rat: "Horse", Ox: "Goat", Tiger: "Monkey", Rabbit: "Rooster", Dragon: "Dog", Snake: "Pig",
    Horse: "Rat", Goat: "Ox", Monkey: "Tiger", Rooster: "Rabbit", Dog: "Dragon", Pig: "Snake",
  };
  const relation: "harmony" | "clash" | "self" | "neutral" =
    personSign.animal === forecast.yearAnimal ? "self"
    : CLASH[personSign.animal] === forecast.yearAnimal ? "clash"
    : (CHINESE_COMPATIBLE[personSign.animal] as readonly string[]).includes(forecast.yearAnimal) ? "harmony"
    : "neutral";


  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Your birth year</label>
          <input
            type="number"
            value={birthYear}
            min={1900}
            max={currentYear}
            onChange={(e) => setBirthYear(Number(e.target.value))}
            className="glass rounded-lg px-3 py-1.5 text-sm w-28"
          />
          <div className="text-sm text-pearl">
            You are <span className="gold-text font-display text-lg">{personSign.element} {personSign.animal}</span> ({personSign.yinYang})
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Forecast · {currentYear} · Year of the {forecast.yearElement} {forecast.yearAnimal}</div>
            <div className="mt-1 text-sm text-pearl">{forecast.theme}</div>
          </div>
          <Flame className="w-5 h-5 text-gold" />
        </div>
        <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-5 text-xs">
          {[["Overall", forecast.overallScore], ["Love", forecast.loveScore], ["Career", forecast.careerScore], ["Wealth", forecast.wealthScore], ["Health", forecast.healthScore]].map(([k, v]) => (
            <div key={k as string} className="rounded-lg border border-white/5 p-2">
              <div className="text-[10px] text-muted-foreground">{k as string}</div>
              <div className="text-pearl">{v as number}%</div>
              <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${v as number}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-white/5 p-2">
            <div className="text-[10px] text-muted-foreground">Lucky colours</div>
            <div className="text-pearl">{forecast.luckyColors.join(" · ")}</div>
          </div>
          <div className="rounded-lg border border-white/5 p-2">
            <div className="text-[10px] text-muted-foreground">Lucky numbers</div>
            <div className="text-pearl">{forecast.luckyNumbers.join(", ")}</div>
          </div>
          <div className="rounded-lg border border-white/5 p-2">
            <div className="text-[10px] text-muted-foreground">Direction</div>
            <div className="text-pearl">{forecast.luckyDirection}</div>
          </div>
        </div>
      </GlassCard>

      <ChineseDomainPanel
        personAnimal={personSign.animal}
        personElement={personSign.element}
        yearAnimal={forecast.yearAnimal}
        yearElement={forecast.yearElement}
        relation={relation}
        year={currentYear}
      />



      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {CHINESE_ANIMALS.map((animal) => {
          const sampleYear = currentYear - ((currentYear - 4 - CHINESE_ANIMALS.indexOf(animal)) % 12 + 12) % 12;
          const sign = chineseSign(sampleYear);
          return (
            <button key={animal} onClick={() => onSelect(animal)} className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06]">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{sign.element} · {sign.yinYang}</div>
              <div className="mt-1 font-display text-xl text-pearl">{animal}</div>
              <div className="mt-2 text-xs text-muted-foreground line-clamp-3">{CHINESE_TRAITS[animal]}</div>
              <div className="mt-3 text-[10px] gold-text">Best: {CHINESE_COMPATIBLE[animal].join(" · ")}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CosmicRibbon({ today, onPickWestern, onPickVedic }: { today: Date; onPickWestern: (s: string) => void; onPickVedic: (s: string) => void }) {
  const cotd = useMemo(() => tarotCardOfTheDay(today), [today]);
  const moon = useMemo(() => moonPhaseInfo(today), [today]);
  const sunS = useMemo(() => sunSign(today), [today]);
  const moonS = useMemo(() => moonSign(today), [today]);
  const nak = useMemo(() => nakshatraOfDay(today), [today]);

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button onClick={() => onPickWestern(sunS)} className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06]">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Card of the day</div>
        <div className="mt-1 font-display text-xl text-pearl">
          {cotd.card.name}{cotd.reversed && <span className="text-gold text-sm"> ⤵</span>}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{cardGuidance(cotd.card, cotd.reversed)}</div>
      </button>

      <div className="glass rounded-2xl p-5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Moon phase</div>
        <div className="mt-1 font-display text-xl text-pearl flex items-center gap-2">
          <span className="text-2xl">{moon.emoji}</span> {moon.name}
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${Math.round(moon.illumination * 100)}%` }} />
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground">
          {Math.round(moon.illumination * 100)}% illuminated · {moon.waxing ? "waxing" : "waning"}
        </div>
      </div>

      <button onClick={() => onPickWestern(sunS)} className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06]">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Sky right now</div>
        <div className="mt-1 font-display text-xl text-pearl">Sun in {sunS}</div>
        <div className="mt-1 text-xs text-muted-foreground">Moon in {moonS}</div>
        <div className="mt-2 text-[10px] gold-text">Tap for today's reading →</div>
      </button>

      <button onClick={() => onPickVedic(RASHIS[Math.floor(nak.moonLon / 30)])} className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06]">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Nakshatra today</div>
        <div className="mt-1 font-display text-xl text-pearl flex items-center gap-2">
          <MoonIcon className="w-4 h-4 text-gold" /> {nak.name}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Pada {nak.pada} · Lord {nak.lord} · {nak.deity}</div>
        <Link to="/panchang" className="mt-2 inline-block text-[10px] gold-text">Open Panchang →</Link>
      </button>
    </div>
  );
}
