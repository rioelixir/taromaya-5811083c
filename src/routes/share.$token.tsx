import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicShare } from "@/lib/share.functions";
import { computeKundli, RASHIS, NAKSHATRAS, formatDegree } from "@/lib/vedic";
import { NorthIndianChart, SouthIndianChart } from "@/components/rashi-chart";
import { Loader2, Eye, Calendar, MapPin, Sparkles } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/share/$token")({
  component: SharePage,
  head: ({ params }) => ({
    meta: [
      { title: "Shared Cosmic Chart — TAROMAYA" },
      { name: "description", content: "A shared birth chart from TAROMAYA — luxury Vedic astrology, live." },
      { property: "og:title", content: "A cosmic chart just for you" },
      { property: "og:description", content: "View this shared Vedic birth chart on TAROMAYA." },
      { name: "robots", content: "noindex" },
      { name: "share-token", content: params.token },
    ],
  }),
});

function SharePage() {
  const { token } = Route.useParams();
  const fetchShare = useServerFn(getPublicShare);
  const { data, isLoading, error } = useQuery({
    queryKey: ["share", token],
    queryFn: () => fetchShare({ data: { token } }),
    retry: false,
  });

  const chart = useMemo(() => {
    if (!data) return null;
    try {
      const [Y, M, D] = data.birth_date.split("-").map(Number);
      const [hh, mm] = data.birth_time.split(":").map(Number);
      const k = computeKundli({
        year: Y, month: M, day: D,
        hour: hh, minute: mm,
        tzOffsetHours: Number(data.tz_offset),
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      });
      const withHouses = {
        ...k,
        planets: k.planets.map((p) => ({
          ...p,
          house: ((p.rashi - k.ascendant.rashi + 12) % 12) + 1,
        })),
      };
      return withHouses;
    } catch {
      return null;
    }
  }, [data]);


  if (isLoading) {
    return (
      <main className="min-h-dvh grid place-items-center text-foreground" aria-busy="true">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Opening the shared chart…</span>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 text-center">
        <div className="max-w-md space-y-3" role="alert">
          <h1 className="font-display text-3xl gold-text">Link not available</h1>
          <p className="text-foreground">
            This share link may have expired or been removed by its owner.
          </p>
          <Link to="/" className="inline-block rounded-full border border-primary/60 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Explore TAROMAYA
          </Link>
        </div>
      </main>
    );
  }

  const moon = chart?.planets.find((p) => p.name === "Moon");

  return (
    <main className="min-h-dvh" aria-labelledby="share-heading">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <header className="text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary">Shared cosmic chart</div>
          <h1 id="share-heading" className="mt-2 font-display text-4xl sm:text-5xl">
            <span className="gold-text">{data.display_name}</span>
          </h1>
          <dl className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-foreground">
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <dt className="sr-only">Birth date and time</dt>
              <dd>{data.birth_date} · {data.birth_time.slice(0, 5)}</dd>
            </div>
            {data.place && (
              <div className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <dt className="sr-only">Place</dt>
                <dd>{data.place}</dd>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <dt className="sr-only">Views</dt>
              <dd>{data.views + 1} views</dd>
            </div>
          </dl>
        </header>

        {chart && (
          <>
            <section className="mt-8 glass rounded-3xl border border-primary/20 p-5" aria-labelledby="snapshot-heading">
              <h2 id="snapshot-heading" className="text-[10px] uppercase tracking-[0.35em] text-primary mb-3">Snapshot</h2>
              <div className="grid gap-2 sm:grid-cols-2 text-sm text-foreground">
                <div><span className="text-foreground/80">Ascendant:</span> {RASHIS[chart.ascendant.rashi]} · {formatDegree(chart.ascendant.degreeInRashi)}</div>
                <div><span className="text-foreground/80">Moon Nakshatra:</span> {NAKSHATRAS[chart.moonNakshatra.index]} · pada {chart.moonNakshatra.pada}</div>
                {moon && (
                  <div><span className="text-foreground/80">Moon Sign:</span> {RASHIS[moon.rashi]}</div>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-6 md:grid-cols-2" aria-label="Birth charts">
              <div className="glass rounded-3xl border border-primary/20 p-5">
                <NorthIndianChart chart={chart} title="Rashi · North Indian" />
              </div>
              <div className="glass rounded-3xl border border-primary/20 p-5">
                <SouthIndianChart chart={chart} title="Rashi · South Indian" />
              </div>
            </section>
          </>
        )}

        <footer className="mt-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Get your own chart on TAROMAYA
          </Link>
          {data.expires_at && (
            <p className="mt-3 text-xs text-foreground/80">
              This link expires {new Date(data.expires_at).toLocaleDateString()}
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
