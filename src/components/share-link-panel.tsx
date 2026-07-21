import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Link2, Loader2, Trash2, Eye } from "lucide-react";
import { createShareLink, listMyShares, deleteShare } from "@/lib/share.functions";

type Birth = {
  name: string;
  date: string;
  time: string;
  tz: string;
  lat: string;
  lon: string;
  place: string;
};

export function ShareLinkPanel({ birth }: { birth: Birth }) {
  const create = useServerFn(createShareLink);
  const list = useServerFn(listMyShares);
  const del = useServerFn(deleteShare);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [expDays, setExpDays] = useState<string>("30");

  const shares = useQuery({
    queryKey: ["my-shares"],
    queryFn: () => list(),
  });

  async function makeLink() {
    setBusy(true);
    try {
      const parsed = {
        display_name: birth.name?.trim() || "Cosmic Traveler",
        birth_date: birth.date,
        birth_time: birth.time.length === 5 ? `${birth.time}:00` : birth.time,
        tz_offset: Number(birth.tz),
        latitude: Number(birth.lat),
        longitude: Number(birth.lon),
        place: birth.place || undefined,
        kind: "kundli",
        expires_in_days: expDays ? Number(expDays) : undefined,
      };
      const res = await create({ data: parsed });
      const url = `${window.location.origin}/share/${res.token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Share link created & copied");
      qc.invalidateQueries({ queryKey: ["my-shares"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create share link");
    } finally {
      setBusy(false);
    }
  }

  async function copy(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Link copied");
  }

  async function remove(id: string) {
    try {
      await del({ data: { id } });
      qc.invalidateQueries({ queryKey: ["my-shares"] });
      toast.success("Share removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove share");
    }
  }

  return (
    <div className="glass mt-6 rounded-3xl border border-primary/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80">Share</div>
          <h3 className="mt-1 font-display text-xl">
            <span className="gold-text">Send your chart as a link</span>
          </h3>
          <p className="mt-1 text-sm text-foreground/70">
            A read-only public page — perfect for family, friends, or your astrologer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-foreground/70">
            Expires in
            <select
              value={expDays}
              onChange={(e) => setExpDays(e.target.value)}
              className="ml-2 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-foreground"
            >
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="">Never</option>
            </select>
          </label>
          <button
            onClick={makeLink}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-soft px-4 py-2 text-sm font-medium text-cosmic hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Create share link
          </button>
        </div>
      </div>

      {shares.data && shares.data.length > 0 && (
        <ul className="mt-5 space-y-2">
          {shares.data.map((s) => {
            const url = typeof window !== "undefined" ? `${window.location.origin}/share/${s.token}` : `/share/${s.token}`;
            const expired = s.expires_at && new Date(s.expires_at).getTime() < Date.now();
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground">
                    {s.display_name}
                    {expired && <span className="ml-2 text-[10px] uppercase tracking-widest text-rose-400">expired</span>}
                  </div>
                  <div className="truncate font-mono text-xs text-foreground/60">{url}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-foreground/70">
                  <Eye className="h-3.5 w-3.5" /> {s.views}
                </span>
                <button
                  onClick={() => copy(s.token)}
                  className="rounded-lg border border-white/10 bg-black/30 p-2 text-foreground/80 hover:text-primary"
                  aria-label="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="rounded-lg border border-white/10 bg-black/30 p-2 text-foreground/80 hover:text-rose-400"
                  aria-label="Delete share"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
