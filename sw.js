const SURUM='defter-1.6.1';
const CEKIRDEK=['./','index.html','styles.css','app.js','data.js','firebase-config.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(SURUM).then(c=>c.addAll(CEKIRDEK))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>!k.startsWith(SURUM)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('message',e=>{ if(e.data==='atla') self.skipWaiting(); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(c=>c||fetch(r).then(res=>{ if(res.ok){ const k=res.clone(); caches.open(SURUM).then(x=>x.put(r,k)); } return res; }).catch(()=>caches.match('index.html'))));
    return;
  }
  const dis=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'||(u.hostname==='www.gstatic.com'&&u.pathname.includes('/firebasejs/'));
  if(dis) e.respondWith(caches.open(SURUM+'-dis').then(c=>c.match(r).then(m=>{ const f=fetch(r).then(res=>{ if(res.ok||res.type==='opaque') c.put(r,res.clone()); return res; }).catch(()=>m); return m||f; })));
});
