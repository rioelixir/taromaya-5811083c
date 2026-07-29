import { createFileRoute } from "@tanstack/react-router";
import { PremiumGate } from "@/components/premium-gate";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PlainAIText } from "@/components/plain-ai-text";
import { PageShell } from "@/components/page-shell";
import { interpretDream } from "@/lib/dream-oracle.functions";
import { Moon, Sparkles, Loader2, Feather, Wand2 } from "lucide-react";

export const Route = createFileRoute("/dreams")({
  component: () => (<PremiumGate featureName="Dream Oracle"><DreamsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Dream Oracle — TAROMAYA" },
      { name: "description", content: "Interpret your dreams through Jungian, Vedic, and Tarot archetypes with live cosmic grounding." },
    ],
  }),
});

type Focus = "general" | "relationships" | "career" | "spiritual" | "shadow";

const FOCI: { id: Focus; label: string; hint: string }[] = [
  { id: "general", label: "General", hint: "Balanced psycho-spiritual" },
  { id: "relationships", label: "Relationships", hint: "Venus / Moon focus" },
  { id: "career", label: "Career", hint: "Saturn / Sun / Mars" },
  { id: "spiritual", label: "Spiritual", hint: "Ketu / soul echoes" },
  { id: "shadow", label: "Shadow", hint: "Jungian integration" },
];

const SYMBOL_LIBRARY: { symbol: string; meaning: string; archetype: string }[] = [
  { symbol: "Water / Ocean", meaning: "The unconscious, emotional depths, Moon-realm", archetype: "The High Priestess · Moon" },
  { symbol: "Falling", meaning: "Loss of control, ego surrender, Saturn descent", archetype: "The Tower · Saturn" },
  { symbol: "Flying", meaning: "Spiritual ascent, mental clarity, Mercury liberation", archetype: "The Fool · Mercury" },
  { symbol: "Snake", meaning: "Transformation, Kundalini, Rahu-Ketu axis", archetype: "Death · Rahu/Ketu" },
  { symbol: "Being chased", meaning: "Disowned aspect, shadow pursuing integration", archetype: "The Devil · Mars" },
  { symbol: "Teeth falling", meaning: "Power loss, identity shift, life-force transit", archetype: "Wheel of Fortune · Saturn" },
  { symbol: "House", meaning: "The Self, psyche's chambers, natal 4th house", archetype: "Four of Cups · Moon" },
  { symbol: "Mirror", meaning: "Self-recognition, Anima/Animus, Venus reflection", archetype: "The Lovers · Venus" },
  { symbol: "Fire", meaning: "Transformation, purification, Agni / Mars", archetype: "The Sun · Mars/Sun" },
  { symbol: "Death (of another)", meaning: "End of a self-aspect, not literal — rebirth signal", archetype: "Death · Pluto/Ketu" },
  { symbol: "Baby / Child", meaning: "New self, vulnerable potential, Jupiter blessing", archetype: "The Sun · Jupiter" },
  { symbol: "Naked in public", meaning: "Exposure of authenticity, vulnerability, Sun in shadow", archetype: "The Star · Uranus" },
];

function DreamsPage() {
  const [dream, setDream] = useState("");
  const [mood, setMood] = useState("");
  const [focus, setFocus] = useState<Focus>("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; context: { moonSign: string; sunSign: string; moonPhase: string; illumination: number; retros: string } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = useServerFn(interpretDream);

  const submit = async () => {
    if (dream.trim().length < 4) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await call({ data: { dream: dream.trim(), mood: mood.trim() || null, focus } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      eyebrow="Phase 17 · Dream Oracle"
      title="Dream Oracle"
      subtitle="Whisper your dream to the sky. The Oracle listens through Jungian, Vedic, and Tarot archetypes."
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="glass rounded-2xl p-6 space-y-5 gold-border">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold">
            <Feather className="h-3.5 w-3.5" /> Describe the dream
          </div>
          <textarea
            value={dream}
            onChange={e => setDream(e.target.value)}
            placeholder="Last night I dreamt I was walking through a temple made of water…"
            className="w-full min-h-40 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-gold/50 focus:outline-none resize-y"
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-white/60 flex-1 min-w-52">
              Waking mood (optional)
              <input
                value={mood}
                onChange={e => setMood(e.target.value)}
                placeholder="unsettled, curious, tender…"
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30"
              />
            </label>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Interpretation lens</div>
            <div className="flex flex-wrap gap-2">
              {FOCI.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFocus(f.id)}
                  className={[
                    "px-3 py-2 rounded-full text-xs uppercase tracking-widest border transition",
                    focus === f.id
                      ? "gold-border bg-gold/15 text-gold"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30",
                  ].join(" ")}
                  title={f.hint}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-white/40">
              Live cosmic context is woven into every reading.
            </div>
            <button
              onClick={submit}
              disabled={loading || dream.trim().length < 4}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gold-border bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? "Consulting the sky…" : "Interpret dream"}
            </button>
          </div>
          {error && <div className="text-rose-300 text-sm">{error}</div>}
        </div>

        {result && (
          <section className="space-y-4">
            <div className="glass rounded-2xl p-5 flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                <Moon className="h-3.5 w-3.5 text-white/60" />
                <span className="text-white/80">Moon in {result.context.moonSign}</span>
                <span className="text-white/40">· {result.context.moonPhase}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="text-white/80">Sun in {result.context.sunSign}</span>
              </div>
              {result.context.retros !== "none" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-400/20 bg-rose-500/10">
                  <span className="text-rose-300">℞ {result.context.retros}</span>
                </div>
              )}
            </div>
            <article className="glass rounded-2xl p-6 md:p-8">
              <PlainAIText text={result.text} label="Dream reading" />
            </article>
          </section>
        )}

        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="font-display text-xl gold-text tracking-wide">Symbol Library</h2>
            <span className="ml-auto text-[11px] text-white/40">Common dream symbols · archetypal keys</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SYMBOL_LIBRARY.map(s => (
              <div key={s.symbol} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-display text-lg text-white">{s.symbol}</div>
                <div className="text-xs text-white/70 mt-1">{s.meaning}</div>
                <div className="text-[10px] uppercase tracking-widest text-gold/80 mt-2">{s.archetype}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
