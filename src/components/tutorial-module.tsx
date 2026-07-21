import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles, Star, Compass, LayoutGrid, Bot, ShieldCheck, Rocket,
  ChevronLeft, ChevronRight, Search, Check, RotateCcw, X,
  Lightbulb, AlertTriangle, CheckCircle2, XCircle, Pin, Timer,
  ThumbsUp, ThumbsDown, ChevronDown, PartyPopper,
} from "lucide-react";

type Callout = { kind: "tip" | "warn" | "do" | "dont" | "pro" | "note"; text: string };
type DeepLink = { to: string; tour?: string; label: string };
type Step = {
  id: string;
  icon: typeof Sparkles;
  title: string;
  lede: string;
  bullets: string[];
  callouts?: Callout[];
  link?: DeepLink;
  cta?: { to: string; label: string };
};

const STEPS: Step[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to Taromaya",
    lede: "A calm, luxurious home for tarot, Vedic astrology and an AI oracle — designed to feel simple, no matter your experience.",
    bullets: [
      "Draw cards from five specialised decks (Rider–Waite, Nakshatra, Health, Lost & Found, Soulmates).",
      "Cast an accurate kundli with Lahiri ayanamsa, dashas, yogas and doshas.",
      "Get plain-English (or Hindi) readings for every module.",
    ],
    callouts: [
      { kind: "pro", text: "Enter your birth details once — every module autofills privately from your profile." },
    ],
  },
  {
    id: "dashboard",
    icon: LayoutGrid,
    title: "Your home dashboard",
    lede: "Everything starts from this page. Three zones, easy to scan.",
    bullets: [
      "Hero — greets you and offers the two primary actions: Start a reading and Ask the oracle.",
      "Quick actions — Tarot, Kundli, Panchang, AI Guide. One tap to jump in.",
      "Today — live Sun, Moon and Tithi at a glance.",
    ],
    callouts: [
      { kind: "tip", text: "Tap “Explore all modules” at the bottom to open the full menu drawer." },
    ],
  },
  {
    id: "navigation",
    icon: Compass,
    title: "Navigating the app",
    lede: "Navigation stays out of your way. Use the header for essentials and the menu for depth.",
    bullets: [
      "Header — logo (home), Birth status chip, menu button, and your profile.",
      "Menu drawer — searchable list of every module grouped by theme.",
      "Focus mode — collapse the header on any page to reduce distractions.",
      "Back / Home — every page has explicit navigation buttons.",
    ],
    callouts: [
      { kind: "note", text: "Language toggle (English • हिंदी • Roman Hindi) lives in the header menu." },
    ],
  },
  {
    id: "birth",
    icon: ShieldCheck,
    title: "Set your birth details (once)",
    lede: "Go to Profile → Birth details. Save your date, time and place of birth a single time.",
    bullets: [
      "Kept strictly private via row-level security — no other user can see your details.",
      "Autofills Kundli, Numerology, Panchang, Compatibility, Transits, Dashas and more.",
      "Edit any time from your profile — modules will refresh automatically.",
    ],
    callouts: [
      { kind: "warn", text: "Accurate time of birth matters — even a few minutes changes the ascendant." },
      { kind: "do", text: "Use place-of-birth autocomplete to lock the correct latitude/longitude/timezone." },
    ],
  },
  {
    id: "features",
    icon: Star,
    title: "Using each module",
    lede: "Every module follows the same pattern: inputs on top, visual chart in the middle, AI reading at the bottom.",
    bullets: [
      "Tarot — pick a deck, choose a spread (1-Card, Yes/No, Past·Present·Future, Freestyle), drag cards onto the canvas, tap to reveal, tap again for a text-free zoom.",
      "Kundli — instant Lagna, Rasi and Navamsa charts with dashas, yogas and doshas.",
      "Panchang — Tithi, Nakshatra, Yoga, Karana, sunrise/sunset — daily to yearly.",
      "Numerology — Life Path, Loshu grid, name-spelling and mobile-frequency check.",
      "AI Guide — ask any question in plain language; it uses your profile for context.",
    ],
    callouts: [
      { kind: "pro", text: "Every chart is pinch-to-zoom and pan-friendly — tap the chart to open fullscreen." },
    ],
  },
  {
    id: "workflow",
    icon: Rocket,
    title: "A real reading — end to end",
    lede: "Here’s a typical five-minute flow.",
    bullets: [
      "1. Open Tarot from Quick actions.",
      "2. Choose the Rider–Waite deck and the Past·Present·Future spread.",
      "3. Drag three cards onto the canvas and lock the spread.",
      "4. Tap each card to reveal, then tap again to zoom.",
      "5. Read the AI interpretation below — save or share as a public report.",
    ],
    callouts: [
      { kind: "tip", text: "Every reading is stored in History — reopen it any time from your profile." },
    ],
  },
  {
    id: "best",
    icon: Lightbulb,
    title: "Best practices",
    lede: "Small habits that lead to better readings.",
    bullets: [
      "Do — ask one clear question at a time.",
      "Do — enter accurate birth details for the highest precision.",
      "Don’t — repeat the same question in a short window; sit with the answer.",
      "Privacy — your birth data is encrypted at rest and never shown to other users.",
      "Accuracy — use the Diagnostics panel (admins) to verify calculation versions.",
    ],
  },
  {
    id: "faq",
    icon: Sparkles,
    title: "You’re ready",
    lede: "Explore freely — this tutorial stays available on the home page whenever you need it.",
    bullets: [
      "Restart this tour any time.",
      "Share readings via a public link.",
      "Download up to 10 PDF reports per month (unlimited for staff).",
    ],
    cta: { to: "/tarot", label: "Start using Taromaya" },
  },
];

