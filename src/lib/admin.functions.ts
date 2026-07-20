import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;
    const ids = data.users.map((u) => u.id);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    });
    return data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      confirmed: !!u.email_confirmed_at,
      roles: roleMap.get(u.id) ?? [],
    }));
  });

export const adminGrantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "user" }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw error;
    return { ok: true };
  });

export const adminRevokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "user" }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const adminListSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("*")
      .order("key");
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: unknown }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({
        key: data.key,
        value: data.value as any,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_settings").delete().eq("key", data.key);
    if (error) throw error;
    return { ok: true };
  });

export const adminListKundlis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("saved_kundlis")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

export const adminDeleteKundli = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("saved_kundlis").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: users }, { count: kundlis }, { count: admins }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("saved_kundlis").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    ]);
    return { users: users ?? 0, kundlis: kundlis ?? 0, admins: admins ?? 0 };
  });

const TEST_USER_EMAIL = "testuser@taromaya.app";

export const adminProvisionTestUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { password?: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password =
      data.password && data.password.length >= 8
        ? data.password
        : `Taromaya#${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`;

    // Find existing test user (paginate a bit in case list is large)
    let existing: any = null;
    for (let page = 1; page <= 10; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      existing = list.users.find((u) => u.email?.toLowerCase() === TEST_USER_EMAIL);
      if (existing || list.users.length < 200) break;
    }

    let userId: string;
    if (existing) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (error) throw error;
      userId = existing.id;
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Test User", terms_accepted: true },
      });
      if (error) throw error;
      userId = created.user!.id;
    }

    // Make sure test user is NOT an admin (so PremiumGate + views apply normally)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");

    // Ensure terms accepted so they can enter the app
    await supabaseAdmin
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", userId);

    // Give them an active 1-year subscription so every module is unlocked
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    await supabaseAdmin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          status: "active",
          expires_at: expires.toISOString(),
        },
        { onConflict: "user_id" },
      );

    return { email: TEST_USER_EMAIL, password, userId };
  });
