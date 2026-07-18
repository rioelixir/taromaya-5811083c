import { createFileRoute } from "@tanstack/react-router";
import { StarField } from "@/components/star-field";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Sparkles, Trash2, Plus, Search, X, Save,
  Wand2, Star as StarIcon, NotebookPen, Sun, Cog,
} from "lucide-react";
import {
  createJournalEntry, listJournalEntries, deleteJournalEntry, updateJournalEntry,
} from "@/lib/journal.functions";

export const Route = createFileRoute("/_authenticated/journal")({
  component: JournalPage,
  head: () => ({
    meta: [
      { title: "Journal — TAROMAYA" },
      { name: "description", content: "Your private cosmic journal — capture tarot pulls, AI insights, and reflections across moons." },
    ],
  }),
});

type Kind = "tarot" | "ai" | "note" | "kundli" | "horoscope";
type Entry = {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  mood: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  created_at: string;
};

const KIND_META: Record<Kind, { label: string; Icon: any; tint: string }> = {
  tarot: { label: "Tarot", Icon: Wand2, tint: "from-fuchsia-500/20 to-purple-500/10" },
  ai: { label: "AI Guide", Icon: Sparkles, tint: "from-amber-400/20 to-rose-400/10" },
  note: { label: "Note", Icon: NotebookPen, tint: "from-sky-400/15 to-indigo-400/10" },
  kundli: { label: "Kundli", Icon: StarIcon, tint: "from-emerald-400/20 to-teal-400/10" },
  horoscope: { label: "Horoscope", Icon: Sun, tint: "from-yellow-300/20 to-orange-400/10" },
};

const MOODS = ["✨ Radiant", "🌙 Reflective", "🔥 Fired up", "🌊 Tender", "🌑 Heavy", "🪷 Grateful"];

function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterKind, setFilterKind] = useState<Kind | "all">("all");
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await listJournalEntries();
      setEntries((rows ?? []) as Entry[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filterKind !== "all" && e.kind !== filterKind) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [entries, query, filterKind]);

  const openEntry = entries.find((e) => e.id === openId) ?? null;

  return (
    <div className="relative min-h-dvh">
      <StarField />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 pb-24">
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-widest text-gold">
            <BookOpen className="h-3 w-3" /> Cosmic Journal
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl gold-text">Your quiet ledger</h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Save readings, dreams and small omens. Search across moons; the pattern will show itself.
          </p>
        </header>

        {/* Toolbar */}
        <div className="glass rounded-2xl p-3 mb-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, body, or tag…"
              className="flex-1 bg-transparent outline-none text-sm text-pearl placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={filterKind === "all"} onClick={() => setFilterKind("all")}>All</FilterChip>
            {(Object.keys(KIND_META) as Kind[]).map((k) => {
              const { label, Icon } = KIND_META[k];
              return (
                <FilterChip key={k} active={filterKind === k} onClick={() => setFilterKind(k)}>
                  <Icon className="h-3 w-3" /> {label}
                </FilterChip>
              );
            })}
          </div>
          <button
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-4 py-2 rounded-full bg-gradient-to-br from-gold to-gold-soft text-cosmic font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> New entry
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <Cog className="h-6 w-6 mx-auto text-muted-foreground opacity-50" />
            <div className="mt-3 text-pearl/80 text-sm">
              {entries.length === 0
                ? "No entries yet. Save a tarot pull or write a note to begin."
                : "Nothing matches those filters."}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <EntryCard key={e.id} entry={e} onOpen={() => setOpenId(e.id)} />
            ))}
          </div>
        )}
      </div>

      {composing && (
        <Composer
          onClose={() => setComposing(false)}
          onSaved={async () => { setComposing(false); await reload(); }}
        />
      )}

      {openEntry && (
        <EntryModal
          entry={openEntry}
          onClose={() => setOpenId(null)}
          onDeleted={async () => { setOpenId(null); await reload(); }}
          onSaved={async () => { await reload(); }}
        />
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-widest transition-colors ${
        active
          ? "bg-gold text-cosmic border border-gold"
          : "border border-white/10 text-pearl/80 hover:border-gold/40"
      }`}
    >
      {children}
    </button>
  );
}

function EntryCard({ entry, onOpen }: { entry: Entry; onOpen: () => void }) {
  const meta = KIND_META[entry.kind];
  const { Icon } = meta;
  const dateStr = new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return (
    <button
      onClick={onOpen}
      className={`text-left glass rounded-2xl p-4 border border-white/10 hover:border-gold/40 transition-colors bg-gradient-to-br ${meta.tint}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold">
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        <span className="text-[10px] text-muted-foreground">{dateStr}</span>
      </div>
      <div className="font-display text-lg text-pearl leading-snug line-clamp-2">{entry.title}</div>
      {entry.body && (
        <div className="mt-2 text-xs text-pearl/70 line-clamp-3 whitespace-pre-wrap">{entry.body}</div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {entry.mood && <span className="text-[10px] rounded-full bg-white/10 px-2 py-0.5">{entry.mood}</span>}
        {entry.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-[10px] rounded-full border border-white/10 px-2 py-0.5 text-pearl/70">#{t}</span>
        ))}
      </div>
    </button>
  );
}

