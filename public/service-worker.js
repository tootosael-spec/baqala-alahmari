const CACHE_NAME='baqala-pwa-v30-homepage-refresh-20261117';;
const APP_SHELL=['/','/index.html','/admin.html','/manifest.webmanifest','/icons/icon.svg'];

self.addEventListener('install',event=>{
 event.waitUntil(
  caches.open(CACHE_NAME)
   .then(cache=>cache.addAll(APP_SHELL))
   .then(()=>self.skipWaiting())
 );
});

self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
   .then(()=>self.clients.claim())
 );
});

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;

 // Always ask the network first for pages so visitors receive the latest storefront.
 if(request.mode==='navigate'){
  event.respondWith(
   fetch(request).then(response=>{
    if(response&&response.ok){
     const copy=response.clone();
     event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)));
    }
    return response;
   }).catch(async()=>{
    const cached=await caches.match(request);
    return cached||caches.match('/index.html');
   })
  );
  return;
 }

 // For same-origin static assets, refresh the cache in the background when online.
 event.respondWith(
  fetch(request).then(response=>{
   if(response&&response.ok){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)));
   }
   return response;
  }).catch(async()=>await caches.match(request))
 );
});
