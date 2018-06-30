var CACHE_NAME = 'cc-static';

//listent to service worker install event
self.addEventListener('install', e => {

    //caching all statis files for application     
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache){
            return cache.addAll([
                        '/',
                        '/plugins/bootstrap/css/bootstrap.css',
                        '/plugins/bootstrap-select/css/bootstrap-select.css',
                        '/css/style.css',
                        '/css/themes/all-themes.css',
                        '/plugins/jquery/jquery.min.js',
                        '/plugins/bootstrap/js/bootstrap.js',
                        '/plugins/bootstrap-select/js/bootstrap-select.js',
                        '/plugins/node-waves/waves.js',
                        '/js/admin.js',
                        '/js/pages/forms/basic-form-elements.js',
                        '/idb.js'
            ])
        })
    );
});

// self.addEventListener('fetch', event => {
//     //const requestUrl = new URL(event.request.url);
//      event.respondWith(fetchResource(event));
// });

// function fetchResource(event){    
//     return caches.match(event.request).then(cacheResponse => {
//         if(cacheResponse){
//             return cacheResponse;
//         }

//         const fetchRequest = event.request.clone();
//         return fetch(fetchRequest);
//     });
// }

// Fetch data from cache.
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    console.log(requestUrl);
    cacheWithNetworkFallbackAndStore(event);
    // if (requestUrl.pathname === '/rates') {
    //   // Rates. Don't cache.
    //   fetch(event.request);
    // } else if (requestUrl.pathname === '/') {
    //   // Serve from cache, update in background.
    //   cacheThenUpdateWithCacheBust(event);
    // } else {
    //   // Try cache first. If that fails, go to network and update cache.
    //   cacheWithNetworkFallbackAndStore(event);
    // }
  });
 
  /**
   * Attempts to retrieve from cache first. If that fails, goes to network and
   * stores it in the cache for later.
   * @param {FetchEvent} event The event to handle.
   */
  function cacheWithNetworkFallbackAndStore(event) {
    let response = null;
    event.respondWith(fromCache(event.request)
        .catch(() => fetch(event.request.clone())
            .then((resp) => {
                response = resp;
                return update(event.request, resp.clone());
            })
            .then(() => response)));
  }
  
  /**
   * Immediately responds from cache, but updates from network in the background.
   * Performs a cache bust when updating.
   * @param {FetchEvent} event The event to handle.
   */
  function cacheThenUpdateWithCacheBust(event) {
    const networkRequest =
        new Request(`${event.request.url}?${Date.now().toString()}`);
  
    const network = fetch(networkRequest);
    const networkClone = network.then((response) => response.clone());
  
    event.respondWith(fromCache(event.request).catch(() => networkClone));
    event.waitUntil(network.then((resp) => update(event.request, resp)));
  }
  
  /**
   * Retrieve response from cache.
   * @param {Request} request The fetch request to handle.
   * @return {Promise} The response promise.
   */
  function fromCache(request) {
    return caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((matching) => {
        return matching || Promise.reject('no-match');
      });
    });
  }
  
  /**
   * Store response in the cache.
   * @param {Request} request The fetch request to handle.
   * @param {Response} response The fetch response to handle.
   * @return {Promise} The storage promise.
   */
  function update(request, response) {
    return caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
  }