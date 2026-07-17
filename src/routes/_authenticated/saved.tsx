import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { listKundlis, deleteKundli } from "@/lib/kundli-storage.functions";
import { Trash2, Sparkles, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saved")({
  component: SavedPage,
  head: () => ({ meta: [{ title: "Saved Kundlis — TAROMAYA" }] }),
});

type Saved = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  tz_offset: number;
  latitude: number;
  longitude: number;
  place: string | null;
  created_at: string;
};

function SavedPage() {
  const list = useServerFn(listKundlis);
  const del = useServerFn(deleteKundli);
  const router = useRouter();
  const [items, setItems] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void list().then((rows) => {
      setItems(rows as Saved[]);
      setLoading(false);
    });
  }, [list]);

  const onDelete = async (id: string) => {
    await del({ data: { id } });
    setItems(items.filter((i) => i.id !== id));
    router.invalidate();
  };

  return (
    <PageShell
      eyebrow="Library"
      title="Saved Kundlis"
      subtitle="Your saved birth charts. Open one to explore or share."
    >
      {loading && <div className="text-muted-foreground text-sm">Loading…</div>}
      {!loading && items.length === 0 && (
        <GlassCard title="No saved charts yet" desc="Compute a kundli and save it to see it here.">
          <Link to="/kundli" className="inline-flex items-center gap-2 text-gold hover:underline">
            <Sparkles className="h-4 w-4" /> Compute a new chart
          </Link>
        </GlassCard>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((k) => (
          <div key={k.id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl text-pearl">{k.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {k.birth_date} · {k.birth_time.slice(0, 5)} · UTC{k.tz_offset >= 0 ? "+" : ""}{k.tz_offset}
                </div>
                {k.place && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {k.place}
                  </div>
                )}
              </div>
              <button
                onClick={() => onDelete(k.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-red-300"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/kundli"
              search={{
                load: k.id,
              } as never}
              className="mt-4 inline-flex items-center gap-2 text-xs text-gold hover:underline"
            >
              Open chart <Sparkles className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
