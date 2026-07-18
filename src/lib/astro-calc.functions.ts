// Cached astrology calculation server function.
// Reads/writes public.chart_calculations keyed by (user, engine_version, config_hash).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { ChartConfig } from "@/lib/chart-config";

const BirthInputSchema = z.object({
  name: z.string().max(120).optional(),
  gender: z.enum(["unspecified", "male", "female", "neutral", "other"]).optional(),
  place: z.string().max(200).optional(),
  year: z.number().int().min(1800).max(2200),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  seconds: z.number().int().min(0).max(59).optional(),
  tzOffsetHours: z.number().min(-14).max(14),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  language: z.enum(["en", "hi", "hi_roman"]).optional(),
  chartStyle: z.enum(["north", "south", "east"]).optional(),
});

const ConfigSchema = z.object({
  ayanamsa: z.enum(["lahiri", "raman", "kp-old", "kp-new", "tropical"]),
  houseSystem: z.enum(["whole-sign", "placidus", "koch", "equal", "sripati", "bhava-chalit"]),
  nodeType: z.enum(["mean", "true"]),
  elevationMeters: z.number().min(-500).max(9000).default(0),
  topocentric: z.boolean().default(false),
});

const CalcInputSchema = z.object({
  moduleId: z.string().min(1).max(64),
  birth: BirthInputSchema,
  config: ConfigSchema,
  savedChartId: z.string().uuid().optional(),
});

export const calculateAstroChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CalcInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { getAstroProvider, hashCalcRequest } = await import(
      "@/lib/astro-provider.server"
    );
    const provider = getAstroProvider("swiss");
    const config = data.config as ChartConfig;
    const hash = hashCalcRequest(data.birth, config, data.moduleId);
    const cacheKey = `${data.moduleId}:${hash}`;

    // Cache lookup
    const cached = await context.supabase
      .from("chart_calculations")
      .select("payload, engine_version")
      .eq("user_id", context.userId)
      .eq("engine_version", `${provider.version}::${cacheKey}`)
      .maybeSingle();
    if (cached.data?.payload) {
      return { chart: cached.data.payload, cached: true, engineVersion: provider.version };
    }

    // Compute
    const chart = await provider.computeRashi(data.birth, config);

    // Store (best-effort; ignore duplicate/unique conflicts silently)
    await context.supabase.from("chart_calculations").upsert(
      {
        user_id: context.userId,
        chart_id: data.savedChartId ?? null,
        config_hash: hash,
        engine_version: `${provider.version}::${cacheKey}`,
        payload: JSON.parse(JSON.stringify(chart)),
      },
      { onConflict: "user_id,chart_id,engine_version,config_hash", ignoreDuplicates: true },
    );

    return { chart, cached: false, engineVersion: provider.version };
  });
