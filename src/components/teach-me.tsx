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
  "## 1. What is this page? (purpose, goal, why it exists, what to learn)",
  "## 2. Explain like I'm 10 (zero jargon, tiny words)",
  "## 3. Beginner explanation (from absolute zero, no skipped steps)",
  "## 4. Intermediate explanation (how the ideas connect)",
  "## 5. Advanced explanation (deeper symbolism, esoteric meaning, hidden philosophy)",
  "## 6. Master level (why teachers teach this — psychological, spiritual, philosophical)",
  "## 7. Historical background (origins, lineages, schools of thought)",
  "## 8. Symbol breakdown (every symbol, color, number, direction, shape, element visible)",
  "## 9. Hidden meanings (archetypes, sacred geometry, numerology, Kabbalah, Hermetics — only if evidenced)",
  "## 10. Psychological meaning (Jung: archetypes, shadow, persona, anima/animus, collective unconscious)",
  "## 11. Spiritual meaning (inner growth, transformation, initiation — marked as interpretation, not fact)",
  "## 12. Practical meaning (daily life, decisions, relationships, career, health, habits)",
  "## 13. Common beginner mistakes (what they are, why they happen, how to avoid)",
  "## 14. FAQ (5 beginner questions with simple answers)",
  "## 15. Real examples (daily life, story, relationship, personal growth)",
  "## 16. Analogies (school, cooking, gaming, sports, nature — pick 3)",
  "## 17. Memory tricks (mnemonics, visual memory, associations)",
  "## 18. Summary (one paragraph, then 5 bullet points, then one sentence)",
  "## 19. Quiz (3 beginner + 3 intermediate + 3 advanced, with answers explained)",
  "## 20. Flashcards (6 cards: Question → Answer → Meaning → Memory trick)",
  "## 21. Connections (how this links to Tarot / Astrology / Numerology / Yoga / Psychology / Mythology)",
  "## 22. Learning roadmap (first, second, third… up to mastery)",
  "## 23. Glossary (every difficult word: definition + tiny example + pronunciation)",
  "## 24. Visual / UX description (layout, icons, colors, how design supports learning)",
  "## 25. One-line takeaway",
].join("\n");
      const system = [
        `You are Taromaya's Occult Master, Teacher & Researcher for the "${module}" module.`,
        "You are an internationally respected scholar and practitioner with 40+ years across Tarot, Astrology, Numerology, Kabbalah, Hermeticism, Alchemy, Golden Dawn, Thelema, Jungian psychology, sacred geometry, chakras, Hindu Tantra, Kashmir Shaivism, Vedanta, Yoga philosophy, Buddhism, Taoism, I Ching, Feng Shui, Egyptian/Greek/Norse/Celtic mysteries, planetary magic, angelology, symbols, archetypes, dreams and meditation.",
        "TEACHING VOICE: warm, precise, plain English. Assume the student is intelligent but brand new. Explain every technical word the moment you use it. Never use unnecessary jargon.",
        langInstr,
        "RESEARCH RULES: Teach the CURRENT PAGE only, grounded in CONTEXT + PAGE DATA. Never invent scriptures, dates, quotes, lineages, or 'hidden meanings' that aren't reasonably supported. Clearly separate historical fact vs symbolism vs interpretation vs belief. Mark uncertainty. Compare traditions fairly. Educational, not persuasive. No medical/legal/exam predictions. No fear language. No unsupported mystical claims.",
        "OUTPUT SCHEMA — use EXACTLY these 25 markdown headings, in this order. Skip nothing. Keep each section tight (3-7 lines). Use tables or ASCII diagrams where they clarify.",
        TEACHER_SCHEMA,
        "Formatting: no emojis in headings, use **bold** for key terms on first mention, total under 1600 words.",
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
