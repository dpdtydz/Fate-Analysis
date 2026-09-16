import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 🌟 Safe Auto-Recovery from Stale Chunk / Dynamic Import Failures (Vite & PWA Cache Desync)
if (typeof window !== 'undefined') {
  // 1. Vite specific chunk preload error handler
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    console.warn('[Vite] Chunk preload failed (new deployment detected). Auto-reloading page...');
    const reloadKey = 'vite_chunk_reload_' + window.location.pathname;
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    // Prevent infinite reload loops (allow 1 reload per 10 seconds)
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
    }
  });

  // 2. Generic dynamic import error recovery
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason || '');
    if (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('error loading dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('Loading chunk')
    ) {
      console.warn('[App] Dynamic import failed:', message);
      const reloadKey = 'chunk_reload_' + window.location.pathname;
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for PWA offline caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        // Automatically reload if a new service worker takes over
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      },
      (err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      }
    );
  });
}
