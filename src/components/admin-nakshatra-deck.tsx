import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/page-shell";
import { Loader2, Check } from "lucide-react";
import { NAKSHATRAS } from "@/lib/vedic";
import { nakshatraProfile } from "@/lib/nakshatra-deep";
import { NAKSHATRA_META_KEY, cardForNakshatra, type NakshatraMetaMap } from "@/lib/nakshatra-deck";
import { useUploadedDecks } from "@/hooks/use-uploaded-decks";

/**
 * Nakshatra Deck Manager — pick the picture, title, keywords and meaning for
 * each of the 27 birth stars. Pictures come from the cards uploaded in
 * Admin → Assets → Nakshatra Deck. Saving updates the app right away.
 */
export function AdminNakshatraDeckTab() {
  const { decks, loading } = useUploadedDecks();
  const cards = decks["nakshatra"] ?? [];
  const [meta, setMeta] = useState<NakshatraMetaMap>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", NAKSHATRA_META_KEY)
      .maybeSingle()
      .then(({ data }) =>
        setMeta(((data?.value as NakshatraMetaMap | null) ?? {}) as NakshatraMetaMap),
      );
  }, []);

  const rows = useMemo(() => {
    return NAKSHATRAS.map((name, i) => {
      const m = meta[String(i)] ?? {};
      return { i, name, m, card: cardForNakshatra(i, cards, m), order: m.order ?? i };
    }).sort((a, b) => a.order - b.order);
  }, [meta, cards]);

  const patch = (i: number, next: Partial<NakshatraMetaMap[string]>) => {
    setSaved(false);
    setMeta((prev) => ({ ...prev, [String(i)]: { ...(prev[String(i)] ?? {}), ...next } }));
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const { error } = await supabase.from("app_settings").upsert({
        key: NAKSHATRA_META_KEY,
        value: meta,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard
      title="Nakshatra Deck Manager"
      desc="One card for each of the 27 birth stars. Upload the pictures in Assets, then set the picture, title, keywords and meaning here."
    >
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          {loading ? "Loading cards…" : `${cards.length} pictures uploaded`}
        </span>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-4 py-2 text-sm font-medium text-cosmic disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save
        </button>
        {saved && <span className="text-xs text-emerald-300">Saved</span>}
        {err && <span className="text-xs text-red-300">{err}</span>}
      </div>

      <div className="space-y-3">
        {rows.map(({ i, name, m, card }) => (
          <div
            key={i}
            className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 sm:grid-cols-[92px_1fr]"
          >
            <div
              className="relative overflow-hidden rounded-xl border border-white/10 bg-black"
              style={{ aspectRatio: "2 / 3" }}
            >
              {card ? (
                <img
                  src={card.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                  No picture
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-gold/80">
                  {i + 1}. {name}
                </span>
                <label className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={m.enabled !== false}
                    onChange={(e) => patch(i, { enabled: e.target.checked })}
                  />
                  Show
                </label>
                <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  Order
                  <input
                    type="number"
                    value={m.order ?? i}
                    onChange={(e) => patch(i, { order: Number(e.target.value) })}
                    className="w-14 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-pearl"
                  />
                </label>
              </div>
              <select
                value={m.path ?? card?.id ?? ""}
                onChange={(e) => patch(i, { path: e.target.value || undefined })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-pearl"
              >
                <option value="">Match by card name</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={m.title ?? ""}
                onChange={(e) => patch(i, { title: e.target.value })}
                placeholder={`Title (default: ${name})`}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-pearl"
              />
              <input
                value={(m.keywords ?? []).join(", ")}
                onChange={(e) =>
                  patch(i, {
                    keywords: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={`Keywords, comma separated (default: ${nakshatraProfile(i).strengths.slice(0, 4).join(", ")})`}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-pearl"
              />
              <textarea
                value={m.meaning ?? ""}
                onChange={(e) => patch(i, { meaning: e.target.value })}
                rows={2}
                placeholder={`Short meaning (default: ${nakshatraProfile(i).deityShort})`}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-pearl"
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
