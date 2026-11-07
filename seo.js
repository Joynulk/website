/* মেলা — adds search/share tags to the page head (loaded by menu.js on every shop page).
   Search engines that run scripts (Google) read these. Chat apps and Facebook do not run scripts, so the home page
   also has the same tags written directly in index.html. */
(()=>{
  const BASE="https://joynulk.github.io/website/";
  const file=location.pathname.split("/").pop()||"index.html";
  const canon=file==="index.html"?BASE:BASE+file+(file==="product.html"?location.search:"");
  const DESC={
    "index.html":"হাতের কাজ, শাড়ি-পোশাক, খাবার ও ঘরকন্নার জিনিস। সারাদেশে ক্যাশ অন ডেলিভারি, ৭ দিনে ফেরত।",
    "shop.html":"মেলার সব পণ্য: শাড়ি-পোশাক, হাতের কাজ, খাবার, খেলনা ও ঘরকন্না। ক্যাশ অন ডেলিভারি।",
    "product.html":"মেলার পণ্যের বিবরণ, দাম ও অর্ডার। ক্যাশ অন ডেলিভারি, ৭ দিনে ফেরত।",
    "contact.html":"ফোন, WhatsApp বা SMS-এ মেলার সঙ্গে যোগাযোগ করুন।",
    "about.html":"মেলা সম্পর্কে: দেশি শখের জিনিস, হাতের কাজ ও রোজকার প্রয়োজনের দোকান।",
    "policy.html":"মেলার ডেলিভারি চার্জ, ক্যাশ অন ডেলিভারি ও ৭ দিনে ফেরতের নিয়ম।",
    "help.html":"অর্ডার, ট্র্যাকিং, ডেলিভারি চার্জ ও পাসওয়ার্ড নিয়ে সাধারণ প্রশ্নের উত্তর।"
  };
  /* pages with personal or temporary content stay out of search results */
  const PRIVATE=/^(cart|account|login|signup|wishlist|order-placed|forgot-password|reset-password|track|admin)\.html$/;
  const head=document.head;
  const meta=(attr,key,val)=>{
    let m=head.querySelector(`meta[${attr}="${key}"]`);
    if(!m){m=document.createElement("meta");m.setAttribute(attr,key);head.appendChild(m)}
    if(!m.content)m.content=val;
    return m;
  };
  if(PRIVATE.test(file))meta("name","robots","noindex,nofollow");
  if(!head.querySelector('link[rel="canonical"]')){const l=document.createElement("link");l.rel="canonical";l.href=canon;head.appendChild(l)}
  const d=DESC[file];
  if(d)meta("name","description",d);
  meta("property","og:type","website");
  meta("property","og:site_name","মেলা");
  meta("property","og:locale","bn_BD");
  const ot=meta("property","og:title",document.title);
  if(d)meta("property","og:description",d);
  meta("property","og:url",canon);
  meta("property","og:image",BASE+"og-image.png");
  meta("name","twitter:card","summary_large_image");
  const t=document.querySelector("title");
  if(t)new MutationObserver(()=>{ot.content=document.title}).observe(t,{childList:true});
  if(!head.querySelector('link[rel~="icon"]')){const l=document.createElement("link");l.rel="icon";l.type="image/svg+xml";l.href=BASE+"favicon.svg";head.appendChild(l)}
  if(!head.querySelector('link[rel="apple-touch-icon"]')){const l=document.createElement("link");l.rel="apple-touch-icon";l.href=BASE+"apple-touch-icon.png";head.appendChild(l)}
})();
