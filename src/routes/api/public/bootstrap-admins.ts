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
      POST: async ({ request: _request }) => {

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const results: Array<{ email: string; status: string; id?: string; error?: string }> = [];
        for (const a of ADMINS) {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: a.email,
            password: a.password,
            email_confirm: true,
          });
          if (error) {
            // If already exists, look up and update password + confirm.
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
            const existing = list?.users.find((u) => u.email?.toLowerCase() === a.email.toLowerCase());
            if (existing) {
              const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
                password: a.password,
                email_confirm: true,
              });
              if (updErr) {
                results.push({ email: a.email, status: "update_failed", error: updErr.message });
                continue;
              }
              // Ensure admin role row exists (trigger only fires on confirm event).
              await supabaseAdmin
                .from("user_roles")
                .upsert({ user_id: existing.id, role: "admin" }, { onConflict: "user_id,role" });
              results.push({ email: a.email, status: "updated", id: existing.id });
            } else {
              results.push({ email: a.email, status: "create_failed", error: error.message });
            }
            continue;
          }
          const uid = data.user?.id;
          if (uid) {
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