function Composer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<Kind>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true); setError(null);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20);
      await createJournalEntry({ data: { kind, title: title.trim(), body, mood, tags } });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="New entry">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(KIND_META) as Kind[]).map((k) => {
            const { label, Icon } = KIND_META[k];
            return (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-widest transition-colors ${
                  kind === k
                    ? "bg-gold text-cosmic border border-gold"
                    : "border border-white/10 text-pearl/80 hover:border-gold/40"
                }`}
              >
                <Icon className="h-3 w-3" /> {label}
              </button>
            );
          })}
        </div>
        <input
          value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
          placeholder="Title…"
          className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/40"
        />
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)} rows={7}
          placeholder="What did you notice? What did the cards say?"
          className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/40 resize-none"
        />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Mood</div>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? null : m)}
                className={`text-[11px] rounded-full px-3 py-1 border transition-colors ${
                  mood === m ? "bg-gold/20 border-gold text-gold" : "border-white/10 text-pearl/80 hover:border-gold/40"
                }`}
              >{m}</button>
            ))}
          </div>
        </div>
        <input
          value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (comma separated): love, mercury-rx, dream"
          className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-pearl outline-none focus:border-gold/40"
        />
        {error && <div className="text-xs text-red-300/90">{error}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 text-pearl/80">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || saving}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-4 py-2 rounded-full bg-gradient-to-br from-gold to-gold-soft text-cosmic font-medium disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function EntryModal({
  entry, onClose, onDeleted, onSaved,
}: { entry: Entry; onClose: () => void; onDeleted: () => void; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = KIND_META[entry.kind];
  const { Icon } = meta;

  const save = async () => {
    setSaving(true);
    try {
      await updateJournalEntry({ data: { id: entry.id, title, body } });
      setEditing(false);
      onSaved();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    setDeleting(true);
    try { await deleteJournalEntry({ data: { id: entry.id } }); onDeleted(); }
    finally { setDeleting(false); }
  };

  return (
    <ModalShell onClose={onClose} title={
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{meta.label}</span>
      </span>
    }>
      {editing ? (
        <div className="space-y-3">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/40"
          />
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)} rows={12}
            className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/40 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 text-pearl/80">Cancel</button>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-4 py-2 rounded-full bg-gradient-to-br from-gold to-gold-soft text-cosmic font-medium disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="font-display text-2xl text-pearl">{entry.title}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {new Date(entry.created_at).toLocaleString()}
              {entry.mood && <> · <span>{entry.mood}</span></>}
            </div>
          </div>
          {entry.body && (
            <div className="text-sm text-pearl/90 whitespace-pre-wrap leading-relaxed">{entry.body}</div>
          )}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((t) => (
                <span key={t} className="text-[10px] rounded-full border border-white/10 px-2 py-0.5 text-pearl/70">#{t}</span>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button onClick={remove} disabled={deleting}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-3 py-2 rounded-full border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> {deleting ? "…" : "Delete"}
            </button>
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-4 py-2 rounded-full bg-gradient-to-br from-gold to-gold-soft text-cosmic font-medium">
              Edit
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({ onClose, title, children }: { onClose: () => void; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-cosmic/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="text-sm text-pearl">{title}</div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-pearl">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
