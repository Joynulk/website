import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore, refreshSession } from "./store.js";
import { signIn, signUp, recover, signOutNow, saveProfile, getUser, myOrders, bn, tk, fmtDate, STATUS } from "./lib.js";

function useTitle(t) { useEffect(() => { document.title = t + " — মেলা"; }, [t]); }

const nice = (m) =>
  /invalid login/i.test(m) ? "ইমেইল বা পাসওয়ার্ড ভুল। মনে না পড়লে “পাসওয়ার্ড ভুলে গেছেন?” চাপুন।"
  : /not confirmed/i.test(m) ? "আগে ইমেইল যাচাই করুন।"
  : /already|registered/i.test(m) ? "এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।"
  : /rate limit|too many|only request this after/i.test(m) ? "অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন।"
  : /weak|short|least|characters/i.test(m) ? "পাসওয়ার্ড সহজ বা ছোট। কমপ্রে ৮ অক্ষরের ভালো পাসওয়ার্ড দিন।"
  : "কাজটি হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।";

export function Login() {
  const { session } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useTitle("লগইন");
  useEffect(() => { if (session) nav("/account", { replace: true }); }, [session, nav]);
  async function go(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    try { await signIn(email.trim(), pw); refreshSession(); return; } catch (x) { setMsg(nice(x.message)); }
    setBusy(false);
  }
  return (
    <main>
      <h2>লগইন</h2>
      <p className="note">লগইন করলে আপনার অর্ডার ইতিহাস ও ঠিকানা সব ডিভাইসে পাবেন। লগইন ছাড়াও অর্ডার করা যায়।</p>
      <p className="note" role="alert" style={{ color: "var(--red)" }}>{msg}</p>
      <form onSubmit={go}>
        <label htmlFor="em">ইমেইল</label><input id="em" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">পাসওয়ার্ড</label><input id="pw" type={show ? "text" : "password"} required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <label className="chk"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> পাসওয়ার্ড দেখান</label>
        <button className="btn" type="submit" disabled={busy}>লগইন</button>
        <Link className="btn alt" to={"/forgot" + (email ? "?email=" + encodeURIComponent(email.trim()) : "")}>পাসওয়ার্ড ভুলে গেছেন?</Link>
      </form>
      <p style={{ textAlign: "center", marginTop: 20 }}>অ্যাকাউন্ট নেই? <Link to="/signup">নতুন অ্যাকাউন্ট খুলুন</Link></p>
    </main>
  );
}

export function Signup() {
  const { session } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  useTitle("নতুন অ্যাকাউন্ট");
  useEffect(() => { if (session) nav("/account", { replace: true }); }, [session, nav]);
  async function go(e) {
    e.preventDefault(); setMsg("");
    if (pw !== pw2) { setMsg("দুটি পাসওয়ার্ড এক হয়নি।"); return; }
    setBusy(true);
    try {
      const loggedIn = await signUp(email.trim(), pw);
      if (loggedIn) { refreshSession(); return; }
      setOk(true);
    } catch (x) { setMsg(nice(x.message)); }
    setBusy(false);
  }
  if (ok) return <main><h2>ইমেইল যাচাই করুন</h2><p>আমরা আপনার ইমেইলে একটি লিংক পাঠিয়েছি। লিংকে যাচাই করে লগইন করুন।</p><Link className="btn" to="/login">লগইনে যান</Link></main>;
  return (
    <main>
      <h2>নতুন অ্যাকাউন্ট</h2>
      <p className="note" role="alert" style={{ color: "var(--red)" }}>{msg}</p>
      <form onSubmit={go}>
        <label htmlFor="em">ইমেইল</label><input id="em" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</label><input id="pw" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <label htmlFor="pw2">আবার লিখুন</label><input id="pw2" type="password" required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <button className="btn" type="submit" disabled={busy}>অ্যাকাউন্ট খুলুন</button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20 }}>আগেই অ্যাকাউন্ট আছে? <Link to="/login">লগইন করুন</Link></p>
    </main>
  );
}

