import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStore, toggleTheme, isDark, toggleWish, addToCart, toast, refreshSession } from "./store.js";
import { bn, tk, img, soldOut, signOutNow } from "./lib.js";

const ICONS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h3l2.4 11h10l2-8H7" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  box: <><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
};
export const Svg = ({ k }) => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true">{ICONS[k]}</svg>
);

function Header({ onMenu }) {
  const { cart } = useStore();
  const count = cart.reduce((s, l) => s + l.q, 0);
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const dark = isDark();
  const ic = (to, k, t, extra, cls) => (
    <NavLink to={to} className={({ isActive }) => (cls || "") + (isActive ? " on" : "")} aria-label={t}>
      <Svg k={k} /><span>{t}</span>{extra}
    </NavLink>
  );
  const search = (e) => {
    e.preventDefault();
    nav("/shop" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : ""));
  };
  return (
    <header>
      <div className="hb">
        <button type="button" className="mbtn" aria-label="মেনু খুলুন" onClick={onMenu}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <Link className="logo" to="/">মেলা</Link>
        <form className="hs" role="search" onSubmit={search}>
          <input type="search" name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="পণ্য খুঁজুন… (পাঞ্জাবি, শাড়ি)" aria-label="পণ্য খুঁজুন" autoComplete="off" />
          <button type="submit" aria-label="খুঁজুন"><Svg k="search" /></button>
        </form>
        <nav className="ic" aria-label="দ্রুত লিংক">
          {ic("/track", "box", "ট্র্যাক", null, "trk")}
          {ic("/wishlist", "heart", "প্রিয়")}
          {ic("/cart", "cart", "কার্ট", <b className="bd">{bn(count)}</b>)}
          {ic("/account", "user", "অ্যাকাউন্ট")}
          <button type="button" className="tg" onClick={toggleTheme} aria-label={dark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}>
            <Svg k={dark ? "sun" : "moon"} /><span>{dark ? "লাইট" : "ডার্ক"}</span>
          </button>
        </nav>
      </div>
      <nav className="tn" aria-label="প্রধান মেনু">
        <NavLink end to="/">হোম</NavLink>
        <NavLink to="/shop">দোকান</NavLink>
        <NavLink to="/track">অর্ডার ট্র্যাক</NavLink>
        <NavLink to="/contact">যোগাযোগ</NavLink>
        <NavLink to="/help">প্রশ্নোত্তর</NavLink>
        <NavLink to="/about">আমাদের কথা</NavLink>
      </nav>
    </header>
  );
}

/* slide menu: hamburger + left drawer */
function Menu({ open, onClose }) {
  const { cats, cart, session } = useStore();
  const panel = useRef(null);
  const tx = useRef(null);
  const nav = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    const el = panel.current;
    if (el) el.inert = !open;
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return undefined;
    if (el) el.querySelector(".smx").focus({ preventScroll: true });
    const key = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !el) return;
      const f = [...el.querySelectorAll("a[href],button:not([disabled]),input")];
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [open, onClose]);

  const L = (to, ico, t, extra) => (
    <Link to={to} onClick={onClose}><span aria-hidden="true">{ico}</span>{t}{extra}</Link>
  );
  const count = cart.reduce((s, l) => s + l.q, 0);
  const logout = () => { signOutNow(); refreshSession(); onClose(); nav("/"); };

  return (
    <>
      <div className={"smo" + (open ? " on" : "")} onClick={onClose} />
      <aside
        ref={panel}
        id="sm"
        className={"sm" + (open ? " on" : "")}
        role="dialog"
        aria-modal="true"
        aria-label="মেনু"
        onTouchStart={(e) => { tx.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (tx.current !== null && e.changedTouches[0].clientX - tx.current < -60) onClose(); tx.current = null; }}
      >
        <div className="smh"><b>মেলা</b><button type="button" className="smx" aria-label="মেনু বন্ধ করুন" onClick={onClose}>✕</button></div>
        <div className="smb2">
          <form className="ss" role="search" onSubmit={(e) => { e.preventDefault(); onClose(); nav("/shop" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : "")); }}>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="পণ্য খুঁজুন…" aria-label="পণ্য খুঁজুন" autoComplete="off" />
          </form>
          <nav className="sl" aria-label="সাইটের মেনু">
            {L("/", "🏠", "হোম")}{L("/shop", "🛍️", "সব পণ্য")}
            <h3>ক্যাটাগরি</h3>
            {cats.map((c) => <span key={c.id} style={{ display: "contents" }}>{L("/shop?c=" + encodeURIComponent(c.id), c.e, c.n)}</span>)}
            <h3>আমার</h3>
            {L("/wishlist", "♡", "প্রিয় তালিকা")}
            {L("/cart", "🛒", "কার্ট", <b className="smb">{bn(count)}</b>)}
            {L("/track", "📦", "অর্ডার ট্র্যাক")}
            {session && session.user ? (
              <>
                <p className="sw">{session.user.email}</p>
                {L("/account", "👤", "আমার অ্যাকাউন্ট")}
                <button type="button" className="so" onClick={logout}>লগ আউট</button>
              </>
            ) : (
              <>{L("/login", "👤", "লগইন")}{L("/signup", "✨", "নতুন অ্যাকাউন্ট")}</>
            )}
            <h3>সহায়তা</h3>
            {L("/contact", "📞", "যোগাযোগ")}{L("/about", "ℹ️", "আমাদের কথা")}{L("/policy", "🚚", "ডেলিভারি ও ফেরত")}{L("/help", "❓", "প্রশ্নোত্তর")}
          </nav>
        </div>
      </aside>
    </>
  );
}

