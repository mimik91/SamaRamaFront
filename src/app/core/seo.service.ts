import { Injectable, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../environments/environments';

/**
 * Interface dla danych SEO
 */
export interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
}

/**
 * Serwis do zarządzania SEO i strukturalnymi danymi Schema.org
 *
 * @description
 * Zapewnia centralne zarządzanie meta tagami, Open Graph, Twitter Cards,
 * canonical URLs oraz JSON-LD structured data dla lepszego SEO
 */
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly defaultTitle = 'CycloPick | Znajdź serwis rowerowy w Twojej okolicy';
  private readonly defaultDescription = 'Znajdź najlepszy serwis rowerowy w swojej okolicy dzięki CycloPick. Sprawdź mapę, opinie i umów się na naprawę online.';
  private readonly defaultImage = 'https://cyclopick.pl/assets/images/pictures/picture1.jpg';

  private renderer: Renderer2;
  private readonly SCHEMA_SCRIPT_ID = 'app-structured-data';

  constructor(
    @Inject(DOCUMENT) private dom: Document,
    private titleService: Title,
    private metaService: Meta,
    private rendererFactory: RendererFactory2
  ) {
    // Tworzymy Renderer2 przez factory
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



    // 7. Robots - KRYTYCZNE: Sprawdź czy to nie strona administracyjna
    // Centralna logika blokowania indeksacji dla paneli admina/konta
    if (path && (path.includes('admin') || path.includes('panel') || path.includes('account'))) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
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
   * Dodaje JSON-LD structured data do <head>
   *
   * @param data Obiekt schema.org (np. BikeRepairShop, BreadcrumbList)
   * @param scriptId Opcjonalne unikalne ID dla skryptu (domyślnie 'app-structured-data')
   *
   * @description
   * Metoda bezpiecznie dodaje lub aktualizuje tag <script type="application/ld+json">
   * w sekcji <head>. Używa Renderer2 dla kompatybilności z SSR.
   * Każdy skrypt ma unikalne ID, aby uniknąć duplikacji.
   *
   * @example
   * ```typescript
   * const schema = SchemaOrgHelper.generateBikeRepairShop({...});
   * this.seoService.addStructuredData(schema);
   * ```
   */
  addStructuredData(data: any, scriptId: string = this.SCHEMA_SCRIPT_ID): void {
    if (!data) {
      console.warn('[SeoService] Próba dodania pustych danych structured data');
      return;
    }

    // Usuń poprzedni skrypt o tym ID (jeśli istnieje)
    this.removeStructuredData(scriptId);

    try {
      // Utwórz nowy element <script>
      const script = this.renderer.createElement('script');
      this.renderer.setAttribute(script, 'type', 'application/ld+json');
      this.renderer.setAttribute(script, 'id', scriptId);

      // Dodaj JSON jako textContent
      const jsonText = this.renderer.createText(JSON.stringify(data, null, 0));
      this.renderer.appendChild(script, jsonText);

      // Dodaj skrypt do <head>
      this.renderer.appendChild(this.dom.head, script);

      console.log(`[SeoService] ✅ Structured data added (ID: ${scriptId})`);
    } catch (error) {
      console.error('[SeoService] ❌ Błąd podczas dodawania structured data:', error);
    }
  }

  /**
   * Usuwa JSON-LD structured data z <head>
   *
   * @param scriptId ID skryptu do usunięcia (domyślnie 'app-structured-data')
   *
   * @description
   * Usuwa tag <script type="application/ld+json"> o podanym ID.
   * Używaj w ngOnDestroy() komponentu, aby wyczyścić dane przy przejściu do innej strony.
   *
   * @example
   * ```typescript
   * ngOnDestroy() {
   *   this.seoService.removeStructuredData();
   * }
   * ```
   */
  removeStructuredData(scriptId: string = this.SCHEMA_SCRIPT_ID): void {
    const existingScript = this.dom.getElementById(scriptId);

    if (existingScript) {
      this.renderer.removeChild(this.dom.head, existingScript);
      console.log(`[SeoService] ✅ Structured data removed (ID: ${scriptId})`);
    }
  }

  /**
   * Dodaje wiele JSON-LD structured data jednocześnie
   *
   * @param dataArray Tablica obiektów schema.org
   *
   * @description
   * Użyj gdy potrzebujesz dodać kilka różnych typów schema
   * (np. BikeRepairShop + BreadcrumbList) jednocześnie
   *
   * @example
   * ```typescript
   * this.seoService.addMultipleStructuredData([
   *   SchemaOrgHelper.generateBikeRepairShop({...}),
   *   SchemaOrgHelper.generateBreadcrumb([...])
   * ]);
   * ```
   */
  addMultipleStructuredData(dataArray: any[]): void {
    if (!dataArray || dataArray.length === 0) {
      console.warn('[SeoService] Pusta tablica structured data');
      return;
    }

    // Filtruj null/undefined
    const validData = dataArray.filter(data => data !== null && data !== undefined);

    if (validData.length === 0) {
      console.warn('[SeoService] Wszystkie dane structured data są null/undefined');
      return;
    }

    // Jeśli jest tylko jeden element, użyj standardowej metody
    if (validData.length === 1) {
      this.addStructuredData(validData[0]);
      return;
    }

    // Dla wielu elementów, stwórz tablicę JSON-LD
    // (zgodne z Graph notation Schema.org)
    const graphData = {
      '@context': 'https://schema.org',
      '@graph': validData
    };

    this.addStructuredData(graphData);
  }

  /**
   * Usuwa wszystkie JSON-LD structured data z <head>
   *
   * @description
   * Czyści wszystkie tagi <script type="application/ld+json"> z sekcji <head>
   */
  removeAllStructuredData(): void {
    const scripts = this.dom.querySelectorAll('script[type="application/ld+json"]');

    scripts.forEach(script => {
      if (script.parentNode) {
        this.renderer.removeChild(script.parentNode, script);
      }
    });

    if (scripts.length > 0) {
      console.log(`[SeoService] ✅ Removed ${scripts.length} structured data script(s)`);
    }
  }

  /**
   * Ustawia canonical URL dla strony
   *
   * @param url Pełny URL strony (np. https://cyclopick.pl/gyver)
   *
   * @description
   * Dodaje lub aktualizuje tag <link rel="canonical"> w <head>.
   * Canonical URL zapobiega problemom z duplicate content w SEO.
   */
  private setCanonicalUrl(url: string): void {
    let link = this.dom.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!link) {
      link = this.renderer.createElement('link');
      this.renderer.setAttribute(link, 'rel', 'canonical');
      this.renderer.appendChild(this.dom.head, link);
    }

    this.renderer.setAttribute(link, 'href', url);
  }
}