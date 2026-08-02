import { supabase } from "@/integrations/supabase/client";
import type { LoShuInput } from "./types";

export type LoShuReport = {
  id: string;
  full_name: string;
  birth_date: string;
  gender: string | null;
  notes: string | null;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, full_name, birth_date, gender, notes, is_favourite, created_at, updated_at";

export async function listReports(search = ""): Promise<LoShuReport[]> {
  let q = supabase
    .from("loshu_reports")
    .select(COLUMNS)
    .order("is_favourite", { ascending: false })
    .order("created_at", { ascending: false });
  if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as LoShuReport[];
}

export async function saveReport(input: LoShuInput, snapshot: unknown): Promise<LoShuReport> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Please sign in to save a report.");
  const { data, error } = await supabase
    .from("loshu_reports")
    .insert({
      user_id: userId,
      full_name: input.fullName,
      birth_date: input.birthDate,
      gender: input.gender ?? null,
      notes: input.notes ?? null,
      snapshot: snapshot as never,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as LoShuReport;
}

export async function updateReport(
  id: string,
  patch: Partial<Pick<LoShuReport, "full_name" | "birth_date" | "gender" | "notes" | "is_favourite">>,
): Promise<void> {
  const { error } = await supabase.from("loshu_reports").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("loshu_reports").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateReport(row: LoShuReport, snapshot: unknown): Promise<LoShuReport> {
  return saveReport(
    {
      fullName: `${row.full_name} (copy)`,
      birthDate: row.birth_date,
      gender: row.gender ?? undefined,
      notes: row.notes ?? undefined,
    },
    snapshot,
  );
}
