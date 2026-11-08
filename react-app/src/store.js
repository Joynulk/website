/* মেলা — one small shared store (cart, wishlist, login, catalogue, theme, toast).
   Components read it with useStore(); actions below change it and keep the browser storage in step. */
import { useSyncExternalStore } from "react";
import { ls, getSession, fetchCatalog, VAR, soldOut } from "./lib.js";

const THEME_KEY = "mela_theme";
const readTheme = () => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } };
const cached = ls.get("mela_catalog", null);

let state = {
  cart: ls.get("mela_cart", []).filter((l) => l.q > 0),
  wish: ls.get("mela_wish", []),
  session: getSession(),
  cats: cached && Array.isArray(cached.CATS) ? cached.CATS : [],
  products: cached && Array.isArray(cached.P) ? cached.P : [],
  ready: !!(cached && Array.isArray(cached.P) && cached.P.length),
  theme: readTheme(),
  toast: null,
};

const listeners = new Set();
export const getState = () => state;
function set(patch) { state = { ...state, ...patch }; listeners.forEach((f) => f()); }
export const useStore = () =>
  useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, getState);

/* ---- theme ---- */
export function isDark() {
  const t = state.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}
function applyTheme() {
  const r = document.documentElement;
  if (state.theme === "light" || state.theme === "dark") r.setAttribute("data-theme", state.theme); else r.removeAttribute("data-theme");
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = isDark() ? "#0e2433" : "#38bdf8";
}
export function toggleTheme() {
  const next = isDark() ? "light" : "dark";
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  set({ theme: next });
  applyTheme();
}

/* ---- toast ---- */
export function toast(text) {
  const id = Date.now() + Math.random();
  set({ toast: { text, id } });
  setTimeout(() => { if (state.toast && state.toast.id === id) set({ toast: null }); }, 1800);
}

/* ---- catalogue ---- */
export async function loadCatalog() {
  try {
    const { cats, products } = await fetchCatalog();
    if (cats.length && products.length) {
      ls.set("mela_catalog", { CATS: cats, P: products });
      set({ cats, products, ready: true });
    } else set({ ready: true });
  } catch { set({ ready: true }); }
}

/* ---- cart: lines [{k:"id:variant", n, e, pr, q}] ---- */
export function setCart(lines) {
  const cart = lines.filter((l) => l.q > 0);
  ls.set("mela_cart", cart);
  set({ cart });
}
/* returns false when the product is sold out */
export function addToCart(id, vi = 0, q = 1) {
  const p = state.products.find((x) => x.id == id);
  if (!p || soldOut(p)) return false;
  const k = p.id + ":" + vi;
  const cart = state.cart.map((l) => ({ ...l }));
  const f = cart.find((l) => l.k === k);
  if (f) f.q += q; else cart.push({ k, n: p.n + (vi ? " (" + VAR[vi].n + ")" : ""), e: p.e, pr: p.p + VAR[vi].x, q });
  setCart(cart);
  return true;
}
/* keep the cart equal to the shop: current prices, no products that are gone, quantities within stock */
export function syncCart() {
  if (!state.products.length) return;
  const left = {};
  state.products.forEach((p) => { if (p.s != null) left[p.id] = p.s; });
  const cart = state.cart
    .filter((l) => state.products.some((p) => p.id == l.k.split(":")[0]))
    .map((l) => {
      const [id, v] = l.k.split(":");
      const p = state.products.find((x) => x.id == id);
      const n = { ...l, pr: p.p + (VAR[+v] || VAR[0]).x };
      if (left[id] != null) { n.q = Math.max(0, Math.min(n.q, left[id])); left[id] -= n.q; }
      return n;
    });
  setCart(cart);
}

/* ---- wishlist ---- */
export function toggleWish(id) {
  id = +id;
  const wish = state.wish.includes(id) ? state.wish.filter((x) => x !== id) : [...state.wish, id];
  ls.set("mela_wish", wish);
  set({ wish });
}

/* ---- login ---- */
export const refreshSession = () => set({ session: getSession() });

/* ---- start-up ---- */
export function initApp() {
  applyTheme();
  loadCatalog();
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (!state.theme) { applyTheme(); set({}); } }); } catch { /* old browser */ }
  /* another tab (or the static pages) changed the cart, wishlist or login */
  addEventListener("storage", () => set({ cart: ls.get("mela_cart", []).filter((l) => l.q > 0), wish: ls.get("mela_wish", []), session: getSession() }));
}
