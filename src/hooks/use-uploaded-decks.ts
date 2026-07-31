import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DECK_LIST, prettyCardName, type DeckKey, type UploadedCard } from "@/lib/tarot-decks";

const BUCKET = "app-assets";

type StoredCard = { path: string; name: string };
type DeckValue = { name?: string; expected?: number; cards?: StoredCard[] };

export type UploadedDecks = Record<DeckKey, UploadedCard[]>;

function emptyDecks(): UploadedDecks {
  return Object.fromEntries(DECK_LIST.map((d) => [d.key, [] as UploadedCard[]])) as unknown as UploadedDecks;
}

/**
 * Loads every admin-uploaded deck (app_settings `decks.<key>`) and resolves
 * signed URLs for each card image in the private app-assets bucket.
 */
export function useUploadedDecks() {
  const [decks, setDecks] = useState<UploadedDecks>(emptyDecks);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const keys = DECK_LIST.map((d) => `decks.${d.key}`);
      const { data } = await supabase.from("app_settings").select("key, value").in("key", keys);
      const next = emptyDecks();

      await Promise.all(
        DECK_LIST.map(async (meta) => {
          const row = data?.find((r) => r.key === `decks.${meta.key}`);
          const stored = ((row?.value as DeckValue | null)?.cards ?? []) as StoredCard[];
          if (!stored.length) return;
          const { data: signed } = await supabase.storage
            .from(BUCKET)
            .createSignedUrls(stored.map((c) => c.path), 3600);
          next[meta.key] = stored
            .map((c, i) => {
              const url = signed?.[i]?.signedUrl;
              if (!url) return null;
              return {
                id: c.path,
                name: prettyCardName(c.name || c.path.split("/").pop() || `Card ${i + 1}`),
                image: url,
                deckKey: meta.key,
              } satisfies UploadedCard;
            })
            .filter(Boolean) as UploadedCard[];
        }),
      );

      setDecks(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Picture links stay good for 1 hour, so refresh them well before that.
    const t = setInterval(load, 40 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  // Decks where the admin has put in fewer pictures than the deck should have.
  const shortages = DECK_LIST.filter((d) => decks[d.key].length > 0 && decks[d.key].length < d.expected).map((d) => ({
    key: d.key,
    name: d.name,
    have: decks[d.key].length,
    expected: d.expected,
  }));

  return { decks, loading, reload: load, shortages };
}
