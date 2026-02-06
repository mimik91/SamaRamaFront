// src/app/pages/services-map-page/services-map-page.component.ts

import { Component, OnInit, OnDestroy, ViewChild, Inject, PLATFORM_ID, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { debounceTime, Subject, takeUntil } from 'rxjs';

// Services
import { MapService } from './services/map.service';
import { NotificationService } from '../../core/notification.service';
import { SeoService } from '../../core/seo.service';

// Resolver
import { ServicesMapResolvedData } from './services-map-page.resolver';

// Models
import {
  MapPin,
  CitySuggestion,
  MapViewState,
  SearchFiltersState,
  CoverageCategory,
  MapServicesRequestDto,
  ServiceDetails,
  BikeRepairCoverageCategoryDto,
  BikeRepairCoverageDto
} from '../../shared/models/map.models';

// Components
import { MapComponent } from './components/map/map.component';
import { ServicesListComponent } from './components/services-list/services-list.component';
import { SearchFiltersComponent } from './components/search-filters/search-filters.component';

// Interface for pending popup state
interface PendingPopup {
  serviceId: number;
  timestamp: number; // When it was set
}

// Interface for map bounds
interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

@Component({
  selector: 'app-services-map-page',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    ServicesListComponent,
    SearchFiltersComponent
  ],
  templateUrl: './services-map-page.component.html',
  styleUrls: ['./services-map-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesMapPageComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  private destroy$ = new Subject<void>();
  private citySearchSubject = new Subject<string>();
  private serviceSearchSubject = new Subject<string>();
  private mapMoveSubject = new Subject<MapViewState>();
  private resizeSubject = new Subject<void>();
  private mapInvalidateTimeoutId?: number;

  isBrowser: boolean;
  isMobileView = false;
  showMapView = true; // true = mapa, false = lista (mobile only)

  isAdvandedFiltersPanelOpen = false;
  // Map state
  mapPins: MapPin[] = []; // Piny na mapie (clustered)
  mapVisible = true;
  mapInitialized = false;
  currentMapView: MapViewState = {
    center: { lat: 52.0100, lng: 19.5111 },
    zoom: 7
  };

  // Services list state
  services: MapPin[] = []; // Serwisy w liście
  allServices: MapPin[] = [];
  selectedServiceId: number | null = null;
  pendingPopup: PendingPopup | null = null;
  totalServices = 0;
  currentPage = 0;
  totalPages = 0;
  hasMoreServices = false;

  // Loading states
  loadingServices = false;
  loadingMore = false;
  servicesError = false;

  // Search & Filters state
  filtersState: SearchFiltersState = {
    cityQuery: '',
    serviceQuery: '',
    verifiedOnly: false,
    selectedCoverageIds: []
  };

  citySuggestions: CitySuggestion[] = [];
  serviceSuggestions: MapPin[] = [];
  citySearchLoading = false;
  serviceSearchLoading = false;
  coverageCategories: CoverageCategory[] = [];

  constructor(
    private mapService: MapService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private meta: Meta,
    private title: Title,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.resizeSubject.next();
    }
  }

  ngOnInit(): void {
    // Inicjalizuj dane z resolvera (SSR)
    this.initializeFromResolver();

    // Nasłuchuj na zmiany query params (dla dynamicznych meta tagów)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['city']) {
        this.filtersState.cityQuery = params['city'];
      }
      if (params['coverages']) {
        this.filtersState.selectedCoverageIds = params['coverages']
          .split(',')
          .map(Number)
          .filter((n: number) => !isNaN(n) && n > 0);
      }
      // Aktualizuj meta tagi przy zmianie filtrów
      this.updateDynamicMetaTags();
    });

    // Ustaw SEO (schema markup nie zależy od filtrów)
    this.addSchemaMarkup();

    if (!this.isBrowser) return;

    this.checkMobileView();
    this.setupDebouncing();

    // Jeśli nie mamy danych z resolvera, załaduj ręcznie
    if (this.services.length === 0) {
      this.loadRepairCoverages();
      setTimeout(() => {
        this.loadInitialData();
      }, 100);
    } else {
      // Dane z resolvera są już załadowane, tylko załaduj piny na mapę
      setTimeout(() => {
        this.loadMapPins(this.currentMapView.zoom, this.getBoundsString(this.currentMapView.bounds));
      }, 100);
    }
  }

  /**
   * Inicjalizuje dane z resolvera (SSR)
   * Resolver pobiera dane przed renderowaniem HTML
   */
  private initializeFromResolver(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      const mapData = data['mapData'] as ServicesMapResolvedData | null;

      if (mapData) {
        // Dane z resolvera - SSR
        this.services = mapData.services.map(pin => ({
          ...pin,
          address: pin.address || this.buildAddressFromPin(pin)
        }));
        this.allServices = [...this.services];
        this.totalServices = mapData.total;
        this.currentPage = 0;
        this.totalPages = Math.ceil(mapData.total / 50);
        this.hasMoreServices = this.services.length < mapData.total;
        this.coverageCategories = mapData.coverageCategories;

        // Ustaw filtry z resolvera
        if (mapData.city) {
          this.filtersState.cityQuery = mapData.city;
        }
        if (mapData.coverageIds && mapData.coverageIds.length > 0) {
          this.filtersState.selectedCoverageIds = mapData.coverageIds;
        }

        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    // Clear any pending timeouts
    if (this.mapInvalidateTimeoutId !== undefined) {
      clearTimeout(this.mapInvalidateTimeoutId);
      this.mapInvalidateTimeoutId = undefined;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ INITIALIZATION ============

  private checkMobileView(): void {
    this.isMobileView = window.innerWidth <= 1024;
  }

  private setupDebouncing(): void {
    this.citySearchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(query => this.performCitySearch(query));

    this.serviceSearchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(query => this.performServiceSearch(query));

    this.mapMoveSubject
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(viewState => this.handleMapMove(viewState));

    this.resizeSubject
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => this.checkMobileView());
  }

  private loadInitialData(): void {
    // Load clustered pins for map
    this.loadMapPins(this.currentMapView.zoom, this.getBoundsString(this.currentMapView.bounds));

    // Load services for sidebar
    this.loadServicesForList(0);
  }

  // ============ REPAIR COVERAGES ============

  private loadRepairCoverages(): void {
    this.mapService.getAllRepairCoverages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coverages) => {
          if (coverages?.coveragesByCategory) {
            this.processCoverageCategories(coverages.coveragesByCategory);
          } else {
            console.warn('No coveragesByCategory in response');
          }
        },
        error: (error) => {
          console.error('Error loading coverages:', error);
          this.notificationService.error('Nie udało się załadować filtrów');
        }
      });
  }

  private processCoverageCategories(coveragesByCategory: { [key: string]: BikeRepairCoverageDto[] }): void {
    const categoriesMap = new Map<string, CoverageCategory>();

    Object.entries(coveragesByCategory).forEach(([key, coverages]: [string, BikeRepairCoverageDto[]]) => {
      try {
        // Parse the string format: "BikeRepairCoverageCategoryDto(id=1, name=Typ roweru, displayOrder=1)"
        const idMatch = key.match(/id=(\d+)/);
        const nameMatch = key.match(/name=([^,)]+)/);
        const displayOrderMatch = key.match(/displayOrder=(\d+)/);

        if (idMatch && nameMatch) {
          const categoryData: BikeRepairCoverageCategoryDto = {
            id: parseInt(idMatch[1]),
            name: nameMatch[1].trim(),
            displayOrder: displayOrderMatch ? parseInt(displayOrderMatch[1]) : 0
          };

          // Filter out empty coverage arrays
          if (Array.isArray(coverages) && coverages.length > 0) {
            categoriesMap.set(key, {
              category: categoryData,
              coverages: coverages
            });
          }
        } else {
          console.warn('Could not parse category key:', key);
        }
      } catch (error) {
        console.error('Error processing category:', key, error);
      }
    });

    this.coverageCategories = Array.from(categoriesMap.values())
      .sort((a, b) => (a.category.displayOrder || 0) - (b.category.displayOrder || 0));

    if (this.coverageCategories.length === 0) {
      console.error('No categories were processed! Check the data format.');
    }

    this.cdr.markForCheck();
  }

  // ============ MAP PINS (CLUSTERED) ============

  private loadMapPins(zoom: number, bounds?: string): void {
    this.mapService.getClusteredPins(
      zoom,
      bounds,
      this.filtersState.cityQuery || undefined,
      this.filtersState.selectedCoverageIds.length > 0
      ? this.filtersState.selectedCoverageIds
      : undefined
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            this.mapPins = response.data;
            this.cdr.markForCheck();
          }
        },
        error: (error) => console.error('Error loading map pins:', error)
      });
  }

  // ============ SERVICES LIST ============


  private loadServicesForList(page: number = 0): void {
    this.loadingServices = page === 0;
    this.loadingMore = page > 0;

    const request: MapServicesRequestDto = {
      type: 'event',
      bounds: this.getBoundsString(this.currentMapView.bounds),
      page: page,
      perPage: 25,
      coverageIds: this.filtersState.selectedCoverageIds.length > 0
        ? this.filtersState.selectedCoverageIds
        : undefined
    };

    this.mapService.getServices(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            const servicesWithAddress = response.data.map(pin => ({
              ...pin,
              address: pin.address || this.buildAddressFromPin(pin)
            }));

            if (page === 0) {
              this.services = servicesWithAddress;
            } else {
              this.services = [...this.services, ...servicesWithAddress];
            }

            this.allServices = [...this.services];
            this.totalServices = response.total;
            this.currentPage = response.page ?? page;
            this.totalPages = response.totalPages ?? Math.ceil(response.total / (response.perPage || request.perPage || 25));
            this.hasMoreServices = this.services.length < response.total;

            // Check if we need to open a popup for pending service
            this.checkAndOpenPendingPopup();
          }
          this.loadingServices = false;
          this.loadingMore = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading services:', error);
          this.servicesError = true;
          this.loadingServices = false;
          this.loadingMore = false;
          this.cdr.markForCheck();
        }
      });
  }

  private buildAddressFromPin(pin: MapPin): string {
    return pin.address?.trim() || pin.name || 'Serwis rowerowy';
  }

  private getBoundsString(bounds: MapBounds | null | undefined): string | undefined {
    if (!bounds) return undefined;
    return `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  }

  onPopupReopenRequested(serviceId: number): void {
    // Guard against null/undefined serviceId
    if (serviceId != null && serviceId > 0) {
      this.loadServiceDetailsAndShowPopup(serviceId);
    }
  }

  onPopupClosed(serviceId: number): void {
    this.selectedServiceId = null;
    this.pendingPopup = null;
  }

  // ============ CITY SEARCH ============

  onCitySearchChanged(query: string): void {
    this.filtersState.cityQuery = query;
    if (query.length >= 3) {
      this.citySearchSubject.next(query);
    } else {
      this.citySuggestions = [];
      this.cdr.markForCheck();
    }
  }

  private performCitySearch(query: string): void {
    if (query.trim().length < 3) {
      this.citySuggestions = [];
      this.cdr.markForCheck();
      return;
    }

    this.citySearchLoading = true;
    this.mapService.searchCities(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.citySuggestions = cities;
          this.citySearchLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('City search error:', error);
          this.citySuggestions = [];
          this.citySearchLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

onCitySelected(city: CitySuggestion): void {
    // Wykorzystujemy współrzędne bezpośrednio z odpowiedzi
    const latitude = city.latitude;
    const longitude = city.longitude;

    // Aktualizuj URL z query param (dla SEO i udostępniania linków)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { city: city.cityName },
      queryParamsHandling: 'merge'
    });

    if (this.mapComponent && latitude && longitude) {
      // Centrujemy mapę na współrzędnych miasta z odpowiednim zoomem
      this.mapComponent.centerOn(latitude, longitude, 13);
    } else {
      console.error('Missing coordinates or map component for city:', city);
    }
  }

  onCityClearRequested(): void {
    this.filtersState.cityQuery = '';
    this.citySuggestions = [];

    // Usuń query param z URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { city: null },
      queryParamsHandling: 'merge'
    });

    this.cdr.markForCheck();
    if (this.mapComponent) {
      this.mapComponent.centerOn(52.0100, 19.5111, 7);
    }
  }
  // ============ SERVICE SEARCH ============

  onServiceSearchChanged(query: string): void {
    this.filtersState.serviceQuery = query;
    if (query.length >= 3) {
      this.serviceSearchSubject.next(query);
    } else {
      this.serviceSuggestions = [];
      if (query.length === 0) {
        this.services = [...this.allServices];
        this.applyFilters();
      }
    }
  }

  private performServiceSearch(query: string): void {
    if (query.trim().length < 3) {
      this.serviceSuggestions = [];
      return;
    }

    this.serviceSearchLoading = true;
    this.mapService.searchServicesAutocomplete(query, 10, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            this.serviceSuggestions = response.data.map(pin => ({
              ...pin,
              address: pin.address || this.buildAddressFromPin(pin)
            }));
            this.filterServicesBySearchResults(response.data);
          }
          this.serviceSearchLoading = false;
        },
        error: (error) => {
          console.error('Service search error:', error);
          this.serviceSuggestions = [];
          this.serviceSearchLoading = false;
        }
      });
  }

  private filterServicesBySearchResults(searchResults: MapPin[]): void {
    this.services = searchResults.map(pin => ({
      ...pin,
      address: pin.address || this.buildAddressFromPin(pin)
    }));
    this.applyFilters();
  }

  async onServiceSelected(service: MapPin): Promise<void> {
  if (!service.id) return; // Zabezpieczenie

  if (this.isMobileView) {
    this.showMapView = true;
  }

  // Ustaw pending popup PRZED centrowaniem
  this.pendingPopup = { serviceId: service.id, timestamp: Date.now() };

  // Wycentruj mapę - pinezki przeładują się automatycznie
  if (this.mapComponent) {
    await this.mapComponent.centerOn(service.latitude, service.longitude, 15);
  }

  // Popup zostanie otwarty automatycznie przez updateMapPins()
}

  onServiceClearRequested(): void {
    this.filtersState.serviceQuery = '';
    this.serviceSuggestions = [];
    this.services = [...this.allServices];
    this.applyFilters();
  }

  // ============ FILTERS ============

  onVerifiedOnlyChanged(value: boolean): void {
    this.filtersState.verifiedOnly = value;
    this.applyFilters();
  }

  onCoverageToggled(coverageId: number): void {
    const index = this.filtersState.selectedCoverageIds.indexOf(coverageId);
    if (index > -1) {
      this.filtersState.selectedCoverageIds.splice(index, 1);
    } else {
      this.filtersState.selectedCoverageIds.push(coverageId);
    }
    const boundsStr = this.getBoundsString(this.currentMapView.bounds);
    this.loadMapPins(this.currentMapView.zoom, boundsStr);

    this.loadServicesForList(0);
  }

  onAdvancedFiltersApplied(): void {
    this.loadServicesForList(0);
  }


  onAdvancedFiltersCleared(): void {
    this.filtersState.selectedCoverageIds = [];
    this.loadServicesForList(0);
  }

  private applyFilters(): void {
    if (this.filtersState.verifiedOnly) {
      this.services = this.services.filter(s => s.verified);
    }
  }

  // ============ MAP EVENTS ============

  onMapReady(): void {
    this.mapInitialized = true;
  }

  onMapMoved(viewState: MapViewState): void {
    this.currentMapView = viewState;
    this.mapMoveSubject.next(viewState);
  }

  private handleMapMove(viewState: MapViewState): void {
    const boundsStr = this.getBoundsString(viewState.bounds);
    this.loadMapPins(viewState.zoom, boundsStr);
    this.loadServicesForList(0);
  }

  onPinClicked(pin: MapPin): void {
    // Ensure ID is a valid number (convert if needed)
    const serviceId = Number(pin.id);

    if (isNaN(serviceId) || serviceId <= 0) {
      console.error('Invalid service ID in pin:', pin.id);
      return;
    }

    this.pendingPopup = { serviceId, timestamp: Date.now() };
    this.loadServiceDetailsAndShowPopup(serviceId);
  }

  private checkAndOpenPendingPopup(): void {
    // If we have a pending popup to show, open it now that services are loaded
    if (this.pendingPopup !== null && this.pendingPopup.serviceId > 0) {
      this.loadServiceDetailsAndShowPopup(this.pendingPopup.serviceId);
    }
  }

  private loadServiceDetailsAndShowPopup(serviceId: number): void {
    this.mapService.getServiceDetails(serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (serviceDetails) => {
          if (serviceDetails && this.mapComponent) {
            this.selectedServiceId = serviceId;
            this.mapComponent.showServicePopup(serviceDetails);
          }
        },
        error: (error) => {
          console.error('Error loading service details:', error);
          this.notificationService.error('Nie udało się załadować szczegółów serwisu');
        }
      });
  }

  onViewServiceDetails(serviceDetails: ServiceDetails): void {
    this.router.navigate(['/service', serviceDetails.id]);
  }

  onRegisterService(serviceDetails: ServiceDetails): void {
    this.router.navigate(['/register-service'], {
      queryParams: {
        serviceId: serviceDetails.id,
        serviceName: serviceDetails.name,
        street: serviceDetails.street || '',
        building: serviceDetails.building || '',
        flat: serviceDetails.flat || '',
        city: serviceDetails.city || '',
        phoneNumber: serviceDetails.phoneNumber || '',
        email: serviceDetails.email || ''
      }
    });
  }

  onOrderTransport(serviceDetails: ServiceDetails): void {
    this.router.navigate(['/order-transport'], {
      queryParams: {
        serviceId: serviceDetails.id,
        serviceName: serviceDetails.name,
        serviceAddress: `${serviceDetails.street} ${serviceDetails.building}${serviceDetails.flat ? '/' + serviceDetails.flat : ''}, ${serviceDetails.city}`,
        transportCost: serviceDetails.transportCost
      }
    });
  }

  onClusterClicked(data: { lat: number; lng: number; zoom: number }): void {
    if (this.mapComponent) {
      this.mapComponent.centerOn(data.lat, data.lng, data.zoom);
    }
  }

  onMapError(error: string): void {
    this.notificationService.error(error);
  }

  // ============ SERVICES LIST EVENTS ============

  onServiceDetailsRequested(service: MapPin): void {
    this.router.navigate(['/service', service.id]);
  }

  onScrollEnd(): void {
    if (this.hasMoreServices && !this.loadingMore) {
      this.loadServicesForList(this.currentPage + 1);
    }
  }

  onRetryRequested(): void {
    this.servicesError = false;
    this.loadServicesForList(0);
  }

  // ============ MOBILE VIEW TOGGLE ============

  toggleView(): void {
    this.showMapView = !this.showMapView;
    if (this.showMapView && this.mapComponent) {
      // Clear any existing timeout before setting a new one
      if (this.mapInvalidateTimeoutId !== undefined) {
        clearTimeout(this.mapInvalidateTimeoutId);
      }

      this.mapInvalidateTimeoutId = window.setTimeout(() => {
        if (this.mapComponent) {
          this.mapComponent.invalidateSize();
        }
        this.mapInvalidateTimeoutId = undefined;
      }, 100);
    }
  }

  // ============ SEO ============

  /**
   * Dynamiczne meta tagi - aktualizowane przy zmianie filtrów (Long-tail SEO)
   * Przykłady:
   * - /services-map -> "Mapa serwisów rowerowych w Polsce"
   * - /services-map?city=Warszawa -> "Serwisy rowerowe Warszawa"
   */
  private updateDynamicMetaTags(): void {
    const city = this.filtersState.cityQuery;
    const hasCity = city && city.trim().length > 0;

    // Dynamiczny title i description
    const titleText = hasCity
      ? `Serwisy rowerowe ${city} | Mapa warsztatów rowerowych | CycloPick`
      : 'Mapa serwisów rowerowych w Polsce | Znajdź warsztat rowerowy | CycloPick';

    const descriptionText = hasCity
      ? `Szukasz serwisu rowerowego w lokalizacji: ${city}? Sprawdź opinie, cenniki i umów wizytę online. Najlepsza mapa warsztatów rowerowych.`
      : 'Interaktywna mapa serwisów rowerowych w Polsce. Znajdź najbliższy warsztat rowerowy, sprawdź opinie i umów wizytę online. Ponad 1000 serwisów rowerowych w całej Polsce.';

    const urlPath = hasCity
      ? `https://www.cyclopick.pl?city=${encodeURIComponent(city)}`
      : 'https://www.cyclopick.pl';

    // Title
    this.title.setTitle(titleText);

    // Meta description
    this.meta.updateTag({
      name: 'description',
      content: descriptionText
    });

    // Meta keywords - dynamiczne
    const baseKeywords = 'mapa serwisów rowerowych, warsztat rowerowy, serwis rowerowy, naprawa rowerów';
    const cityKeywords = hasCity
      ? `, serwis rowerowy ${city}, warsztat rowerowy ${city}, naprawa rowerów ${city}`
      : ', mapa warsztatów rowerowych, serwis rowerowy w pobliżu, mechanik rowerowy';
    this.meta.updateTag({
      name: 'keywords',
      content: baseKeywords + cityKeywords
    });

    // Open Graph - dynamiczne
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: descriptionText });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: urlPath });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/for-services/widocznosc-na-mapie-serwisow.webp' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });

    // Twitter Card - dynamiczne
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: titleText });
    this.meta.updateTag({ name: 'twitter:description', content: descriptionText });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.cyclopick.pl/assets/images/for-services/widocznosc-na-mapie-serwisow.webp' });

    // Robots
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Geo meta tags dla lokalnego SEO
    this.meta.updateTag({ name: 'geo.region', content: 'PL' });
    this.meta.updateTag({ name: 'geo.placename', content: hasCity ? city : 'Polska' });
  }

  private addSchemaMarkup(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://www.cyclopick.pl/services-map#webpage',
          'url': 'https://www.cyclopick.pl/services-map',
          'name': 'Mapa serwisów rowerowych w Polsce',
          'description': 'Interaktywna mapa serwisów rowerowych w Polsce. Znajdź najbliższy warsztat rowerowy, sprawdź opinie i umów wizytę online.',
          'isPartOf': {
            '@id': 'https://www.cyclopick.pl/#website'
          },
          'primaryImageOfPage': {
            '@type': 'ImageObject',
            'url': 'https://www.cyclopick.pl/assets/images/for-services/widocznosc-na-mapie-serwisow.webp'
          },
          'breadcrumb': {
            '@id': 'https://www.cyclopick.pl/services-map#breadcrumb'
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': 'https://www.cyclopick.pl/services-map#breadcrumb',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Strona główna',
              'item': 'https://www.cyclopick.pl'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Mapa serwisów rowerowych',
              'item': 'https://www.cyclopick.pl/services-map'
            }
          ]
        },
        {
          '@type': 'Service',
          '@id': 'https://www.cyclopick.pl/services-map#service',
          'name': 'Wyszukiwarka serwisów rowerowych',
          'description': 'Interaktywna mapa pozwalająca znaleźć serwisy rowerowe w całej Polsce. Filtrowanie po usługach, lokalizacji i ocenach.',
          'provider': {
            '@type': 'Organization',
            'name': 'CycloPick',
            'url': 'https://www.cyclopick.pl',
            'logo': 'https://www.cyclopick.pl/assets/images/logo-cyclopick.webp'
          },
          'areaServed': {
            '@type': 'Country',
            'name': 'Polska'
          },
          'serviceType': 'Wyszukiwarka warsztatów rowerowych'
        },
        {
          '@type': 'ItemList',
          '@id': 'https://www.cyclopick.pl/services-map#servicelist',
          'name': 'Lista serwisów rowerowych w Polsce',
          'description': 'Katalog warsztatów rowerowych dostępnych na mapie CycloPick',
          'numberOfItems': this.totalServices || 1000,
          'itemListOrder': 'https://schema.org/ItemListOrderDescending'
        },
        // FAQPage Schema - dla AIO (ChatGPT, Copilot, Gemini)
        {
          '@type': 'FAQPage',
          '@id': 'https://www.cyclopick.pl/services-map#faq',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'Jak znaleźć najlepszy serwis rowerowy w mojej okolicy?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Skorzystaj z interaktywnej mapy CycloPick. Wpisz nazwę swojego miasta w wyszukiwarkę, a mapa pokaże wszystkie dostępne serwisy rowerowe w okolicy. Możesz przefiltrować wyniki według oferowanych usług (np. naprawa przerzutek, centrowanie kół) i sprawdzić opinie innych użytkowników.'
              }
            },
            {
              '@type': 'Question',
              'name': 'Czy mogę umówić się do serwisu rowerowego online?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Tak, większość serwisów na mapie CycloPick umożliwia rezerwację terminu online. Po wybraniu serwisu możesz sprawdzić dostępne terminy i zarezerwować wizytę bez dzwonienia. Niektóre serwisy oferują również możliwość zamówienia transportu roweru.'
              }
            },
            {
              '@type': 'Question',
              'name': 'Ile kosztuje naprawa roweru w serwisie?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Ceny różnią się w zależności od serwisu i rodzaju naprawy. Podstawowy przegląd roweru kosztuje zwykle 50-150 zł. Dzięki CycloPick możesz porównać cenniki różnych serwisów przed wizytą - wiele warsztatów publikuje swoje cenniki na swoich profilach.'
              }
            },
            {
              '@type': 'Question',
              'name': 'Jak sprawdzić opinie o serwisie rowerowym?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Na mapie CycloPick każdy serwis rowerowy ma swój profil z opiniami użytkowników. Kliknij na wybrany serwis, aby zobaczyć oceny, komentarze i zdjęcia od innych rowerzystów. Zweryfikowane serwisy są oznaczone specjalną ikoną.'
              }
            },
            {
              '@type': 'Question',
              'name': 'Czy CycloPick działa w całej Polsce?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Tak, mapa CycloPick obejmuje serwisy rowerowe w całej Polsce. Aktualnie w bazie znajduje się ponad 1000 warsztatów rowerowych - od dużych miast jak Warszawa, Kraków czy Wrocław, po mniejsze miejscowości. Lista serwisów jest stale aktualizowana.'
              }
            }
          ]
        }
      ]
    };

    this.seoService.addStructuredData(schema, 'services-map-structured-data');
  }
}
