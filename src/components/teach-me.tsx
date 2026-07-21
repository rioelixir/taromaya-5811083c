import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { GraduationCap, Loader2, StopCircle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBirthProfile } from "@/hooks/use-birth-profile";
import { buildGuideContext, type SavedKundliRow } from "@/lib/ai-context";
import type { BirthProfile } from "@/lib/birth-profile.functions";
import { useLang } from "@/lib/i18n";

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

const TEACHER_SCHEMA = [
  "## 1. ELI10 (10-year-old friend voice)",
  "## 2. Intermediate (curious student)",
  "## 3. Advanced (serious seeker)",
  "## 4. Master (occult scholar)",
  "## 5. Core Symbols on this page",
  "## 6. Hidden meanings & archetypes",
  "## 7. Psychological meaning (Jung, shadow, self)",
  "## 8. Spiritual meaning (soul, karma, dharma)",
  "## 9. Mythology & scripture references",
  "## 10. History & lineage",
  "## 11. How it is calculated (plain math)",
  "## 12. Common mistakes & misreadings",
  "## 13. Practice — 3 tiny exercises",
  "## 14. Journal prompts (3)",
  "## 15. Meditation / mantra / mudra",
  "## 16. Ethics & when NOT to use it",
  "## 17. Glossary (5 key words, one-line each)",
  "## 18. Mini-quiz (3 questions with answers)",
  "## 19. Flashcards (5 term → meaning pairs)",
  "## 20. Cross-links (related modules to visit next)",
  "## 21. Real-life example (short story)",
  "## 22. Red flags in interpretation",
  "## 23. Deepening roadmap (beginner → master)",
  "## 24. Recommended reading (books/tantras)",
  "## 25. One-line takeaway",
].join("\n");

export function TeachMe({
  module,
  snapshot,
}: {
  module: string;
  snapshot?: string;
}) {
  const { data: profile } = useBirthProfile();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }

  async function teach() {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const row = profile ? profileToRow(profile) : null;
      const context = buildGuideContext(row);
      const langInstr =
        lang === "hi"
          ? "Write the ENTIRE lesson in Hindi (Devanagari)."
          : lang === "hr"
          ? "Write the ENTIRE lesson in Roman Hinglish."
          : "Write the lesson in simple English.";
      const system = [
        `You are Taromaya's Occult Master Teacher for the "${module}" module.`,
        "You are a warm, precise, deeply-read guide: part Vedic acharya, part Jungian analyst, part tarot elder.",
        langInstr,
        "Teach the CURRENT PAGE only. Ground every claim in CONTEXT + PAGE DATA. Never invent scriptures, dates, or quotes.",
        "OUTPUT SCHEMA — use exactly these 25 markdown headings, in this order. Keep each section tight (2-6 lines). Skip nothing.",
        TEACHER_SCHEMA,
        "Rules: no emojis in headings, no medical/legal/exam predictions, no fear language, total under 1200 words.",
      ].join("\n");
      const prompt = [
        `MODULE: ${module}`,
        "",
        "=== CONTEXT (user chart + today's sky) ===",
        context,
        "",
        "=== PAGE DATA (what this page currently shows) ===",
        snapshot?.trim() || "(no live values — teach the module generally)",
        "",
        "Now teach this page using all 25 sections.",
      ].join("\n");

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch("/api/ai-reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          system: system.slice(0, 4000),
          prompt: prompt.slice(0, 6000),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        if (res.status === 402) throw new Error("The AI service is out of credits.");
        if (res.status === 429) throw new Error("Too many requests — please wait a moment.");
        throw new Error(`Lesson failed (${res.status}).`);
      }
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
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load lesson");
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function openDrawer() {
    setOpen(true);
    if (!text && !loading) void teach();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="inline-flex items-center gap-1.5 rounded-xl glass gold-border px-3 py-2 text-xs sm:text-sm text-pearl hover:bg-white/10 transition"
        aria-label={`Teach me this page: ${module}`}
        title="Teach me this page"
      >
        <GraduationCap className="h-4 w-4 text-gold" />
        <span className="hidden sm:inline">Teach me</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Lesson on ${module}`}
          className="fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-background border-l border-primary/20 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-primary/15 bg-background/95 backdrop-blur px-5 py-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.35em] text-primary">Occult Codex</div>
                <div className="font-display text-lg gold-text">Teach me: {module}</div>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Button size="sm" variant="outline" onClick={stop} aria-label="Stop lesson">
                    <StopCircle className="mr-1.5 h-4 w-4" /> Stop
                  </Button>
                ) : text ? (
                  <Button size="sm" variant="outline" onClick={teach} aria-label="Regenerate lesson">
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Again
                  </Button>
                ) : null}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-6">
              {loading && !text && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing your lesson…
                </div>
              )}
              {error && (
                <div role="alert" className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {text && (
                <article
                  data-no-translate
                  className="space-y-3 text-foreground leading-relaxed
                    [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-display [&_h1]:text-2xl
                    [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-primary
                    [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-display [&_h3]:text-base
                    [&_p]:text-foreground
                    [&_strong]:text-primary [&_strong]:font-semibold
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
                    [&_blockquote]:border-l-2 [&_blockquote]:border-primary/60 [&_blockquote]:pl-4 [&_blockquote]:italic"
                >
                  <ReactMarkdown>{text}</ReactMarkdown>
                </article>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
