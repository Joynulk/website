// admin-recovery-link: lets the shop owner make a one-time password-reset link for a customer
// who cannot receive the reset email. The owner then sends the link by phone / WhatsApp.
// Only a logged-in shop admin may call it (checked through the database's is_admin()).
// It uses the project's service key (auto-provided to Edge Functions, never sent to the browser).

const ORIGIN = "https://joynulk.github.io";
const RESET_PAGE = ORIGIN + "/website/reset-password.html";
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "login required" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_Yj2bClV0p5p9y2bxRpJ3Xw_ONx64AcF";
  const r = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: anon, Authorization: auth, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok || (await r.json()) !== true) return json({ error: "admin only" }, 403);

  let email = "";
  try { email = String((await req.json()).email || "").trim().toLowerCase(); } catch (_) { /* empty body */ }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "bad email" }, 400);

  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) return json({ error: "not configured" }, 500);

  // generate_link makes the link but does not send any email
  const g = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "recovery", email, redirect_to: RESET_PAGE }),
  });
  const j = await g.json().catch(() => null);
  const link = j && (j.action_link || (j.properties && j.properties.action_link));
  if (!g.ok || !link) return json({ error: "not found" }, 404);

  const meta = (j.user_metadata || (j.user && j.user.user_metadata) || {}) as Record<string, string>;
  // name and mobile are returned so the owner can check it is really that customer
  return json({ link, name: meta.full_name || "", mobile: meta.mobile || "" });
});
