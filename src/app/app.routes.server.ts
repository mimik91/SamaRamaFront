import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server routes configuration for SSR and prerendering
 *
 * RenderMode options:
 * - Prerender: Generate static HTML at build time (best for SEO, fastest LCP)
 * - Server: Generate HTML on each request (for dynamic content)
 * - Client: Only render on client side (for authenticated/dynamic pages)
 */
export const serverRoutes: ServerRoute[] = [
  // === PRERENDERED ROUTES (Static pages - best SEO & LCP) ===

  // Landing page - PRERENDER for best SEO and LCP
  {
    path: '',
    renderMode: RenderMode.Prerender
  },

  // Static info pages - prerender
  {
    path: 'jak-dzialamy',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'dla-serwisow',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'cooperation',
    renderMode: RenderMode.Prerender
  },

  // Legal pages - prerender
  {
    path: 'terms-of-service',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'terms-of-service-workshops',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'privacy-policy',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'cookie-policy',
    renderMode: RenderMode.Prerender
  },

  // Pricing pages - prerender (static content)
  {
    path: 'cennik-rowerzysci',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'cennik-serwisy',
    renderMode: RenderMode.Prerender
  },

  // === SERVER RENDERED ROUTES (Dynamic content) ===

  // Map page - server render (needs fresh data from API)
  {
    path: 'mapa-serwisow',
    renderMode: RenderMode.Server
  },

  // All services page - server render (SEO important)
  {
    path: 'serwisy',
    renderMode: RenderMode.Server
  },

  // City services pages - server render (SEO important, data changes)
  {
    path: 'serwisy/:city',
    renderMode: RenderMode.Server
  },


  // === CLIENT ONLY ROUTES (Authenticated/interactive pages) ===

  // Auth pages - client side only
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'register',
    renderMode: RenderMode.Client
  },
  {
    path: 'register-service',
    renderMode: RenderMode.Client
  },
  {
    path: 'verify-account',
    renderMode: RenderMode.Client
  },
  {
    path: 'password-reset-request',
    renderMode: RenderMode.Client
  },
  {
    path: 'password-reset',
    renderMode: RenderMode.Client
  },
  {
    path: 'complete-registration',
    renderMode: RenderMode.Client
  },

  // User dashboards - client only (auth required)
  {
    path: 'client-dashboard',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-dashboard',
    renderMode: RenderMode.Client
  },
  {
    path: 'account',
    renderMode: RenderMode.Client
  },
  {
    path: 'service-pending-verification',
    renderMode: RenderMode.Client
  },

  // Admin routes - client only
  {
    path: 'admin-orders',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-orders/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-users',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-services-verification',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-service-edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-enumerations',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-service-slots',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-bike-services',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-office-addresses',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin-express-service',
    renderMode: RenderMode.Client
  },
  {
    path: 'mistrzauta',
    renderMode: RenderMode.Client
  },

  // User specific routes - client only
  {
    path: 'bicycles',
    renderMode: RenderMode.Client
  },
  {
    path: 'bicycles/add',
    renderMode: RenderMode.Client
  },
  {
    path: 'bicycles/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'ordersummary',
    renderMode: RenderMode.Client
  },

  // Service admin panel - client only (auth required)
  {
    path: ':suffix/panel-administratora',
    renderMode: RenderMode.Client
  },
  {
    path: ':suffix/panel-administratora/kanban',
    renderMode: RenderMode.Client
  },
  {
    path: ':suffix/panel-administratora/profil',
    renderMode: RenderMode.Client
  },
  {
    path: ':suffix/historia-zlecen',
    renderMode: RenderMode.Client
  },

  // === PUBLIC SERVICE PROFILES (Server render for SEO) ===

  // Service profiles - server render (profiles can change, SEO important)
  {
    path: 'order-transport',
    renderMode: RenderMode.Server
  },
  {
    path: 'reserve-service',
    renderMode: RenderMode.Server
  },
  {
    path: 'reserve-service/:suffix',
    renderMode: RenderMode.Server
  },
  {
    path: ':suffix/zamow-transport',
    renderMode: RenderMode.Server
  },
  // Serwis ekspresowy — SSR (SEO)
  {
    path: 'krakow/zarezerwuj',
    renderMode: RenderMode.Server
  },
  {
    path: ':suffix/zarezerwuj',
    renderMode: RenderMode.Server
  },
  // Strona przekierowania z ulotek — renderowana po stronie klienta
  {
    path: 'ulotka',
    renderMode: RenderMode.Client
  },
  // Strona sukcesu — renderowana po stronie klienta (countdown + GA4)
  {
    path: 'sukces',
    renderMode: RenderMode.Client
  },
  // Podsumowanie zamówienia przed płatnością — client only (stan z routera)
  {
    path: 'platnosc/podsumowanie',
    renderMode: RenderMode.Client
  },
  // Strona powrotu z PayU — client only (query params z PayU, brak SSR potrzebna)
  {
    path: 'platnosc/powrot',
    renderMode: RenderMode.Client
  },
  {
    path: ':suffix',
    renderMode: RenderMode.Server
  },

  // === FALLBACK ===

  // Fallback for any unmatched routes - server render
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
