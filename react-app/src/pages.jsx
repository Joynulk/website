import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useStore, addToCart, setCart, syncCart, toggleWish, toast, loadCatalog } from "./store.js";
import { ProductCard } from "./Layout.jsx";
import { bn, tk, img, soldOut, VAR, STATUS, ls, getUser, placeOrder, saveProfile, rememberOrder, savedOrders, trackOrder, fmtDate } from "./lib.js";

function useTitle(t) { useEffect(() => { document.title = t + " — মেলা"; }, [t]); }

/* ---------------- home ---------------- */
export function Home() {
  const { cats, products } = useStore();
  useEffect(() => { document.title = "মেলা — দেশি শখের জিনিস, সেরা দামে"; }, []);
  return (
    <main className="bleed">
      <section className="hero">
        <div className="hero-in">
          <span className="chip2">সারাদেশে ক্যাশ অন ডেলিভারি</span>
          <h1>দেশি শখের জিনিস, সেরা দামে</h1>
          <p>হাতের কাজ, শাড়ি-পোশাক, খাবার আর ঘরকন্নার প্রয়োজনীয় জিনিস — এক জায়গায়।</p>
          <Link className="btn" to="/shop">এখনই কিনুন</Link>
        </div>
        <div className="hero-art" aria-hidden="true"><span>🥻</span><span>🏺</span><span>🍯</span></div>
      </section>
      <section className="trust" aria-label="সুবিধা">
        <div><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg><span><b>ক্যাশ অন ডেলিভারি</b><small>পণ্য হাতে পেয়ে টাকা দিন</small></span></div>
        <div><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6.2" /><path d="M4 4v4h4" /></svg><span><b>৭ দিনে ফেরত</b><small>পছন্দ না হলে ফেরত</small></span></div>
        <div><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h11v9H2zM13 9h4l3 3v3h-7" /><circle cx="6" cy="17" r="1.8" /><circle cx="16" cy="17" r="1.8" /></svg><span><b>২০০০ টাকায় ফ্রি ডেলিভারি</b><small>নিচে ডেলিভারি ৬০ টাকা</small></span></div>
        <div><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></svg><span><b>অর্ডার ট্র্যাক</b><small>লগইন ছাড়াই অবস্থা জানুন</small></span></div>
      </section>
      <section className="sec">
        <div className="sh"><h2>ক্যাটাগরি অনুযায়ী কিনুন</h2><Link to="/shop">সব দেখুন ›</Link></div>
        <div className="cats">
          {cats.map((c) => (
            <Link key={c.id} className="cat" to={"/shop?c=" + encodeURIComponent(c.id)}><span className="ci" aria-hidden="true">{c.e}</span>{c.n}</Link>
          ))}
        </div>
      </section>
      <section className="sec">
        <div className="sh"><h2>জনপ্রিয় পণ্য</h2><Link to="/shop">সব পণ্য ›</Link></div>
        <div className="grid">{products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>
      <section className="sec" style={{ paddingBottom: 40 }}>
        <Link className="btn alt" to="/shop" style={{ maxWidth: 320, margin: "8px auto 0" }}>আরও পণ্য দেখুন</Link>
      </section>
    </main>
  );
}

/* ---------------- shop ---------------- */
export function Shop() {
  const { cats, products, ready } = useStore();
  const [sp, setSp] = useSearchParams();
  useTitle("দোকান");
  const cat = sp.get("c") || "all", q = sp.get("q") || "", so = sp.get("so") || "", pf = sp.get("pf") || "";
  const upd = (k, v) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const [lo, hi] = (pf || "0-99999").split("-").map(Number);
  const list = products.filter((p) => (cat === "all" || p.c === cat) && p.n.includes(q.trim()) && p.p >= lo && p.p < hi);
  if (so === "pa") list.sort((a, b) => a.p - b.p);
  if (so === "pd") list.sort((a, b) => b.p - a.p);
  if (so === "nm") list.sort((a, b) => a.n.localeCompare(b.n, "bn"));
  return (
    <main className="wide">
      <h2>সব পণ্য</h2>
      <div className="tools">
        <input type="search" value={q} onChange={(e) => upd("q", e.target.value)} placeholder="পণ্য খুঁজুন…" aria-label="পণ্য খুঁজুন" autoComplete="off" />
        <select value={so} onChange={(e) => upd("so", e.target.value)} aria-label="সাজান">
          <option value="">সাজান: ডিফল্ট</option><option value="pa">দাম: কম থেকে বেশি</option><option value="pd">দাম: বেশি থেকে কম</option><option value="nm">নাম অনুযায়ী</option>
        </select>
        <select value={pf} onChange={(e) => upd("pf", e.target.value)} aria-label="দামের সীমা">
          <option value="">সব দাম</option><option value="0-500">৫০০ টাকার নিচে</option><option value="500-1500">৫০০ থেকে ১৫০০ টাকার নিচে</option><option value="1500-99999">১৫০০ টাকা বা তার বেশি</option>
        </select>
      </div>
      <div className="chips" role="group" aria-label="ক্যাটাগরি">
        <button type="button" className={"chip" + (cat === "all" ? " on" : "")} aria-pressed={cat === "all"} onClick={() => upd("c", "")}>🎪 সব দোকান</button>
        {cats.map((c) => <button type="button" key={c.id} className={"chip" + (cat === c.id ? " on" : "")} aria-pressed={cat === c.id} onClick={() => upd("c", c.id)}>{c.e} {c.n}</button>)}
      </div>
      <p className="cnt" aria-live="polite">{bn(list.length)}টি পণ্য</p>
      <div className="grid">
        {list.length ? list.map((p) => <ProductCard key={p.id} p={p} />) : <div className="empty">{ready ? "কোনো পণ্য পাওয়া যায়নি। ফিল্টার বদলে দেখুন।" : "লোড হচ্ছে…"}</div>}
      </div>
    </main>
  );
}

/* ---------------- product ---------------- */
export function Product() {
  const { id } = useParams();
  const { products, cats, ready, wish } = useStore();
  const nav = useNavigate();
  const p = products.find((x) => String(x.id) === id);
  const [vi, setVi] = useState(0);
  const [qty, setQty] = useState(1);
  useEffect(() => { setVi(0); setQty(1); }, [id]);
  useEffect(() => { document.title = (p ? p.n : "পণ্য") + " — মেলা"; }, [p]);
  if (!p) return <main className="wide"><p className="empty">{ready ? <>পণ্যটি পাওয়া যায়নি। <Link to="/shop">দোকানে ফিরুন</Link></> : "লোড হচ্ছে…"}</p></main>;
  const cat = cats.find((c) => c.id === p.c) || { n: "দোকান" };
  const out = soldOut(p);
  const maxq = Math.min(20, p.s != null ? Math.max(p.s, 1) : 20);
  const pr = p.p + VAR[vi].x;
  const im = img(p.i, 900);
  const rel = products.filter((x) => x.c === p.c && x.id !== p.id).slice(0, 4);
  const w = wish.includes(p.id);
  return (
    <main className="wide">
      <nav className="crumb" aria-label="পথ"><Link to="/">হোম</Link> › <Link to={"/shop?c=" + encodeURIComponent(p.c)}>{cat.n}</Link> › {p.n}</nav>
      <div className="pd">
        <div className="pimg" style={{ overflow: "hidden" }} aria-hidden="true">
          {im ? <img src={im} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : p.e}
        </div>
        <div className="pinfo">
          <h1>{p.n}</h1>
          <div className="pprice" aria-live="polite">{tk(pr)}</div>
          <p>{p.d}</p>
          <div className="vs" role="group" aria-label="ধরন">
            {VAR.map((v, i) => <button type="button" key={i} className={"vr" + (i === vi ? " on" : "")} aria-pressed={i === vi} onClick={() => setVi(i)}>{v.n}{v.x ? " +" + tk(v.x) : ""}</button>)}
          </div>
          <div className="qr">
            <div className="qc">
              <button type="button" aria-label="কমান" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <b aria-live="polite">{bn(qty)}</b>
              <button type="button" aria-label="বাড়ান" onClick={() => setQty(Math.min(maxq, qty + 1))}>+</button>
            </div>
            <b aria-live="polite">{tk(pr * qty)}</b>
          </div>
          <div className="acts">
            <button type="button" className="btn" disabled={out} onClick={() => (addToCart(p.id, vi, qty) ? toast(p.n + " কার্টে যোগ হয়েছে") : toast("স্টক নেই"))}>{out ? "স্টক নেই" : "কার্টে যোগ করুন"}</button>
            <button type="button" className="btn alt" disabled={out} onClick={() => { if (addToCart(p.id, vi, qty)) nav("/cart"); else toast("স্টক নেই"); }}>এখনই কিনুন</button>
            <button type="button" className="hrt big" aria-label="প্রিয় তালিকা" aria-pressed={w} onClick={() => toggleWish(p.id)}>{w ? "♥" : "♡"}</button>
          </div>
          <ul className="perks"><li>🚚 ক্যাশ অন ডেলিভারি</li><li>🔁 ৭ দিনে ফেরত</li><li>🎁 ২০০০ টাকা বা তার বেশি কিনলে ডেলিভারি ফ্রি</li></ul>
        </div>
      </div>
      {rel.length > 0 && <section><h2>এই ধরনের আরও পণ্য</h2><div className="grid">{rel.map((x) => <ProductCard key={x.id} p={x} />)}</div></section>}
    </main>
  );
}

/* ---------------- cart and checkout ---------------- */
function oops(m) {
  if (/too many orders/.test(m)) return "এই ফোন নম্বর থেকে ঘণ্টায় ৩টির বেশি অর্ডার নেওয়া হয় না। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  if (/out of stock/.test(m)) return "কিছু পণ্যের স্টক এখন যথেষ্ট নেই। কার্ট ঠিক করে দেওয়া হয়েছে, আবার দেখে অর্ডার করুন।";
  if (/product not found/.test(m)) return "কোনো পণ্য আর পাওয়া যাচ্ছে না। কার্ট ঠিক করে দেওয়া হয়েছে, আবার দেখুন।";
  return "অর্ডার পাঠানো যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।";
}

export function Cart() {
  const { cart, session, ready } = useStore();
  const nav = useNavigate();
  const saved = getUser() || {};
  const [f, setF] = useState({ name: saved.name || "", phone: saved.phone || "", addr: saved.addr || "" });
  const [keep, setKeep] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState(null);
  useTitle("কার্ট");
  useEffect(() => { if (ready) syncCart(); }, [ready]);

  const sub = cart.reduce((s, l) => s + l.pr * l.q, 0);
  const ship = sub && sub < 2000 ? 60 : 0;
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function change(i, d) {
    const next = cart.map((l) => ({ ...l }));
    if (d < 0 && next[i].q === 1) {
      const [rm] = next.splice(i, 1);
      setCart(next);
      setUndo({ l: rm, i });
      setTimeout(() => setUndo((u) => (u && u.l === rm ? null : u)), 6000);
      return;
    }
    next[i].q += d;
    setCart(next);
  }
  function restore() {
    if (!undo) return;
    const next = cart.map((l) => ({ ...l }));
    next.splice(Math.min(undo.i, next.length), 0, { ...undo.l, q: 1 });
    setCart(next);
    setUndo(null);
  }
  async function submit(e) {
    e.preventDefault();
    if (!cart.length) return;
    setBusy(true); setErr("");
    const d = { name: f.name.trim(), phone: f.phone.trim(), addr: f.addr.trim() };
    try {
      const r = await placeOrder(d, cart);
      rememberOrder({ id: r.id, name: d.name, phone: d.phone, addr: d.addr, lines: cart, total: r.total, date: new Date().toISOString(), status: "প্রক্রিয়াধীন" });
      if (keep) saveProfile(d).catch(() => {});
      setCart([]);
      nav("/placed");
      return;
    } catch (x) {
      setErr(oops(x.message));
      if (/out of stock|product not found/.test(x.message)) { await loadCatalog(); syncCart(); }
    }
    setBusy(false);
  }

  return (
    <main>
      <h2>আপনার কার্ট</h2>
      <div>
        {cart.length ? cart.map((l, i) => (
          <div className="row" key={l.k}>
            <i aria-hidden="true">{l.e}</i>
            <div>{l.n}<br /><small>{tk(l.pr)}</small></div>
            <button type="button" aria-label={l.n + " কমান"} onClick={() => change(i, -1)}>−</button>
            <b>{bn(l.q)}</b>
            <button type="button" aria-label={l.n + " বাড়ান"} onClick={() => change(i, 1)}>+</button>
          </div>
        )) : <p className="empty">কার্ট খালি। <Link to="/shop">কেনাকাটা শুরু করুন</Link></p>}
      </div>
      <p className="note" role="status">
        {undo && <>{undo.l.n} কার্ট থেকে সরানো হয়েছে। <button type="button" className="chip" onClick={restore}>ফিরিয়ে আনুন</button></>}
      </p>
      <div className="sum">
        <div><span>পণ্যের দাম</span><span>{tk(sub)}</span></div>
        <div><span>ডেলিভারি (২০০০ টাকার নিচে)</span><span>{ship ? tk(ship) : "বিনামূল্যে"}</span></div>
        <div className="t"><span>মোট</span><span>{tk(sub + ship)}</span></div>
      </div>
      <h2>ডেলিভারির ঠিকানা</h2>
      <p className="note">
        {session && session.user ? "লগইন আছে: " + session.user.email + " — অর্ডারটি আপনার অ্যাকাউন্টে যোগ হবে।" : <>লগইন ছাড়াও অর্ডার করা যাবে। <Link to="/login">লগইন করলে</Link> অর্ডার ইতিহাস সব ডিভাইসে দেখতে পারবেন।</>}
      </p>
      <form onSubmit={submit}>
        <label htmlFor="nm">নাম</label><input id="nm" name="name" required autoComplete="name" value={f.name} onChange={on("name")} />
        <label htmlFor="ph">মোবাইল নম্বর</label><input id="ph" name="phone" type="tel" required inputMode="numeric" pattern="01[3-9][0-9]{8}" title="১১ সংখ্যার বাংলাদেশি নম্বর, যেমন 017XXXXXXXX" autoComplete="tel" value={f.phone} onChange={on("phone")} />
        <label htmlFor="ad">পূর্ণ ঠিকানা</label><textarea id="ad" name="address" rows={3} required minLength={5} autoComplete="street-address" value={f.addr} onChange={on("addr")} />
        <label className="chk"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> পরের বারের জন্য আমার তথ্য মনে রাখুন</label>
        <p className="note" role="alert" style={{ color: "var(--red)" }}>{err}</p>
        <button className="btn" type="submit" disabled={busy || !cart.length}>{busy ? "অর্ডার পাঠানো হচ্ছে…" : "অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি)"}</button>
      </form>
    </main>
  );
}

export function Placed() {
  const o = ls.get("mela_order", null);
  useTitle("অর্ডার সম্পন্ন");
  if (!o) return <main><p className="empty">কোনো অর্ডার পাওয়া যায়নি। <Link to="/shop">দোকানে ফিরুন</Link></p></main>;
  return (
    <main>
      <div className="ok" aria-hidden="true">🎉</div>
      <h2 style={{ textAlign: "center" }}>ধন্যবাদ! অর্ডার পাওয়া গেছে</h2>
      <p style={{ textAlign: "center", color: "var(--mute)" }}>অর্ডার নম্বর {o.id} · {o.name} · {o.phone}</p>
      {(o.lines || []).map((l) => <div className="row" key={l.k}><i>{l.e}</i><div>{l.n}</div><b>{bn(l.q)} × {tk(l.pr)}</b></div>)}
      <div className="sum"><div className="t"><span>মোট (ক্যাশ অন ডেলিভারি)</span><span>{tk(o.total)}</span></div></div>
      <Link className="btn" to={"/track?id=" + encodeURIComponent(o.id)}>অর্ডারের অবস্থা দেখুন</Link>
      <Link className="btn alt" to="/shop">আবার কেনাকাটা করুন</Link>
      <Link className="btn alt" to="/account">আমার অ্যাকাউন্ট</Link>
    </main>
  );
}

/* ---------------- order tracking ---------------- */
const DIG = "০১২৩৪৫৬৭৮৯";
const en = (s) => String(s).replace(/[০-৯]/g, (d) => DIG.indexOf(d)).trim();
const RANK = { pending: 0, shipped: 1, delivered: 2 };

function OrderView({ r }) {
  const ev = {};
  (r.events || []).forEach((e) => { ev[e.status] = e.at; });
  const steps = r.status === "cancelled"
    ? [["অর্ডার হয়েছে", r.created_at, "done"], ["বাতিল হয়েছে", ev.cancelled, "done bad"]]
    : [["অর্ডার হয়েছে", r.created_at, "pending"], ["পাঠানো হয়েছে", ev.shipped, "shipped"], ["পৌঁছেছে", ev.delivered, "delivered"]]
        .map(([t, at, k]) => [t, at, RANK[k] <= RANK[r.status] ? "done" : ""]);
  return (
    <article className="ord">
      <div className="oh"><b>{r.id}</b><span className={"st st-" + r.status}>{STATUS[r.status] || r.status}</span></div>
      <ol className="tl">{steps.map(([t, at, c]) => <li key={t} className={c}><b>{t}</b>{at && c ? <small>{fmtDate(at)}</small> : null}</li>)}</ol>
      <ul>{(r.items || []).map((i, n) => <li key={n}>{i.emoji || ""} {i.name} × {bn(i.qty)}</li>)}</ul>
      <div className="ot">মোট: {tk(r.total)} (ডেলিভারি {tk(r.shipping)})</div>
    </article>
  );
}

export function Track() {
  const [sp] = useSearchParams();
  const mine = useMemo(() => savedOrders().filter((o) => o && o.id && o.phone).slice(-5).reverse(), []);
  const [id, setId] = useState(sp.get("id") || "");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState({});
  useTitle("অর্ডার ট্র্যাক");

  async function run(i, ph) {
    setErr(""); setRes(null);
    i = en(i).toUpperCase(); ph = en(ph);
    if (!/^M\d{6}$/.test(i)) { setErr("অর্ডার নম্বর এভাবে লিখুন: M000001"); return; }
    if (!/^01[3-9]\d{8}$/.test(ph)) { setErr("১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন, যেমন 017XXXXXXXX"); return; }
    setBusy(true);
    try {
      const r = await trackOrder(i, ph);
      if (!r) setErr("এই নম্বর ও ফোনে কোনো অর্ডার মিলছে না। অর্ডারের সময় যে ফোন দিয়েছিলেন তাই দিন।");
      else setRes(r);
    } catch { setErr("লোড করা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।"); }
    setBusy(false);
  }

  useEffect(() => {
    const want = sp.get("id");
    const m = want && mine.find((o) => o.id === want);
    if (m) { setPhone(m.phone); run(m.id, m.phone); }
    mine.forEach(async (o) => {
      try { const r = await trackOrder(o.id, o.phone); if (r) setLive((s) => ({ ...s, [o.id]: r.status })); } catch { /* offline */ }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <h2>অর্ডার ট্র্যাক করুন</h2>
      <p className="note">অর্ডার নম্বর আর অর্ডারে দেওয়া মোবাইল নম্বর দিন। লগইন লাগবে না।</p>
      <form onSubmit={(e) => { e.preventDefault(); run(id, phone); }}>
        <label htmlFor="ti">অর্ডার নম্বর</label>
        <input id="ti" name="order" placeholder="M000001" autoComplete="off" autoCapitalize="characters" maxLength={12} required value={id} onChange={(e) => setId(e.target.value)} />
        <label htmlFor="tp">মোবাইল নম্বর</label>
        <input id="tp" name="phone" type="tel" inputMode="numeric" maxLength={11} autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="note" role="alert" style={{ color: "var(--red)" }}>{err}</p>
        <button className="btn" type="submit" disabled={busy}>{busy ? "খুঁজছি…" : "অবস্থা দেখুন"}</button>
      </form>
      <div aria-live="polite">{res && <OrderView r={res} />}</div>
      {mine.length > 0 && (
        <section>
          <h2>আপনার সাম্প্রতিক অর্ডার</h2>
          {mine.map((o) => (
            <div className="rl" key={o.id}>
              <div><b>{o.id}</b><br /><small className="note">{fmtDate(o.date)} · {tk(o.total)}</small></div>
              {live[o.id] ? <span className={"st st-" + live[o.id]}>{STATUS[live[o.id]]}</span> : <span className="st" />}
              <button type="button" onClick={() => { setId(o.id); setPhone(o.phone); run(o.id, o.phone); window.scrollTo({ top: 0, behavior: "smooth" }); }}>দেখুন</button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

/* ---------------- wishlist ---------------- */
export function Wishlist() {
  const { products, wish } = useStore();
  useTitle("প্রিয় তালিকা");
  const list = products.filter((p) => wish.includes(p.id));
  return (
    <main className="wide">
      <h2>প্রিয় তালিকা</h2>
      {list.length
        ? <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        : <p className="empty">কোনো পণ্য প্রিয় তালিকায় নেই। পণ্যের কার্ডে ♡ চাপুন। <Link to="/shop">দোকানে যান</Link></p>}
    </main>
  );
}

/* ---------------- text pages ---------------- */
export function About() {
  useTitle("আমাদের কথা");
  return (
    <main className="prose">
      <h1>আমাদের কথা</h1>
      <p>মেলা একটি অনলাইন দোকান। এখানে পাবেন দেশি শখের জিনিস, হাতের কাজ আর রোজকার প্রয়োজনের পণ্য।</p>
      <h2>কীভাবে কাজ করে</h2>
      <p>পছন্দের পণ্য কার্টে রাখুন, নাম ও ঠিকানা দিন, আর অর্ডার নিশ্চিত করুন। পণ্য হাতে পেয়ে টাকা দিন (ক্যাশ অন ডেলিভারি)। অ্যাকাউন্ট ছাড়াও অর্ডার করা যায়।</p>
      <Link className="btn" to="/shop">কেনাকাটা শুরু করুন</Link>
    </main>
  );
}

export function Policy() {
  useTitle("ডেলিভারি ও ফেরত");
  return (
    <main className="prose">
      <h1>ডেলিভারি ও ফেরত</h1>
      <h2>পেমেন্ট</h2><p>শুধু ক্যাশ অন ডেলিভারি। পণ্য হাতে পেয়ে টাকা দিন।</p>
      <h2>ডেলিভারি চার্জ</h2>
      <ul><li>২০০০ টাকার নিচে কিনলে ডেলিভারি চার্জ ৬০ টাকা।</li><li>২০০০ টাকা বা তার বেশি কিনলে ডেলিভারি ফ্রি।</li></ul>
      <h2>ফেরত</h2><p>পণ্য পাওয়ার ৭ দিনের মধ্যে ফেরত দেওয়া যাবে।</p>
      <h2>অর্ডার ও স্টক</h2>
      <ul><li>একটি ফোন নম্বর থেকে ঘণ্টায় সর্বোচ্চ ৩টি অর্ডার নেওয়া হয়।</li><li>স্টক শেষ হলে অর্ডার নেওয়া বন্ধ থাকে।</li><li>অর্ডার বাতিল হলে পণ্যগুলো আবার স্টকে ফিরে আসে।</li></ul>
    </main>
  );
}

export function Help() {
  useTitle("প্রশ্নোত্তর");
  return (
    <main>
      <h1>প্রশ্নোত্তর</h1>
      <details><summary>অর্ডার কীভাবে করব?</summary><p>পছন্দের পণ্য কার্টে যোগ করুন, কার্ট পেজে নাম, মোবাইল নম্বর ও ঠিকানা লিখে অর্ডার নিশ্চিত করুন।</p></details>
      <details><summary>লগইন ছাড়া অর্ডার করা যায়?</summary><p>হ্যাঁ। তবে অ্যাকাউন্ট খুললে অর্ডার ইতিহাস ও ঠিকানা সব ডিভাইসে পাওয়া যায়।</p></details>
      <details><summary>আমার অর্ডারের অবস্থা কোথায় দেখব?</summary><p><Link to="/track">অর্ডার ট্র্যাক</Link> পেজে অর্ডার নম্বর ও মোবাইল নম্বর দিন। লগইন লাগবে না। অবস্থা হতে পারে: প্রক্রিয়াধীন, পাঠানো হয়েছে, পৌঁছেছে, বাতিল।</p></details>
      <details><summary>ডেলিভারি চার্জ কত?</summary><p>২০০০ টাকার নিচে ৬০ টাকা। ২০০০ টাকা বা তার বেশি হলে ফ্রি।</p></details>
      <details><summary>পাসওয়ার্ড ভুলে গেলে কী করব?</summary><p><Link to="/forgot">পাসওয়ার্ড রিসেট</Link> পেজে অ্যাকাউন্টের ইমেইল দিন। ইমেইল না এলে <Link to="/contact">যোগাযোগ</Link> করুন, পরিচয় মিললে মালিক আপনাকে রিসেট লিংক পাঠিয়ে দেবেন।</p></details>
      <details><summary>দোকানের সঙ্গে কীভাবে যোগাযোগ করব?</summary><p>ফোন, WhatsApp বা SMS-এ। নম্বর ও বোতাম <Link to="/contact">যোগাযোগ</Link> পেজে আছে।</p></details>
    </main>
  );
}

export function Contact() {
  useTitle("যোগাযোগ");
  return (
    <main className="prose">
      <h1>যোগাযোগ</h1>
      <p>অর্ডার, ডেলিভারি, পাসওয়ার্ড বা অন্য যে কোনো বিষয়ে জানতে ফোন বা মেসেজ করুন।</p>
      <p style={{ fontSize: 28, fontWeight: 600, margin: "8px 0", color: "var(--ink)" }}><a href="tel:+8801911753985" style={{ textDecoration: "none" }}>01911-753985</a></p>
      <a className="btn" href="tel:+8801911753985">ফোন করুন</a>
      <a className="btn alt" href="https://wa.me/8801911753985" target="_blank" rel="noopener noreferrer">WhatsApp-এ মেসেজ</a>
      <a className="btn alt" href="sms:+8801911753985">SMS পাঠান</a>
      <h2>মেসেজে কী জানাবেন</h2>
      <ul>
        <li><b>অর্ডার নিয়ে:</b> অর্ডার নম্বর ও অর্ডারে দেওয়া ফোন নম্বর। অবস্থা নিজে দেখতে <Link to="/track">অর্ডার ট্র্যাক</Link> পেজটি দেখুন।</li>
        <li><b>পাসওয়ার্ড ভুলে গেলে:</b> আগে <Link to="/forgot">পাসওয়ার্ড রিসেট</Link> চেষ্টা করুন। ইমেইল না এলে অ্যাকাউন্টের ইমেইল জানান। পরিচয় মিললে মালিক আপনাকে রিসেট লিংক পাঠিয়ে দেবেন।</li>
        <li><b>ডেলিভারি ও ফেরত:</b> নিয়ম জানতে <Link to="/policy">ডেলিভারি ও ফেরত</Link> দেখুন।</li>
      </ul>
    </main>
  );
}

export function NotFound() {
  useTitle("পাতাটি পাওয়া যায়নি");
  return (
    <main style={{ textAlign: "center", paddingTop: "10vh" }}>
      <div className="ok" aria-hidden="true">🔍</div>
      <h1>পাতাটি পাওয়া যায়নি</h1>
      <p className="note">লিংকটি ভুল অথবা পাতাটি সরানো হয়েছে।</p>
      <Link className="btn" style={{ maxWidth: 320 }} to="/">হোমপেজে ফিরুন</Link>
    </main>
  );
}
