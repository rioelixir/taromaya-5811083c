import { createFileRoute } from "@tanstack/react-router";

// One-shot admin bootstrap. Guarded by CRON_SECRET header.
// Creates the two allow-listed staff accounts with email pre-confirmed so the
// `grant_admin_for_allowlisted_email` trigger auto-grants them the admin role.
const ADMINS: Array<{ email: string; password: string }> = [
  { email: "tarotbyriaa@gmail.com", password: "rioooo" },
  { email: "taromayaexperts@gmail.com", password: "giaaaa" },
];

export const Route = createFileRoute("/api/public/bootstrap-admins")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret) return new Response("CRON_SECRET not configured", { status: 500 });
        const provided =
          request.headers.get("x-cron-secret") ||
          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        if (provided !== secret) return new Response("Unauthorized", { status: 401 });


        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const results: Array<{ email: string; status: string; id?: string; error?: string }> = [];
        for (const a of ADMINS) {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: a.email,
            password: a.password,
            email_confirm: true,
          });
          if (error) {
            // Already exists — look them up and ensure profile + admin role.
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
            const existing = list?.users.find((u) => u.email?.toLowerCase() === a.email.toLowerCase());
            if (!existing) {
              results.push({ email: a.email, status: "create_failed", error: error.message });
              continue;
            }
            await supabaseAdmin
              .from("profiles")
              .upsert(
                { id: existing.id, email: a.email, is_comped: true, terms_accepted_at: new Date().toISOString() },
                { onConflict: "id" },
              );
            await supabaseAdmin
              .from("user_roles")
              .upsert({ user_id: existing.id, role: "admin" }, { onConflict: "user_id,role" });
            results.push({ email: a.email, status: "backfilled", id: existing.id });
            continue;
          }
          const uid = data.user?.id;
          if (uid) {
            await supabaseAdmin
              .from("profiles")
              .upsert(
                { id: uid, email: a.email, is_comped: true, terms_accepted_at: new Date().toISOString() },
                { onConflict: "id" },
              );
            await supabaseAdmin
              .from("user_roles")
              .upsert({ user_id: uid, role: "admin" }, { onConflict: "user_id,role" });
          }
          results.push({ email: a.email, status: "created", id: uid });
        }

        return new Response(JSON.stringify({ ok: true, results }, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
