/* মেলা — shared data and helpers (plain browser JS, no build step) */
const Mela=(()=>{
/* ---- light / dark theme: follows the phone until the visitor taps the theme button, then remembers the choice ---- */
const THEME_KEY="mela_theme";
function savedTheme(){try{return localStorage.getItem(THEME_KEY)}catch(e){return null}}
function isDark(){
  const t=document.documentElement.getAttribute("data-theme");
  return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;
}
function applyTheme(t){
  const r=document.documentElement;
  if(t==="light"||t==="dark")r.setAttribute("data-theme",t);else r.removeAttribute("data-theme");
  const m=document.querySelector('meta[name="theme-color"]');
  if(m)m.content=isDark()?"#0e2433":"#38bdf8";
}
applyTheme(savedTheme());

/* built-in starter catalogue: used until (or if) the Supabase copy can be loaded */
const CATS=[
 {id:"all",n:"সব দোকান",e:"🎪",c:"#f4a300"},
 {id:"cloth",n:"শাড়ি ও পোশাক",e:"🥻",c:"#f28ba0"},
 {id:"craft",n:"হাতের কাজ",e:"🏺",c:"#e9a56b"},
 {id:"food",n:"খাবার",e:"🍯",c:"#9fd8a3"},
 {id:"toy",n:"খেলনা",e:"🪁",c:"#8ec5f2"},
 {id:"home",n:"ঘরকন্না",e:"🪔",c:"#c9a7ec"}
];
const P=[
 {id:1,n:"জামদানি শাড়ি",c:"cloth",p:4800,e:"🥻",d:"হাতে বোনা জামদানি, নকশাদার পাড়।"},
 {id:2,n:"নকশি কাঁথা",c:"cloth",p:2200,e:"🧵",d:"গ্রামের মায়েদের হাতে সেলাই করা কাঁথা।"},
 {id:3,n:"পাঞ্জাবি",c:"cloth",p:1450,e:"👘",d:"নরম সুতি কাপড়ের হালকা পাঞ্জাবি।"},
 {id:4,n:"মাটির পুতুল",c:"craft",p:350,e:"🪆",d:"কুমারপাড়ার হাতে গড়া রঙিন পুতুল।"},
 {id:5,n:"শীতলপাটি",c:"craft",p:1800,e:"🧺",d:"সিলেটের ঐতিহ্যবাহী শীতলপাটি, গরমে আরাম।"},
 {id:6,n:"বাঁশের ঝুড়ি",c:"craft",p:420,e:"🧺",d:"শক্ত বাঁশের বুননে তৈরি বহুমুখী ঝুড়ি।"},
 {id:7,n:"খাঁটি মধু",c:"food",p:650,e:"🍯",d:"সুন্দরবনের ফুলের মধু, ৫০০ গ্রাম।"},
 {id:8,n:"নলেন গুড়",c:"food",p:380,e:"🟤",d:"খেজুরের রসের সুগন্ধি গুড়, ১ কেজি।"},
 {id:9,n:"আচারের সেট",c:"food",p:520,e:"🫙",d:"আম, জলপাই ও চালতার তিন স্বাদের আচার।"},
 {id:10,n:"রঙিন ঘুড়ি",c:"toy",p:120,e:"🪁",d:"হালকা কাগজ ও বাঁশের কঞ্চির ঘুড়ি।"},
 {id:11,n:"কাঠের লাটিম",c:"toy",p:150,e:"🪀",d:"হাতে কাটা কাঠের লাটিম, সুতোসহ।"},
 {id:12,n:"মাটির প্রদীপ",c:"home",p:180,e:"🪔",d:"১২টি প্রদীপের এক সেট।"},
 {id:13,n:"পিতলের ঘটি",c:"home",p:950,e:"🏺",d:"খাঁটি পিতলের ঘটি, ঝকঝকে পালিশ।"},
 {id:14,n:"তালপাখা",c:"home",p:90,e:"🪭",d:"বিদ্যুৎ ছাড়াই বাতাস, গরমের বন্ধু।"}
];
const VAR=[{n:"সাধারণ",x:0},{n:"উপহার প্যাক",x:60}];
const STATUS={pending:"প্রক্রিয়াধীন",shipped:"পাঠানো হয়েছে",delivered:"পৌঁছেছে",cancelled:"বাতিল"};

const bn=n=>Number(n).toLocaleString("bn-BD"),tk=n=>"৳"+bn(n);
const $=id=>document.getElementById(id);
/* every piece of shop data (names, descriptions, emoji) is escaped before it goes into innerHTML */
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* colours from the database must look like #rrggbb, anything else falls back to gold */
const col=c=>/^#[0-9a-fA-F]{6}$/.test(c)?c:"#f4a300";
const tone=id=>col((CATS.find(c=>c.id===id)||CATS[0]).c);
const params=()=>new URLSearchParams(location.search);
/* p.s is the stock from the database; the built-in starter list has none and counts as available */
const soldOut=p=>p.s!=null&&p.s<=0;
/* product pictures live on Cloudinary. Only Cloudinary upload addresses are accepted; the size is set in the address
   (f_auto,q_auto = smallest good format, c_fill + ar_1:1 = square crop, w_ = width in pixels). Returns "" if none. */
const CLD=/^https:\/\/res\.cloudinary\.com\/[A-Za-z0-9_-]+\/image\/upload\//;
const img=(u,w)=>CLD.test(u||"")?esc(u.replace("/image/upload/","/image/upload/f_auto,q_auto,c_fill,ar_1:1,w_"+(+w||400)+"/")):"";

/* localStorage helpers */
const get=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const del=k=>{try{localStorage.removeItem(k)}catch(e){}};

/* orders and saved customer details (browser copy; logged-in customers also keep them in their account) */
const orders=()=>get("mela_orders",[]);
const addOrder=o=>set("mela_orders",[...orders(),o]);
const user=()=>get("mela_user",null);
const setUser=u=>set("mela_user",u);

/* ---- Supabase (public URL + publishable key; access rules live in the database) ---- */
const SB={url:"https://gjawsgadcwqlohvfakzp.supabase.co",key:"sb_publishable_Yj2bClV0p5p9y2bxRpJ3Xw_ONx64AcF"};

/* ---- customer accounts: Supabase Auth over plain fetch ---- */
const SESSION_KEY="mela_session";
const session=()=>get(SESSION_KEY,null);
const loggedIn=()=>!!session();
async function auth(path,body,tok,method){
  const r=await fetch(SB.url+"/auth/v1/"+path,{
    method:method||"POST",
    headers:{apikey:SB.key,"Content-Type":"application/json",...(tok?{Authorization:"Bearer "+tok}:{})},
    body:body?JSON.stringify(body):undefined
  });
  const j=await r.json().catch(()=>null);
  if(!r.ok)throw new Error((j&&(j.msg||j.error_description||j.message||j.error))||"auth failed");
  return j;
}
function saveSession(j){
  if(!j||!j.access_token)return null;
  const old=session(),u=j.user||(old&&old.user)||{};
  const s={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at||Math.floor(Date.now()/1000)+(j.expires_in||3600),
    user:{id:u.id,email:u.email,meta:u.user_metadata||u.meta||{}}};
  set(SESSION_KEY,s);return s;
}
/* saved delivery details live in the account's user_metadata */
function applyMeta(m){if(m&&(m.full_name||m.mobile||m.address))setUser({name:m.full_name||"",phone:m.mobile||"",addr:m.address||""})}
let refreshing=null;
function token(){
  const s=session();if(!s)return Promise.resolve(null);
  if(s.expires_at-60>Date.now()/1000)return Promise.resolve(s.access_token);
  if(!refreshing)refreshing=auth("token?grant_type=refresh_token",{refresh_token:s.refresh_token})
    .then(j=>{const n=saveSession(j);return n?n.access_token:null})
    .catch(()=>{del(SESSION_KEY);return null})
    .finally(()=>{refreshing=null});
  return refreshing;
}
/* returns true when logged in, false when the email must be confirmed first */
async function signUp(email,password){
  const s=saveSession(await auth("signup",{email,password}));
  if(s)applyMeta(s.user.meta);
  return !!s;
}
async function signIn(email,password){
  const s=saveSession(await auth("token?grant_type=password",{email,password}));
  if(!s)throw new Error("auth failed");
  applyMeta(s.user.meta);
}
function signOut(){
  const s=session();del(SESSION_KEY);del("mela_user");
  if(s)auth("logout",null,s.access_token).catch(()=>{});
}
/* the reset email's link comes back to reset-password.html (it must be on Supabase's redirect list; if not, the site address is used and the forward below finds the page) */
const recover=email=>auth("recover?redirect_to="+encodeURIComponent(new URL("reset-password.html",location.href).href),{email});
const updatePassword=(tok,password)=>auth("user",{password},tok,"PUT");
async function saveProfile(d){
  setUser(d);
  if(!session())return;
  const t=await token();if(!t)return;
  const j=await auth("user",{data:{full_name:d.name,mobile:d.phone,address:d.addr}},t,"PUT");
  const s=session();if(s){s.user={id:j.id,email:j.email,meta:j.user_metadata||{}};set(SESSION_KEY,s)}
}
/* password-reset emails land on the site's address with a token in the #hash: forward to the reset page */
if(/type=recovery/.test(location.hash)&&!/(account|reset-password)\.html$/.test(location.pathname))location.replace("reset-password.html"+location.hash);

async function sb(path,opt={}){
  const t=await token();
  const r=await fetch(SB.url+"/rest/v1/"+path,{...opt,headers:{apikey:SB.key,"Content-Type":"application/json",...(t?{Authorization:"Bearer "+t}:{}),...(opt.headers||{})}});
  const j=await r.json().catch(()=>null);
  if(!r.ok)throw new Error((j&&(j.message||j.error))||"request failed");
  return j;
}
/* true only when the logged-in account is in the admins table (the database decides, not the page) */
const isAdmin=()=>sb("rpc/is_admin",{method:"POST",body:"{}"}).then(r=>r===true);

/* catalogue: built-in fallback -> cached copy -> fresh copy from the database.
   The arrays are updated in place, so pages that destructured CATS/P keep working. */
function applyCatalog(cs,ps){CATS.splice(1,CATS.length,...cs);P.splice(0,P.length,...ps)}
const cached=get("mela_catalog",null);
if(cached&&Array.isArray(cached.CATS)&&Array.isArray(cached.P)&&cached.P.length)applyCatalog(cached.CATS,cached.P);
let loading=null;
function load(){
  if(loading)return loading;
  loading=Promise.all([
    sb("categories?select=id,name,emoji,color&order=sort"),
    sb("products?select=id,name,category_id,price,emoji,description,stock,image_url&active=eq.true&order=id")
  ]).then(([cs,ps])=>{
    if(!cs.length||!ps.length)return false;
    applyCatalog(
      cs.map(c=>({id:c.id,n:c.name,e:c.emoji||"🏷️",c:c.color||"#f4a300"})),
      ps.map(p=>({id:p.id,n:p.name,c:p.category_id,p:p.price,e:p.emoji||"🛍️",d:p.description||"",s:p.stock,i:p.image_url||null}))
    );
    set("mela_catalog",{CATS:CATS.slice(1),P:P.slice()});
    return true;
  }).catch(()=>false);
  return loading;
}
/* download the catalogue again (used after the server says something is out of stock) */
function refresh(){loading=null;return load()}

/* One key per checkout attempt. If the same checkout is sent twice (double tap, network retry),
   the server returns the first order instead of creating a second one. */
function orderKey(d,lines){
  const sig=JSON.stringify([lines.map(l=>[l.k,l.q]),d.name,d.phone,d.addr]);
  let o=get("mela_order_key",null);
  if(!o||o.sig!==sig){
    o={sig,key:(window.crypto&&crypto.randomUUID)?crypto.randomUUID():(Date.now().toString(16)+Math.random().toString(16).slice(2,12))};
    set("mela_order_key",o);
  }
  return o.key;
}

/* place an order: the server recomputes every price and takes the stock, so the browser cannot change them.
   When a customer is logged in the order is linked to their account. */
async function placeOrder(d,lines){
  const items=lines.map(l=>{const [id,vi]=l.k.split(":");return{id:+id,qty:l.q,gift:+vi>0}});
  const r=await sb("rpc/place_order",{method:"POST",body:JSON.stringify({p_name:d.name,p_phone:d.phone,p_address:d.addr,p_items:items,p_key:orderKey(d,lines)})});
  del("mela_order_key");
  return r;
}
/* the logged-in customer's own orders (the database only returns their own rows) */
const myOrders=()=>sb("orders?select=id,total,status,created_at,order_items(name,emoji,unit_price,qty)&order=created_at.desc&limit=50");

/* cart: lines [{k:"id:variant",n,e,pr,q}] under mela_cart */
const cartLines=()=>get("mela_cart",[]).filter(l=>l.q>0);
const cartCount=()=>cartLines().reduce((s,l)=>s+l.q,0);
function refreshBadge(){document.querySelectorAll("[data-cb]").forEach(b=>{b.textContent=bn(cartCount())})}
/* returns false when the product is sold out */
function addToCart(id,vi=0,q=1){
  vi=+vi||0;const p=P.find(x=>x.id==id);if(!p||soldOut(p))return false;
  const k=p.id+":"+vi,L=cartLines(),f=L.find(l=>l.k===k);
  if(f)f.q+=q;else L.push({k,n:p.n+(vi?" ("+VAR[vi].n+")":""),e:p.e,pr:p.p+VAR[vi].x,q});
  set("mela_cart",L);refreshBadge();
  return true;
}

/* wishlist: array of product ids under mela_wish */
const wish=()=>get("mela_wish",[]);
const isWish=id=>wish().includes(+id);
function toggleWish(id){id=+id;let w=wish();const on=!w.includes(id);w=on?[...w,id]:w.filter(x=>x!==id);set("mela_wish",w);return on}

function toast(t){
  let el=$("toast");
  if(!el){el=document.createElement("div");el.id="toast";el.className="toast";el.setAttribute("role","status");document.body.appendChild(el)}
  el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),1600);
}

