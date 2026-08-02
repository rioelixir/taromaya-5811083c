import { useMemo, useState } from "react";
import { GlassCard } from "@/components/page-shell";
import { Explain } from "@/components/explain";
import { DataTable, type Column } from "@/components/data-table";
import {
  nameChart, nameHarmony, spellingOptions, ROOT_MEANINGS,
  type NameSystem, type WordChart,
} from "@/lib/name-numerology-pro";
import {
  birthNumbers, dashaAt, mahadashaTimeline, personalCycles,
  predictForDate, multiYearForecast, currentGrid, practicalGuidance,
  NUMBER_PLANET, GRID_ORDER, type Period,
} from "@/lib/numerology-dasha";
import { kabbalahReading, HEBREW_LETTERS } from "@/lib/kabbalah-tarot";

const fmt = (d: Date) =>
  `${d.getUTCDate().toString().padStart(2, "0")} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ${d.getUTCFullYear()}`;

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 text-base last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right text-pearl">{v}</span>
    </div>
  );
}

type FieldValue = { field: string; value: React.ReactNode };

const FV_COLUMNS: Column<FieldValue>[] = [
  { header: "Field", cell: (r: FieldValue) => r.field, className: "text-muted-foreground" },
  { header: "Value", cell: (r: FieldValue) => r.value, align: "right", className: "text-pearl" },
];

function FieldValueTable({ rows }: { rows: FieldValue[] }) {
  return <DataTable columns={FV_COLUMNS} rows={rows} rowKey={(r) => r.field} />;
}

type TextItem = { text: string };

function TextList({ title, items }: { title: string; items: string[] }) {
  const rows: TextItem[] = items.map((s) => ({ text: s }));
  const columns: Column<TextItem>[] = [{ header: title, cell: (r: TextItem) => r.text, className: "text-pearl" }];
  return <DataTable columns={columns} rows={rows} rowKey={(r: TextItem, i: number) => i} />;
}

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-lg text-pearl">{title}</h3>
      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

// ── Name numerology: Chaldean chart, compound numbers, spelling study ───────

const WORD_COLUMNS: Column<WordChart>[] = [
  {
    header: "Word",
    cell: (w: WordChart) => (
      <div>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {w.cells.map((c, i) => (
            <span key={`${w.word}-${i}`} className={`inline-flex min-w-[38px] flex-col items-center rounded-lg border px-2 py-1 ${c.isVowel ? "border-gold/40 bg-gold/10" : "border-white/10"}`}>
              <span className="text-sm text-pearl">{c.letter}</span>
              <span className="text-xs text-gold">{c.value}</span>
            </span>
          ))}
        </div>
        <div className="text-pearl">{w.word}</div>
      </div>
    ),
  },
  { header: "Total → Root", cell: (w: WordChart) => `${w.compound} → ${w.root}`, align: "right" },
  { header: "Meaning", cell: (w: WordChart) => w.compoundMeaning, className: "text-muted-foreground" },
];

