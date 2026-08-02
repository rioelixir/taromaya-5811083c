import { BirthOneBox } from "@/components/birth-one-box";
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

        <BirthOneBox
          value={{
            name: form.name,
            date: `${form.year}-${String(form.month).padStart(2, "0")}-${String(form.day).padStart(2, "0")}`,
            time: `${String(form.hour).padStart(2, "0")}:${String(form.minute).padStart(2, "0")}`,
            place: form.place,
            lat: String(form.latitude),
            lon: String(form.longitude),
            tz: String(form.tzOffsetHours),
          }}
          onChange={(patch) =>
            setForm((f) => {
              const next = { ...f };
              if (patch.name !== undefined) next.name = patch.name;
              if (patch.date) {
                const [y, mo, d] = patch.date.split("-").map(Number);
                if (y) next.year = y;
                if (mo) next.month = mo;
                if (d) next.day = d;
              }
              if (patch.time) {
                const [hh, mi] = patch.time.split(":").map(Number);
                next.hour = hh || 0;
                next.minute = mi || 0;
                next.seconds = 0;
              }
              if (patch.place !== undefined) next.place = patch.place;
              if (patch.lat) next.latitude = parseFloat(patch.lat) || next.latitude;
              if (patch.lon) next.longitude = parseFloat(patch.lon) || next.longitude;
              if (patch.tz) next.tzOffsetHours = parseFloat(patch.tz) || 0;
              return next;
            })
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>


        <div className="grid gap-4 border-t border-white/10 pt-4 md:grid-cols-3">

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