/* page-level accessibility and head tags shared by every page that uses header() */
function pageSetup(){
  const hd=document.head;
  if(!hd.querySelector('meta[name="theme-color"]')){
    const e=document.createElement("meta");e.name="theme-color";e.content=isDark()?"#0e2433":"#38bdf8";hd.appendChild(e);
  }
  applyTheme(savedTheme());
  if(!hd.querySelector('link[href="https://fonts.gstatic.com"]')){
    const l=document.createElement("link");l.rel="preconnect";l.href="https://fonts.gstatic.com";l.crossOrigin="";hd.appendChild(l);
  }
  const m=document.querySelector("main");
  if(m){
    if(!m.id)m.id="main";
    if(!document.querySelector(".skip")){
      const s=document.createElement("a");s.className="skip";s.href="#"+m.id;s.textContent="মূল অংশে যান";
      document.body.insertBefore(s,document.body.firstChild);
    }
    /* pages open with an h2: tell assistive tech it is the page's main heading */
    if(!m.querySelector("h1")){
      const h=[...m.querySelectorAll("h2")].find(x=>!x.closest("[hidden]"));
      if(h)h.setAttribute("aria-level","1");
    }
  }
  /* every form control gets a name (same as its id) so browsers can autofill it */
  document.querySelectorAll("input[id],select[id],textarea[id]").forEach(e=>{if(!e.name&&e.type!=="hidden")e.name=e.id});
}

