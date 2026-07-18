import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeKundli } from "@/lib/vedic";
import { horaryRowByNumber, kp249Table } from "@/lib/horary-249";
import { kpBreakdown, rulingPlanets, cuspalSignificators, KP_RASHIS, KP_NAKSHATRAS } from "@/lib/kp";
import { NorthIndianChart } from "@/components/rashi-chart";

export const Route = createFileRoute("/_authenticated/prashna")({
  head: () => ({
    meta: [
      { title: "Prashna · Horary — TAROMAYA" },
      { name: "description", content: "KP horary system: 1–249 sub-lord chart with ruling-planet verdict for question timing." },
    ],
  }),
  component: PrashnaPage,
});

const RASHI = KP_RASHIS;

function tzHours() {
  return -new Date().getTimezoneOffset() / 60;
}

function PrashnaPage() {
  const [num, setNum] = useState<number>(1);
  const [lat, setLat] = useState<number>(28.6139);
  const [lon, setLon] = useState<number>(77.209);
  const [place, setPlace] = useState<string>("New Delhi");
  const [question, setQuestion] = useState("");
  const [computed, setComputed] = useState<{
    at: Date;
    horaryNumber: number;
    horaryLon: number;
  } | null>(null);

  const table = useMemo(() => kp249Table(), []);

  const chart = useMemo(() => {
    if (!computed) return null;
    const d = computed.at;
    return computeKundli({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes(),
      seconds: d.getSeconds(),
      tzOffsetHours: tzHours(),
      latitude: lat,
      longitude: lon,
    });
  }, [computed, lat, lon]);

  // Overlay: replace natural Lagna with the horary sub midpoint.
  const horaryChart = useMemo(() => {
    if (!chart || !computed) return null;
    const midLon = computed.horaryLon;
    const rashi = Math.floor(midLon / 30);
    const degIn = midLon - rashi * 30;

    // Recompute houses whole-sign from this new Lagna.
    const planets = chart.planets.map((p) => ({
      ...p,
      house: ((p.rashi - rashi + 12) % 12) + 1,
    }));

    return {
      ascendant: { longitude: midLon, rashi, degreeInRashi: degIn },
      planets,
    };
  }, [chart, computed]);

  const ruling = useMemo(() => {
    if (!chart || !horaryChart) return null;
    const moon = chart.planets.find((p) => p.name === "Moon");
    if (!moon) return null;
    return rulingPlanets(new Date(), horaryChart.ascendant.longitude, moon.longitude);
  }, [chart, horaryChart]);

  const cuspal = useMemo(() => (horaryChart ? cuspalSignificators(horaryChart as any) : null), [horaryChart]);

  function submit() {
    const row = horaryRowByNumber(num);
    if (!row) return;
    const midLon = (row.startLon + row.endLon) / 2;
    setComputed({ at: new Date(), horaryNumber: num, horaryLon: midLon });
  }

  return (
    <PageShell title="Prashna · Horary" subtitle="KP 1–249 · Question-time chart · Ruling Planet verdict">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="glass-card space-y-4 p-4">
          <div>
            <h3 className="font-serif text-lg">Ask a question</h3>
            <p className="text-xs text-muted-foreground">
              Pick a number from 1 to 249 the instant your question arrives. The
              chart is cast for this moment at your location.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Your question</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Will the offer come through this month?" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Number (1–249)</Label>
              <Input type="number" min={1} max={249} value={num} onChange={(e) => setNum(Math.max(1, Math.min(249, Number(e.target.value) || 1)))} />
            </div>
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input type="number" step="0.0001" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input type="number" step="0.0001" value={lon} onChange={(e) => setLon(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Place</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>

          <Button onClick={submit} className="w-full">Cast Horary Chart</Button>

          {computed && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Horary sub for #{computed.horaryNumber}</div>
              {(() => {
                const row = table[computed.horaryNumber - 1];
                return (
                  <div className="mt-1 font-mono">
                    {RASHI[row.sign]} · {KP_NAKSHATRAS[row.nakshatra]} · Star {row.starLord} · Sub {row.subLord}
                    <div className="text-[10px] text-muted-foreground">
                      {row.startLon.toFixed(3)}° – {row.endLon.toFixed(3)}° · Lagna set at midpoint
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>

        {computed && horaryChart && (
          <div className="space-y-4">
            <NorthIndianChart chart={horaryChart as any} title={`Horary D1 · ${place}`} />

            {ruling && (
              <Card className="glass-card space-y-2 p-4 text-xs">
                <div>
                  <h3 className="font-serif text-base">Ruling Planets</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Snapshot for the moment the question was asked.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono">
                  <span className="text-muted-foreground">Day lord</span><span>{ruling.weekdayLord}</span>
                  <span className="text-muted-foreground">Moon sign / star / sub</span>
                  <span>{ruling.moonSignLord} · {ruling.moonStarLord} · {ruling.moonSubLord}</span>
                  <span className="text-muted-foreground">Lagna sign / star / sub</span>
                  <span>{ruling.ascSignLord} · {ruling.ascStarLord} · {ruling.ascSubLord}</span>
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Combined RP</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {ruling.combined.map((n) => (
                      <span key={n} className="rounded-full border border-border/40 bg-background/40 px-2 py-0.5 font-mono text-[10px]">{n}</span>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {cuspal && (
              <Card className="glass-card space-y-2 p-4 text-xs">
                <div>
                  <h3 className="font-serif text-base">Verdict — Cuspal Significators</h3>
                  <p className="text-[11px] text-muted-foreground">
                    A house "promises" its matter when its cuspal sub-lord signifies
                    the relevant houses. Match your question to the primary house
                    (marriage → 7, career → 10, litigation → 6, journey → 3/9…).
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-md border border-border/40">
                  <table className="w-full text-[11px]">
                    <thead className="bg-background/40 text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-left">H</th>
                        <th className="px-2 py-1.5 text-left">Sign</th>
                        <th className="px-2 py-1.5 text-left">Cuspal Sub</th>
                        <th className="px-2 py-1.5 text-left">Significators</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {cuspal.map((row) => {
                        const cuspLon = (horaryChart.ascendant.longitude + (row.house - 1) * 30) % 360;
                        const bd = kpBreakdown(cuspLon);
                        return (
                          <tr key={row.house} className="border-t border-border/30">
                            <td className="px-2 py-1.5 text-primary">{row.house}</td>
                            <td className="px-2 py-1.5">{RASHI[row.sign]}</td>
                            <td className="px-2 py-1.5">{bd.subLord}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{row.combined.join(", ")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
