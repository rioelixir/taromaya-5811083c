import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles, RotateCcw, Star, ChevronDown, BookmarkPlus, Check } from "lucide-react";
import { StarField } from "@/components/star-field";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listKundlis } from "@/lib/kundli-storage.functions";
import { buildGuideContext, GUIDE_SYSTEM_PROMPT, type SavedKundliRow } from "@/lib/ai-context";
import { createJournalEntry } from "@/lib/journal.functions";
import { PlainAIText } from "@/components/plain-ai-text";


export const Route = createFileRoute("/ai")({
  component: () => (<PremiumGate featureName="Ai"><AiPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "AI Guide — TAROMAYA" },
      { name: "description", content: "Chat with your personal AI astrologer & tarot reader — grounded in your real birth chart and today's sky." },
    ],
  }),
});

const STORAGE_KEY = "taromaya.ai.conversation.v1";

function loadInitial(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function AiPage() {
  const [kundlis, setKundlis] = useState<SavedKundliRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [initialMessages] = useState<UIMessage[]>(() => loadInitial());
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load user's saved charts.
  useEffect(() => {
    listKundlis().then((rows: any[]) => {
      setKundlis(rows as SavedKundliRow[]);
      const primary = rows.find((r) => r.is_primary) ?? rows[0];
      if (primary) setSelectedId(primary.id);
    }).catch(() => {});
  }, []);

  const selectedRow = useMemo(
    () => kundlis.find((k: any) => k.id === selectedId) ?? null,
    [kundlis, selectedId],
  );

  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    headers: async (): Promise<Record<string, string>> => {
      const { data } = await supabase.auth.getSession();
      const t = data.session?.access_token;
      return t ? { Authorization: `Bearer ${t}` } : {};
    },

    body: () => ({
      context: buildGuideContext(selectedRow),
      system: `${GUIDE_SYSTEM_PROMPT}\n\n${aiLanguageRule(langRef.current)}`,
    }),
  }), [selectedRow]);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "taromaya-guide",
    messages: initialMessages,
    transport,
    onError: (e) => setError(e?.message ?? "Something went wrong"),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Persist conversation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Autoscroll.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Focus.
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (!isLoading) inputRef.current?.focus(); }, [isLoading]);

  const send = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setError(null);
    setInput("");
    sendMessage({ text });
  };

  const reset = () => {
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  };

  const suggestions = [
    "What does my Lagna say about how I show up in the world?",
    "How will the next two weeks feel for me?",
    "Should I trust my instincts on a career decision?",
    "Pull a tarot card for tonight and interpret it.",
  ];

  return (
    <div className="relative min-h-dvh">
      <StarField />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 pt-6 pb-40">
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-widest text-gold">
            <Sparkles className="h-3 w-3" /> Personal AI Guide
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl gold-text">Ask the stars</h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Grounded in your birth chart and today's sky. Not a substitute for medical, legal or financial advice.
          </p>
        </header>

        {/* Chart selector */}
        <div className="glass rounded-2xl p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Grounded in</div>
            {kundlis.length > 0 ? (
              <div className="relative mt-0.5">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full appearance-none bg-transparent text-pearl text-sm pr-6 py-1 outline-none"
                >
                  {kundlis.map((k: any) => (
                    <option key={k.id} value={k.id} className="bg-cosmic">
                      {k.name} · {k.place || `${k.latitude.toFixed(1)},${k.longitude.toFixed(1)}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1.5 h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No saved kundli yet. <a href="/kundli" className="text-gold underline">Save one</a> to personalise readings.
              </div>
            )}
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-pearl transition-colors px-3 py-1.5 rounded-full border border-white/10"
          >
            <RotateCcw className="h-3 w-3" /> New chat
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="glass rounded-3xl p-4 min-h-[420px] max-h-[65vh] overflow-y-auto flex flex-col gap-3"
        >
          {messages.length === 0 && (
            <div className="m-auto text-center py-8 space-y-4">
              <div className="text-pearl/80 text-sm">Welcome, seeker. What's stirring in your heart today?</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left text-xs text-pearl/90 rounded-2xl border border-white/10 hover:border-gold/40 bg-white/[0.02] px-3 py-2 transition-colors"
                  >
                    <Star className="inline h-3 w-3 text-gold mr-1.5" />{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex">
              <div className="rounded-2xl bg-gradient-to-br from-galaxy/25 to-midnight/30 gold-border px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-300/90 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-4 z-20">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="glass rounded-3xl flex items-end gap-2 p-2 border border-white/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask about your day, your chart, a decision…"
              className="flex-1 max-h-40 resize-none bg-transparent px-3 py-2.5 text-sm text-pearl outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={send}
              disabled={isLoading || !input.trim()}
              aria-label="Send"
              className="h-10 w-10 shrink-0 rounded-2xl grid place-items-center bg-gradient-to-br from-gold to-gold-soft text-cosmic disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: UIMessage }) {
  const isAi = m.role !== "user";
  const text = m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveToJournal = async () => {
    if (saving || saved || !text.trim()) return;
    setSaving(true);
    try {
      const title = text.split("\n").find((l) => l.trim())?.slice(0, 100) || "AI reflection";
      await createJournalEntry({ data: { kind: "ai", title, body: text, tags: ["ai-guide"] } });
      setSaved(true);
    } catch {
      // silent — user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex ${isAi ? "" : "justify-end"} group`}>
      <div
        className={
          isAi
            ? "max-w-[92%] sm:max-w-[85%] rounded-2xl bg-gradient-to-br from-galaxy/25 to-midnight/30 gold-border px-4 py-3 text-sm text-pearl relative"
            : "max-w-[92%] sm:max-w-[85%] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-pearl whitespace-pre-wrap"
        }
      >
        {isAi ? <PlainAIText text={text} label="Assistant reply" /> : text}
        {isAi && text.trim() && (
          <button
            onClick={saveToJournal}
            disabled={saving || saved}
            title={saved ? "Saved to Journal" : "Save to Journal"}
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full grid place-items-center bg-cosmic/80 border border-gold/40 text-gold opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}


function TypingDots() {
  return (
    <div className="flex gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}
