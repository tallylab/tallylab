// Most of this is pinched from https://developers.google.com/web/fundamentals/primers/service-workers/ – Thanks, Matt Gaunt!

var CACHE_NAME = ''; // Updated in deploy

// Install/open new cache
self.addEventListener('install', function(event) {

  self.skipWaiting(); // Refreshes w/o user having to close the app first

  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(
          [] //filelist
        );
      })
  );

});

// Remove old caches, which for now are any caches that aren't the one we declared above
self.addEventListener('activate', function(event) {

  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

});

// Augments filelist
self.addEventListener('fetch', function(event) {

    event.respondWith(
      caches
        .match(
          event.request,
          { ignoreSearch: true } // Important for us since we use URL params for navigation
        )
        .then(function(response) {
          // Cache hit - return response
          if (response) {
            return response;
          }

          // IMPORTANT: Clone the request. A request is a stream and
          // can only be consumed once. Since we are consuming this
          // once by cache and once by the browser for fetch, we need
          // to clone the response.
          var fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(
            function(response) {
              // Check if we received a valid response
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // IMPORTANT: Clone the response. A response is a stream
              // and because we want the browser to consume the response
              // as well as the cache consuming the response, we need
              // to clone it so we have two streams.
              var responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          );
        })
    );

});
