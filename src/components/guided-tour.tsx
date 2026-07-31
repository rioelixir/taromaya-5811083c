// Lightweight in-app guided tour. Renders as a sequence of centered modal
// steps with next / prev / skip controls. No sound, no autoplay video —
// pure text tour that walks the user through the app.

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X, Compass } from "lucide-react";

export type TourStep = {
  title: string;
  body: string;
};

export const DEFAULT_TOUR: TourStep[] = [
  { title: "Welcome to TAROMAYA", body: "A luxury Vedic + Tarot studio. This 60-second tour shows you where everything lives." },
  { title: "1. Save your birth details once", body: "Open Birth Details from the menu and save your date, exact time, and place. Every module (Kundli, Dasha, Panchang, Numerology, Match Making) auto-fills from this." },
  { title: "2. Kundli", body: "Your full Vedic chart with North / South Indian diamonds, Vargas D1–D60, Vimshottari Dasha, Yogas, Doshas, Ashtakavarga, Shadbala, and KP sub-lords." },
  { title: "3. Tarot", body: "Draw from Rider-Waite, Nakshatra, Health, Lost & Found, or Soulmates decks with 1-card, Yes/No, Past-Present-Future, or freestyle spreads. No reversed cards, no reshuffling mid-draw." },
  { title: "4. AI Reading", body: "Every module has an AI interpretation in plain English (ELI10) or Hindi. Uses your chart directly — no vague generic text." },
  { title: "5. Voice", body: "Tap the microphone and speak — say a page name to move around, or tap a box first and speak to fill it in." },
  { title: "You’re ready", body: "Tap Skip anytime. You can restart this tour from How to Use TAROMAYA in the menu." },
];

const KEY = "taromaya:tour-seen-v1";

export function shouldAutoStartTour(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) !== "1";
}

export function markTourSeen() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, "1");
}

export function GuidedTour({
  open, onClose, steps = DEFAULT_TOUR,
}: { open: boolean; onClose: () => void; steps?: TourStep[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (open) setI(0); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, steps.length]);

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  const close = () => { markTourSeen(); onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tour-title" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
            <Compass className="h-4 w-4" /> Guided Tour · {i + 1}/{steps.length}
          </span>
          <button onClick={close} aria-label="Skip tour" className="rounded-full p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id="tour-title" className="mb-2 font-serif text-lg text-foreground">{step.title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{step.body}</p>
        <div className="flex items-center justify-between gap-2">
          <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground">Skip</button>
          <div className="flex gap-2">
            <button
              onClick={() => setI((v) => Math.max(0, v - 1))}
              disabled={i === 0}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs disabled:opacity-40"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <button
              onClick={() => (last ? close() : setI(i + 1))}
              className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/40 px-3 py-1 text-xs text-foreground hover:bg-primary/30"
            >
              {last ? "Finish" : (<>Next <ArrowRight className="h-3 w-3" /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
