// Full Parashari Vargas suite + Vimshottari Dasha tree UI.
// Consumes the normalized chart from astro-provider.server.

import { useMemo, useState } from "react";
import { vargaSign } from "@/lib/vargas";
import { NorthIndianChart, SouthIndianChart } from "@/components/rashi-chart";
import { dashaNarrative, vargaNarrative } from "@/lib/vedic-narrative";
import { computeVimshottari, type DashaTree, type MahaPeriod, type AntarPeriod, type DashaPeriod } from "@/lib/vedic-extended";

type NP = {
  name: string;
  longitude: number;
  rashi: number;
  house: number;
  degreeInRashi: number;
  retrograde?: boolean;
  combust?: boolean;
  exalted?: boolean;
  debilitated?: boolean;
};
type Chart = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: NP[];
};

const VARGAS: { n: number; code: string; name: string }[] = [
  { n: 1,  code: "D1",  name: "Rashi · overall life" },
  { n: 2,  code: "D2",  name: "Hora · wealth" },
  { n: 3,  code: "D3",  name: "Drekkana · siblings" },
  { n: 4,  code: "D4",  name: "Chaturthamsa · home & property" },
  { n: 5,  code: "D5",  name: "Panchamsa · fame & authority" },
  { n: 6,  code: "D6",  name: "Shashtamsa · health" },
  { n: 7,  code: "D7",  name: "Saptamsa · progeny" },
  { n: 8,  code: "D8",  name: "Ashtamsa · sudden events" },
  { n: 9,  code: "D9",  name: "Navamsha · spouse & dharma" },
  { n: 10, code: "D10", name: "Dashamsa · career" },
  { n: 11, code: "D11", name: "Rudramsa · gains & income" },
  { n: 12, code: "D12", name: "Dwadashamsa · parents" },
  { n: 16, code: "D16", name: "Shodashamsha · vehicles" },
  { n: 20, code: "D20", name: "Vimshamsa · spirituality" },
  { n: 24, code: "D24", name: "Chaturvimshamsha · learning" },
  { n: 27, code: "D27", name: "Nakshatramsa · strengths" },
  { n: 30, code: "D30", name: "Trimshamsa · afflictions" },
  { n: 40, code: "D40", name: "Khavedamsa · maternal" },
  { n: 45, code: "D45", name: "Akshavedamsa · paternal" },
  { n: 60, code: "D60", name: "Shashtiamsa · karma" },
];


function toVarga(chart: Chart, n: number): Chart {
  if (n === 1) return chart;
  const ascLon = chart.ascendant.rashi * 30 + chart.ascendant.degreeInRashi;
  const ascV = vargaSign(ascLon, n);
  const planets: NP[] = chart.planets.map((p) => {
    const s = vargaSign(p.longitude, n);
    const house = ((s - ascV + 12) % 12) + 1;
    return { ...p, rashi: s, house };
  });
  return { ascendant: { rashi: ascV, degreeInRashi: 0 }, planets };
}

