import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Employee access. Everything here is decided on the server.
 * An employee gets full access only while they have a live work session.
 */

const SESSION_HOURS = 12;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Role check failed");
  if (!data) throw new Error("Forbidden: admin only");
}

async function log(
  admin: any,
  actorId: string | null,
  subjectId: string | null,
  action: string,
  detail: Record<string, unknown> = {},
) {
  try {
    await admin.from("security_audit_log").insert({
      actor_id: actorId,
      subject_id: subjectId,
      action,
      detail: detail as any,
    });
  } catch {
    // Never let logging break the action itself.
  }
}

/** Called when a signed-in person opens the app. Starts or refreshes their work session. */
export const startWorkSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { device?: string } | undefined) => ({
    device: typeof d?.device === "string" ? d.device.slice(0, 200) : null,
  }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();

    // Reuse a session that is still alive so refreshes do not pile up rows.
    const { data: live } = await supabaseAdmin
      .from("work_sessions")
      .select("id, expires_at")
      .eq("user_id", context.userId)
      .is("revoked_at", null)
      .gt("expires_at", now.toISOString())
      .gt("last_seen_at", new Date(now.getTime() - 15 * 60 * 1000).toISOString())
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (live?.id) {
      await supabaseAdmin
        .from("work_sessions")
        .update({ last_seen_at: now.toISOString() })
        .eq("id", live.id);
      return { sessionId: live.id as string, resumed: true };
    }

    const { data: created, error } = await supabaseAdmin
      .from("work_sessions")
      .insert({
        user_id: context.userId,
        device: data.device,
        last_seen_at: now.toISOString(),
        expires_at: new Date(now.getTime() + SESSION_HOURS * 3600 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;

    await log(supabaseAdmin, context.userId, context.userId, "session_started", {
      device: data.device,
    });
    return { sessionId: created.id as string, resumed: false };
  });

/** Keeps the session marked as alive. Returns false once it is dead or revoked. */
export const heartbeatWorkSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => {
    if (!d?.sessionId) throw new Error("Missing session");
    return d;
  })
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: row, error } = await supabaseAdmin
      .from("work_sessions")
      .update({ last_seen_at: now })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .is("revoked_at", null)
      .gt("expires_at", now)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return { active: !!row };
  });

/** Ends the session on sign out. Access falls back to the normal rules right away. */
export const endWorkSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => {
    if (!d?.sessionId) throw new Error("Missing session");
    return d;
  })
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("work_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .is("revoked_at", null);
    await log(supabaseAdmin, context.userId, context.userId, "session_ended");
    return { ok: true };
  });

/** What the signed-in person is allowed to see, decided on the server. */
export const myAccessStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: employee }, { data: liveSession }, { data: premium }] = await Promise.all([
      context.supabase.rpc("is_employee", { _user_id: context.userId }),
      context.supabase.rpc("has_active_work_session", { _user_id: context.userId }),
      context.supabase.rpc("is_premium", { _user_id: context.userId }),
    ]);
    const isEmployee = !!employee;
    const hasLiveSession = !!liveSession;
    return {
      isEmployee,
      hasLiveSession,
      employeeAccessActive: isEmployee && hasLiveSession,
      isPremium: !!premium,
    };
  });

/* ------------------------------- admin side ------------------------------- */

export const adminListEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: people, error: pErr }, { data: emps }, { data: sessions }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabaseAdmin.from("employees").select("user_id, is_active, note, granted_at"),
      supabaseAdmin
        .from("work_sessions")
        .select("user_id, last_seen_at, expires_at, revoked_at")
        .is("revoked_at", null),
    ]);
    if (pErr) throw pErr;

    const empMap = new Map((emps ?? []).map((e) => [e.user_id, e]));
    const now = Date.now();
    const liveUsers = new Set(
      (sessions ?? [])
        .filter(
          (s) =>
            new Date(s.expires_at).getTime() > now &&
            now - new Date(s.last_seen_at).getTime() < 15 * 60 * 1000,
        )
        .map((s) => s.user_id),
    );

    return (people ?? []).map((p) => {
      const e = empMap.get(p.id);
      const isEmployee = !!e?.is_active;
      return {
        id: p.id,
        email: p.email,
        display_name: p.display_name,
        created_at: p.created_at,
        isEmployee,
        note: e?.note ?? null,
        hasLiveSession: liveUsers.has(p.id),
        accessActive: isEmployee && liveUsers.has(p.id),
      };
    });
  });

export const adminSetEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; isEmployee: boolean; note?: string }) => {
    if (!d?.userId) throw new Error("Missing person");
    return { userId: d.userId, isEmployee: !!d.isEmployee, note: d.note?.slice(0, 500) ?? null };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("employees").upsert({
      user_id: data.userId,
      is_active: data.isEmployee,
      note: data.note,
      granted_by: context.userId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    // Turning employee status off also kills their live sessions immediately.
    if (!data.isEmployee) {
      await supabaseAdmin
        .from("work_sessions")
        .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
        .eq("user_id", data.userId)
        .is("revoked_at", null);
    }

    await log(
      supabaseAdmin,
      context.userId,
      data.userId,
      data.isEmployee ? "employee_enabled" : "employee_disabled",
      { note: data.note },
    );
    return { ok: true };
  });

export const adminListSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("work_sessions")
      .select("id, user_id, started_at, last_seen_at, expires_at, revoked_at, device")
      .order("last_seen_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const ids = Array.from(new Set((data ?? []).map((s) => s.user_id)));
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, email, display_name").in("id", ids)
      : { data: [] as any[] };
    const nameMap = new Map((people ?? []).map((p) => [p.id, p.email ?? p.display_name ?? p.id]));

    const now = Date.now();
    return (data ?? []).map((s) => ({
      ...s,
      who: nameMap.get(s.user_id) ?? s.user_id,
      live:
        !s.revoked_at &&
        new Date(s.expires_at).getTime() > now &&
        now - new Date(s.last_seen_at).getTime() < 15 * 60 * 1000,
    }));
  });

export const adminRevokeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => {
    if (!d?.sessionId) throw new Error("Missing session");
    return d;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("work_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
      .eq("id", data.sessionId)
      .is("revoked_at", null)
      .select("user_id")
      .maybeSingle();
    if (error) throw error;
    await log(supabaseAdmin, context.userId, row?.user_id ?? null, "session_revoked", {
      session_id: data.sessionId,
    });
    return { ok: true };
  });

export const adminRevokeAllSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => {
    if (!d?.userId) throw new Error("Missing person");
    return d;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("work_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
      .eq("user_id", data.userId)
      .is("revoked_at", null);
    if (error) throw error;
    await log(supabaseAdmin, context.userId, data.userId, "sessions_force_logout");
    return { ok: true };
  });

export const adminAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("security_audit_log")
      .select("id, actor_id, subject_id, action, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const ids = Array.from(
      new Set([
        ...(data ?? []).map((r) => r.actor_id),
        ...(data ?? []).map((r) => r.subject_id),
      ].filter(Boolean) as string[]),
    );
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, email, display_name").in("id", ids)
      : { data: [] as any[] };
    const nameMap = new Map((people ?? []).map((p) => [p.id, p.email ?? p.display_name ?? p.id]));

    return (data ?? []).map((r) => ({
      id: r.id,
      action: r.action,
      created_at: r.created_at,
      actor: r.actor_id ? (nameMap.get(r.actor_id) ?? r.actor_id) : "system",
      subject: r.subject_id ? (nameMap.get(r.subject_id) ?? r.subject_id) : null,
    }));
  });
