import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

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
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * JSON-LD structured data for static pages.
 * Angular SSR does not serialize dynamically added <script> tags,
 * so we inject them after rendering.
 */
const ROUTE_JSONLD: Record<string, object> = {
  '/for-services': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Usługi dla serwisów rowerowych',
    'description': 'Zarejestruj swój serwis rowerowy w CycloPick. Zyskaj widoczność na mapie, profesjonalną wizytówkę i nowych klientów.',
    'url': 'https://www.cyclopick.pl/for-services',
    'mainEntity': {
      '@type': 'Service',
      'name': 'CycloPick - platforma dla serwisów rowerowych',
      'description': 'Platforma łącząca serwisy rowerowe z klientami. Oferujemy mapę serwisów, wizytówki online i narzędzia promocyjne.',
      'provider': {
        '@type': 'Organization',
        'name': 'CycloPick',
        'url': 'https://www.cyclopick.pl',
        'logo': 'https://www.cyclopick.pl/assets/images/logo-cyclopick.png',
      },
      'areaServed': { '@type': 'Country', 'name': 'Polska' },
      'serviceType': 'Platforma dla serwisów rowerowych',
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'Usługi dla warsztatów rowerowych',
        'itemListElement': [
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Interaktywna mapa serwisów rowerowych', 'description': 'Wyróżnij swój warsztat na mapie z unikalną pinezką i wyższą pozycją w wynikach' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Wizytówka SEO dla serwisu rowerowego', 'description': 'Profesjonalna strona-wizytówka z galerią zdjęć i ofertą, zoptymalizowana pod wyszukiwarki' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Optymalizacja pod AI (AIO)', 'description': 'Dane zoptymalizowane dla chatbotów AI jak ChatGPT i Copilot' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Zaawansowane filtry usług', 'description': 'System filtrowania pozwalający klientom znaleźć serwis oferujący konkretne naprawy' } },
        ],
      },
    },
  },
  '/cooperation': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Współpraca z CycloPick',
    'description': 'Dołącz do CycloPick - startupu zmieniającego branżę rowerową w Polsce. Szukamy osób do współpracy w obszarach: rozwój aplikacji, marketing, biznes, organizacja eventów rowerowych.',
    'url': 'https://www.cyclopick.pl/cooperation',
    'publisher': {
      '@type': 'Organization',
      'name': 'CycloPick',
      'url': 'https://www.cyclopick.pl',
      'logo': 'https://www.cyclopick.pl/assets/images/logo-cyclopick.png',
    },
  },
};

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  const { protocol, originalUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: 'REQUEST', useValue: req }],
    })
    .then((html) => {
      const path = originalUrl.split('?')[0];
      const schema = ROUTE_JSONLD[path];
      if (schema) {
        html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
      }
      res.send(html);
    })
    .catch((err) => {
      console.error('Angular SSR Error:', err);
      next(err);
    });
});

/**
 * Start the server
 */
const port = process.env['PORT'] || 4000;
app.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});
