import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Canonical URL redirect (301)
 * Redirects non-www to www and http to https
 */
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;

  // Skip in development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return next();
  }

  // Redirect non-www to www (and ensure https)
  if (host === 'cyclopick.pl') {
    const newUrl = `https://www.cyclopick.pl${req.originalUrl}`;
    return res.redirect(301, newUrl);
  }

  // Redirect http to https (for www domain)
  if (protocol === 'http' && host === 'www.cyclopick.pl') {
    const newUrl = `https://www.cyclopick.pl${req.originalUrl}`;
    return res.redirect(301, newUrl);
  }

  next();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);