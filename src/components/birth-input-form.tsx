import { PlacePicker } from "@/components/place-picker";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { calculateAstroChart } from "@/lib/astro-calc.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type ChartResult = Awaited<ReturnType<typeof calculateAstroChart>>["chart"];

const AYANAMSAS = [
  { v: "lahiri", l: "Lahiri (Chitrapaksha) — default" },
  { v: "raman", l: "B.V. Raman" },
  { v: "kp-old", l: "KP Old (Krishnamurti)" },
  { v: "kp-new", l: "KP New" },
  { v: "tropical", l: "Tropical (Western)" },
];

export function BirthInputForm({
  onComputed,
}: {
  onComputed?: (chart: ChartResult, birth: Record<string, unknown>) => void;
}) {
  const compute = useServerFn(calculateAstroChart);
  const [step, setStep] = useState<"input" | "confirm" | "done">("input");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    gender: "unspecified" as const,
    place: "",
    year: 1990, month: 1, day: 1,
    hour: 12, minute: 0, seconds: 0,
    tzOffsetHours: 5.5,
    latitude: 28.6139, longitude: 77.209,
    ayanamsa: "lahiri",
    houseSystem: "whole-sign",
    nodeType: "true" as "true" | "mean",
    zodiac: "sidereal" as "sidereal" | "tropical",
    chartStyle: "north" as "north" | "south" | "east",
    language: "en" as "en" | "hi" | "hi_roman",
    elevationMeters: 0,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const utcPreview = (() => {
    try {
      const local = new Date(Date.UTC(
        form.year, form.month - 1, form.day,
        form.hour, form.minute, form.seconds,
      ));
      const utc = new Date(local.getTime() - form.tzOffsetHours * 3600_000);
      return utc.toISOString().replace("T", " ").replace(".000Z", " UTC");
    } catch { return "—"; }
  })();

  async function runCompute() {
    setLoading(true);
    try {
      const res = await compute({ data: {
        moduleId: "rashi",
        birth: {
          name: form.name || undefined,
          gender: form.gender,
          place: form.place || undefined,
          year: form.year, month: form.month, day: form.day,
          hour: form.hour, minute: form.minute, seconds: form.seconds,
          tzOffsetHours: form.tzOffsetHours,
          latitude: form.latitude, longitude: form.longitude,
          language: form.language,
          chartStyle: form.chartStyle,
        },
        config: {
          ayanamsa: form.ayanamsa as never,
          houseSystem: form.houseSystem as never,
          nodeType: form.nodeType,
          elevationMeters: form.elevationMeters,
          topocentric: false,
        },
      } });
      toast.success(res.cached ? "Loaded from cache" : "Chart computed");
      onComputed?.(res.chart, form as unknown as Record<string, unknown>);
      setStep("done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to compute");
    } finally {
      setLoading(false);
    }
  }

  if (step === "input") {
    return (
      <Card className="glass-card space-y-5 p-6">
        <h2 className="text-2xl font-serif tracking-tight">Birth details</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Gender / identity">
            <Select value={form.gender} onValueChange={(v) => set("gender", v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">Prefer not to say</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="neutral">Non-binary / neutral</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="md:col-span-2">
            <PlacePicker
              value={{ place: form.place, lat: String(form.latitude), lon: String(form.longitude), tz: String(form.tzOffsetHours) }}
              onChange={(p) => {
                setForm((f) => ({
                  ...f,
                  place: p.place,
                  latitude: parseFloat(p.lat) || 0,
                  longitude: parseFloat(p.lon) || 0,
                  tzOffsetHours: parseFloat(p.tz) || 0,
                }));
              }}
              forDate={`${form.year}-${String(form.month).padStart(2, "0")}-${String(form.day).padStart(2, "0")}`}
              forTime={`${String(form.hour).padStart(2, "0")}:${String(form.minute).padStart(2, "0")}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 md:col-span-2">
            <Field label="Year"><Input type="number" value={form.year} onChange={(e) => set("year", parseInt(e.target.value) || 0)} /></Field>
            <Field label="Month"><Input type="number" min={1} max={12} value={form.month} onChange={(e) => set("month", parseInt(e.target.value) || 1)} /></Field>
            <Field label="Day"><Input type="number" min={1} max={31} value={form.day} onChange={(e) => set("day", parseInt(e.target.value) || 1)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-2 md:col-span-2">
            <Field label="Hour (0-23)"><Input type="number" min={0} max={23} value={form.hour} onChange={(e) => set("hour", parseInt(e.target.value) || 0)} /></Field>
            <Field label="Minute"><Input type="number" min={0} max={59} value={form.minute} onChange={(e) => set("minute", parseInt(e.target.value) || 0)} /></Field>
            <Field label="Second"><Input type="number" min={0} max={59} value={form.seconds} onChange={(e) => set("seconds", parseInt(e.target.value) || 0)} /></Field>
          </div>
        </div>

        <div className="grid gap-4 border-t border-white/10 pt-4 md:grid-cols-3">
          <Field label="Ayanamsa">
            <Select value={form.ayanamsa} onValueChange={(v) => set("ayanamsa", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AYANAMSAS.map((a) => <SelectItem key={a.v} value={a.v}>{a.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Node type">
            <Select value={form.nodeType} onValueChange={(v) => set("nodeType", v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mean">Mean Node</SelectItem>
                <SelectItem value="true">True Node</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Chart style">
            <Select value={form.chartStyle} onValueChange={(v) => set("chartStyle", v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="north">North Indian</SelectItem>
                <SelectItem value="south">South Indian</SelectItem>
                <SelectItem value="east">East Indian</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Button className="w-full" size="lg" onClick={() => setStep("confirm")}>
          Review & confirm
        </Button>
      </Card>
    );
  }

  if (step === "confirm") {
    return (
      <Card className="glass-card space-y-4 p-6">
        <h2 className="text-2xl font-serif">Confirm before calculation</h2>
        <p className="text-sm text-muted-foreground">
          Astrology accuracy depends on exact time and place. Please verify below.
        </p>
        <div className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
          <Row k="Name" v={form.name || "—"} />
          <Row k="Place" v={form.place || "—"} />
          <Row k="Local date-time" v={`${form.year}-${String(form.month).padStart(2,"0")}-${String(form.day).padStart(2,"0")}  ${String(form.hour).padStart(2,"0")}:${String(form.minute).padStart(2,"0")}:${String(form.seconds).padStart(2,"0")}`} />
          <Row k="Ayanamsa" v={form.ayanamsa} />
          <Row k="Node type" v={form.nodeType} />
          <Row k="Chart style" v={form.chartStyle} />
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep("input")}>Back to edit</Button>
          <Button className="flex-1" onClick={runCompute} disabled={loading}>
            {loading ? "Calculating…" : "Calculate chart"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card space-y-3 p-6 text-center">
      <h2 className="text-2xl font-serif">Chart computed ✨</h2>
      <p className="text-sm text-muted-foreground">
        Cached to your account and available across every module.
      </p>
      <Button variant="ghost" onClick={() => setStep("input")}>Compute another</Button>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-right">{v}</span>
    </div>
  );
}