export function VargaExplorer({ chart }: { chart: Chart }) {
  const [n, setN] = useState<number>(1);
  const [style, setStyle] = useState<"north" | "south">("north");
  const varga = useMemo(() => toVarga(chart, n), [chart, n]);
  const meta = VARGAS.find((v) => v.n === n)!;

  return (
    <div className="glass-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg">Vargas · Divisional charts</h3>
        <div className="inline-flex overflow-hidden rounded-full border border-border/50 bg-background/40 text-xs">
          <button onClick={() => setStyle("north")} className={`px-3 py-1.5 ${style === "north" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>North</button>
          <button onClick={() => setStyle("south")} className={`px-3 py-1.5 ${style === "south" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>South</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {VARGAS.map((v) => (
          <button
            key={v.n}
            onClick={() => setN(v.n)}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
              n === v.n
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {v.code}
          </button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">{meta.code} — {meta.name}</div>
      {style === "north" ? (
        <NorthIndianChart chart={varga} />
      ) : (
        <SouthIndianChart chart={varga} />
      )}
      <div className="space-y-3 border-t border-border/20 pt-3 text-sm leading-relaxed">
        {vargaNarrative(n, varga.ascendant.rashi, varga.planets).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}

// ── Dasha tree ────────────────────────────────────────────────────────────────

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function PratRow({ p, now }: { p: DashaPeriod; now: Date }) {
  const active = now >= p.start && now < p.end;
  return (
    <div className={`flex items-center justify-between gap-2 rounded px-2 py-0.5 font-mono text-[11px] ${active ? "bg-primary/15 text-primary" : ""}`}>
      <span>{p.lord}</span>
      <span className="text-right text-muted-foreground">{fmt(p.start)} → {fmt(p.end)}</span>
    </div>
  );
}

function AntarRow({ a, now, isOpen, onToggle }: { a: AntarPeriod; now: Date; isOpen: boolean; onToggle: () => void }) {
  const active = now >= a.start && now < a.end;
  return (
    <div className="rounded-lg border border-border/30">
      <button onClick={onToggle} className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left font-mono text-xs ${active ? "bg-primary/10 text-primary" : ""}`}>
        <span>{isOpen ? "▾" : "▸"} {a.lord} <span className="text-muted-foreground">antar</span></span>
        <span className="text-muted-foreground">{fmt(a.start)} → {fmt(a.end)}</span>
      </button>
      {isOpen && <div className="space-y-0.5 border-t border-border/20 px-3 py-2">
        {a.pratyantar.map((p) => <PratRow key={p.lord + p.start.getTime()} p={p} now={now} />)}
      </div>}
    </div>
  );
}

function MahaCard({ m, now }: { m: MahaPeriod; now: Date }) {
  const active = now >= m.start && now < m.end;
  const [open, setOpen] = useState(active);
  const [openAntar, setOpenAntar] = useState<string | null>(null);
  return (
    <div className={`rounded-lg border ${active ? "border-primary/60 bg-primary/5" : "border-border/40"}`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="font-serif text-sm">
          {open ? "▾" : "▸"} <span className={active ? "text-primary" : ""}>{m.lord}</span>
          <span className="ml-2 text-xs text-muted-foreground">mahadasha · {m.years.toFixed(0)}y</span>
        </span>
        <span className="font-mono text-xs text-muted-foreground">{fmt(m.start)} → {fmt(m.end)}</span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-border/20 px-3 py-2">
          {m.antar.map((a) => (
            <AntarRow
              key={a.lord + a.start.getTime()}
              a={a}
              now={now}
              isOpen={openAntar === a.lord + a.start.getTime()}
              onToggle={() =>
                setOpenAntar((cur) => (cur === a.lord + a.start.getTime() ? null : a.lord + a.start.getTime()))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

const DASHA_SYSTEMS = [
  { key: "vimshottari", label: "Vimshottari", note: "The 120-year nakshatra cycle used as the primary timing system in Parashari practice." },
  { key: "ashtottari", label: "Ashtottari", note: "A 108-year cycle read as a second opinion, especially where Rahu and the night-birth conditions apply." },
  { key: "yogini", label: "Yogini", note: "A 36-year cycle of eight yoginis, valued for short-range timing and day-to-day tendencies." },
] as const;
type DashaSystemKey = (typeof DASHA_SYSTEMS)[number]["key"];

export function DashaTimeline({
  birthDate, moonLongitude,
}: { birthDate: Date; moonLongitude: number }) {
  const now = new Date();
  const [system, setSystem] = useState<DashaSystemKey>("vimshottari");
  const meta = DASHA_SYSTEMS.find((s) => s.key === system)!;
  const tree: DashaTree = useMemo(() => {
    const NAK_SPAN = 360 / 27;
    const nakIndex = Math.floor(((moonLongitude % 360) + 360) % 360 / NAK_SPAN);
    const degInNak = (((moonLongitude % 360) + 360) % 360) - nakIndex * NAK_SPAN;
    if (system === "ashtottari") return computeAshtottari(birthDate, nakIndex, degInNak);
    if (system === "yogini") return computeYogini(birthDate, nakIndex, degInNak);
    return computeVimshottari(birthDate, nakIndex, degInNak);
  }, [birthDate, moonLongitude, system]);

  return (
    <div className="glass-card space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg">{meta.label} Dasha</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {tree.currentMaha.lord} · {tree.currentAntar.lord} · {tree.currentPratyantar.lord}
        </span>
      </div>
      <div className="inline-flex overflow-hidden rounded-full border border-border/50 bg-background/40 text-xs">
        {DASHA_SYSTEMS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSystem(s.key)}
            className={`min-h-11 px-4 py-2 transition ${system === s.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{meta.note}</p>
      <div className="space-y-3 text-sm leading-relaxed">
        {dashaNarrative(
          tree.currentMaha.lord,
          tree.currentAntar.lord,
          tree.currentPratyantar.lord,
          tree.currentAntar.end,
        ).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="space-y-2">
        {tree.maha.map((m) => (
          <MahaCard key={m.lord + m.start.getTime()} m={m} now={now} />
        ))}
      </div>
    </div>
  );
}