/* line icons used by the header and the floating buttons */
const ico=p=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const IC={
  search:ico('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>'),
  heart:ico('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  cart:ico('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h3l2.4 11h10l2-8H7"/>'),
  user:ico('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
  box:ico('<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>'),
  moon:ico('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  sun:ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  wa:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/><path d="M16.6 14.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.3-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.5 1.4.6 2 .7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.5-.2z"/></svg>'
};

/* the theme button shows the mode you would switch to */
function paintThemeBtn(){
  const dark=isDark();
  document.querySelectorAll("[data-theme-btn]").forEach(b=>{
    b.innerHTML=(dark?IC.sun:IC.moon)+"<span>"+(dark?"লাইট":"ডার্ক")+"</span>";
    b.setAttribute("aria-label",dark?"লাইট মোড চালু করুন":"ডার্ক মোড চালু করুন");
  });
}
function toggleTheme(){
  const next=isDark()?"light":"dark";
  try{localStorage.setItem(THEME_KEY,next)}catch(e){}
  applyTheme(next);paintThemeBtn();
}
document.addEventListener("click",e=>{if(e.target.closest("[data-theme-btn]"))toggleTheme()});
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(!savedTheme()){applyTheme(null);paintThemeBtn()}})}catch(e){}

/* shared header + footer */
function header(active){
  pageSetup();
  const h=$("hd"),here=location.pathname.split("/").pop()||"index.html";
  if(h){
    const ic=(href,key,svg,t,extra="")=>`<a href="${href}" aria-label="${t}"${active===key?' class="on" aria-current="page"':""}>${svg}<span>${t}</span>${extra}</a>`;
    const tn=(href,t)=>`<a href="${href}"${here===href?' class="on" aria-current="page"':""}>${t}</a>`;
    h.innerHTML=`<div class="hb"><a class="logo" href="index.html">মেলা</a><form class="hs" action="shop.html" method="get" role="search"><input type="search" name="q" placeholder="পণ্য খুঁজুন… (পাঞ্জাবি, শাড়ি)" aria-label="পণ্য খুঁজুন" autocomplete="off"><button type="submit" aria-label="খুঁজুন">${IC.search}</button></form><nav class="ic" aria-label="দ্রুত লিংক">${ic("track.html","track",IC.box,"ট্র্যাক")}${ic("wishlist.html","wish",IC.heart,"প্রিয়")}${ic("cart.html","cart",IC.cart,"কার্ট",`<b class="bd" id="cb" data-cb>${bn(cartCount())}</b>`)}${ic("account.html","acc",IC.user,"অ্যাকাউন্ট")}<button type="button" class="tg" data-theme-btn></button></nav></div><nav class="tn" aria-label="প্রধান মেনু">${tn("index.html","হোম")}${tn("shop.html","দোকান")}${tn("track.html","অর্ডার ট্র্যাক")}${tn("contact.html","যোগাযোগ")}${tn("help.html","প্রশ্নোত্তর")}${tn("about.html","আমাদের কথা")}</nav>`;
    paintThemeBtn();
    if(!document.querySelector(".fab")){
      const cartFab=/^(cart|order-placed)\.html$/.test(here)?"":`<a class="fab ct" href="cart.html" aria-label="কার্ট">${IC.cart}<b class="bd" data-cb>${bn(cartCount())}</b></a>`;
      document.body.insertAdjacentHTML("beforeend",cartFab+`<a class="fab wa" href="https://wa.me/8801911753985" target="_blank" rel="noopener" aria-label="WhatsApp-এ মেসেজ করুন">${IC.wa}</a>`);
    }
  }
  const f=$("ft");
  if(f)f.innerHTML=`<div class="fg"><div><h4>কেনাকাটা</h4><a href="shop.html">সব পণ্য</a><a href="wishlist.html">প্রিয় তালিকা</a><a href="cart.html">কার্ট</a></div><div><h4>অ্যাকাউন্ট</h4><a href="account.html">আমার অ্যাকাউন্ট</a><a href="login.html">লগইন</a><a href="signup.html">নতুন অ্যাকাউন্ট</a></div><div><h4>সহায়তা</h4><a href="contact.html">যোগাযোগ</a><a href="about.html">আমাদের কথা</a><a href="policy.html">ডেলিভারি ও ফেরত</a><a href="help.html">প্রশ্নোত্তর</a></div></div><p class="fl">© মেলা ২০২৬ · ক্যাশ অন ডেলিভারি · ৭ দিনে ফেরত · ফোন: <a href="tel:+8801911753985">01911-753985</a></p>`;
  /* slide menu (hamburger + left drawer) lives in menu.js / menu.css */
  if(h&&!document.querySelector('script[src="menu.js"]')){
    const s=document.createElement("script");s.src="menu.js";document.body.appendChild(s);
  }
}

