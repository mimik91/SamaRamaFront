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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];