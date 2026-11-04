// cloudinary-sign: gives the admin page a signed upload ticket for Cloudinary.
// Only a logged-in shop admin gets one (checked through the database's is_admin()).
// The Cloudinary API secret never leaves this function: it is read from the CLOUDINARY_URL secret
// (format cloudinary://API_KEY:API_SECRET@CLOUD_NAME), set in Supabase -> Edge Functions -> Secrets.

const ORIGIN = "https://joynulk.github.io";
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

  // is the caller a shop admin? the database decides, using the caller's own token
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_Yj2bClV0p5p9y2bxRpJ3Xw_ONx64AcF";
  const r = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: anon, Authorization: auth, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok || (await r.json()) !== true) return json({ error: "admin only" }, 403);

  const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec((Deno.env.get("CLOUDINARY_URL") || "").trim());
  if (!m) return json({ error: "cloudinary not configured" }, 500);
  const [, apiKey, apiSecret, cloud] = m;

  // the uploader must send exactly these parameters, or Cloudinary rejects the signature
  const params: Record<string, string> = {
    allowed_formats: "jpg,png,webp",
    folder: "mela/products",
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  const signature = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return json({ cloud, api_key: apiKey, signature, ...params });
});
