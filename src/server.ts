import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();

// Lazy initialization - engine is created on first request
// This ensures the manifest is loaded before instantiation
let angularApp: AngularNodeAppEngine | null = null;
function getAngularApp(): AngularNodeAppEngine {
  if (!angularApp) {
    angularApp = new AngularNodeAppEngine();
  }
  return angularApp;
}

// KLUCZOWE DLA HEROKU: Informuje Express, że jest za proxy
app.set('trust proxy', true);

// Dodaj kompresję, aby przyspieszyć ładowanie assetów (AIO/SEO boost)
app.use(compression());

/**
 * Canonical URL redirect (301) - only non-www to www
 * Cloudflare handles HTTP->HTTPS redirects
 */
app.use((req, res, next) => {
  const host = req.headers.host || '';

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return next();
  }

  // Only redirect non-www to www (Cloudflare handles HTTPS)
  if (host === 'cyclopick.pl') {
    return res.redirect(301, `https://www.cyclopick.pl${req.originalUrl}`);
  }

  next();
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y', // Bardzo ważne dla SEO (Cache Policy)
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  getAngularApp()
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch((err) => {
      console.error('Angular SSR Error:', err);
      next(err);
    });
});

/**
 * Start the server
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);