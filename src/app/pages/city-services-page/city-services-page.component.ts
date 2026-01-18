import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MapService } from '../services-map-page/services/map.service';
import { MapPin } from '../../shared/models/map.models';
import { I18nService } from '../../core/i18n.service';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { environment } from '../../environments/environments';
import { CityServicesResolvedData } from './city-services-page.resolver';

export interface CityConfig {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-city-services-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './city-services-page.component.html',
  styleUrls: ['./city-services-page.component.css']
})
export class CityServicesPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private seoService = inject(SeoService);

  // Wszystkie miasta z environment (dla dropdowna) - posortowane alfabetycznie
  readonly cities: CityConfig[] = [...environment.settings.seoCities].sort((a, b) =>
    a.name.localeCompare(b.name, 'pl')
  );

  // Miasta do wyświetlenia w stopce (podzbiór)
  readonly footerCities: CityConfig[] = environment.settings.seoCities.filter(
    city => environment.settings.seoFooterCities.includes(city.slug)
  );

  currentCity: CityConfig | null = null;
  selectedCitySlug: string = '';
  services: MapPin[] = [];
  loading = true;
  error = false;
  totalServices = 0;
  cityNotFound = false;

  isBrowser: boolean;

  // Flaga czy to Kraków (dla transportu)
  get isKrakow(): boolean {
    return this.currentCity?.slug === 'krakow';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mapService: MapService,
    private meta: Meta,
    private title: Title,
    private i18n: I18nService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Pobierz dane z resolvera (Angular SSR czeka na resolver przed renderowaniem)
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      const cityData = data['cityData'] as CityServicesResolvedData | null;

      if (cityData) {
        // Dane z resolvera - miasto znalezione
        this.currentCity = cityData.city;
        this.selectedCitySlug = cityData.city.slug;
        this.services = cityData.services;
        this.totalServices = cityData.total;
        this.cityNotFound = false;
        this.loading = false;

        this.updateMetaTags();
        this.updateStructuredData();

        console.log('✅ City services initialized from resolver data:', cityData.city.name);
      } else {
        // Resolver zwrócił null - miasto nie znalezione
        const citySlug = this.route.snapshot.paramMap.get('city') || '';
        this.selectedCitySlug = citySlug;
        this.cityNotFound = true;
        this.loading = false;
        this.update404MetaTags(citySlug);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Usuń JSON-LD structured data przy przechodzeniu do innej strony
    this.seoService.removeStructuredData();
  }

  // Tłumaczenia z parametrami
  t(key: string, params?: Record<string, any>): string {
    return this.i18n.translate(key, params);
  }

  onCityChange(): void {
    if (this.selectedCitySlug) {
      this.router.navigate(['/serwisy', this.selectedCitySlug]);
    }
  }

  navigateToMap(): void {
    if (this.currentCity) {
      this.router.navigate(['/'], {
        queryParams: {
          city: this.currentCity.name,
          lat: this.currentCity.latitude,
          lng: this.currentCity.longitude
        }
      });
    }
  }

  getTransportLink(serviceId: number): string {
    return `/order-transport?serviceId=${serviceId}`;
  }

  private updateMetaTags(): void {
    if (!this.currentCity) return;

    const cityName = this.currentCity.name;

    let titleText: string;
    let description: string;

    if (this.isKrakow) {
      titleText = `Serwisy rowerowe Kraków - naprawa rowerów z transportem door-to-door | CycloPick`;
      description = `Znajdź serwis rowerowy w Krakowie z usługą transportu roweru door-to-door. Lista warsztatów rowerowych w Krakowie z adresami, telefonami i możliwością zamówienia transportu. Naprawa rowerów Kraków.`;
    } else {
      titleText = this.t('city_services.meta_title', { city: cityName });
      description = this.t('city_services.meta_description', { city: cityName });
    }

    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Dodatkowe meta tagi dla SEO
    this.meta.updateTag({ name: 'keywords', content: this.getKeywords(cityName) });

    // Canonical URL
    this.updateCanonicalTag(this.currentCity.slug);
  }

  private update404MetaTags(citySlug: string): void {
    const titleText = `Miasto "${citySlug}" nie znalezione | CycloPick`;
    const description = `Nie znaleziono miasta "${citySlug}" w naszej bazie. Wybierz miasto z listy dostępnych lokalizacji.`;

    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  private updateCanonicalTag(citySlug: string): void {
    const canonicalUrl = `https://www.cyclopick.pl/serwisy/${citySlug}`;

    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");

    if (link) {
      link.setAttribute('href', canonicalUrl);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      this.document.head.appendChild(link);
    }
  }

  private getKeywords(cityName: string): string {
    const baseKeywords = `serwis rowerowy ${cityName}, naprawa rowerów ${cityName}, warsztat rowerowy ${cityName}, rower ${cityName}`;

    if (this.isKrakow) {
      return `${baseKeywords}, transport rowerów Kraków, transport roweru door-to-door, odbiór roweru Kraków, naprawa roweru z transportem`;
    }

    return baseKeywords;
  }

  trackByServiceId(index: number, service: MapPin): number {
    return service.id;
  }

  // Nawiguj do strony serwisu (pobierz suffix z API)
  navigateToServicePage(service: MapPin): void {
    this.mapService.getServiceSuffix(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.suffix) {
            this.router.navigate([response.suffix]);
          } else {
            console.error('Could not retrieve suffix for service:', service.id);
          }
        },
        error: (err) => {
          console.error('Error during suffix fetch:', err);
        }
      });
  }

  // Nawiguj do rejestracji serwisu (skopiowane z services-map-page)
  registerService(service: MapPin): void {
    this.router.navigate(['/register-service'], {
      queryParams: {
        serviceId: service.id,
        serviceName: service.name,
        phoneNumber: service.phoneNumber || '',
        email: service.email || ''
      }
    });
  }

  /**
   * Generuje i dodaje JSON-LD ItemList schema dla listy serwisów
   * Dzięki temu AI crawlery (ChatGPT, Gemini) mogą odczytać dane serwisów
   */
  private updateStructuredData(): void {
    if (!this.currentCity || this.services.length === 0) return;

    const itemList = SchemaOrgHelper.generateItemList(
      this.services.map(service => ({
        name: service.name,
        address: service.address || undefined,
        telephone: service.phoneNumber || undefined
      })),
      `Serwisy rowerowe ${this.currentCity.name}`
    );

    if (itemList) {
      this.seoService.addStructuredData(itemList);
    }
  }
}
