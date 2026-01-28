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
    path: 'for-services',
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

  // === SERVER RENDERED ROUTES (Dynamic content) ===

  // Map page - server render (needs fresh data from API)
  {
    path: 'mapa-serwisow',
    renderMode: RenderMode.Server
  },

  // City services pages - server render (SEO important, data changes)
  {
    path: 'serwisy/:city',
    renderMode: RenderMode.Server
  },

  // Transport/order routes - server render
  {
    path: 'order-transport',
    renderMode: RenderMode.Server
  },
  {
    path: 'order-transport/:suffix',
    renderMode: RenderMode.Server
  },
  {
    path: 'guest-order',
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
    path: 'bicycles/:id/order-service',
    renderMode: RenderMode.Client
  },
  {
    path: 'service-appointments',
    renderMode: RenderMode.Client
  },
  {
    path: 'service-appointments/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'order-service',
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

  // === PUBLIC SERVICE PROFILES (Server render for SEO) ===

  // Service profiles - server render (profiles can change, SEO important)
  {
    path: ':suffix/cennik',
    renderMode: RenderMode.Server
  },
  {
    path: ':suffix/godziny-otwarcia',
    renderMode: RenderMode.Server
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
