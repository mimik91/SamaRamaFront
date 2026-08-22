// Wspólny loader biblioteki Leaflet (CDN, z SRI) — używany przez każdy komponent renderujący mapę
// (services-map-page/components/map, service-profile/service-location-map). Wywołuj tylko w przeglądarce.

declare var L: any;

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
const LEAFLET_JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_JS_INTEGRITY = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';

let leafletLoadingPromise: Promise<void> | null = null;

/**
 * Ładuje Leaflet z CDN tylko raz — współbieżne wywołania z różnych komponentów dzielą tę samą
 * obietnicę zamiast wstrzykiwać drugi `<script>`.
 */
export function loadLeaflet(): Promise<void> {
  if (typeof L !== 'undefined') {
    return Promise.resolve();
  }

  if (leafletLoadingPromise) {
    return leafletLoadingPromise;
  }

  leafletLoadingPromise = new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="leaflet.js"]')) {
      let isResolved = false;

      const checkInterval = setInterval(() => {
        if (typeof L !== 'undefined' && !isResolved) {
          isResolved = true;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          clearInterval(checkInterval);
          reject(new Error('Leaflet loading timeout'));
        }
      }, 10000);
      return;
    }

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = LEAFLET_CSS_URL;
      cssLink.integrity = LEAFLET_CSS_INTEGRITY;
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS_URL;
    script.integrity = LEAFLET_JS_INTEGRITY;
    script.crossOrigin = '';
    script.async = true;

    script.onload = () => {
      setTimeout(() => {
        if (typeof L !== 'undefined') {
          resolve();
        } else {
          reject(new Error('Leaflet loaded but not available'));
        }
      }, 100);
    };

    script.onerror = () => {
      leafletLoadingPromise = null;
      reject(new Error('Failed to load Leaflet'));
    };
    document.head.appendChild(script);
  });

  return leafletLoadingPromise;
}
