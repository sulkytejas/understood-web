// public/service-worker.js
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js',
);

if (workbox) {
  console.log(`Workbox is loaded`);
  // Your caching logic will go here

  // Cache requests to tfhub.dev
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://tfhub.dev',
    new workbox.strategies.CacheFirst({
      cacheName: 'tfhub-model-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for one week
        }),
      ],
    }),
  );

  //   // Cache requests to storage.googleapis.com
  //   workbox.routing.registerRoute(
  //     ({ url }) => url.origin === 'https://storage.googleapis.com',
  //     new workbox.strategies.CacheFirst({
  //       cacheName: 'gcs-model-cache',
  //       plugins: [
  //         new workbox.expiration.ExpirationPlugin({
  //           maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for one week
  //         }),
  //       ],
  //     }),
  //   );

  // Configure Service Worker for Offline Support
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    }),
  );

  // Handle Navigation Requests:
  workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(
      workbox.precaching.createHandlerBoundToURL('/index.html'),
    ),
  );
} else {
  console.log(`Workbox didn't load`);
}
