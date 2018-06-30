//listent to service worker install event
self.addEventListener('install', e => {

    //caching all statis files for application   
    e.waitUntil(
        caches.open('cc-static').then(function(cache){
            return cache.addAll([
                        './',
                        './plugins/bootstrap/css/bootstrap.css',
                        './plugins/bootstrap-select/css/bootstrap-select.css',
                        './css/style.css',
                        './css/themes/all-themes.css',
                        './plugins/jquery/jquery.min.js',
                        './plugins/bootstrap/js/bootstrap.js',
                        './plugins/bootstrap-select/js/bootstrap-select.js',
                        './plugins/node-waves/waves.js',
                        './js/admin.js',
                        './js/pages/forms/basic-form-elements.js',
                        './idb.js'
            ])
        })
    );
});

// Fetch data from cache.
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    /***
     * Fetch all Currency API request from network
     * if not API request fetch from cache first and if not in cache fetch and store from network
     */
    if(requestUrl.origin === "https://free.currencyconverterapi.com"){
        fetchFromNetwork(event);
    }else{
        fetchFromCacheFirst(event);
    }
  });
 
  /**
   * Attempts to retrieve from cache first. If that fails, goes to network and
   * stores it in the cache for later.
   * @param {FetchEvent} event The event to handle.
   */
  function fetchFromCacheFirst(event) {
    let response = null;
    event.respondWith(fromCache(event.request)
        .catch(() => fetch(event.request.clone())
            .then((resp) => {
                response = resp;
                return update(event.request, resp.clone());
            })
            .then(() => response)));
  }

  function fetchFromNetwork(event){
      event.respondWith(fetch(event.request.clone()));            
  }
  
  /**
   * Retrieve response from cache.
   * @param {Request} request The fetch request to handle.
   * @return {Promise} The response promise.
   */
  function fromCache(request) {
    return caches.open('cc-static').then((cache) => {
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
    return caches.open('cc-static').then((cache) => cache.put(request, response));
  }