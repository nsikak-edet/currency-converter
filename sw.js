// import { fetchCurrencyFromDB } from './app';

//listent to service worker install event
self.addEventListener('install', e => {

    //caching all statis files for application 
    const cacheName = 'cc-static';
    e.waitUntil(
        caches.open(cacheName).then(function(cache){
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

self.addEventListener('fetch', e => {
    e.respondWith(fetchResource(e));
});

function fetchResource(event){    
    return caches.match(event.request).then(cacheResponse => {
        if(cacheResponse){
            return cacheResponse;
        }

        const fetchRequest = event.request.clone();
        return fetch(fetchRequest);
    });
}