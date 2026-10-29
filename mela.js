/* মেলা — shared data and helpers (plain browser JS, no build step) */
const Mela=(()=>{
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
const recover=email=>auth("recover",{email});
const updatePassword=(tok,password)=>auth("user",{password},tok,"PUT");
async function saveProfile(d){
  setUser(d);
  if(!session())return;
  const t=await token();if(!t)return;
  const j=await auth("user",{data:{full_name:d.name,mobile:d.phone,address:d.addr}},t,"PUT");
  const s=session();if(s){s.user={id:j.id,email:j.email,meta:j.user_metadata||{}};set(SESSION_KEY,s)}
}
/* password-reset emails land on the site's address with a token in the #hash: forward to the account page */
if(/type=recovery/.test(location.hash)&&!/account\.html$/.test(location.pathname))location.replace("account.html"+location.hash);

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
    sb("products?select=id,name,category_id,price,emoji,description&active=eq.true&order=id")
  ]).then(([cs,ps])=>{
    if(!cs.length||!ps.length)return false;
    applyCatalog(
      cs.map(c=>({id:c.id,n:c.name,e:c.emoji||"🏷️",c:c.color||"#f4a300"})),
      ps.map(p=>({id:p.id,n:p.name,c:p.category_id,p:p.price,e:p.emoji||"🛍️",d:p.description||""}))
    );
    set("mela_catalog",{CATS:CATS.slice(1),P:P.slice()});
    return true;
  }).catch(()=>false);
  return loading;
}

/* place an order: the server recomputes every price, so the browser cannot change them.
   When a customer is logged in the order is linked to their account. */
function placeOrder(d,lines){
  const items=lines.map(l=>{const [id,vi]=l.k.split(":");return{id:+id,qty:l.q,gift:+vi>0}});
  return sb("rpc/place_order",{method:"POST",body:JSON.stringify({p_name:d.name,p_phone:d.phone,p_address:d.addr,p_items:items})});
}
/* the logged-in customer's own orders (the database only returns their own rows) */
const myOrders=()=>sb("orders?select=id,total,status,created_at,order_items(name,emoji,unit_price,qty)&order=created_at.desc&limit=50");

/* cart: lines [{k:"id:variant",n,e,pr,q}] under mela_cart */
const cartLines=()=>get("mela_cart",[]).filter(l=>l.q>0);
const cartCount=()=>cartLines().reduce((s,l)=>s+l.q,0);
function refreshBadge(){const b=$("cb");if(b)b.textContent=bn(cartCount())}
function addToCart(id,vi=0,q=1){
  vi=+vi||0;const p=P.find(x=>x.id==id);if(!p)return;
  const k=p.id+":"+vi,L=cartLines(),f=L.find(l=>l.k===k);
  if(f)f.q+=q;else L.push({k,n:p.n+(vi?" ("+VAR[vi].n+")":""),e:p.e,pr:p.p+VAR[vi].x,q});
  set("mela_cart",L);refreshBadge();
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

/* shared header + footer */
function header(active){
  const h=$("hd");
  if(h){
    const a=(href,key,ico,t,extra="")=>`<a href="${href}" aria-label="${t}"${active===key?' class="on" aria-current="page"':""}><span aria-hidden="true">${ico}</span><span class="t">&nbsp;${t}</span>${extra}</a>`;
    h.innerHTML=`<a class="logo" href="index.html">মেলা</a><nav class="nv" aria-label="প্রধান মেনু">${a("shop.html","shop","🛍️","দোকান")}${a("wishlist.html","wish","♡","প্রিয়")}${a("account.html","acc","👤","অ্যাকাউন্ট")}${a("cart.html","cart","🛒","কার্ট",`<b class="bd" id="cb">${bn(cartCount())}</b>`)}</nav>`;
  }
  const f=$("ft");if(f)f.innerHTML="© মেলা ২০২৬ · ক্যাশ অন ডেলিভারি · ৭ দিনে ফেরত";
}

/* product card used by shop, wishlist and product pages */
function card(p){
  const w=isWish(p.id),id=+p.id;
  return `<article class="p"><a class="ph" href="product.html?id=${id}" style="background:${tone(p.c)}55" aria-label="${esc(p.n)} বিস্তারিত">${esc(p.e)}</a><button class="hrt${w?" on":""}" data-w="${id}" aria-label="প্রিয় তালিকা" aria-pressed="${w}">${w?"♥":"♡"}</button><div class="in"><h3><a href="product.html?id=${id}">${esc(p.n)}</a></h3><span class="pr">${tk(p.p)}</span><button class="add" data-a="${id}">কার্টে যোগ করুন</button></div></article>`;
}
function bindGrid(el,after){
  el.addEventListener("click",e=>{
    const a=e.target.closest("[data-a]"),w=e.target.closest("[data-w]");
    if(a){addToCart(a.dataset.a);toast(P.find(x=>x.id==a.dataset.a).n+" কার্টে যোগ হয়েছে")}
    if(w){const on=toggleWish(w.dataset.w);w.classList.toggle("on",on);w.textContent=on?"♥":"♡";w.setAttribute("aria-pressed",on);if(after)after()}
  });
}

return{CATS,P,VAR,STATUS,bn,tk,$,esc,tone,params,get,set,load,request:sb,isAdmin,placeOrder,myOrders,session,loggedIn,signUp,signIn,signOut,recover,updatePassword,saveProfile,cartLines,cartCount,refreshBadge,addToCart,wish,isWish,toggleWish,orders,addOrder,user,setUser,toast,header,card,bindGrid};
})();
