import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { NAKSHATRAS } from "@/lib/vedic";
import {
  PADA_SYLLABLES, syllablesForNakshatra, enrichNames, SEED_NAMES,
  type BabyNameCriteria, type BabyName, type Gender, type Tradition,
} from "@/lib/baby-names";
import { suggestBabyNames } from "@/lib/baby-names.functions";
import { Baby, Loader2, Sparkles, Heart, Star } from "lucide-react";

export const Route = createFileRoute("/baby-names")({
  component: () => (
    <PremiumGate featureName="Baby Names">
      <BabyNamesPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Baby Names — Vedic Namakarana Generator | TAROMAYA" },
      {
        name: "description",
        content:
          "Vedic-aligned baby name suggestions by Nakshatra pada syllables, tradition, meaning, and numerology life path.",
      },
    ],
  }),
});

function BabyNamesPage() {
  const [gender, setGender] = useState<Gender>("Boy");
  const [tradition, setTradition] = useState<Tradition>("Sanskrit");
  const [nakshatraIndex, setNakshatraIndex] = useState<number>(0);
  const [pada, setPada] = useState<1 | 2 | 3 | 4 | 0>(0); // 0 = all
  const [manualSyllables, setManualSyllables] = useState<string>("");
  const [meaningTheme, setMeaningTheme] = useState<string>("");
  const [targetLifePath, setTargetLifePath] = useState<number | "">("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [count, setCount] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<BabyName[] | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const suggest = useServerFn(suggestBabyNames);

  const syllables = useMemo(() => {
    if (manualSyllables.trim()) {
      return manualSyllables.split(/[,\s]+/).filter(Boolean);
    }
    return pada === 0
      ? syllablesForNakshatra(nakshatraIndex)
      : syllablesForNakshatra(nakshatraIndex, pada);
  }, [manualSyllables, nakshatraIndex, pada]);

  const criteria: BabyNameCriteria = {
    gender,
    tradition,
    nakshatraIndex,
    pada: pada === 0 ? undefined : pada,
    syllables,
    meaningTheme: meaningTheme || undefined,
    targetLifePath: typeof targetLifePath === "number" ? targetLifePath : undefined,
    birthDate: birthDate || undefined,
    count,
  };

  async function generate() {
    setLoading(true);
    try {
      const res = await suggest({
        data: {
          gender,
          tradition,
          syllables,
          meaningTheme: meaningTheme || undefined,
          nakshatraName: NAKSHATRAS[nakshatraIndex],
          targetLifePath: typeof targetLifePath === "number" ? targetLifePath : undefined,
          count,
        },
      });
      const enriched = enrichNames(
        res.names.map((n) => ({ ...n, gender: n.gender as Gender })),
        criteria,
      );
      setNames(enriched);
    } catch (e) {
      console.error(e);
      // graceful fallback — show seed pool
      const seed = SEED_NAMES.filter((n) => n.gender === gender || gender === "Unisex").map((n) => ({
        ...n,
        syllable: n.name.slice(0, 2),
      }));
      setNames(enrichNames(seed, criteria));
    } finally {
      setLoading(false);
    }
  }

  function toggleSaved(name: string) {
    setSaved((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  }

  return (
    <PageShell
      eyebrow="Namakarana"
      title="Baby Names Generator"
      subtitle="Vedic pada-syllable alignment, tradition, meaning theme, and numerology life-path — curated by AI."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Criteria panel */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Baby className="w-4 h-4 text-gold" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Criteria</div>
          </div>

          <Field label="Gender">
            <div className="flex gap-2">
              {(["Boy", "Girl", "Unisex"] as Gender[]).map((g) => (
                <Chip key={g} active={gender === g} onClick={() => setGender(g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Tradition">
            <select
              value={tradition}
              onChange={(e) => setTradition(e.target.value as Tradition)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl"
            >
              {(["Sanskrit","Hindu","Sikh","Muslim","Christian","Modern","Any"] as Tradition[]).map((t) => (
                <option key={t} value={t} className="bg-cosmic">{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Nakshatra">
            <select
              value={nakshatraIndex}
              onChange={(e) => setNakshatraIndex(Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl"
            >
              {NAKSHATRAS.map((n, i) => (
                <option key={n} value={i} className="bg-cosmic">
                  {i + 1}. {n}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pada">
            <div className="flex gap-2 flex-wrap">
              <Chip active={pada === 0} onClick={() => setPada(0)}>All</Chip>
              {[1, 2, 3, 4].map((p) => (
                <Chip key={p} active={pada === p} onClick={() => setPada(p as 1|2|3|4)}>
                  Pada {p}
                </Chip>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {syllables.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold"
                >
                  {s}
                </span>
              ))}
            </div>
          </Field>

          <Field label="Custom syllables (optional)">
            <input
              value={manualSyllables}
              onChange={(e) => setManualSyllables(e.target.value)}
              placeholder="e.g. Aa, Ar, Ish"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground"
            />
          </Field>

          <Field label="Meaning theme (optional)">
            <input
              value={meaningTheme}
              onChange={(e) => setMeaningTheme(e.target.value)}
              placeholder="e.g. courage, light, devotion"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground"
            />
          </Field>

          <Field label="Target Life Path (optional)">
            <div className="flex gap-1 flex-wrap">
              <Chip active={targetLifePath === ""} onClick={() => setTargetLifePath("")}>None</Chip>
              {[1,2,3,4,5,6,7,8,9,11,22,33].map((n) => (
                <Chip key={n} active={targetLifePath === n} onClick={() => setTargetLifePath(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Child birth date (for numerology, optional)">
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl"
            />
          </Field>

          <Field label={`Count: ${count}`}>
            <input
              type="range"
              min={6}
              max={30}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </Field>

          <button
            onClick={generate}
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium px-4 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Divining names…" : "Generate names"}
          </button>
        </GlassCard>

        {/* Results */}
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {names ? `${names.length} suggestions` : "Ready when you are"}
              </div>
              {saved.length > 0 && (
                <div className="ml-auto text-[11px] text-gold">
                  {saved.length} shortlisted
                </div>
              )}
            </div>
            {!names && (
              <div className="mt-4 text-sm text-muted-foreground">
                Choose a Nakshatra and pada to see the traditional starting syllables from
                the classical Namakarana Samskara. Add a meaning theme or target Life Path
                to filter further, then generate.
              </div>
            )}
          </GlassCard>

          {names && (
            <div className="grid gap-3 sm:grid-cols-2">
              {names.map((n) => (
                <NameCard
                  key={n.name}
                  n={n}
                  saved={saved.includes(n.name)}
                  onToggle={() => toggleSaved(n.name)}
                />
              ))}
            </div>
          )}

          {saved.length > 0 && (
            <GlassCard>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Your shortlist
              </div>
              <div className="flex flex-wrap gap-2">
                {saved.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm text-pearl"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs ${
        active
          ? "border border-gold/60 bg-gold/15 text-gold"
          : "border border-white/10 text-muted-foreground hover:text-pearl"
      }`}
    >
      {children}
    </button>
  );
}

function NameCard({
  n, saved, onToggle,
}: {
  n: BabyName; saved: boolean; onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-gold/30 transition-colors">
      <div className="flex items-start gap-2">
        <div>
          <div className="text-lg font-semibold text-pearl tracking-wide">
            {n.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {n.origin} · {n.gender}
            {n.syllable ? ` · begins with ${n.syllable}` : ""}
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`ml-auto p-1.5 rounded-full border ${
            saved ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground"
          }`}
          aria-label="Save"
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="mt-2 text-sm text-pearl/85 leading-relaxed">{n.meaning}</div>
      {(n.numerology || n.alignment?.padaMatch || n.alignment?.lifePathMatch) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {n.alignment?.padaMatch && (
            <Tag color="emerald">Pada match</Tag>
          )}
          {n.alignment?.lifePathMatch && (
            <Tag color="gold">Life path match</Tag>
          )}
          {n.numerology && (
            <>
              <Tag>Destiny {n.numerology.destiny}</Tag>
              <Tag>Soul {n.numerology.soulUrge}</Tag>
              <Tag>Persona {n.numerology.personality}</Tag>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ children, color = "neutral" }: { children: React.ReactNode; color?: "emerald" | "gold" | "neutral" }) {
  const cls =
    color === "emerald" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
    : color === "gold"  ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-muted-foreground";
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  );
}
