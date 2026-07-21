import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/page-shell";
import { Loader2, Plus, Trash2, Save, ChevronLeft, Edit3, Sparkles, Layers, History } from "lucide-react";
import {
  adminListDecks,
  adminSaveDeck,
  adminDeleteDeck,
  adminListCards,
  adminSaveCard,
  adminDeleteCard,
  adminListPrompts,
  adminSavePrompt,
  adminDeletePrompt,
  adminListPromptVersions,
} from "@/lib/tarot-cms.functions";

// ================= TAROT CMS =================

type Deck = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  tagline: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
  language: string | null;
  difficulty: string | null;
  accent: string | null;
  glyph: string | null;
  card_back_url: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  guidebook_pdf_url: string | null;
  keywords: string[] | null;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
  is_featured: boolean;
  is_public: boolean;
};

type Card = {
  id: string;
  deck_id: string;
  position: number;
  name: string;
  arcana: string | null;
  suit: string | null;
  number: string | null;
  element: string | null;
  planet: string | null;
  zodiac: string | null;
  keywords: string[] | null;
  meaning_upright: string | null;
  meaning_reversed: string | null;
  advice: string | null;
  love: string | null;
  career: string | null;
  finance: string | null;
  health: string | null;
  spiritual: string | null;
  timing: string | null;
  affirmation: string | null;
  journal_prompt: string | null;
  front_image_url: string | null;
  back_image_url: string | null;
  is_active: boolean;
};

const emptyDeck = (): Partial<Deck> => ({
  slug: "", name: "", tagline: "", description: "", author: "", category: "classic",
  language: "en", difficulty: "beginner", accent: "#c9a94a", glyph: "✦",
  card_back_url: "", cover_url: "", thumbnail_url: "",
  keywords: [], sort_order: 100, is_active: true, is_premium: false, is_featured: false, is_public: true,
});

const emptyCard = (deckId: string): Partial<Card> => ({
  deck_id: deckId, position: 0, name: "", arcana: "major", suit: "", number: "",
  keywords: [], meaning_upright: "", meaning_reversed: "", advice: "",
  love: "", career: "", finance: "", health: "", spiritual: "",
  timing: "", affirmation: "", journal_prompt: "",
  front_image_url: "", back_image_url: "", is_active: true,
});

