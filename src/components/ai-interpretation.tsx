import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  module: string;
  snapshot?: string;
  intent?: string;
}) {
  const { data: profile } = useBirthProfile();
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const row = profile ? profileToRow(profile) : null;
      const context = buildGuideContext(row);
      const system = [
        `You are Taromaya's friendly guide for the "${module}" module.`,
        "Write like you're talking to a curious 10-year-old best friend: super simple everyday words, short sentences, warm and kind. NO jargon. If you must use a special word, explain it in 4-5 words right after.",
        "Use clean markdown: ## short headings, **bold** the key idea, tiny paragraphs (1-2 lines), bullet points.",
        "Ground every point in the CONTEXT and MODULE DATA. Never invent numbers, dates, or placements.",
        "Structure: ## What's happening (2 lines) → ## What it means for you (3 bullets) → ## What to do this week (3 tiny tips).",
        "Keep the whole reading under 220 words. No fluff. No death, medical, or legal predictions.",
      ].join(" ");
      const prompt = [
        `MODULE: ${module}`,
        intent ? `USER INTENT: ${intent}` : "",
        "",
        "=== CONTEXT ===",
        context,
        "",
        "=== MODULE DATA ===",
        snapshot?.trim() || "(no page data — read the module from context)",
        "",
        "Write the super-simple reading now.",
      ].filter(Boolean).join("\n");

      const res = await fetch("/api/ai-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: system.slice(0, 2000), prompt: prompt.slice(0, 4000) }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "Failed"));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
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
            <span className="gold-text">Your simple {module} reading</span>
          </h2>
          <p className="mt-1 text-sm text-foreground/80">
            {profile
              ? `Made just for ${profile.full_name} — in easy words.`
              : "Save your birth details for a personal reading."}
          </p>
        </div>
        <Button
          onClick={reveal}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading…</>
          ) : text ? (
            <><RefreshCw className="mr-2 h-4 w-4" /> Read again</>
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