export function NameChartPanel({ fullName, birthDate }: { fullName: string; birthDate: string }) {
  const [system, setSystem] = useState<NameSystem>("Chaldean");
  const data = useMemo(() => {
    if (!fullName.trim()) return null;
    try {
      const b = birthNumbers(birthDate);
      const chart = nameChart(fullName, system);
      const harmony = nameHarmony(chart.root, b.mulank, b.bhagyank);
      const spelling = spellingOptions(fullName, b.mulank, b.bhagyank, system);
      return { b, chart, harmony, spelling };
    } catch {
      return null;
    }
  }, [fullName, birthDate, system]);

  if (!data) {
    return <GlassCard><p className="text-base text-muted-foreground">Say or type your full name and birth date to build the name chart.</p></GlassCard>;
  }
  const { b, chart, harmony, spelling } = data;

  const chartRows: FieldValue[] = [
    { field: "Full name total (compound)", value: chart.compound },
    { field: "Single digit (root)", value: `${chart.root} — ${NUMBER_PLANET[chart.root] ?? ""}` },
    { field: "Vowel total (soul urge input)", value: `${chart.vowelTotal} → ${chart.vowelRoot}` },
    { field: "Consonant total (personality input)", value: `${chart.consonantTotal} → ${chart.consonantRoot}` },
    { field: "Values missing from the name", value: chart.missingValues.join(", ") || "none" },
    { field: "Values repeated three or more times", value: chart.repeatedValues.map((r) => `${r.value} × ${r.count}`).join(", ") || "none" },
  ];

  const spellingBetterColumns: Column<(typeof spelling.better)[number]>[] = [
    { header: "Spelling", cell: (o) => o.spelling, className: "text-pearl" },
    { header: "Change", cell: (o) => o.change, className: "text-muted-foreground" },
    { header: "Total → Root", cell: (o) => `${o.compound} → ${o.root}`, align: "right" },
    { header: "Score", cell: (o) => `${o.score} / 100`, align: "right" },
    { header: "Note", cell: (o) => o.note, className: "text-pearl" },
  ];

  const spellingAvoidColumns: Column<(typeof spelling.avoid)[number]>[] = [
    { header: "Spelling", cell: (o) => o.spelling, className: "text-amber-200" },
    { header: "Change", cell: (o) => o.change, className: "text-muted-foreground" },
    { header: "Total → Root", cell: (o) => `${o.compound} → ${o.root}`, align: "right" },
    { header: "Score", cell: (o) => `${o.score} / 100`, align: "right" },
  ];

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["Chaldean", "Pythagorean"] as NameSystem[]).map((s) => (
            <button
              key={s}
              onClick={() => setSystem(s)}
              className={`min-h-[44px] rounded-full px-4 text-sm ${system === s ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <Head
          title={`${system} name chart`}
          note={system === "Chaldean"
            ? "Chaldean gives each letter a value from 1 to 8 by sound. The full total is read as a compound number, and only then reduced to a single digit."
            : "Pythagorean numbers the alphabet in order from 1 to 9 and keeps 11, 22 and 33 as master numbers."}
        />
        <DataTable columns={WORD_COLUMNS} rows={chart.words} rowKey={(w: WordChart) => w.word} />
        <div className="mt-4">
          <FieldValueTable rows={chartRows} />
        </div>
        <p className="mt-3 text-base text-pearl">{chart.compoundMeaning}</p>
        <p className="mt-2 text-sm text-muted-foreground">{ROOT_MEANINGS[chart.root]}</p>
      </GlassCard>

      <GlassCard>
        <Head title="Name against birth numbers" note="A name is judged against the birth day number and the destiny number, never on its own." />
        <FieldValueTable
          rows={[
            { field: "Name number", value: harmony.namank },
            { field: "Birth day number (Mulank)", value: `${b.mulank} — ${NUMBER_PLANET[b.mulank]}` },
            { field: "Destiny number (Bhagyank)", value: `${b.bhagyank} — ${NUMBER_PLANET[b.bhagyank]}` },
            { field: "Name with day number", value: harmony.withMulank },
            { field: "Name with destiny number", value: harmony.withBhagyank },
            { field: "Spelling score", value: `${harmony.score} out of 100` },
          ]}
        />
        <p className="mt-3 text-base text-pearl">{harmony.verdict}</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <TextList title="Strengths" items={harmony.strengths} />
          <TextList title="Weak points" items={harmony.weaknesses} />
        </div>
      </GlassCard>

      <GlassCard>
        <Head title="Lucky and unlucky spellings" note="Only realistic changes are offered: doubling a letter you already have, adding one letter, or dropping a repeated letter." />
        <p className="text-base text-pearl">Current spelling {spelling.current.spelling}: total {spelling.current.compound}, root {spelling.current.root}, score {spelling.current.score}.</p>
        <div className="mt-4 space-y-3">
          <p className="text-sm uppercase tracking-widest text-gold">Stronger options</p>
          {spelling.better.length === 0 && <p className="text-base text-muted-foreground">Nothing scores higher than your current spelling. Keep it and use it consistently everywhere.</p>}
          {spelling.better.length > 0 && (
            <DataTable columns={spellingBetterColumns} rows={spelling.better} rowKey={(o) => o.spelling} />
          )}
          {spelling.avoid.length > 0 && (
            <>
              <p className="mt-4 text-sm uppercase tracking-widest text-gold">Spellings to avoid</p>
              <DataTable columns={spellingAvoidColumns} rows={spelling.avoid} rowKey={(o) => o.spelling} />
            </>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">A spelling change only works when it is used everywhere: signature, documents, email and social handles. Legal names should be changed with advice, not on impulse.</p>
      </GlassCard>
    </div>
  );
}

// ── Dasha ladder, date prediction, multi-year forecast ──────────────────────

function PeriodCard({ p, label }: { p: Period; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-sm uppercase tracking-widest text-gold">{label}</p>
      <p className="text-lg text-pearl">Number {p.lord} — {p.planet}</p>
      <p className="text-sm text-muted-foreground">{fmt(p.start)} to {fmt(p.end)} ({p.years.toFixed(2)} years)</p>
      <p className="mt-2 text-base text-pearl">{p.focus}</p>
      <div className="mt-2">
        <TextList title="Opportunities" items={p.opportunities} />
      </div>
      <div className="mt-2">
        <TextList title="Challenges" items={p.challenges} />
      </div>
    </div>
  );
}

export type DashaTab = "maha" | "antar" | "pratyantar" | "personal" | "date" | "forecast";
export const DASHA_TAB_LABEL: Record<DashaTab, string> = {
  maha: "Mahadasha",
  antar: "Antardasha",
  pratyantar: "Pratyantar Dasha",
  personal: "Personal year",
  date: "Any date",
  forecast: "Forecast",
};

const LADDER_COLUMNS = (prefix?: string): Column<Period>[] => [
  { header: "Period", cell: (p: Period) => (prefix ? `${prefix} / ${p.lord}` : `Number ${p.lord} — ${p.planet}`) },
  { header: "Range", cell: (p: Period) => `${fmt(p.start)} to ${fmt(p.end)}`, align: "right", className: "text-muted-foreground" },
];

function LadderRows({ rows, prefix }: { rows: Period[]; prefix?: string }) {
  return <DataTable columns={LADDER_COLUMNS(prefix)} rows={rows} rowKey={(p: Period) => p.start.toISOString()} />;
}

export function DashaPanel({ birthDate, view }: { birthDate: string; view?: DashaTab }) {
  const [subState, setSub] = useState<DashaTab>("maha");
  const sub = view ?? subState;
  const [queryDate, setQueryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fromYear, setFromYear] = useState(() => new Date().getFullYear());
  const [span, setSpan] = useState(10);

  const data = useMemo(() => {
    try {
      const now = dashaAt(birthDate, new Date());
      const ladder = mahadashaTimeline(birthDate, 90);
      const cycles = personalCycles(birthDate);
      const prediction = predictForDate(birthDate, queryDate);
      const forecast = multiYearForecast(birthDate, fromYear, span);
      return { now, ladder, cycles, prediction, forecast };
    } catch {
      return null;
    }
  }, [birthDate, queryDate, fromYear, span]);

  if (!data) return <GlassCard><p className="text-base text-muted-foreground">Give a valid birth date to build the period ladder.</p></GlassCard>;
  const { now, ladder, cycles, prediction, forecast } = data;

  const forecastColumns: Column<(typeof forecast)[number]>[] = [
    { header: "Year", cell: (r) => r.year },
    { header: "Personal year", cell: (r) => r.personalYear, align: "right" },
    { header: "Major / Sub / Fine", cell: (r) => `${r.mahaLord} / ${r.antarLord} / ${r.pratyantarLord}`, align: "right" },
    { header: "Headline", cell: (r) => r.headline, className: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {!view && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DASHA_TAB_LABEL) as DashaTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setSub(t)}
              className={`min-h-[44px] rounded-full px-4 py-2 text-xs uppercase tracking-widest ${
                sub === t ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"
              }`}
            >
              {DASHA_TAB_LABEL[t]}
            </button>
          ))}
        </div>
      )}


      {sub === "maha" && (
        <>
          <GlassCard>
            <Head
              title="Running Mahadasha"
              note="Number periods run in the order 1 to 9 from your birth day number. Each number rules as many years as itself, so one full round is 45 years."
            />
            {now ? <PeriodCard p={now.maha} label="Mahadasha" />
              : <p className="text-base text-muted-foreground">The ladder does not cover today's date.</p>}
          </GlassCard>
          <GlassCard>
            <Head title="Whole life timeline" note="Every major period from birth, in order, with its start and end date." />
            <LadderRows rows={ladder} />
          </GlassCard>
        </>
      )}

      {sub === "antar" && (
        <>
          <GlassCard>
            <Head title="Running Antardasha" note="The sub-period inside the running major period." />
            {now ? <PeriodCard p={now.antar} label="Antardasha" />
              : <p className="text-base text-muted-foreground">The ladder does not cover today's date.</p>}
          </GlassCard>
          {now && (
            <GlassCard>
              <Head title="All Antardashas of the running Mahadasha" />
              <LadderRows rows={now.antarList} prefix={String(now.maha.lord)} />
            </GlassCard>
          )}
        </>
      )}

      {sub === "pratyantar" && (
        <>
          <GlassCard>
            <Head title="Running Pratyantar Dasha" note="The fine period inside the running sub-period." />
            {now ? <PeriodCard p={now.pratyantar} label="Pratyantar Dasha" />
              : <p className="text-base text-muted-foreground">The ladder does not cover today's date.</p>}
          </GlassCard>
          {now && (
            <GlassCard>
              <Head title="All Pratyantar periods of the running Antardasha" />
              <LadderRows rows={now.pratyantarList} prefix={`${now.maha.lord} / ${now.antar.lord}`} />
            </GlassCard>
          )}
        </>
      )}

      {sub === "personal" && (
        <GlassCard>
          <Head title="Personal year, month and day" />
          <FieldValueTable
            rows={[
              { field: "Personal year", value: cycles.personalYear },
              { field: "Personal month", value: cycles.personalMonth },
              { field: "Personal day", value: cycles.personalDay },
              { field: "Universal year", value: cycles.universalYear },
            ]}
          />
          <p className="mt-3 text-base text-pearl">{cycles.theme}</p>
          <div className="mt-3">
            <FieldValueTable
              rows={[
                { field: "Career", value: cycles.career },
                { field: "Money", value: cycles.money },
                { field: "Health", value: cycles.health },
                { field: "Relationships", value: cycles.relationship },
              ]}
            />
          </div>
        </GlassCard>
      )}

      {sub === "date" && (
        <GlassCard>
          <Head title="Any date prediction" note="Pick any past or future date to see the periods and the personal year that were or will be active." />
          <input
            type="date"
            value={queryDate}
            onChange={(e) => setQueryDate(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-transparent px-3 text-base text-pearl"
          />
          <p className="mt-3 text-base text-pearl">{prediction.summary}</p>
          {prediction.maha && (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <PeriodCard p={prediction.maha} label="Mahadasha" />
              <PeriodCard p={prediction.antar!} label="Antardasha" />
              <PeriodCard p={prediction.pratyantar!} label="Pratyantar Dasha" />
            </div>
          )}
        </GlassCard>
      )}

      {sub === "forecast" && (
        <GlassCard>
          <Head title="Multi-year forecast" />
          <div className="mb-3 flex flex-wrap gap-3">
            <label className="text-base text-muted-foreground">
              From year
              <input type="number" value={fromYear} onChange={(e) => setFromYear(Number(e.target.value) || fromYear)}
                className="ml-2 min-h-[44px] w-28 rounded-xl border border-white/10 bg-transparent px-3 text-base text-pearl" />
            </label>
            <label className="text-base text-muted-foreground">
              Years
              <input type="number" min={1} max={40} value={span} onChange={(e) => setSpan(Math.min(40, Math.max(1, Number(e.target.value) || 10)))}
                className="ml-2 min-h-[44px] w-24 rounded-xl border border-white/10 bg-transparent px-3 text-base text-pearl" />
            </label>
          </div>
          <DataTable columns={forecastColumns} rows={forecast} rowKey={(r) => r.year} />
        </GlassCard>
      )}
    </div>
  );
}


// ── Current grid ────────────────────────────────────────────────────────────

export function CurrentGridPanel({ birthDate }: { birthDate: string }) {
  const grid = useMemo(() => { try { return currentGrid(birthDate); } catch { return null; } }, [birthDate]);
  if (!grid) return <GlassCard><p className="text-base text-muted-foreground">Give a valid birth date.</p></GlassCard>;
  return (
    <GlassCard>
      <Head title="Current grid" note={grid.note} />
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {GRID_ORDER.map((n) => (
          <div key={n} className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border ${grid.counts[n] ? "gold-border bg-gold/10" : "border-white/10"}`}>
            <span className="text-lg text-pearl">{grid.counts[n] ? String(n).repeat(Math.min(grid.counts[n]!, 5)) : "—"}</span>
            <span className="text-sm text-muted-foreground">{n}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <FieldValueTable
          rows={[
            { field: "Active numbers", value: grid.activeNumbers.join(", ") || "none" },
            { field: "Strong numbers", value: grid.strongNumbers.join(", ") || "none" },
            { field: "Missing numbers", value: grid.missingNumbers.join(", ") || "none" },
          ]}
        />
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <TextList title="Current strengths" items={grid.strengths} />
        <TextList title="Current weak spots" items={grid.weaknesses} />
      </div>
    </GlassCard>
  );
}

