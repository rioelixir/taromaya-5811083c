import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { StarField } from "@/components/star-field";

export const Route = createFileRoute("/ai")({
  component: AiPage,
  head: () => ({ meta: [{ title: "AI Guide — TAROMAYA" }] }),
});

function AiPage() {
  return (
    <div className="relative min-h-dvh">
      <StarField />
      <div className="relative z-10 w-full px-4 sm:px-6 pt-8 lg:pt-12 pb-32">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-widest text-gold">
            <Sparkles className="h-3 w-3" /> Personal AI Guide
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl gold-text">Ask the stars</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            Chat with your personal astrologer & tarot reader. Voice, vision, and memory —
            grounded in your birth chart.
          </p>
        </header>

        <div className="glass rounded-3xl p-4 min-h-[400px] flex flex-col gap-3">
          <Msg from="ai">
            Welcome, seeker. What's stirring in your heart today?
          </Msg>
        </div>

        <div className="fixed inset-x-0 bottom-16 lg:bottom-6 lg:left-64 z-20">
          <div className="w-full px-4">
            <div className="glass rounded-full flex items-center gap-2 p-1.5">
              <input
                placeholder="Ask about your day, your chart, a decision…"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-pearl outline-none placeholder:text-muted-foreground"
              />
              <button
                aria-label="Send"
                className="h-10 w-10 rounded-full grid place-items-center bg-gradient-to-br from-gold to-gold-soft text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Msg({ from, children }: { from: "ai" | "me"; children: React.ReactNode }) {
  const isAi = from === "ai";
  return (
    <div className={`flex ${isAi ? "" : "justify-end"}`}>
      <div
        className={
          isAi
            ? "max-w-[85%] rounded-2xl bg-gradient-to-br from-galaxy/25 to-midnight/30 gold-border px-4 py-3 text-sm text-pearl"
            : "max-w-[85%] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-pearl"
        }
      >
        {children}
      </div>
    </div>
  );
}
