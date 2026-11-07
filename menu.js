/* মেলা — slide menu (hamburger + left drawer). Loaded by Mela.header() on every page. */
(()=>{
  if(window.__slideMenu)return;window.__slideMenu=1;
  /* search and share tags for this page */
  const sj=document.createElement("script");sj.src="seo.js";document.body.appendChild(sj);
  const css=document.createElement("link");css.rel="stylesheet";css.href="menu.css";
  css.onload=build;css.onerror=build;document.head.appendChild(css);

  function build(){
    if(typeof Mela==="undefined")return;
    const hd=document.getElementById("hd");if(!hd)return;
    const M=Mela,esc=M.esc,here=location.pathname.split("/").pop()||"index.html";

    const btn=document.createElement("button");
    btn.type="button";btn.className="mbtn";
    btn.setAttribute("aria-label","মেনু খুলুন");btn.setAttribute("aria-expanded","false");btn.setAttribute("aria-controls","sm");
    btn.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const host=hd.querySelector(".hb")||hd;
    host.insertBefore(btn,host.firstChild);

    const ov=document.createElement("div");ov.className="smo";
    const panel=document.createElement("aside");
    panel.className="sm";panel.id="sm";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","মেনু");panel.inert=true;
    panel.innerHTML='<div class="smh"><b>মেলা</b><button type="button" class="smx" id="smx" aria-label="মেনু বন্ধ করুন">✕</button></div><div class="smb2" id="smb2"></div>';
    document.body.appendChild(ov);document.body.appendChild(panel);
    const body=panel.querySelector("#smb2");

    const link=(href,ico,t,extra="")=>`<a href="${href}"${here===href?' aria-current="page"':""}><span aria-hidden="true">${ico}</span>${t}${extra}</a>`;
    function render(){
      const cats=M.CATS.filter(c=>c.id!=="all").map(c=>link("shop.html?c="+encodeURIComponent(c.id),esc(c.e),esc(c.n))).join("");
      const s=M.session();
      const acc=s&&s.user
        ?`<p class="sw">${esc(s.user.email||"")}</p>`+link("account.html","👤","আমার অ্যাকাউন্ট")+'<button type="button" class="so" id="smout">লগ আউট</button>'
        :link("login.html","👤","লগইন")+link("signup.html","✨","নতুন অ্যাকাউন্ট");
      body.innerHTML=`<form class="ss" action="shop.html" method="get" role="search"><input type="search" name="q" placeholder="পণ্য খুঁজুন…" aria-label="পণ্য খুঁজুন" autocomplete="off"></form>`
        +`<nav class="sl" aria-label="সাইটের মেনু">${link("index.html","🏠","হোম")}${link("shop.html","🛍️","সব পণ্য")}`
        +`<h3>ক্যাটাগরি</h3>${cats}`
        +`<h3>আমার</h3>${link("wishlist.html","♡","প্রিয় তালিকা")}${link("cart.html","🛒","কার্ট",`<b class="smb">${M.bn(M.cartCount())}</b>`)}${link("track.html","📦","অর্ডার ট্র্যাক")}${acc}`
        +`<h3>সহায়তা</h3>${link("contact.html","📞","যোগাযোগ")}${link("about.html","ℹ️","আমাদের কথা")}${link("policy.html","🚚","ডেলিভারি ও ফেরত")}${link("help.html","❓","প্রশ্নোত্তর")}</nav>`;
    }
    render();
    M.load().then(ok=>{if(ok)render()});

    let isOpen=false;
    function open(){
      if(isOpen)return;isOpen=true;render();
      panel.inert=false;panel.classList.add("on");ov.classList.add("on");
      btn.setAttribute("aria-expanded","true");
      document.documentElement.style.overflow="hidden";
      panel.querySelector("#smx").focus({preventScroll:true});
    }
    function close(back=true){
      if(!isOpen)return;isOpen=false;
      panel.classList.remove("on");ov.classList.remove("on");panel.inert=true;
      btn.setAttribute("aria-expanded","false");
      document.documentElement.style.overflow="";
      if(back)btn.focus({preventScroll:true});
    }
    btn.onclick=open;ov.onclick=()=>close();
    panel.addEventListener("click",e=>{
      if(e.target.closest("#smx")){close();return}
      if(e.target.closest("#smout")){M.signOut();location.reload();return}
      if(e.target.closest("a"))close(false);
    });
    addEventListener("keydown",e=>{
      if(!isOpen)return;
      if(e.key==="Escape"){close();return}
      if(e.key!=="Tab")return;
      const f=[...panel.querySelectorAll("a[href],button:not([disabled]),input")];
      if(!f.length)return;
      const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    });
    /* swipe the panel to the left to close it (phones) */
    let tx=null;
    panel.addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});
    panel.addEventListener("touchend",e=>{if(tx!==null&&e.changedTouches[0].clientX-tx<-60)close();tx=null},{passive:true});
    addEventListener("pageshow",()=>close(false));
  }
})();