/* product card used by shop, wishlist and product pages */
function card(p){
  const w=isWish(p.id),id=+p.id,out=soldOut(p),im=img(p.i,400);
  return `<article class="p"><a class="ph" href="product.html?id=${id}" style="background:${tone(p.c)}55" aria-label="${esc(p.n)} বিস্তারিত">${im?`<img src="${im}" alt="" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block">`:esc(p.e)}</a><button class="hrt${w?" on":""}" data-w="${id}" aria-label="প্রিয় তালিকা" aria-pressed="${w}">${w?"♥":"♡"}</button><div class="in"><h3><a href="product.html?id=${id}">${esc(p.n)}</a></h3><span class="pr">${tk(p.p)}</span><div class="cb">${out?'<button class="add" disabled>স্টক নেই</button>':`<button class="add alt" data-a="${id}">কার্টে দিন</button><button class="add" data-b="${id}">অর্ডার করুন</button>`}</div></div></article>`;
}
function bindGrid(el,after){
  el.addEventListener("click",e=>{
    const a=e.target.closest("[data-a]"),b=e.target.closest("[data-b]"),w=e.target.closest("[data-w]");
    if(a){const p=P.find(x=>x.id==a.dataset.a);if(p&&addToCart(a.dataset.a))toast(p.n+" কার্টে যোগ হয়েছে");else toast("স্টক নেই")}
    if(b){if(addToCart(b.dataset.b))location.href="cart.html";else toast("স্টক নেই")}
    if(w){const on=toggleWish(w.dataset.w);w.classList.toggle("on",on);w.textContent=on?"♥":"♡";w.setAttribute("aria-pressed",on);if(after)after()}
  });
}

return{CATS,P,VAR,STATUS,bn,tk,$,esc,img,tone,soldOut,params,get,set,load,refresh,request:sb,isAdmin,placeOrder,myOrders,session,loggedIn,signUp,signIn,signOut,recover,updatePassword,saveProfile,cartLines,cartCount,refreshBadge,addToCart,wish,isWish,toggleWish,orders,addOrder,user,setUser,toast,header,card,bindGrid,toggleTheme,isDark};
})();