const FAQS: { q: string; a: string }[] = [
  { q: "How long does the tutorial take?", a: "About 5–7 minutes end to end. You can skip and return any time." },
  { q: "Can I edit my birth details later?", a: "Yes. Open Profile → Birth details. All modules refresh automatically." },
  { q: "Is my data private?", a: "Yes. Birth details are protected by row-level security — no other user can see them." },
  { q: "Can I export a reading?", a: "Yes. Every reading has a Share (public link) and Download PDF option (10/month)." },
  { q: "What if a calculation looks off?", a: "Open the Accuracy panel on the page — it shows the model, ayanamsa and version used." },
  { q: "Which languages are supported?", a: "English, हिंदी and Roman Hindi. Switch from the menu drawer." },
];

const CALLOUT_STYLE: Record<Callout["kind"], { icon: typeof Lightbulb; bg: string; ring: string; label: string }> = {
  tip:  { icon: Lightbulb,     bg: "bg-amber-50",   ring: "ring-amber-200",   label: "Tip" },
  warn: { icon: AlertTriangle, bg: "bg-orange-50",  ring: "ring-orange-200",  label: "Warning" },
  do:   { icon: CheckCircle2,  bg: "bg-emerald-50", ring: "ring-emerald-200", label: "Best practice" },
  dont: { icon: XCircle,       bg: "bg-rose-50",    ring: "ring-rose-200",    label: "Avoid" },
  pro:  { icon: Star,          bg: "bg-violet-50",  ring: "ring-violet-200",  label: "Pro tip" },
  note: { icon: Pin,           bg: "bg-sky-50",     ring: "ring-sky-200",     label: "Note" },
};

const STORAGE_KEY = "taromaya.tutorial.v1";

type Persist = { step: number; done: boolean; feedback?: "up" | "down" };

function loadState(): Persist {
  if (typeof window === "undefined") return { step: 0, done: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 0, done: false };
    return { ...(JSON.parse(raw) as Persist) };
  } catch {
    return { step: 0, done: false };
  }
}