export function Forgot() {
  const [email, setEmail] = useState(new URLSearchParams(location.hash.split("?")[1] || "").get("email") || "");
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useTitle("পাসওয়ার্ড ভুলে গেছেন?");
  async function go(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    try { await recover(email.trim()); setDone(true); }
    catch (x) { setMsg(/rate limit|too many|only request this after/i.test(x.message) ? "অনেকবার চেষ্টা হয়েছে। এক মিনিট পর আবার চেষ্টা করুন।" : "এখন ইমেইল পাঠানো যাচ্ছে না। দোকানে যোগাযোগ করুন, মালিক আপনাকে পাসওয়ার্ড বদলানোর লিংক পাঠিয়ে দেবেন।"); }
    setBusy(false);
  }
  return (
    <main>
      <h2>পাসওয়ার্ড ভুলে গেছেন?</h2>
      {done ? (
        <>
          <p><b>ইমেইলটি নিবন্ধিত থাকলে লিংক পাঠানো হয়েছে।</b></p>
          <ul className="note" style={{ paddingLeft: 20 }}>
            <li>ইনবক্সের পাশাপাশি স্প্যাম ও প্রমোশন ফোল্ডারও দেখুন।</li>
            <li>কয়েক মিনিট লাগতে পারে। লিংকটি শুধু একবার কাজ করে আর সময় পার হলে অচল হয়।</li>
            <li>তারপরও না এলে <Link to="/contact">দোকানে যোগাযোগ</Link> করুন।</li>
          </ul>
        </>
      ) : (
        <form onSubmit={go}>
          <p className="note">আপনার অ্যাকাউন্টের ইমেইল দিন। নিবন্ধিত থাকলে পাসওয়ার্ড বদলানোর লিংক পাঠানো হবে।</p>
          <label htmlFor="em">ইমেইল</label><input id="em" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <p className="note" role="alert" style={{ color: "var(--red)" }}>{msg}</p>
          <button className="btn" type="submit" disabled={busy}>লিংক পাঠান</button>
        </form>
      )}
      <p style={{ textAlign: "center", marginTop: 20 }}><Link to="/login">লগইনে ফিরে যান</Link> · <Link to="/contact">যোগাযোগ</Link></p>
    </main>
  );
}

export function Account() {
  const { session } = useStore();
  const nav = useNavigate();
  const saved = getUser() || {};
  const [f, setF] = useState({ name: saved.name || "", phone: saved.phone || "", addr: saved.addr || "" });
  const [msg, setMsg] = useState("");
  const [orders, setOrders] = useState(null);
  useTitle("আমার অ্যাকাউন্ট");
  useEffect(() => {
    if (!session) return;
    myOrders().then(setOrders).catch(() => setOrders([]));
  }, [session]);
  if (!session) return <Navigate to="/login" replace />;
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault(); setMsg("");
    try { await saveProfile({ name: f.name.trim(), phone: f.phone.trim(), addr: f.addr.trim() }); setMsg("সংরক্ষণ হয়েছে।"); }
    catch { setMsg("সংরক্ষণ হয়নি। আবার চেষ্টা করুন।"); }
  }
  return (
    <main>
      <h2>আমার অ্যাকাউন্ট</h2>
      <p className="note">{session.user && session.user.email}</p>
      <h2>ডেলিভারির তথ্য</h2>
      <form onSubmit={save}>
        <label htmlFor="nm">নাম</label><input id="nm" autoComplete="name" value={f.name} onChange={on("name")} />
        <label htmlFor="ph">মোবাইল নম্বর</label><input id="ph" type="tel" inputMode="numeric" pattern="01[3-9][0-9]{8}" autoComplete="tel" value={f.phone} onChange={on("phone")} />
        <label htmlFor="ad">ঠিকানা</label><textarea id="ad" rows={3} autoComplete="street-address" value={f.addr} onChange={on("addr")} />
        <p className="note" role="status">{msg}</p>
        <button className="btn" type="submit">সংরক্ষণ করুন</button>
      </form>
      <h2>আমার অর্ডার</h2>
      {orders === null ? <p className="note">লোড হচ্ছে…</p>
        : orders.length ? orders.map((o) => (
          <article className="ord" key={o.id}>
            <div className="oh"><b>{o.id}</b><span className={"st st-" + o.status}>{STATUS[o.status] || o.status}</span></div>
            <small className="note">{fmtDate(o.created_at)}</small>
            <ul>{(o.order_items || []).map((i, n) => <li key={n}>{i.emoji || ""} {i.name} × {bn(i.qty)}</li>)}</ul>
            <div className="ot">মোট: {tk(o.total)}</div>
          </article>
        )) : <p className="empty">এখনো কোনো অর্ডার নেই। <Link to="/shop">কেনাকাটা শুরু করুন</Link></p>}
      <button type="button" className="btn alt" onClick={() => { signOutNow(); refreshSession(); nav("/"); }}>লগ আউট</button>
    </main>
  );
}