function Footer() {
  return (
    <footer>
      <div className="fg">
        <div><h4>কেনাকাটা</h4><Link to="/shop">সব পণ্য</Link><Link to="/wishlist">প্রিয় তালিকা</Link><Link to="/cart">কার্ট</Link></div>
        <div><h4>অ্যাকাউন্ট</h4><Link to="/account">আমার অ্যাকাউন্ট</Link><Link to="/login">লগইন</Link><Link to="/signup">নতুন অ্যাকাউন্ট</Link></div>
        <div><h4>সহায়তা</h4><Link to="/contact">যোগাযোগ</Link><Link to="/about">আমাদের কথা</Link><Link to="/policy">ডেলিভারি ও ফেরত</Link><Link to="/help">প্রশ্নোত্তর</Link></div>
      </div>
      <p className="fl">© মেলা ২০২৬ · ক্যাশ অন ডেলিভারি · ৭ দিনে ফেরত · ফোন: <a href="tel:+8801911753985">01911-753985</a></p>
    </footer>
  );
}

function Floating() {
  const { cart } = useStore();
  const { pathname } = useLocation();
  const count = cart.reduce((s, l) => s + l.q, 0);
  const hideCart = pathname === "/cart" || pathname === "/placed";
  return (
    <>
      {!hideCart && <Link className="fab ct" to="/cart" aria-label="কার্ট"><Svg k="cart" /><b className="bd">{bn(count)}</b></Link>}
      <a className="fab wa" href="https://wa.me/8801911753985" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp-এ মেসেজ করুন">
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" /><path d="M16.6 14.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.3-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.5 1.4.6 2 .7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.5-.2z" /></svg>
      </a>
    </>
  );
}

function ToastBar() {
  const { toast: t } = useStore();
  return <div className={"toast" + (t ? " on" : "")} role="status">{t ? t.text : ""}</div>;
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); setOpen(false); }, [pathname]);
  return (
    <>
      <a className="skip" href="#/" onClick={(e) => { e.preventDefault(); const m = document.getElementById("main"); if (m) m.focus(); }}>মূল অংশে যান</a>
      <Header onMenu={() => setOpen(true)} />
      <Menu open={open} onClose={() => setOpen(false)} />
      <div id="main" tabIndex={-1} style={{ outline: "none" }}>{children}</div>
      <Footer />
      <Floating />
      <ToastBar />
    </>
  );
}

export function ProductCard({ p }) {
  const { wish } = useStore();
  const nav = useNavigate();
  const w = wish.includes(p.id);
  const im = img(p.i, 400);
  const add = () => (addToCart(p.id) ? toast(p.n + " কার্টে যোগ হয়েছে") : toast("স্টক নেই"));
  const buy = () => { if (addToCart(p.id)) nav("/cart"); else toast("স্টক নেই"); };
  return (
    <article className="p">
      <Link className="ph" to={"/product/" + p.id} aria-label={p.n + " বিস্তারিত"}>
        {im ? <img src={im} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : p.e}
      </Link>
      <button type="button" className={"hrt" + (w ? " on" : "")} aria-label="প্রিয় তালিকা" aria-pressed={w} onClick={() => toggleWish(p.id)}>{w ? "♥" : "♡"}</button>
      <div className="in">
        <h3><Link to={"/product/" + p.id}>{p.n}</Link></h3>
        <span className="pr">{tk(p.p)}</span>
        <div className="cb">
          {soldOut(p)
            ? <button type="button" className="add" disabled>স্টক নেই</button>
            : <><button type="button" className="add alt" onClick={add}>কার্টে দিন</button><button type="button" className="add" onClick={buy}>অর্ডার করুন</button></>}
        </div>
      </div>
    </article>
  );
}