function saveState(s: Persist) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function TutorialModule() {
  const [open, setOpen] = useState(true);
  const [state, setState] = useState<Persist>(() => loadState());
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveState(state); }, [state]);

  const total = STEPS.length;
  const step = Math.min(state.step, total - 1);
  const current = STEPS[step];
  const progress = Math.round(((step + 1) / total) * 100);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STEPS.map((_, i) => i);
    return STEPS
      .map((s, i) => {
        const hay = (s.title + " " + s.lede + " " + s.bullets.join(" ")).toLowerCase();
        return hay.includes(q) ? i : -1;
      })
      .filter((i) => i >= 0);
  }, [query]);

  const goto = (i: number) => {
    setState((s) => ({ ...s, step: Math.max(0, Math.min(total - 1, i)) }));
    requestAnimationFrame(() => stepRef.current?.focus());
  };
  const next = () => goto(step + 1);
  const prev = () => goto(step - 1);
  const finish = () => setState((s) => ({ ...s, done: true, step: total - 1 }));
  const restart = () => setState({ step: 0, done: false });

  if (!open) {
    return (
      <section className="mt-10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between rounded-2xl border border-border/40 bg-white/70 px-5 py-4 text-left hover:bg-white/95 transition"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg">How to Use Taromaya</div>
              <div className="text-sm text-muted-foreground">
                {state.done ? "Tutorial completed ✓ — view again" : "Resume the 5-minute tour"}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>
    );
  }

  const StepIcon = current.icon;

  return (
    <section
      aria-labelledby="tutorial-heading"
      className="mt-10 rounded-3xl border border-border/40 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-border/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <Rocket className="h-3.5 w-3.5" />
            Onboarding
            <span className="mx-1">•</span>
            <Timer className="h-3.5 w-3.5" />
            5–7 min
          </div>
          <h2 id="tutorial-heading" className="mt-2 font-display text-2xl sm:text-3xl leading-tight">
            <span className="gold-text">How to Use Taromaya</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Everything you need before your first reading. Follow the steps or jump around.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Collapse tutorial"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/50 bg-white/70 hover:bg-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 sm:px-6 pt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {total} — {current.title}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-0">
        {/* Sidebar */}
        <aside className="hidden lg:block border-r border-border/40 p-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tutorial…"
              aria-label="Search tutorial"
              className="w-full rounded-lg border border-border/50 bg-white/70 pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <ol className="mt-3 space-y-1">
            {STEPS.map((s, i) => {
              const active = i === step;
              const dim = filtered.length > 0 && !filtered.includes(i);
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goto(i)}
                    className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-primary/5"
                    } ${dim ? "opacity-40" : ""}`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[10px] shrink-0 ${
                        i < step || (state.done && i === total - 1)
                          ? "bg-primary text-primary-foreground"
                          : active
                          ? "bg-primary/20 text-primary"
                          : "bg-primary/5 text-muted-foreground"
                      }`}
                    >
                      {i < step || (state.done && i === total - 1) ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Step content */}
        <div className="p-5 sm:p-6">
          {/* Mobile step chips */}
          <div className="lg:hidden -mx-1 mb-4 flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goto(i)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
                  i === step
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white/70 border-border/50 text-foreground"
                }`}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>

          <div
            ref={stepRef}
            tabIndex={-1}
            key={current.id}
            className="animate-fade-in outline-none"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
                <StepIcon className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Step {step + 1}
                </div>
                <h3 className="mt-1 font-display text-xl sm:text-2xl leading-tight text-foreground">
                  {current.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {current.lede}
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2.5">
              {current.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-white/60 p-3">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>

            {current.callouts?.length ? (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {current.callouts.map((c, i) => {
                  const meta = CALLOUT_STYLE[c.kind];
                  const CIcon = meta.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 rounded-xl ${meta.bg} ring-1 ${meta.ring} p-3`}
                    >
                      <CIcon className="h-4 w-4 mt-0.5 text-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-widest text-foreground/70">{meta.label}</div>
                        <div className="text-sm text-foreground leading-relaxed">{c.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* FAQ on the last step */}
            {step === total - 1 && (
              <div className="mt-6 rounded-2xl border border-border/40 bg-white/60 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">Frequently asked</div>
                <div className="divide-y divide-border/40">
                  {FAQS.map((f, i) => {
                    const isOpen = openFaq === i;
                    return (
                      <div key={i}>
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : i)}
                          className="w-full flex items-center justify-between py-2.5 text-left"
                          aria-expanded={isOpen}
                        >
                          <span className="text-sm text-foreground">{f.q}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="pb-3 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                            {f.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completion CTA + feedback */}
            {step === total - 1 && (
              <div className="mt-6 rounded-2xl bg-primary/5 ring-1 ring-primary/20 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <PartyPopper className="h-5 w-5" />
                  <span className="font-medium">You’re ready to explore Taromaya.</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {current.cta && (
                    <Link
                      to={current.cta.to}
                      onClick={finish}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg transition"
                    >
                      <Sparkles className="h-4 w-4" />
                      {current.cta.label}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-white/80 px-4 py-2 text-sm hover:bg-white transition"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restart tour
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Was this helpful?</span>
                  <button
                    type="button"
                    aria-label="Yes, helpful"
                    onClick={() => setState((s) => ({ ...s, feedback: "up" }))}
                    className={`grid h-8 w-8 place-items-center rounded-full border transition ${
                      state.feedback === "up"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : "border-border/50 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="No, not helpful"
                    onClick={() => setState((s) => ({ ...s, feedback: "down" }))}
                    className={`grid h-8 w-8 place-items-center rounded-full border transition ${
                      state.feedback === "down"
                        ? "bg-rose-100 border-rose-300 text-rose-700"
                        : "border-border/50 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-white/70 px-4 py-2 text-sm hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Skip tutorial
              </button>
              {step < total - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:shadow-md transition"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:shadow-md transition"
                >
                  <Check className="h-4 w-4" />
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