// ── Practical guidance ──────────────────────────────────────────────────────

export function GuidancePanel({ birthDate }: { birthDate: string }) {
  const rows = useMemo(() => { try { return practicalGuidance(birthDate); } catch { return null; } }, [birthDate]);
  if (!rows) return <GlassCard><p className="text-base text-muted-foreground">Give a valid birth date.</p></GlassCard>;
  const columns: Column<(typeof rows)[number]>[] = [
    { header: "Area", cell: (r) => r.area, className: "text-gold" },
    { header: "Advice", cell: (r) => r.advice, className: "text-pearl" },
  ];
  return (
    <GlassCard>
      <Head title="Practical decisions" note="How your numbers apply to real choices. Treat these as timing preferences, not as replacements for professional advice." />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.area} />
    </GlassCard>
  );
}

// ── Hebrew letters and tarot ────────────────────────────────────────────────

export function HebrewTarotPanel({ fullName }: { fullName: string }) {
  const reading = useMemo(() => (fullName.trim() ? kabbalahReading(fullName) : null), [fullName]);

  const pathTotalsColumns: Column<NonNullable<typeof reading>["pathTotals"][number]>[] = [
    { header: "Name part", cell: (p) => p.name },
    { header: "Total", cell: (p) => p.total, align: "right" },
    { header: "Path", cell: (p) => p.pathIndex, align: "right" },
    { header: "Card", cell: (p) => p.card, align: "right", className: "text-pearl" },
  ];

  return (
    <div className="space-y-6">
      <GlassCard>
        <Head
          title="Hebrew letters of the tarot"
          note="Each of the 22 Major Arcana cards sits on one of the 22 paths of the Tree of Life and carries one Hebrew letter with its gematria value."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-base">
            <thead className="text-sm uppercase tracking-widest text-gold">
              <tr>
                <th className="py-2 text-left">Letter</th>
                <th className="py-2 text-left">Value</th>
                <th className="py-2 text-left">Meaning</th>
                <th className="py-2 text-left">Path</th>
                <th className="py-2 text-left">Card</th>
                <th className="py-2 text-left">Sign or planet</th>
              </tr>
            </thead>
            <tbody>
              {HEBREW_LETTERS.map((l) => (
                <tr key={l.name} className="border-t border-white/5">
                  <td className="py-2 text-pearl">{l.hebrew} {l.name}</td>
                  <td className="py-2 text-pearl">{l.value}{l.sofit ? ` (final ${l.sofit})` : ""}</td>
                  <td className="py-2 text-muted-foreground">{l.meaning}</td>
                  <td className="py-2 text-muted-foreground">{l.path}</td>
                  <td className="py-2 text-pearl">{l.cardNumber} {l.card}</td>
                  <td className="py-2 text-muted-foreground">{l.element}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {reading && (
        <GlassCard>
          <Head title="Your name in Hebrew letters" note="Latin letters are transliterated with the standard table, including the pairs SH, CH, TZ and TH." />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {reading.cells.map((c, i) => (
              <span key={i} className="inline-flex min-w-[52px] flex-col items-center rounded-lg border border-white/10 px-2 py-1">
                <span className="text-base text-pearl">{c.letter.hebrew}</span>
                <span className="text-sm text-gold">{c.letter.value}</span>
                <span className="text-xs text-muted-foreground">{c.source}</span>
              </span>
            ))}
          </div>
          <FieldValueTable
            rows={[
              { field: "Gematria total", value: reading.total },
              { field: "Single digit", value: reading.root },
              { field: "Ruling path", value: `${reading.rulingLetter.path} — ${reading.rulingLetter.name}` },
              { field: "Ruling card", value: `${reading.rulingLetter.cardNumber} ${reading.rulingCard}` },
              { field: "Strongest attributions", value: reading.dominantElements.map((d) => `${d.element} × ${d.count}`).join(", ") },
            ]}
          />
          <p className="mt-3 text-base text-pearl">{reading.summary}</p>
          <div className="mt-3">
            <DataTable columns={pathTotalsColumns} rows={reading.pathTotals} rowKey={(p) => p.name} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Letters absent from your name point to lessons you meet through other people: {reading.missingLetters.slice(0, 8).join(", ")}.
          </p>
        </GlassCard>
      )}
      <Explain term="Tree of Life path">
        The Tree of Life joins ten spheres with 22 connecting paths. Each path is given one Hebrew letter and one Major Arcana card, which is why the cards can be read as a ladder of lessons rather than as separate pictures.
      </Explain>
    </div>
  );
}

// ── Saved profiles ──────────────────────────────────────────────────────────

export type SavedProfile = { id: string; name: string; birthDate: string; savedAt: string };
const STORE = "taromaya.numerology.profiles";

function loadProfiles(): SavedProfile[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(STORE) ?? "[]") as SavedProfile[]; } catch { return []; }
}
function saveProfiles(list: SavedProfile[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORE, JSON.stringify(list));
}

export function ProfilesPanel({
  fullName, birthDate, onSelect,
}: {
  fullName: string; birthDate: string;
  onSelect: (p: SavedProfile) => void;
}) {
  const [list, setList] = useState<SavedProfile[]>(() => loadProfiles());
  const [query, setQuery] = useState("");
  const shown = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.birthDate.includes(query));

  const add = () => {
    if (!fullName.trim() || !birthDate) return;
    const next = [
      { id: `${Date.now()}`, name: fullName.trim(), birthDate, savedAt: new Date().toISOString() },
      ...list.filter((p) => !(p.name === fullName.trim() && p.birthDate === birthDate)),
    ];
    setList(next); saveProfiles(next);
  };
  const remove = (id: string) => { const next = list.filter((p) => p.id !== id); setList(next); saveProfiles(next); };

  const columns: Column<SavedProfile>[] = [
    { header: "Name", cell: (p: SavedProfile) => p.name, className: "text-pearl" },
    { header: "Birth date", cell: (p: SavedProfile) => p.birthDate, className: "text-muted-foreground" },
    {
      header: "Actions",
      align: "right",
      cell: (p: SavedProfile) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => onSelect(p)} className="min-h-[44px] rounded-full border border-white/10 px-4 text-base text-pearl">Open</button>
          <button onClick={() => remove(p.id)} className="min-h-[44px] rounded-full border border-white/10 px-4 text-base text-muted-foreground">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <GlassCard>
      <Head title="Saved profiles" note="Profiles stay on this device. Save as many as you need and reopen them without typing again." />
      <div className="flex flex-wrap gap-2">
        <button onClick={add} className="min-h-[44px] rounded-full gold-border bg-gold/15 px-4 text-base text-pearl">
          Save current details
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search saved profiles"
          className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-transparent px-3 text-base text-pearl"
        />
      </div>
      <div className="mt-4">
        <DataTable columns={columns} rows={shown} rowKey={(p: SavedProfile) => p.id} empty="No saved profiles yet." />
      </div>
    </GlassCard>
  );
}
