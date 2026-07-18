import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import { CHINESE_ANIMALS, chineseSign, CHINESE_TRAITS, CHINESE_COMPATIBLE } from "@/lib/chinese-zodiac";
import { aiReading } from "@/lib/ai-reading.functions";
import { Loader2, Sparkles } from "lucide-react";
import { tarotCardOfTheDay, cardGuidance, moonPhaseInfo, sunSign, moonSign } from "@/lib/horoscope";

export const Route = createFileRoute("/horoscope")({
  component: () => (<PremiumGate featureName="Horoscope"><HoroscopePage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Horoscope — TAROMAYA" },
      { name: "description", content: "Daily, weekly, monthly, yearly horoscope + Chinese zodiac readings." },
    ],
  }),
});

type Period = "Daily" | "Weekly" | "Monthly" | "Yearly";
const PERIODS: Period[] = ["Daily", "Weekly", "Monthly", "Yearly"];

// Deterministic seeded pseudo-random for luck items
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
  const [period, setPeriod] = useState<Period>("Daily");
  const [sign, setSign] = useState<string | null>(null);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState<string | null>(null);
  const [showChinese, setShowChinese] = useState(false);

  const ai = useServerFn(aiReading);
  const today = useMemo(() => new Date(), []);

  const cacheKey = (s: string, p: Period) => `${p}-${s}-${today.toDateString()}`;

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

  const generateFor = async (s: string): Promise<string> => {
    const key = cacheKey(s, period);
    if (readings[key]) return readings[key];
    const l = luck(s);
    const res = await ai({
      data: {
        system: "You are a poetic modern astrologer. Write elegant, uplifting, specific horoscopes. Markdown allowed. Never hedged.",
        prompt: `Write the ${period.toLowerCase()} horoscope for ${s} for ${today.toDateString()}.
Include sections: Overview, Love & Relationships, Career & Money, Health & Wellbeing, Guidance.
Reference: lucky number ${l.luckyNumber}, colour ${l.luckyColor}, direction ${l.direction}.
About 350 words.`,
      },
    });
    setReadings((prev) => ({ ...prev, [key]: res.text }));
    return res.text;
  };

  const generateReading = async (s: string) => {
    setSign(s); setLoading(true);
    try { await generateFor(s); } finally { setLoading(false); }
  };

  const generateAll = async () => {
    setBatchLoading("all");
    try {
      for (const s of SIGN_NAMES) {
        setBatchLoading(s);
        await generateFor(s);
      }
    } finally { setBatchLoading(null); }
  };

  const currentReading = sign ? readings[cacheKey(sign, period)] : null;


  return (
    <PageShell
      eyebrow="Horoscope"
      title="Read the sky"
      subtitle="Personalised daily, weekly, monthly and yearly readings across love, career, wealth, health, and luck."
    >
      <CosmicRibbon today={today} onPickSign={(s: string) => generateReading(s)} />

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
          onClick={generateAll}
          disabled={batchLoading !== null}
          className="rounded-full bg-gradient-to-r from-gold to-gold-soft text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-60"
        >
          {batchLoading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {batchLoading === "all" ? "Starting…" : batchLoading}</>
            : <><Sparkles className="w-3.5 h-3.5" /> Generate all 12</>}
        </button>
        <button
          onClick={() => setShowChinese(!showChinese)}
          className={`ml-auto rounded-full px-4 py-2 text-xs uppercase tracking-widest ${showChinese ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"}`}
        >
          {showChinese ? "Western" : "Chinese"} zodiac
        </button>
      </div>


      {!showChinese ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {SIGN_NAMES.map((s, i) => {
            const l = luck(s);
            const cached = !!readings[cacheKey(s, period)];
            return (
              <button
                key={s}
                onClick={() => generateReading(s)}
                className={`glass rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5 hover:bg-white/[0.06] ${cached ? "gold-border" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{period}</div>
                    <div className="mt-1 font-display text-xl text-pearl">{s}</div>
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
                  <span>#{l.luckyNumber}</span>
                  <span>· {l.luckyColor}</span>
                  <span>· {l.direction}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <ChineseZodiacGrid onSelect={(y) => generateReading(chineseSign(y).animal)} />
      )}

      {sign && (
        <div className="mt-8">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{period}</div>
                <div className="font-display text-3xl gold-text">{sign}</div>
              </div>
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Aligning the stars…
              </div>
            )}
            {currentReading && (
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{currentReading}</div>
            )}
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}

function ChineseZodiacGrid({ onSelect }: { onSelect: (year: number) => void }) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {CHINESE_ANIMALS.map((animal, i) => {
        const sampleYear = currentYear - ((currentYear - 4 - i) % 12 + 12) % 12;
        const sign = chineseSign(sampleYear);
        return (
          <button
            key={animal}
            onClick={() => onSelect(sampleYear)}
            className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06]"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{sign.element} · {sign.yinYang}</div>
            <div className="mt-1 font-display text-xl text-pearl">{animal}</div>
            <div className="mt-2 text-xs text-muted-foreground line-clamp-3">{CHINESE_TRAITS[animal]}</div>
            <div className="mt-3 text-[10px] gold-text">Best: {CHINESE_COMPATIBLE[animal].join(" · ")}</div>
          </button>
        );
      })}
    </div>
  );
}
