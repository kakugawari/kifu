/* 棋譜ノート — オフライン用のサービスワーカー
   対局場で電波が悪くても開けるように、一式をキャッシュから出す。
   キャッシュを先に返し、裏で新しいものを取りに行って次回に備える。 */
"use strict";
/* 中身を入れ替えたら、この名前を上げる。古いキャッシュは activate で捨てる。 */
const CACHE="kifu-note-v11";
const ASSETS=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.all(ASSETS.map(u=>c.add(u).catch(()=>{}))))  // 1つ欠けても止めない
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET") return;
  if(new URL(req.url).origin!==self.location.origin) return;
  e.respondWith(
    caches.match(req,{ignoreSearch:true}).then(hit=>{
      const net=fetch(req).then(res=>{
        if(res&&res.ok) caches.open(CACHE).then(c=>c.put(req,res.clone()));
        return res;
      }).catch(()=>hit);
      return hit||net;
    })
  );
});
