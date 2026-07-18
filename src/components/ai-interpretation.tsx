import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiReading } from "@/lib/ai-reading.functions";
import { useBirthProfile } from "@/hooks/use-birth-profile";
import { buildGuideContext, type SavedKundliRow } from "@/lib/ai-context";
import type { BirthProfile } from "@/lib/birth-profile.functions";

function profileToRow(p: BirthProfile): SavedKundliRow {
  return {
    name: p.full_name,
    birth_date: p.birth_date,
    birth_time: p.birth_time.length === 5 ? `${p.birth_time}:00` : p.birth_time,
    tz_offset: Number(p.tz_offset_hours),
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    place: p.place ?? null,
  };
}

export function AIInterpretation({
  module,
  snapshot,
  intent,
}: {
  /** Human-readable module name, e.g. "Progressions", "Numerology". */
  module: string;
  /** Page-specific facts the model should ground its reading in. */
  snapshot?: string;
  /** Optional extra instruction, e.g. "Focus on career decisions". */
  intent?: string;
}) {
  const { data: profile } = useBirthProfile();
  const runFn = useServerFn(aiReading);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setLoading(true);
    setError(null);
    try {
      const row = profile ? profileToRow(profile) : null;
      const context = buildGuideContext(row);
      const system = [
        `You are Taromaya's AI interpreter for the "${module}" module.`,
        "Write a personalised, elegant reading in clean markdown (## headings, **bold** placements, short paragraphs, bullet lists).",
        "Ground EVERY claim in the CONTEXT and MODULE DATA blocks — never invent degrees, dates, dashas, or placements.",
        "Explain jargon in one line (ELI10) but keep the tone luxurious and precise (IQ200).",
        "Structure: Overview → Key Signals → What It Means For You → Practical Guidance → Remedies/Next Steps.",
        "Never predict death, medical outcomes, or legal verdicts. If context is missing, say so honestly.",
      ].join(" ");
      const prompt = [
        `MODULE: ${module}`,
        intent ? `USER INTENT: ${intent}` : "",
        "",
        "=== CONTEXT (birth chart + today's sky) ===",
        context,
        "",
        "=== MODULE DATA (what the user is currently viewing) ===",
        snapshot?.trim() || "(no page-specific data provided — interpret the module in light of the CONTEXT)",
        "",
        `Write the reading now for the ${module} module.`,
      ].filter(Boolean).join("\n");

      const res = await runFn({ data: { system: system.slice(0, 2000), prompt: prompt.slice(0, 4000) } });
      setText(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate reading");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 glass rounded-3xl p-6 sm:p-8 border border-primary/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80">
            AI Interpretation
          </div>
          <h2 className="mt-1 font-display text-2xl">
            <span className="gold-text">Reveal your {module} reading</span>
          </h2>
          <p className="mt-1 text-sm text-foreground/80">
            {profile
              ? `Personalised for ${profile.full_name} using your saved birth chart.`
              : "Save your birth details for a personalised reading — otherwise this will be generic."}
          </p>
        </div>
        <Button
          onClick={reveal}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Interpreting…</>
          ) : text ? (
            <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Reveal reading</>
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {text && (
        <article className="mt-6 space-y-3 text-foreground leading-relaxed
          [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-display [&_h1]:text-2xl
          [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-primary
          [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-display [&_h3]:text-lg
          [&_p]:text-foreground/90
          [&_strong]:text-primary [&_strong]:font-semibold
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
          [&_li]:text-foreground/90
          [&_a]:text-primary [&_a]:underline
          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic">
          <ReactMarkdown>{text}</ReactMarkdown>
        </article>
      )}
    </section>
  );
}
