/* মেলা — helpers and server calls (same Supabase project and the same browser storage keys as the static pages,
   so the cart, wishlist and login are shared between the two sites). */

export const SB = {
  url: "https://gjawsgadcwqlohvfakzp.supabase.co",
  key: "sb_publishable_Yj2bClV0p5p9y2bxRpJ3Xw_ONx64AcF",
};

export const bn = (n) => Number(n).toLocaleString("bn-BD");
export const tk = (n) => "৳" + bn(n);
export const STATUS = { pending: "প্রক্রিয়াধীন", shipped: "পাঠানো হয়েছে", delivered: "পৌঁছেছে", cancelled: "বাতিল" };
export const VAR = [{ n: "সাধারণ", x: 0 }, { n: "উপহার প্যাক", x: 60 }];
export const soldOut = (p) => p.s != null && p.s <= 0;

/* browser storage (JSON) */
export const ls = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

/* product pictures live on Cloudinary; only Cloudinary upload addresses are accepted */
const CLD = /^https:\/\/res\.cloudinary\.com\/[A-Za-z0-9_-]+\/image\/upload\//;
export const img = (u, w) =>
  CLD.test(u || "") ? u.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_fill,ar_1:1,w_${+w || 400}/`) : "";

/* ---- customer accounts: Supabase Auth over plain fetch ---- */
const SESSION_KEY = "mela_session";
export const getSession = () => ls.get(SESSION_KEY, null);

async function authReq(path, body, tok, method = "POST") {
  const r = await fetch(SB.url + "/auth/v1/" + path, {
    method,
    headers: { apikey: SB.key, "Content-Type": "application/json", ...(tok ? { Authorization: "Bearer " + tok } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && (j.msg || j.error_description || j.message || j.error)) || "auth failed");
  return j;
}

function saveSession(j) {
  if (!j || !j.access_token) return null;
  const old = getSession();
  const u = j.user || (old && old.user) || {};
  const s = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
    user: { id: u.id, email: u.email, meta: u.user_metadata || u.meta || {} },
  };
  ls.set(SESSION_KEY, s);
  return s;
}

export const getUser = () => ls.get("mela_user", null);
function applyMeta(m) {
  if (m && (m.full_name || m.mobile || m.address)) ls.set("mela_user", { name: m.full_name || "", phone: m.mobile || "", addr: m.address || "" });
}

let refreshing = null;
export function token() {
  const s = getSession();
  if (!s) return Promise.resolve(null);
  if (s.expires_at - 60 > Date.now() / 1000) return Promise.resolve(s.access_token);
  if (!refreshing) {
    refreshing = authReq("token?grant_type=refresh_token", { refresh_token: s.refresh_token })
      .then((j) => { const n = saveSession(j); return n ? n.access_token : null; })
      .catch(() => { ls.del(SESSION_KEY); return null; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

/* true when logged in, false when the email must be confirmed first */
export async function signUp(email, password) {
  const s = saveSession(await authReq("signup", { email, password }));
  if (s) applyMeta(s.user.meta);
  return !!s;
}
export async function signIn(email, password) {
  const s = saveSession(await authReq("token?grant_type=password", { email, password }));
  if (!s) throw new Error("auth failed");
  applyMeta(s.user.meta);
}
export function signOutNow() {
  const s = getSession();
  ls.del(SESSION_KEY);
  ls.del("mela_user");
  if (s) authReq("logout", null, s.access_token).catch(() => {});
}
/* the reset email opens the static reset page (it is on Supabase's redirect list) */
export const recover = (email) =>
  authReq("recover?redirect_to=" + encodeURIComponent(location.origin + "/website/reset-password.html"), { email });

export async function saveProfile(d) {
  ls.set("mela_user", d);
  if (!getSession()) return;
  const t = await token();
  if (!t) return;
  const j = await authReq("user", { data: { full_name: d.name, mobile: d.phone, address: d.addr } }, t, "PUT");
  const s = getSession();
  if (s) { s.user = { id: j.id, email: j.email, meta: j.user_metadata || {} }; ls.set(SESSION_KEY, s); }
}

/* ---- database (REST) ---- */
export async function sb(path, opt = {}) {
  const t = await token();
  const r = await fetch(SB.url + "/rest/v1/" + path, {
    ...opt,
    headers: { apikey: SB.key, "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}), ...(opt.headers || {}) },
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && (j.message || j.error)) || "request failed");
  return j;
}

export async function fetchCatalog() {
  const [cs, ps] = await Promise.all([
    sb("categories?select=id,name,emoji,color&order=sort"),
    sb("products?select=id,name,category_id,price,emoji,description,stock,image_url&active=eq.true&order=id"),
  ]);
  return {
    cats: cs.map((c) => ({ id: c.id, n: c.name, e: c.emoji || "🏷️", c: c.color || "#f4a300" })),
    products: ps.map((p) => ({ id: p.id, n: p.name, c: p.category_id, p: p.price, e: p.emoji || "🛍️", d: p.description || "", s: p.stock, i: p.image_url || null })),
  };
}

/* ---- orders ---- */
export const savedOrders = () => ls.get("mela_orders", []);
export function rememberOrder(o) {
  ls.set("mela_orders", [...savedOrders(), o]);
  ls.set("mela_order", o);
}

/* one key per checkout attempt: sending the same checkout twice returns the first order */
function orderKey(d, lines) {
  const sig = JSON.stringify([lines.map((l) => [l.k, l.q]), d.name, d.phone, d.addr]);
  let o = ls.get("mela_order_key", null);
  if (!o || o.sig !== sig) {
    o = { sig, key: window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2, 12) };
    ls.set("mela_order_key", o);
  }
  return o.key;
}

/* the server recomputes every price and takes the stock; the browser cannot change them */
export async function placeOrder(d, lines) {
  const items = lines.map((l) => { const [id, vi] = l.k.split(":"); return { id: +id, qty: l.q, gift: +vi > 0 }; });
  const r = await sb("rpc/place_order", {
    method: "POST",
    body: JSON.stringify({ p_name: d.name, p_phone: d.phone, p_address: d.addr, p_items: items, p_key: orderKey(d, lines) }),
  });
  ls.del("mela_order_key");
  return r;
}
export const myOrders = () =>
  sb("orders?select=id,total,status,created_at,order_items(name,emoji,unit_price,qty)&order=created_at.desc&limit=50");
export const trackOrder = (id, phone) =>
  sb("rpc/track_order", { method: "POST", body: JSON.stringify({ p_id: id, p_phone: phone }) });

export const fmtDate = (d) => {
  try { return new Date(d).toLocaleString("bn-BD", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch { return ""; }
};