export function AdminTarotCmsTab() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDeck, setEditingDeck] = useState<Partial<Deck> | null>(null);
  const [managingDeck, setManagingDeck] = useState<Deck | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    adminListDecks().then((d) => setDecks(d as Deck[])).finally(() => setLoading(false));
  }, []);
  useEffect(refresh, [refresh]);

  if (managingDeck) {
    return <DeckCards deck={managingDeck} onBack={() => setManagingDeck(null)} />;
  }
  if (editingDeck) {
    return (
      <DeckForm
        deck={editingDeck}
        onCancel={() => setEditingDeck(null)}
        onSaved={() => { setEditingDeck(null); refresh(); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard title="Tarot Decks" desc="Create and edit decks. Cards live inside each deck.">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs text-muted-foreground">{decks.length} decks</div>
          <button
            onClick={() => setEditingDeck(emptyDeck())}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> New deck
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : decks.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-white/10 rounded-xl">
            No decks yet. Create your first deck to get started.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.map((d) => (
              <div key={d.id} className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-start gap-3">
                <div
                  className="h-14 w-14 rounded-lg grid place-items-center flex-shrink-0 text-2xl font-display"
                  style={{ background: `linear-gradient(135deg, ${d.accent ?? "#c9a94a"}33, transparent)`, color: d.accent ?? "#c9a94a" }}
                >{d.glyph ?? "✦"}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-pearl truncate">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">/{d.slug} · {d.category ?? "—"}</div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                    {d.is_active ? <Tag color="green">active</Tag> : <Tag color="gray">inactive</Tag>}
                    {d.is_premium && <Tag color="gold">premium</Tag>}
                    {d.is_featured && <Tag color="purple">featured</Tag>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setManagingDeck(d)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-pearl hover:bg-white/5"
                    ><Layers className="h-3 w-3" /> Cards</button>
                    <button
                      onClick={() => setEditingDeck(d)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-pearl hover:bg-white/5"
                    ><Edit3 className="h-3 w-3" /> Edit</button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete deck "${d.name}" and ALL its cards?`)) return;
                        await adminDeleteDeck({ data: { id: d.id } });
                        refresh();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    ><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Tag({ color, children }: { color: "green" | "gold" | "purple" | "gray"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: "text-aurora border-aurora/30 bg-aurora/10",
    gold: "text-gold border-gold/30 bg-gold/10",
    purple: "text-galaxy border-galaxy/30 bg-galaxy/10",
    gray: "text-muted-foreground border-white/10 bg-white/5",
  };
  return <span className={`rounded-full border px-1.5 py-0.5 ${map[color]}`}>{children}</span>;
}

function DeckForm({ deck, onCancel, onSaved }: { deck: Partial<Deck>; onCancel: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Partial<Deck>>(deck);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof Deck>(k: K, v: Deck[K] | null) => setD((s) => ({ ...s, [k]: v as any }));

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      await adminSaveDeck({ data: {
        id: d.id, slug: d.slug || "", name: d.name || "",
        short_name: d.short_name || null, tagline: d.tagline || null, description: d.description || null,
        author: d.author || null, category: d.category || null, language: d.language || null,
        difficulty: d.difficulty || null, accent: d.accent || null, glyph: d.glyph || null,
        card_back_url: d.card_back_url || null, cover_url: d.cover_url || null,
        thumbnail_url: d.thumbnail_url || null, guidebook_pdf_url: d.guidebook_pdf_url || null,
        keywords: d.keywords ?? [], sort_order: d.sort_order ?? 100,
        is_active: d.is_active ?? true, is_premium: d.is_premium ?? false,
        is_featured: d.is_featured ?? false, is_public: d.is_public ?? true,
      }});
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-pearl">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="font-display text-lg text-pearl">{d.id ? "Edit deck" : "New deck"}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name *"><Input value={d.name ?? ""} onChange={(v) => set("name", v)} /></Field>
        <Field label="Slug * (url-safe)"><Input value={d.slug ?? ""} onChange={(v) => set("slug", v.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))} /></Field>
        <Field label="Tagline"><Input value={d.tagline ?? ""} onChange={(v) => set("tagline", v)} /></Field>
        <Field label="Author"><Input value={d.author ?? ""} onChange={(v) => set("author", v)} /></Field>
        <Field label="Category"><Input value={d.category ?? ""} onChange={(v) => set("category", v)} placeholder="classic, nakshatra, healing…" /></Field>
        <Field label="Language"><Input value={d.language ?? ""} onChange={(v) => set("language", v)} placeholder="en" /></Field>
        <Field label="Difficulty"><Input value={d.difficulty ?? ""} onChange={(v) => set("difficulty", v)} placeholder="beginner, intermediate, advanced" /></Field>
        <Field label="Sort order"><Input value={String(d.sort_order ?? 100)} onChange={(v) => set("sort_order", Number(v) || 0)} /></Field>
        <Field label="Accent color (hex)"><Input value={d.accent ?? ""} onChange={(v) => set("accent", v)} placeholder="#c9a94a" /></Field>
        <Field label="Glyph (emoji/char)"><Input value={d.glyph ?? ""} onChange={(v) => set("glyph", v)} placeholder="✦" /></Field>
        <Field label="Card back URL"><Input value={d.card_back_url ?? ""} onChange={(v) => set("card_back_url", v)} placeholder="https://…" /></Field>
        <Field label="Cover URL"><Input value={d.cover_url ?? ""} onChange={(v) => set("cover_url", v)} placeholder="https://…" /></Field>
        <Field label="Thumbnail URL"><Input value={d.thumbnail_url ?? ""} onChange={(v) => set("thumbnail_url", v)} placeholder="https://…" /></Field>
        <Field label="Guidebook PDF URL"><Input value={d.guidebook_pdf_url ?? ""} onChange={(v) => set("guidebook_pdf_url", v)} placeholder="https://…" /></Field>
      </div>

      <Field label="Description" className="mt-3"><Textarea value={d.description ?? ""} onChange={(v) => set("description", v)} rows={3} /></Field>
      <Field label="Keywords (comma separated)" className="mt-3">
        <Input value={(d.keywords ?? []).join(", ")} onChange={(v) => set("keywords", v.split(",").map((s) => s.trim()).filter(Boolean))} />
      </Field>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Toggle label="Active" value={d.is_active ?? true} onChange={(v) => set("is_active", v)} />
        <Toggle label="Premium" value={d.is_premium ?? false} onChange={(v) => set("is_premium", v)} />
        <Toggle label="Featured" value={d.is_featured ?? false} onChange={(v) => set("is_featured", v)} />
        <Toggle label="Public" value={d.is_public ?? true} onChange={(v) => set("is_public", v)} />
      </div>

      {err && <div className="mt-3 text-xs text-red-300">{err}</div>}
      <div className="mt-4">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save deck
        </button>
      </div>
    </GlassCard>
  );
}

function DeckCards({ deck, onBack }: { deck: Deck; onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Card> | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    adminListCards({ data: { deckId: deck.id } }).then((c) => setCards(c as Card[])).finally(() => setLoading(false));
  }, [deck.id]);
  useEffect(refresh, [refresh]);

  if (editing) {
    return (
      <CardForm
        card={editing}
        deck={deck}
        onCancel={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }}
      />
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-pearl">
          <ChevronLeft className="h-4 w-4" /> Decks
        </button>
        <div className="font-display text-lg text-pearl flex-1">{deck.name} — cards ({cards.length})</div>
        <button
          onClick={() => setEditing(emptyCard(deck.id))}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-3 py-1.5 text-xs font-medium"
        ><Plus className="h-3 w-3" /> New card</button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading cards…</div>
      ) : cards.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-white/10 rounded-xl">
          No cards yet in this deck.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.id} className="rounded-lg border border-white/10 bg-black/30 p-3 flex items-start gap-3">
              <div className="h-14 w-10 rounded overflow-hidden bg-black/60 flex-shrink-0 grid place-items-center text-[9px] text-muted-foreground">
                {c.front_image_url ? <img src={c.front_image_url} alt="" className="h-full w-full object-cover" /> : "no img"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-pearl truncate">{c.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">#{c.position} · {c.arcana ?? ""} {c.suit ? `· ${c.suit}` : ""}</div>
                <div className="mt-2 flex gap-1">
                  <button onClick={() => setEditing(c)} className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-[10px] text-pearl hover:bg-white/5">
                    <Edit3 className="h-2.5 w-2.5" /> Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete card "${c.name}"?`)) return;
                      await adminDeleteCard({ data: { id: c.id } });
                      refresh();
                    }}
                    className="inline-flex items-center gap-1 rounded border border-red-500/20 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/10"
                  ><Trash2 className="h-2.5 w-2.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function CardForm({ card, deck, onCancel, onSaved }: { card: Partial<Card>; deck: Deck; onCancel: () => void; onSaved: () => void }) {
  const [c, setC] = useState<Partial<Card>>(card);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof Card>(k: K, v: Card[K] | null) => setC((s) => ({ ...s, [k]: v as any }));

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      await adminSaveCard({ data: {
        id: c.id, deck_id: deck.id,
        position: c.position ?? 0, name: c.name || "",
        arcana: c.arcana || null, suit: c.suit || null, number: c.number || null,
        element: c.element || null, planet: c.planet || null, zodiac: c.zodiac || null,
        keywords: c.keywords ?? [],
        meaning_upright: c.meaning_upright || null, meaning_reversed: c.meaning_reversed || null,
        advice: c.advice || null, love: c.love || null, career: c.career || null,
        finance: c.finance || null, health: c.health || null, spiritual: c.spiritual || null,
        timing: c.timing || null, affirmation: c.affirmation || null, journal_prompt: c.journal_prompt || null,
        front_image_url: c.front_image_url || null, back_image_url: c.back_image_url || null,
        is_active: c.is_active ?? true,
      }});
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-pearl">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="font-display text-lg text-pearl">{c.id ? "Edit card" : "New card"} — {deck.name}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name *"><Input value={c.name ?? ""} onChange={(v) => set("name", v)} /></Field>
        <Field label="Position"><Input value={String(c.position ?? 0)} onChange={(v) => set("position", Number(v) || 0)} /></Field>
        <Field label="Arcana"><Input value={c.arcana ?? ""} onChange={(v) => set("arcana", v)} placeholder="major, minor" /></Field>
        <Field label="Suit"><Input value={c.suit ?? ""} onChange={(v) => set("suit", v)} placeholder="wands, cups, swords, pentacles" /></Field>
        <Field label="Number"><Input value={c.number ?? ""} onChange={(v) => set("number", v)} placeholder="1, 2, Page, Queen…" /></Field>
        <Field label="Element"><Input value={c.element ?? ""} onChange={(v) => set("element", v)} /></Field>
        <Field label="Planet"><Input value={c.planet ?? ""} onChange={(v) => set("planet", v)} /></Field>
        <Field label="Zodiac"><Input value={c.zodiac ?? ""} onChange={(v) => set("zodiac", v)} /></Field>
        <Field label="Front image URL"><Input value={c.front_image_url ?? ""} onChange={(v) => set("front_image_url", v)} /></Field>
        <Field label="Back image URL"><Input value={c.back_image_url ?? ""} onChange={(v) => set("back_image_url", v)} /></Field>
      </div>

      <Field label="Keywords (comma separated)" className="mt-3">
        <Input value={(c.keywords ?? []).join(", ")} onChange={(v) => set("keywords", v.split(",").map((s) => s.trim()).filter(Boolean))} />
      </Field>

      <Field label="Meaning — upright" className="mt-3"><Textarea value={c.meaning_upright ?? ""} onChange={(v) => set("meaning_upright", v)} rows={3} /></Field>
      <Field label="Meaning — reversed" className="mt-3"><Textarea value={c.meaning_reversed ?? ""} onChange={(v) => set("meaning_reversed", v)} rows={2} /></Field>

      <div className="grid gap-3 sm:grid-cols-2 mt-3">
        <Field label="Love"><Textarea value={c.love ?? ""} onChange={(v) => set("love", v)} rows={2} /></Field>
        <Field label="Career"><Textarea value={c.career ?? ""} onChange={(v) => set("career", v)} rows={2} /></Field>
        <Field label="Finance"><Textarea value={c.finance ?? ""} onChange={(v) => set("finance", v)} rows={2} /></Field>
        <Field label="Health"><Textarea value={c.health ?? ""} onChange={(v) => set("health", v)} rows={2} /></Field>
        <Field label="Spiritual"><Textarea value={c.spiritual ?? ""} onChange={(v) => set("spiritual", v)} rows={2} /></Field>
        <Field label="Advice"><Textarea value={c.advice ?? ""} onChange={(v) => set("advice", v)} rows={2} /></Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mt-3">
        <Field label="Timing"><Input value={c.timing ?? ""} onChange={(v) => set("timing", v)} /></Field>
        <Field label="Affirmation"><Input value={c.affirmation ?? ""} onChange={(v) => set("affirmation", v)} /></Field>
        <Field label="Journal prompt"><Input value={c.journal_prompt ?? ""} onChange={(v) => set("journal_prompt", v)} /></Field>
      </div>

      <div className="mt-4">
        <Toggle label="Active" value={c.is_active ?? true} onChange={(v) => set("is_active", v)} />
      </div>

      {err && <div className="mt-3 text-xs text-red-300">{err}</div>}
      <div className="mt-4">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save card
        </button>
      </div>
    </GlassCard>
  );
}

// ================= AI PROMPTS =================

type Prompt = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  system_prompt: string;
  user_template: string;
  model: string;
  temperature: number;
  max_output_tokens: number | null;
  language: string | null;
  version: number;
  is_active: boolean;
  updated_at: string;
};

const emptyPrompt = (): Partial<Prompt> => ({
  key: "", label: "", description: "",
  system_prompt: "You are a helpful assistant.",
  user_template: "{{input}}",
  model: "google/gemini-3.1-flash-lite",
  temperature: 0.7, language: "en", is_active: true,
});

export function AdminPromptsTab() {
  const [rows, setRows] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Prompt> | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    adminListPrompts().then((d) => setRows(d as Prompt[])).finally(() => setLoading(false));
  }, []);
  useEffect(refresh, [refresh]);

  if (editing) {
    return <PromptForm prompt={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />;
  }

  return (
    <div className="space-y-4">
      <GlassCard title="AI Prompt Library" desc="Edit the system prompts and templates used throughout the app.">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs text-muted-foreground">{rows.length} prompts</div>
          <button
            onClick={() => setEditing(emptyPrompt())}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium"
          ><Plus className="h-4 w-4" /> New prompt</button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-white/10 rounded-xl">
            No prompts yet.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-gold flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="text-pearl">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{p.key} · {p.model} · v{p.version} · T={p.temperature}</div>
                  {p.description && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.description}</div>}
                </div>
                <div className="flex gap-1">
                  {p.is_active ? <Tag color="green">on</Tag> : <Tag color="gray">off</Tag>}
                  <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-[10px] text-pearl hover:bg-white/5">
                    <Edit3 className="h-2.5 w-2.5" /> Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete prompt "${p.label}"?`)) return;
                      await adminDeletePrompt({ data: { id: p.id } });
                      refresh();
                    }}
                    className="inline-flex items-center gap-1 rounded border border-red-500/20 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/10"
                  ><Trash2 className="h-2.5 w-2.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function PromptForm({ prompt, onCancel, onSaved }: { prompt: Partial<Prompt>; onCancel: () => void; onSaved: () => void }) {
  const [p, setP] = useState<Partial<Prompt>>(prompt);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[] | null>(null);

  const set = <K extends keyof Prompt>(k: K, v: Prompt[K] | null) => setP((s) => ({ ...s, [k]: v as any }));

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      await adminSavePrompt({ data: {
        id: p.id, key: p.key || "", label: p.label || "",
        description: p.description || null,
        system_prompt: p.system_prompt || "",
        user_template: p.user_template || "",
        model: p.model || "google/gemini-3.1-flash-lite",
        temperature: Number(p.temperature ?? 0.7),
        max_output_tokens: p.max_output_tokens ?? null,
        language: p.language || null,
        is_active: p.is_active ?? true,
      }});
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const loadVersions = async () => {
    if (!p.id) return;
    const v = await adminListPromptVersions({ data: { promptId: p.id } });
    setVersions(v as any[]);
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-pearl">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="font-display text-lg text-pearl">{p.id ? "Edit prompt" : "New prompt"}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Key * (unique, e.g. tarot.reading)"><Input value={p.key ?? ""} onChange={(v) => set("key", v)} /></Field>
        <Field label="Label *"><Input value={p.label ?? ""} onChange={(v) => set("label", v)} /></Field>
        <Field label="Model"><Input value={p.model ?? ""} onChange={(v) => set("model", v)} placeholder="google/gemini-3.1-flash-lite" /></Field>
        <Field label="Temperature (0–2)"><Input value={String(p.temperature ?? 0.7)} onChange={(v) => set("temperature", Number(v))} /></Field>
      </div>

      <Field label="Description" className="mt-3"><Textarea value={p.description ?? ""} onChange={(v) => set("description", v)} rows={2} /></Field>
      <Field label="System prompt" className="mt-3"><Textarea value={p.system_prompt ?? ""} onChange={(v) => set("system_prompt", v)} rows={6} mono /></Field>
      <Field label="User template (supports placeholders like {{name}})" className="mt-3"><Textarea value={p.user_template ?? ""} onChange={(v) => set("user_template", v)} rows={5} mono /></Field>

      <div className="mt-4"><Toggle label="Active" value={p.is_active ?? true} onChange={(v) => set("is_active", v)} /></div>

      {err && <div className="mt-3 text-xs text-red-300">{err}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic px-4 py-2 text-sm font-medium disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save prompt
        </button>
        {p.id && (
          <button onClick={loadVersions} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-pearl hover:bg-white/5">
            <History className="h-4 w-4" /> View history
          </button>
        )}
      </div>

      {versions && (
        <div className="mt-4 space-y-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Version history</div>
          {versions.length === 0 ? (
            <div className="text-xs text-muted-foreground">No older versions saved yet.</div>
          ) : versions.map((v) => (
            <details key={v.id} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <summary className="cursor-pointer text-xs text-pearl">v{v.version} · {new Date(v.created_at).toLocaleString()} · {v.model}</summary>
              <div className="mt-2 space-y-2">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">System</div>
                  <pre className="text-[11px] text-pearl whitespace-pre-wrap font-mono">{v.system_prompt}</pre>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Template</div>
                  <pre className="text-[11px] text-pearl whitespace-pre-wrap font-mono">{v.user_template}</pre>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ================= reusable primitives =================

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
    />
  );
}

function Textarea({ value, onChange, rows = 3, mono = false }: { value: string; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      spellCheck={false}
      className={`w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-pearl focus:outline-none focus:border-gold/50 ${mono ? "font-mono text-xs" : ""}`}
    />
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`h-5 w-9 rounded-full transition-colors ${value ? "bg-gold" : "bg-white/10"} relative`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
      </button>
      <span className="text-xs text-pearl">{label}</span>
    </label>
  );
}
