import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import {
  Download, Save, Search, Star, Trash2, Copy, FileText, Sparkles, ArrowLeft,
} from "lucide-react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { DataTable } from "@/components/data-table";
import { LoShuGridView, ScoreGauge, ZoneBar } from "@/components/loshu/loshu-grid-view";
import { analyseLoShu } from "@/lib/loshu/engine";
import { NUMBER_PROFILES, MISSING_PROFILES } from "@/lib/loshu/numbers";
import {
  personalitySummary, careerAnalysis, relationshipAnalysis, financialAnalysis,
  healthObservations, luckyFactors, remedies, dailyTip, type Section,
} from "@/lib/loshu/interpret";
import { downloadLoShuPdf } from "@/lib/loshu/pdf";
import { listReports, saveReport, updateReport, deleteReport, duplicateReport, type LoShuReport } from "@/lib/loshu/reports";
import type { Digit, LoShuAnalysis, LoShuInput } from "@/lib/loshu/types";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter the full name.").max(80),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD."),
  gender: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

type View = "dashboard" | "input" | "report" | "saved" | "learn";

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm transition";
const btnGold = `${btn} bg-gold/15 border border-gold/40 text-gold hover:bg-gold/25`;
const btnGhost = `${btn} glass gold-border text-pearl hover:bg-white/10`;
const field = "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-pearl outline-none focus:border-gold/50";

