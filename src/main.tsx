import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/oxanium/300.css';
import '@fontsource/oxanium/400.css';
import '@fontsource/oxanium/500.css';
import '@fontsource/oxanium/600.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles/theme.css';
import { App } from './app/App';

// After a new build is deployed, a tab that is still open asks for screen chunks that no longer
// exist. Reload once to pick up the new build (not again within a minute, in case the server itself
// is broken).
window.addEventListener('vite:preloadError', (event) => {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem('gg-reloaded-at') ?? 0);
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem('gg-reloaded-at', String(Date.now()));
  } catch {
    // No storage: still reload once; the next failure would then surface normally.
  }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
