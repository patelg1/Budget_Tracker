const FILES_TO_CACHE = [
    '/',
    '/index.html',    
    '/styles.css',
    '/index.js',
    '/db.js',
    'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',    
    'https://fonts.googleapis.com/css?family=Istok+Web|Montserrat:800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
  ];
  
  const PRECACHE = 'precache-v1';
  const RUNTIME = 'runtime';
  
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches
        .open(PRECACHE)
        .then((cache) => {
          return cache.addAll(FILES_TO_CACHE)
        })    
        .then(self.skipWaiting())
    );
  });
  
  // The activate handler takes care of cleaning up old caches.
  self.addEventListener('activate', (event) => {    
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {          
          return Promise.all(
            cacheNames.map((cacheList) => {
              if (cacheList !== PRECACHE && cacheList !== RUNTIME) {
                return caches.delete(cacheList);
              }              
            })
          );
        })
    );
    self.clients.claim();
    
  });  

  self.addEventListener("fetch", event => {    
    // handle runtime GET requests for data from /api routes
    if (event.request.url.includes("/api/") && event.request.method === "GET") {
      // make network request and fallback to cache if network request fails (offline)
      event.respondWith(
        caches.open(RUNTIME).then(cache => {
          return fetch(event.request)
            .then(response => {
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => {
              return cache.match(event.request);
            });
        })
        .catch(err => {
          console.log(err)
        })
      );
      return;
    }
  
    // use cache first for all other requests for performance
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
  
        // request is not in cache. make network request and cache the response
        return caches.open(PRECACHE).then(cache => {
          return fetch(event.request).then(response => {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }); 