function SectionList({ items }: { items: Section[] }) {
  return (
    <div className="space-y-4">
      {items.map((s) => (
        <div key={s.heading}>
          <div className="text-sm font-medium text-gold">{s.heading}</div>
          <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function InputScreen({ onDone }: { onDone: (input: LoShuInput) => void }) {
  const [values, setValues] = useState<LoShuInput>({ fullName: "", birthDate: "", gender: "", notes: "" });
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the details.");
      return;
    }
    try {
      analyseLoShu(parsed.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please check the date of birth.");
      return;
    }
    setError(null);
    onDone(parsed.data);
  };

  return (
    <GlassCard title="Enter the details" desc="Only the date of birth drives the grid. The rest personalises your report.">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="ls-name">Full name</label>
          <input id="ls-name" className={field} value={values.fullName}
            onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))} placeholder="Full name" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="ls-dob">Date of birth</label>
          <input id="ls-dob" type="date" max={new Date().toISOString().slice(0, 10)} className={field}
            value={values.birthDate} onChange={(e) => setValues((v) => ({ ...v, birthDate: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="ls-gender">Gender (optional)</label>
          <select id="ls-gender" className={field} value={values.gender}
            onChange={(e) => setValues((v) => ({ ...v, gender: e.target.value }))}>
            <option value="">Prefer not to say</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="ls-notes">Notes (optional)</label>
          <textarea id="ls-notes" rows={3} className={field} value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))} placeholder="What would you like this reading to focus on?" />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="button" className={btnGold} onClick={submit}>
          <Sparkles className="h-4 w-4" /> Generate Lo Shu grid
        </button>
      </div>
    </GlassCard>
  );
}

function ReportView({ analysis, onSave, saving }: { analysis: LoShuAnalysis; onSave: () => void; saving: boolean }) {
  const a = analysis;
  const freqData = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).map((d) => ({ number: String(d), count: a.counts[d] }));
  const radarData = a.zones.map((z) => ({ zone: z.label.replace(" zone", ""), value: z.percent }));
  const lucky = luckyFactors(a);
  const rem = remedies(a);
  const strengthArrows = a.arrows.filter((x) => x.polarity === "strength");
  const cautionArrows = a.arrows.filter((x) => x.polarity === "caution");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnGold} onClick={() => downloadLoShuPdf(a)}>
          <Download className="h-4 w-4" /> Download PDF report
        </button>
        <button type="button" className={btnGhost} onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Saving" : "Save report"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard title="Your Lo Shu grid" desc={`${a.input.fullName} · born ${a.input.birthDate}`} className="lg:col-span-2">
          <LoShuGridView analysis={a} />
          <p className="mt-4 text-xs text-muted-foreground">
            Digits counted: {a.digitsUsed.join(" ")} — zeros are ignored, and every occurrence of a number is shown inside its own cell.
          </p>
        </GlassCard>
        <GlassCard title="Overall energy"><ScoreGauge score={a.energyScore} /></GlassCard>
      </div>

      <GlassCard title="Analysis panel">
        <DataTable
          columns={[
            { header: "Measure", cell: (r: [string, string]) => r[0] },
            { header: "Value", cell: (r: [string, string]) => <span className="text-gold">{r[1]}</span>, align: "right" },
          ]}
          rows={[
            ["Birth or day number", String(a.birthNumber)],
            ["Life path number", String(a.lifePathNumber)],
            ["Total digits", String(a.totalDigits)],
            ["Numbers present", ([1,2,3,4,5,6,7,8,9] as Digit[]).filter((d) => a.counts[d]).join(", ")],
            ["Missing numbers", a.missing.length ? a.missing.join(", ") : "None"],
            ["Repeated numbers", a.repeated.length ? a.repeated.map((d) => `${d} x${a.counts[d]}`).join(", ") : "None"],
            ["Strongest number", String(a.strongest)],
            ["Weakest present number", String(a.weakest)],
            ["Energy score", `${a.energyScore} of 100`],
          ] as [string, string][]}
        />
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Digit frequency">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqData}>
                <XAxis dataKey="number" stroke="currentColor" className="text-muted-foreground" fontSize={11} />
                <YAxis allowDecimals={false} stroke="currentColor" className="text-muted-foreground" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(12,12,18,0.92)", border: "1px solid rgba(176,137,60,0.4)", borderRadius: 12, color: "#eee" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="rgba(212,175,95,0.85)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard title="Energy distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis dataKey="zone" tick={{ fontSize: 10, fill: "rgba(230,230,240,0.7)" }} />
                <Radar dataKey="value" stroke="rgba(212,175,95,0.9)" fill="rgba(212,175,95,0.35)" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Energy zones">
        <div className="space-y-4">
          {a.zones.map((z) => (
            <div key={z.key}>
              <ZoneBar label={z.label} percent={z.percent} />
              <p className="mt-1 text-xs text-muted-foreground">{z.interpretation}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Numbers in your grid">
        <div className="space-y-5">
          {([1,2,3,4,5,6,7,8,9] as Digit[]).filter((d) => a.counts[d]).map((d) => {
            const p = NUMBER_PROFILES[d];
            return (
              <div key={d} className="rounded-2xl border border-white/10 p-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-2xl gold-text">{d}</span>
                  <span className="text-sm text-pearl">{p.title}</span>
                  <span className="text-xs text-muted-foreground">{p.planet} · {p.element} · appears {a.counts[d]} time{a.counts[d] > 1 ? "s" : ""}</span>
                </div>
                <DataTable
                  className="mt-3"
                  columns={[
                    { header: "Area", cell: (r: [string, string]) => r[0] },
                    { header: "Reading", cell: (r: [string, string]) => r[1] },
                  ]}
                  rows={[
                    ["Positive traits", p.positive.join(", ")],
                    ["Watch points", p.negative.join(", ")],
                    ["Career", p.career],
                    ["Leadership", p.leadership],
                    ["Relationships", p.relationships],
                    ["Marriage", p.marriage],
                    ["Communication", p.communication],
                    ["Finance", p.finance],
                    ["Health tendencies", p.health],
                    ["Spiritual lesson", p.spiritualLesson],
                    ["Improvement tips", p.tips.join("; ")],
                  ] as [string, string][]}
                />
              </div>
            );
          })}
        </div>
      </GlassCard>

      {a.missing.length > 0 && (
        <GlassCard title="Missing numbers" desc="Skills to build, never fixed limits.">
          <div className="space-y-5">
            {a.missing.map((d) => {
              const m = MISSING_PROFILES[d];
              return (
                <div key={d} className="rounded-2xl border border-white/10 p-4">
                  <div className="font-display text-xl gold-text">Number {d} is missing</div>
                  <DataTable
                    className="mt-3"
                    columns={[
                      { header: "Area", cell: (r: [string, string]) => r[0] },
                      { header: "Reading", cell: (r: [string, string]) => r[1] },
                    ]}
                    rows={[
                      ["Meaning", m.meaning],
                      ["Weakness", m.weakness],
                      ["Personality impact", m.personality],
                      ["Career impact", m.careerImpact],
                      ["Relationship impact", m.relationshipImpact],
                      ["Financial impact", m.financialImpact],
                      ["Health tendencies", m.health],
                      ["Life lesson", m.lifeLesson],
                      ["Balancing advice", m.balancing],
                      ["Suggested remedies", m.remedies.join("; ")],
                    ] as [string, string][]}
                  />
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <GlassCard title="Repeated numbers" desc="Intensity rises with each occurrence.">
        <div className="space-y-4">
          {a.repeats.map((r) => (
            <div key={r.digit}>
              <ZoneBar label={`Number ${r.digit} — ${r.count} time${r.count > 1 ? "s" : ""} · ${r.label}`} percent={r.intensity} />
              <p className="mt-1 text-xs text-muted-foreground">{r.reading}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Arrows" desc="Every line of the square, read for both presence and absence.">
        <div className="space-y-3">
          {[...strengthArrows, ...cautionArrows].map((arrow) => (
            <div key={arrow.key} className="rounded-2xl border border-white/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-pearl">{arrow.name}</span>
                <span className="text-xs text-muted-foreground">{arrow.line.join("-")}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${arrow.status === "formed" ? "bg-gold/15 text-gold" : "bg-white/5 text-muted-foreground"}`}>
                  {arrow.status === "formed" ? "Present" : "Missing"}
                </span>
              </div>
              <DataTable
                className="mt-3"
                columns={[
                  { header: "Area", cell: (r: [string, string]) => r[0] },
                  { header: "Reading", cell: (r: [string, string]) => r[1] },
                ]}
                rows={[
                  ["Meaning", arrow.meaning],
                  ["Strengths", arrow.strengths],
                  ["Weaknesses", arrow.weaknesses],
                  ["Career", arrow.career],
                  ["Relationships", arrow.relationships],
                  ["Money", arrow.money],
                  ["Health", arrow.health],
                  ["Advice", arrow.advice],
                ] as [string, string][]}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Personality summary"><SectionList items={personalitySummary(a)} /></GlassCard>

      <GlassCard title="Career analysis" desc="Ranked by the strength of the numbers in your grid.">
        <DataTable
          columns={[
            { header: "Field", cell: (r: { field: string }) => r.field },
            { header: "Scope", cell: (r: { detail: string }) => r.detail },
            { header: "Fit", cell: (r: { weight: number }) => <span className="text-gold">{r.weight}</span>, align: "right" },
          ]}
          rows={careerAnalysis(a)}
          rowKey={(r) => r.field}
        />
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Relationship analysis"><SectionList items={relationshipAnalysis(a)} /></GlassCard>
        <GlassCard title="Financial analysis"><SectionList items={financialAnalysis(a)} /></GlassCard>
      </div>

      <GlassCard title="Health and lifestyle" desc="Lifestyle observations only, never a diagnosis.">
        <SectionList items={healthObservations(a)} />
      </GlassCard>

      <GlassCard title="Lucky factors">
        <DataTable
          columns={[
            { header: "Factor", cell: (r: [string, string]) => r[0] },
            { header: "Detail", cell: (r: [string, string]) => r[1] },
          ]}
          rows={[
            ["Lucky numbers", lucky.numbers.join(", ")],
            ["Lucky colours", lucky.colours.join(", ")],
            ["Lucky days", lucky.days.join(", ")],
            ["Lucky directions", lucky.directions.join(", ")],
            ["Lucky activities", lucky.activities.join("; ")],
            ["Supportive habits", lucky.habits.join("; ")],
          ] as [string, string][]}
        />
      </GlassCard>

      <GlassCard title="Remedies" desc="Practical, positive and non superstitious.">
        <DataTable
          columns={[
            { header: "Group", cell: (r: [string, string[]]) => r[0] },
            { header: "Practice", cell: (r: [string, string[]]) => r[1].join("; ") },
          ]}
          rows={[
            ["Lifestyle", rem.lifestyle], ["Colour", rem.colour], ["Meditation", rem.meditation],
            ["Affirmations", rem.affirmations], ["Breathing", rem.breathing], ["Charity", rem.charity],
            ["Nature", rem.nature], ["Daily habits", rem.daily], ["Weekly practices", rem.weekly],
          ] as [string, string[]][]}
        />
      </GlassCard>
    </motion.div>
  );
}

function SavedReports({ onOpen }: { onOpen: (r: LoShuReport) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["loshu-reports", search],
    queryFn: () => listReports(search),
    enabled: !!user,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["loshu-reports"] });
  const act = useMutation({
    mutationFn: async (job: { kind: "favourite" | "delete" | "duplicate"; row: LoShuReport }) => {
      if (job.kind === "favourite") return updateReport(job.row.id, { is_favourite: !job.row.is_favourite });
      if (job.kind === "delete") return deleteReport(job.row.id);
      const analysis = analyseLoShu({ fullName: job.row.full_name, birthDate: job.row.birth_date });
      await duplicateReport(job.row, analysis);
    },
    onSuccess: () => { refresh(); toast.success("Saved reports updated"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update"),
  });

  if (!user) return <GlassCard title="Saved reports">Please sign in to save and revisit reports.</GlassCard>;

  return (
    <GlassCard title="Saved reports" desc="Search, favourite, duplicate, export or remove any analysis.">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 px-3">
        <Search className="h-4 w-4 text-gold" />
        <input className="min-h-11 w-full bg-transparent text-sm text-pearl outline-none" placeholder="Search by name"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading</p>
      ) : (
        <DataTable
          rows={data}
          rowKey={(r) => r.id}
          empty="No saved reports yet."
          columns={[
            { header: "Name", cell: (r) => (
              <button type="button" className="text-pearl underline-offset-4 hover:underline" onClick={() => onOpen(r)}>{r.full_name}</button>
            ) },
            { header: "Born", cell: (r) => r.birth_date },
            { header: "Actions", align: "right", cell: (r) => (
              <div className="flex justify-end gap-1">
                <button type="button" aria-label="Favourite" className="rounded-lg p-2 hover:bg-white/10" onClick={() => act.mutate({ kind: "favourite", row: r })}>
                  <Star className={`h-4 w-4 ${r.is_favourite ? "text-gold" : "text-muted-foreground"}`} />
                </button>
                <button type="button" aria-label="Export PDF" className="rounded-lg p-2 hover:bg-white/10"
                  onClick={() => downloadLoShuPdf(analyseLoShu({ fullName: r.full_name, birthDate: r.birth_date, gender: r.gender ?? undefined, notes: r.notes ?? undefined }))}>
                  <FileText className="h-4 w-4 text-gold" />
                </button>
                <button type="button" aria-label="Duplicate" className="rounded-lg p-2 hover:bg-white/10" onClick={() => act.mutate({ kind: "duplicate", row: r })}>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
                <button type="button" aria-label="Delete" className="rounded-lg p-2 hover:bg-white/10" onClick={() => act.mutate({ kind: "delete", row: r })}>
                  <Trash2 className="h-4 w-4 text-red-300" />
                </button>
              </div>
            ) },
          ]}
        />
      )}
    </GlassCard>
  );
}

function LearnLoShu() {
  return (
    <GlassCard title="Learn Lo Shu" desc="How the grid is built and how to read it.">
      <SectionList
        items={[
          { heading: "Step one, take the full date of birth", body: "Write the date of birth as day, month and year with no separators. For example 17 September 1974 becomes 17091974." },
          { heading: "Step two, count each digit", body: "Count how many times each digit from one to nine appears. Zeros are ignored completely and never occupy a cell." },
          { heading: "Step three, place the counts", body: "The classic magic square is fixed: four, nine, two on the top row, three, five, seven in the middle and eight, one, six at the bottom. Each cell shows its own digit repeated once per occurrence, so three fours appear as 444. Empty cells stay blank." },
          { heading: "Step four, read the lines", body: "Every row, column and diagonal sums to fifteen. A fully filled line is a strength arrow, a fully empty line is a caution arrow, and mixed lines are read through the individual numbers." },
          { heading: "Step five, read the balance", body: "Missing numbers describe skills to build. Repeated numbers describe traits that dominate. The energy score summarises coverage, formed strength lines and how evenly the digits are spread." },
        ]}
      />
    </GlassCard>
  );
}

function LoShuPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [input, setInput] = useState<LoShuInput | null>(null);
  const qc = useQueryClient();

  const analysis = useMemo(() => {
    if (!input) return null;
    try { return analyseLoShu(input); } catch { return null; }
  }, [input]);

  const { data: recent = [] } = useQuery({
    queryKey: ["loshu-reports", ""],
    queryFn: () => listReports(""),
    enabled: !!user,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!analysis) throw new Error("Nothing to save yet.");
      await saveReport(analysis.input, analysis);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loshu-reports"] }); toast.success("Report saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const openSaved = (r: LoShuReport) => {
    setInput({ fullName: r.full_name, birthDate: r.birth_date, gender: r.gender ?? undefined, notes: r.notes ?? undefined });
    setView("report");
  };

  return (
    <PageShell
      eyebrow="Numerology"
      title="Lo Shu Grid Analysis"
      subtitle="Discover your personality, strengths, weaknesses and life patterns using your date of birth."
      aiModule="Lo Shu Grid"
      aiSnapshot={analysis ? `Day number ${analysis.birthNumber}, life path ${analysis.lifePathNumber}, missing ${analysis.missing.join(", ") || "none"}, strongest ${analysis.strongest}, energy score ${analysis.energyScore}.` : undefined}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={view === "input" ? btnGold : btnGhost} onClick={() => setView("input")}>
          <Sparkles className="h-4 w-4" /> Generate analysis
        </button>
        <button type="button" className={view === "saved" ? btnGold : btnGhost} onClick={() => setView("saved")}>
          <Save className="h-4 w-4" /> Saved reports
        </button>
        <button type="button" className={view === "learn" ? btnGold : btnGhost} onClick={() => setView("learn")}>
          <FileText className="h-4 w-4" /> Learn Lo Shu
        </button>
        {view !== "dashboard" && (
          <button type="button" className={btnGhost} onClick={() => setView("dashboard")}>
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
        )}
      </div>

      {view === "dashboard" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard title="Start here" desc="One date of birth produces the complete grid, arrows, zones and remedies.">
            <button type="button" className={btnGold} onClick={() => setView("input")}>
              <Sparkles className="h-4 w-4" /> Generate analysis
            </button>
          </GlassCard>
          <GlassCard title="Today's numerology tip">
            <p className="text-sm text-muted-foreground">{dailyTip()}</p>
          </GlassCard>
          <GlassCard title="Recent reports" className="lg:col-span-2">
            {user ? (
              <DataTable
                rows={recent.slice(0, 5)}
                rowKey={(r) => r.id}
                empty="No reports yet. Generate your first analysis."
                columns={[
                  { header: "Name", cell: (r) => (
                    <button type="button" className="text-pearl underline-offset-4 hover:underline" onClick={() => openSaved(r)}>{r.full_name}</button>
                  ) },
                  { header: "Born", cell: (r) => r.birth_date },
                  { header: "Saved", cell: (r) => r.created_at.slice(0, 10), align: "right" },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Sign in to keep a history of your analyses.</p>
            )}
          </GlassCard>
        </div>
      )}

      {view === "input" && (
        <InputScreen onDone={(i) => { setInput(i); setView("report"); }} />
      )}

      {view === "report" && analysis && (
        <ReportView analysis={analysis} onSave={() => save.mutate()} saving={save.isPending} />
      )}
      {view === "report" && !analysis && (
        <GlassCard title="Nothing to show yet">Generate an analysis first.</GlassCard>
      )}

      {view === "saved" && <SavedReports onOpen={openSaved} />}
      {view === "learn" && <LearnLoShu />}
    </PageShell>
  );
}

export const Route = createFileRoute("/loshu")({
  component: LoShuPage,
  head: () => ({
    meta: [
      { title: "Lo Shu Grid Analysis — TAROMAYA" },
      { name: "description", content: "Build your Lo Shu grid from your date of birth and read missing numbers, arrows, energy zones, career, money, relationship and remedy guidance." },
      { property: "og:title", content: "Lo Shu Grid Analysis — TAROMAYA" },
      { property: "og:description", content: "Complete Lo Shu grid numerology with arrows, energy zones, charts and a professional PDF report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
