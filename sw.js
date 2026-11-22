const CACHE='botarena-v4';
const ASSETS=['./','./index.html','./data.js','./audio.js','./state.js','./art.js','./sim.js','./render.js','./guide.js','./ui.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// network first so updates show up right away; cached copy is used when offline
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=e.request.url,same=u.startsWith(self.location.origin),font=/fonts\.(googleapis|gstatic)\.com/.test(u);if(!same&&!font)return;
 if(font){e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res})));return}
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return res}).catch(()=>caches.match(e.request).then(hit=>hit||caches.match('./index.html'))))});
