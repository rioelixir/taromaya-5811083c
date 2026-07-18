import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MONTHLY_LIMIT = 10;

const KindSchema = z.object({
  kind: z.enum(["kundli", "report"]),
  label: z.string().max(120).optional(),
});

export type PdfQuotaStatus = {
  kind: "kundli" | "report";
  used: number;
  limit: number | null; // null = unlimited (admin)
  isAdmin: boolean;
  remaining: number | null;
  periodStart: string;
};

function periodStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function computeStatus(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  kind: "kundli" | "report",
): Promise<PdfQuotaStatus> {
  const { data: adminRow } = await supabase
    .rpc("has_role", { _user_id: userId, _role: "admin" });
  const isAdmin = adminRow === true;
  const periodStart = periodStartIso();
  if (isAdmin) {
    return { kind, used: 0, limit: null, isAdmin: true, remaining: null, periodStart };
  }
  const { count } = await supabase
    .from("pdf_downloads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", periodStart);
  const used = count ?? 0;
  return {
    kind,
    used,
    limit: MONTHLY_LIMIT,
    isAdmin: false,
    remaining: Math.max(0, MONTHLY_LIMIT - used),
    periodStart,
  };
}

/** Read current usage/limit for both kinds. */
export const getPdfQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{
    kundli: PdfQuotaStatus;
    report: PdfQuotaStatus;
  }> => {
    const [kundli, report] = await Promise.all([
      computeStatus(context.supabase, context.userId, "kundli"),
      computeStatus(context.supabase, context.userId, "report"),
    ]);
    return { kundli, report };
  });

/** Reserve one download slot. Throws if the caller is over quota. */
export const recordPdfDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => KindSchema.parse(input))
  .handler(async ({ data, context }): Promise<PdfQuotaStatus> => {
    const status = await computeStatus(context.supabase, context.userId, data.kind);
    if (!status.isAdmin && status.remaining !== null && status.remaining <= 0) {
      throw new Error(
        `Monthly ${data.kind} PDF limit reached (${MONTHLY_LIMIT}/month). Resets on the 1st.`,
      );
    }
    const { error } = await context.supabase.from("pdf_downloads").insert({
      user_id: context.userId,
      kind: data.kind,
      label: data.label ?? null,
    });
    if (error) throw new Error(error.message);
    // Return updated status.
    return computeStatus(context.supabase, context.userId, data.kind);
  });
