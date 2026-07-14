import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { TRANSPORT_PRICING } from '../../shared/constants/transport-pricing.constants';

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
  styleUrls: ['./city-services-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CityServicesPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private seoService = inject(SeoService);
  private cdr = inject(ChangeDetectorRef);

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

  // City autocomplete state
  cityInputValue = '';
  filteredCities: CityConfig[] = [];
  showCitySuggestions = false;
  activeSuggestionIndex = -1;

  readonly transportPricing = TRANSPORT_PRICING;

  // Rozwijane szczegóły promo serwisu ekspresowego (kompaktowy widok na mobilce)
  expressPromoExpanded = false;

  toggleExpressPromo(): void {
    this.expressPromoExpanded = !this.expressPromoExpanded;
    this.cdr.markForCheck();
  }

  isBrowser: boolean;
  loadingAction: { serviceId: number; type: string } | null = null;

  isServiceLoading(serviceId: number): boolean {
    return this.loadingAction?.serviceId === serviceId;
  }

  isLoadingAction(serviceId: number, type: string): boolean {
    return this.loadingAction?.serviceId === serviceId && this.loadingAction?.type === type;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.city-autocomplete-wrapper')) {
      this.showCitySuggestions = false;
      this.cdr.markForCheck();
    }
  }

  // Flaga czy to Kraków (dla transportu)
  get isKrakow(): boolean {
    const slug = this.currentCity?.slug?.trim().toLowerCase();
    const name = this.currentCity?.name?.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return slug === 'krakow' || name === 'krakow';
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

    // Initialize from snapshot to prevent SSR hydration flash
    // Without this, currentCity is null during client bootstrap → isKrakow=false → section flickers
    const snapshot = this.route.snapshot.data['cityData'] as CityServicesResolvedData | null;
    if (snapshot) {
      this.currentCity = snapshot.city;
      this.selectedCitySlug = snapshot.city.slug;
      this.cityInputValue = snapshot.city.name;
      this.services = snapshot.services;
      this.totalServices = snapshot.total;
      this.loading = false;
    }
  }

  ngOnInit(): void {
    // Pobierz dane z resolvera (Angular SSR czeka na resolver przed renderowaniem)
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      const cityData = data['cityData'] as CityServicesResolvedData | null;

      if (cityData) {
        // Dane z resolvera - miasto znalezione
        this.currentCity = cityData.city;
        this.selectedCitySlug = cityData.city.slug;
        this.cityInputValue = cityData.city.name;
        this.services = cityData.services;
        this.totalServices = cityData.total;
        this.cityNotFound = false;
        this.loading = false;

        this.updateMetaTags();
        this.updateStructuredData();
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

  onCityInput(): void {
    const query = this.cityInputValue.trim().toLowerCase();
    this.activeSuggestionIndex = -1;
    if (query.length < 1) {
      this.filteredCities = [];
      this.showCitySuggestions = false;
    } else {
      this.filteredCities = this.sortWithPriority(
        this.cities.filter(c => c.name.toLowerCase().includes(query))
      ).slice(0, 10);
      this.showCitySuggestions = this.filteredCities.length > 0;
    }
    this.cdr.markForCheck();
  }

  onCityFocus(): void {
    this.activeSuggestionIndex = -1;
    if (this.cityInputValue.trim().length >= 1) {
      this.showCitySuggestions = this.filteredCities.length > 0;
    } else {
      this.filteredCities = this.footerCities;
      this.showCitySuggestions = true;
    }
    this.cdr.markForCheck();
  }

  private sortWithPriority(matches: CityConfig[]): CityConfig[] {
    const matchSlugs = new Set(matches.map(c => c.slug));
    const priority = this.footerCities.filter(c => matchSlugs.has(c.slug));
    const prioritySlugs = new Set(priority.map(c => c.slug));
    const rest = matches.filter(c => !prioritySlugs.has(c.slug));
    return [...priority, ...rest];
  }

  onCityKeydown(event: KeyboardEvent): void {
    if (!this.showCitySuggestions || this.filteredCities.length === 0) {
      if (event.key === 'ArrowDown') {
        this.filteredCities = this.footerCities;
        this.showCitySuggestions = true;
        this.activeSuggestionIndex = 0;
        this.cdr.markForCheck();
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeSuggestionIndex = Math.min(this.activeSuggestionIndex + 1, this.filteredCities.length - 1);
        this.cdr.markForCheck();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeSuggestionIndex = Math.max(this.activeSuggestionIndex - 1, -1);
        this.cdr.markForCheck();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeSuggestionIndex >= 0 && this.filteredCities[this.activeSuggestionIndex]) {
          this.selectCity(this.filteredCities[this.activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        this.showCitySuggestions = false;
        this.activeSuggestionIndex = -1;
        this.cdr.markForCheck();
        break;
    }
  }

  selectCity(city: CityConfig): void {
    this.cityInputValue = city.name;
    this.showCitySuggestions = false;
    this.activeSuggestionIndex = -1;
    this.router.navigate(['/serwisy', city.slug]);
  }

  clearCityInput(): void {
    this.cityInputValue = '';
    this.filteredCities = [];
    this.showCitySuggestions = false;
    this.activeSuggestionIndex = -1;
    this.router.navigate(['/serwisy']);
    this.cdr.markForCheck();
  }

  trackByCitySlug(index: number, city: CityConfig): string {
    return city.slug;
  }

  navigateToMap(): void {
    if (this.currentCity) {
      const zoom = this.isBrowser && window.innerWidth < 768 ? '11' : '13';
      this.router.navigate(['/mapa-serwisow'], {
        queryParams: {
          lat: this.currentCity.latitude,
          lng: this.currentCity.longitude,
          zoom
        }
      });
    }
  }

  // Realna cena transportu z API, jeśli skonfigurowana; w przeciwnym razie (starsze/niezarejestrowane
  // serwisy bez ustawionej wartości w bazie) dotychczasowy szacunek. `0` traktujemy jako świadomie
  // skonfigurowany darmowy transport, nie jako brak danych — stąd porównanie z `null`, nie `||`.
  getTransportCost(service: MapPin): number {
    if (service.transportCost != null) {
      return service.transportCost;
    }
    return service.reservationAvailable ? this.transportPricing.partnerCost : this.transportPricing.standardCost;
  }

  navigateToServiceOnMap(service: MapPin): void {
    this.router.navigate(['/mapa-serwisow'], {
      queryParams: {
        lat: service.latitude,
        lng: service.longitude,
        zoom: '16'
      }
    });
  }

  navigateToTransport(service: MapPin): void {
    if (this.isServiceLoading(service.id)) return;
    this.loadingAction = { serviceId: service.id, type: 'transport' };
    this.cdr.markForCheck();
    this.mapService.getServiceSuffix(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingAction = null;
          this.cdr.markForCheck();
          if (response && response.suffix) {
            this.router.navigate(['/', response.suffix, 'zamow-transport']);
          } else {
            this.router.navigate(['/order-transport'], { queryParams: { serviceId: service.id } });
          }
        },
        error: () => {
          this.loadingAction = null;
          this.cdr.markForCheck();
          this.router.navigate(['/order-transport'], { queryParams: { serviceId: service.id } });
        }
      });
  }

  private updateMetaTags(): void {
    if (!this.currentCity) return;

    const cityName = this.currentCity.name;

    let titleText: string;
    let description: string;

    titleText = this.t('city_services.meta_title', { city: cityName });
    description = this.t('city_services.meta_description', { city: cityName });

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
    return `serwis rowerowy ${cityName}, naprawa rowerów ${cityName}, warsztat rowerowy ${cityName}`;
  }

  trackByServiceId(index: number, service: MapPin): number {
    return service.id;
  }

  // Nawiguj do strony serwisu (pobierz suffix z API)
  navigateToServicePage(service: MapPin): void {
    if (this.isServiceLoading(service.id)) return;
    this.loadingAction = { serviceId: service.id, type: 'profile' };
    this.cdr.markForCheck();
    this.mapService.getServiceSuffix(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingAction = null;
          this.cdr.markForCheck();
          if (response && response.suffix) {
            this.router.navigate([response.suffix]);
          }
        },
        error: () => {
          this.loadingAction = null;
          this.cdr.markForCheck();
        }
      });
  }

  // Nawiguj do rezerwacji wizyty w serwisie
  navigateToReservation(service: MapPin): void {
    if (this.isServiceLoading(service.id)) return;
    this.loadingAction = { serviceId: service.id, type: 'reserve' };
    this.cdr.markForCheck();
    this.mapService.getServiceSuffix(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingAction = null;
          this.cdr.markForCheck();
          if (response && response.suffix) {
            this.router.navigate(['/', response.suffix, 'zarezerwuj'], {
              state: { serviceId: service.id }
            });
          }
        },
        error: () => {
          this.loadingAction = null;
          this.cdr.markForCheck();
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
   * Generuje i dodaje JSON-LD ItemList + BreadcrumbList schema dla listy serwisów
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

    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'CycloPick', url: environment.siteUrl },
      { name: `Serwisy rowerowe – ${this.currentCity.name}`, url: `${environment.siteUrl}/serwisy/${this.currentCity.slug}` }
    ]);

    const schemas = [itemList, breadcrumb].filter(Boolean);
    if (schemas.length === 0) return;

    this.seoService.addMultipleStructuredData(schemas);
  }
}
