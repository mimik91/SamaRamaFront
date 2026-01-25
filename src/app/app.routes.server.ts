import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'bicycles/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'service-appointments/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'bicycles/:id/order-service',
    renderMode: RenderMode.Server  // Set this to Server instead of Prerender
  },
  {
    path: 'serwisy/:city',
    renderMode: RenderMode.Server  // SSR for city services pages - critical for SEO indexing
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];