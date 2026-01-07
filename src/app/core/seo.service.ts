import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../environments/environments';

export interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private renderer: Renderer2;
  private readonly defaultTitle = 'CycloPick | Znajdź serwis rowerowy w Twojej okolicy';
  private readonly defaultDescription = 'Znajdź najlepszy serwis rowerowy w swojej okolicy dzięki CycloPick. Sprawdź mapę, opinie i umów się na naprawę online.';
  private readonly defaultImage = 'https://cyclopick.pl/assets/images/pictures/picture1.jpg';

  constructor(
    @Inject(DOCUMENT) private dom: any,
    private titleService: Title,
    private metaService: Meta,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Podstawowa metoda aktualizacji SEO - używana w app.component.ts
   */
  updateSeoTags(path: string, customTitle?: string, description?: string) {
    const cleanPath = path.split('?')[0];
    const url = `${environment.siteUrl}${cleanPath === '/' ? '' : cleanPath}`;

    this.setCanonicalUrl(url);

    const metaDesc = description || this.defaultDescription;
    this.metaService.updateTag({ name: 'description', content: metaDesc });

    if (path.includes('admin') || path.includes('panel') || path.includes('account')) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    }
  }

  /**
   * Rozszerzona metoda do pełnej kontroli SEO - używaj w komponentach
   */
  updateFullSeoTags(seoData: SeoData, path?: string) {
    // 1. Title
    const title = seoData.title || this.defaultTitle;
    this.titleService.setTitle(title);

    // 2. Meta Description
    const description = seoData.description || this.defaultDescription;
    this.metaService.updateTag({ name: 'description', content: description });

    // 3. Meta Keywords (opcjonalnie)
    if (seoData.keywords && seoData.keywords.length > 0) {
      this.metaService.updateTag({ name: 'keywords', content: seoData.keywords.join(', ') });
    }

    // 4. Open Graph Tags
    const ogType = seoData.type || 'website';
    const ogImage = seoData.image || this.defaultImage;
    const currentUrl = path
      ? `${environment.siteUrl}${path}`
      : environment.siteUrl;

    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: ogImage });
    this.metaService.updateTag({ property: 'og:url', content: currentUrl });
    this.metaService.updateTag({ property: 'og:type', content: ogType });

    // 5. Twitter Card Tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: ogImage });

    // 6. Canonical URL (jeśli podano path)
    if (path) {
      this.setCanonicalUrl(currentUrl);
    }

    // 7. Robots (domyślnie index, follow)
    if (!this.metaService.getTag('name="robots"')) {
      this.metaService.addTag({ name: 'robots', content: 'index, follow' });
    }
  }

  /**
   * Specjalna metoda dla profili serwisów rowerowych
   */
  updateServiceProfileSeo(serviceName: string, city: string, address: string, description?: string, imageUrl?: string) {
    const title = `${serviceName} - Serwis Rowerowy ${city} | CycloPick`;
    const metaDescription = description
      ? `${description.substring(0, 150)}...`
      : `Profesjonalny serwis rowerowy ${serviceName} w ${city}. ${address}. Sprawdź cennik, godziny otwarcia i umów wizytę online przez CycloPick.`;

    const keywords = [
      'serwis rowerowy',
      `serwis rowerowy ${city}`,
      'naprawa rowerów',
      `naprawa rowerów ${city}`,
      serviceName,
      'warsztat rowerowy',
      'mechanik rowerowy',
      'przegląd roweru'
    ];

    this.updateFullSeoTags({
      title,
      description: metaDescription,
      image: imageUrl,
      type: 'profile',
      keywords
    });
  }

  /**
   * Metoda do dodania JSON-LD structured data
   */
  addStructuredData(data: any) {
    this.removeStructuredData(); // Najpierw usuwamy stary profilowy skrypt
    
    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'schema-org-data'; // Unikalne ID
    script.text = JSON.stringify(data);
    this.renderer.appendChild(this.dom.head, script);
  }

  /**
   * Usuń JSON-LD structured data
   */
  removeStructuredData() {
    const script = this.dom.getElementById('schema-org-data');
    if (script) {
      this.renderer.removeChild(this.dom.head, script);
    }
  }

  private setCanonicalUrl(url: string) {
    let link: HTMLLinkElement = this.dom.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.renderer.createElement('link');
      this.renderer.setAttribute(link, 'rel', 'canonical');
      this.renderer.appendChild(this.dom.head, link);
    }
    this.renderer.setAttribute(link, 'href', url);
  }
}