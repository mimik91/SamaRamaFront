import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MapService } from '../services-map-page/services/map.service';
import { MapPin, MapServicesRequestDto, CitySuggestion, calculateCityBounds } from '../../shared/models/map.models';
import { formatServiceDurationBucket } from '../../service-records/service-duration.util';
import { I18nService } from '../../core/i18n.service';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { environment } from '../../environments/environments';
import { CityServicesResolvedData } from './city-services-page.resolver';
import { TRANSPORT_PRICING } from '../../shared/constants/transport-pricing.constants';
import { ServiceSearchFiltersComponent, ServiceListFiltersChange } from '../../shared/components/service-search-filters/service-search-filters.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

export interface CityConfig {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

/** Ile serwisów na stronę w trybie "wszystkie miasta" (paginacja przez "Załaduj więcej") */
const NATIONWIDE_PER_PAGE = 20;

@Component({
  selector: 'app-city-services-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ServiceSearchFiltersComponent, BreadcrumbComponent],
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

  // Paginacja "Załaduj więcej" — dotyczy tylko trybu bez miasta (currentCity === null),
  // dla konkretnego miasta lista i tak mieści się w jednym zapytaniu (perPage 1000)
  currentPage = 0;
  hasMore = false;
  loadingMore = false;

  serviceNameQuery = '';
  selectedCoverageIds: number[] = [];
  private serviceNameDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  // City autocomplete state
  cityInputValue = '';
  filteredCities: CityConfig[] = [];
  showCitySuggestions = false;
  activeSuggestionIndex = -1;

  // Miejscowości spoza sztywnej listy seoCities — dociągane z backendu (jak na /mapa-serwisow),
  // pokazywane tylko gdy filteredCities jest puste. Wybór przenosi na mapę wycentrowaną na tę lokalizację.
  dynamicCitySuggestions: CitySuggestion[] = [];
  private citySearchSubject = new Subject<string>();

  readonly transportPricing = TRANSPORT_PRICING;

  // "Chcę sam wybrać serwis" — pozwala pominąć baner ekspresowy i przejść od razu
  // do wyszukiwarki + listy serwisów (kluczowe na mobile, gdzie baner zajmuje dużo miejsca)
  scrollToServicesList(): void {
    if (!this.isBrowser) return;
    this.document.getElementById('services-browse')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      this.selectedCitySlug = snapshot.city?.slug || '';
      this.cityInputValue = snapshot.city?.name || '';
      this.services = snapshot.services;
      this.totalServices = snapshot.total;
      this.hasMore = !snapshot.city && this.services.length < snapshot.total;
      this.loading = false;
    }
  }

  ngOnInit(): void {
    this.citySearchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(query => this.performDynamicCitySearch(query));

    // Filtry przekazane z landing page (wyszukiwarka nawiguje tu z queryParams) — odzwierciedlamy
    // je w polu nazwy serwisu; resolver już zastosował je do pierwszego zapytania (patrz resolver)
    const queryParams = this.route.snapshot.queryParamMap;
    this.serviceNameQuery = queryParams.get('search') || '';
    const coverageIdsParam = queryParams.get('coverageIds');
    if (coverageIdsParam) {
      this.selectedCoverageIds = coverageIdsParam.split(',').map(Number).filter(n => !isNaN(n));
    }

    // Pobierz dane z resolvera (Angular SSR czeka na resolver przed renderowaniem)
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      const cityData = data['cityData'] as CityServicesResolvedData | null;

      if (cityData) {
        // Dane z resolvera - miasto znalezione (albo tryb "wszystkie miasta", gdy city === null)
        this.currentCity = cityData.city;
        this.selectedCitySlug = cityData.city?.slug || '';
        this.cityInputValue = cityData.city?.name || '';
        this.services = cityData.services;
        this.totalServices = cityData.total;
        this.currentPage = 0;
        this.hasMore = !cityData.city && this.services.length < cityData.total;
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
    clearTimeout(this.serviceNameDebounceTimer);
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
      this.dynamicCitySuggestions = [];
      this.showCitySuggestions = false;
    } else {
      this.filteredCities = this.sortWithPriority(
        this.cities.filter(c => c.name.toLowerCase().includes(query))
      ).slice(0, 10);

      // Miejscowość spoza sztywnej listy — sprawdź w backendzie (jak na mapie), zamiast pokazywać "brak wyników"
      if (this.filteredCities.length === 0 && query.length >= 3) {
        this.citySearchSubject.next(this.cityInputValue.trim());
      } else {
        this.dynamicCitySuggestions = [];
      }

      this.showCitySuggestions = this.filteredCities.length > 0 || this.dynamicCitySuggestions.length > 0;
    }
    this.cdr.markForCheck();
  }

  private performDynamicCitySearch(query: string): void {
    this.mapService.searchCities(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          // Odrzuć spóźnioną odpowiedź, jeśli w międzyczasie pole wyczyszczono albo znalazły się dopasowania statyczne
          if (this.filteredCities.length > 0 || this.cityInputValue.trim().toLowerCase() !== query.trim().toLowerCase()) {
            return;
          }
          this.dynamicCitySuggestions = cities;
          this.showCitySuggestions = cities.length > 0;
          this.cdr.markForCheck();
        },
        error: () => {
          this.dynamicCitySuggestions = [];
          this.cdr.markForCheck();
        }
      });
  }

  onCityFocus(): void {
    this.activeSuggestionIndex = -1;
    if (this.cityInputValue.trim().length >= 1) {
      this.showCitySuggestions = this.filteredCities.length > 0 || this.dynamicCitySuggestions.length > 0;
    } else {
      this.filteredCities = this.footerCities;
      this.dynamicCitySuggestions = [];
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
    const totalSuggestions = this.filteredCities.length + this.dynamicCitySuggestions.length;

    if (!this.showCitySuggestions || totalSuggestions === 0) {
      if (event.key === 'ArrowDown') {
        this.filteredCities = this.footerCities;
        this.dynamicCitySuggestions = [];
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
        this.activeSuggestionIndex = Math.min(this.activeSuggestionIndex + 1, totalSuggestions - 1);
        this.cdr.markForCheck();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeSuggestionIndex = Math.max(this.activeSuggestionIndex - 1, -1);
        this.cdr.markForCheck();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeSuggestionIndex < 0) break;
        if (this.activeSuggestionIndex < this.filteredCities.length) {
          this.selectCity(this.filteredCities[this.activeSuggestionIndex]);
        } else {
          const dynamicCity = this.dynamicCitySuggestions[this.activeSuggestionIndex - this.filteredCities.length];
          if (dynamicCity) this.selectDynamicCity(dynamicCity);
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

  // Miejscowość spoza sztywnej listy seoCities — nie mamy dla niej strony /serwisy/:slug,
  // więc przenosimy na mapę wycentrowaną na jej współrzędne (tak samo jak wyszukiwanie na /mapa-serwisow)
  selectDynamicCity(city: CitySuggestion): void {
    this.showCitySuggestions = false;
    this.activeSuggestionIndex = -1;
    this.router.navigate(['/mapa-serwisow'], {
      queryParams: { lat: city.latitude, lng: city.longitude, zoom: 13, city: city.cityName }
    });
  }

  clearCityInput(): void {
    this.cityInputValue = '';
    this.filteredCities = [];
    this.dynamicCitySuggestions = [];
    this.showCitySuggestions = false;
    this.activeSuggestionIndex = -1;
    this.router.navigate(['/serwisy']);
    this.cdr.markForCheck();
  }

  trackByCitySlug(index: number, city: CityConfig): string {
    return city.slug;
  }

  trackByCityName(index: number, city: CitySuggestion): string {
    return city.cityName;
  }

  // Odświeża listę serwisów po zmianie filtra (wyszukiwanie/coverages), zachowując bounds miasta z resolvera
  onFiltersChanged(change: ServiceListFiltersChange): void {
    this.selectedCoverageIds = change.coverageIds;
    this.refetchServices();
  }

  onServiceNameInput(): void {
    clearTimeout(this.serviceNameDebounceTimer);
    this.serviceNameDebounceTimer = setTimeout(() => this.refetchServices(), 300);
  }

  clearServiceNameSearch(): void {
    clearTimeout(this.serviceNameDebounceTimer);
    this.serviceNameQuery = '';
    this.refetchServices();
  }

  // Odświeża listę serwisów po zmianie filtra (wyszukiwanie/coverages) — dla miasta zachowuje jego
  // bounds z resolvera, dla trybu "wszystkie miasta" resetuje paginację do pierwszej strony
  private refetchServices(): void {
    const request: MapServicesRequestDto = this.currentCity
      ? {
          type: 'event',
          bounds: this.cityBounds(this.currentCity),
          page: 0,
          perPage: 1000,
          search: this.serviceNameQuery || undefined,
          coverageIds: this.selectedCoverageIds.length > 0 ? this.selectedCoverageIds : undefined
        }
      : {
          type: 'event',
          bounds: undefined,
          page: 0,
          perPage: NATIONWIDE_PER_PAGE,
          search: this.serviceNameQuery || undefined,
          coverageIds: this.selectedCoverageIds.length > 0 ? this.selectedCoverageIds : undefined
        };

    this.loading = true;
    this.currentPage = 0;
    this.cdr.markForCheck();

    this.mapService.getServices(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.services = response?.data || [];
          this.totalServices = response?.total || 0;
          this.hasMore = !this.currentCity && this.services.length < this.totalServices;
          this.loading = false;
          this.error = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = true;
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private cityBounds(city: CityConfig): string {
    const bounds = calculateCityBounds(city.latitude, city.longitude);
    return `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  }

  // "Załaduj więcej" — tylko w trybie "wszystkie miasta" (dla konkretnego miasta lista jest w całości
  // pobierana z resolvera od razu, perPage 1000 wystarcza)
  loadMore(): void {
    if (this.currentCity || this.loadingMore || !this.hasMore) return;

    this.loadingMore = true;
    this.cdr.markForCheck();

    const request: MapServicesRequestDto = {
      type: 'event',
      bounds: undefined,
      page: this.currentPage + 1,
      perPage: NATIONWIDE_PER_PAGE,
      search: this.serviceNameQuery || undefined,
      coverageIds: this.selectedCoverageIds.length > 0 ? this.selectedCoverageIds : undefined
    };

    this.mapService.getServices(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.services = [...this.services, ...(response?.data || [])];
          this.totalServices = response?.total || this.totalServices;
          this.currentPage++;
          this.hasMore = this.services.length < this.totalServices;
          this.loadingMore = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingMore = false;
          this.cdr.markForCheck();
        }
      });
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
    } else {
      this.router.navigate(['/mapa-serwisow']);
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
    const titleText = this.currentCity
      ? this.t('city_services.meta_title', { city: this.currentCity.name })
      : 'Serwisy rowerowe w Polsce – pełna lista warsztatów | CycloPick';
    const description = this.currentCity
      ? this.t('city_services.meta_description', { city: this.currentCity.name })
      : 'Przeglądaj pełną listę serwisów rowerowych w całej Polsce. Znajdź warsztat rowerowy blisko Ciebie, zarezerwuj wizytę lub zamów transport roweru.';

    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Dodatkowe meta tagi dla SEO
    this.meta.updateTag({
      name: 'keywords',
      content: this.currentCity
        ? this.getKeywords(this.currentCity.name)
        : 'serwisy rowerowe Polska, lista serwisów rowerowych, warsztaty rowerowe, naprawa rowerów'
    });

    // Canonical URL
    this.updateCanonicalTag(this.currentCity?.slug);
  }

  private update404MetaTags(citySlug: string): void {
    const titleText = `Miasto "${citySlug}" nie znalezione | CycloPick`;
    const description = `Nie znaleziono miasta "${citySlug}" w naszej bazie. Wybierz miasto z listy dostępnych lokalizacji.`;

    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    // Usuń canonical z poprzednio odwiedzonego (poprawnego) miasta — bez tego canonical z
    // nawigacji SPA (np. /serwisy/krakow → /serwisy/nieistniejace) zostałby błędnie
    // wskazywany dla strony 404.
    this.removeCanonicalTag();
  }

  private removeCanonicalTag(): void {
    const link = this.document.querySelector("link[rel='canonical']");
    if (link) {
      link.remove();
    }
  }

  private updateCanonicalTag(citySlug?: string): void {
    const canonicalUrl = citySlug
      ? `https://www.cyclopick.pl/serwisy/${citySlug}`
      : 'https://www.cyclopick.pl/serwisy';

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

  formatDuration(hours: number | null | undefined): string {
    return formatServiceDurationBucket(hours);
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
    if (this.services.length === 0) return;

    const listName = this.currentCity ? `Serwisy rowerowe ${this.currentCity.name}` : 'Serwisy rowerowe w Polsce';
    const itemList = SchemaOrgHelper.generateItemList(
      this.services.map(service => ({
        name: service.name,
        address: service.address || undefined,
        telephone: service.phoneNumber || undefined
      })),
      listName
    );

    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'CycloPick', url: environment.siteUrl },
      this.currentCity
        ? { name: `Serwisy rowerowe – ${this.currentCity.name}`, url: `${environment.siteUrl}/serwisy/${this.currentCity.slug}` }
        : { name: 'Serwisy rowerowe w Polsce', url: `${environment.siteUrl}/serwisy` }
    ]);

    const schemas = [itemList, breadcrumb].filter(Boolean);
    if (schemas.length === 0) return;

    this.seoService.addMultipleStructuredData(schemas);
  }
}
