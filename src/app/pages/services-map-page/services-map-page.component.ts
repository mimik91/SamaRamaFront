// src/app/pages/services-map-page/services-map-page.component.ts

import { Component, OnInit, OnDestroy, ViewChild, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { debounceTime, Subject, takeUntil } from 'rxjs';

// Services
import { MapService } from './services/map.service';
import { NotificationService } from '../../core/notification.service';

// Models
import {
  MapPin,
  CitySuggestion,
  MapViewState,
  SearchFiltersState,
  CoverageCategory,
  MapServicesRequestDto,
  ServiceDetails
} from './services/map.models';

// Components
import { MapComponent } from './components/map/map.component';
import { ServicesListComponent } from './components/services-list/services-list.component';
import { SearchFiltersComponent } from './components/search-filers/search-filters.component';

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
  styleUrls: ['./services-map-page.component.css']
})
export class ServicesMapPageComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  private destroy$ = new Subject<void>();
  private citySearchSubject = new Subject<string>();
  private serviceSearchSubject = new Subject<string>();
  private mapMoveSubject = new Subject<MapViewState>();

  isBrowser: boolean;
  isMobileView = false;
  showMapView = true; // true = mapa, false = lista (mobile only)

  // Map state
  mapPins: MapPin[] = []; // Piny na mapie (clustered)
  mapVisible = true;
  mapInitialized = false;
  currentMapView: MapViewState = {
    center: { lat: 50.0647, lng: 19.9450 },
    zoom: 12
  };

  // Services list state
  services: MapPin[] = []; // Serwisy w liście
  allServices: MapPin[] = [];
  selectedServiceId: number | null = null;
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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.checkMobileView();
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.checkMobileView();
    this.setupDebouncing();
    this.loadRepairCoverages();

    setTimeout(() => {
      this.loadInitialData();
    }, 100);
  }

  ngOnDestroy(): void {
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
          }
        },
        error: (error) => console.error('Error loading coverages:', error)
      });
  }

  private processCoverageCategories(coveragesByCategory: any): void {
    const categoriesMap = new Map<string, CoverageCategory>();
    
    Object.entries(coveragesByCategory).forEach(([key, coverages]: [string, any]) => {
      try {
        const categoryData = JSON.parse(key);
        categoriesMap.set(key, {
          category: categoryData,
          coverages: coverages
        });
      } catch (error) {
        console.error('Error parsing category:', error);
      }
    });
    
    this.coverageCategories = Array.from(categoriesMap.values())
      .sort((a, b) => (a.category.displayOrder || 0) - (b.category.displayOrder || 0));
  }

  // ============ MAP PINS (CLUSTERED) ============

  private loadMapPins(zoom: number, bounds?: string): void {
    this.mapService.getClusteredPins(zoom, bounds, this.filtersState.cityQuery || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            this.mapPins = response.data;
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
            this.currentPage = response.page ?? 0;
            this.totalPages = response.totalPages ?? 0;
            this.hasMoreServices = (response.next ?? 0) > (response.page ?? 0);
          }
          this.loadingServices = false;
          this.loadingMore = false;
        },
        error: (error) => {
          console.error('Error loading services:', error);
          this.servicesError = true;
          this.loadingServices = false;
          this.loadingMore = false;
        }
      });
  }

  private buildAddressFromPin(pin: MapPin): string {
    return pin.address?.trim() || pin.name || 'Serwis rowerowy';
  }

  private getBoundsString(bounds: any): string | undefined {
    if (!bounds) return undefined;
    return `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  }

  // ============ CITY SEARCH ============

  onCitySearchChanged(query: string): void {
    this.filtersState.cityQuery = query;
    if (query.length >= 3) {
      this.citySearchSubject.next(query);
    } else {
      this.citySuggestions = [];
    }
  }

  private performCitySearch(query: string): void {
    if (query.trim().length < 3) {
      this.citySuggestions = [];
      return;
    }

    this.citySearchLoading = true;
    this.mapService.searchCities(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.citySuggestions = cities;
          this.citySearchLoading = false;
        },
        error: (error) => {
          console.error('City search error:', error);
          this.citySuggestions = [];
          this.citySearchLoading = false;
        }
      });
  }

  onCitySelected(city: CitySuggestion): void {
    this.mapService.getCityBounds(city.name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bounds) => {
          if (bounds && this.mapComponent) {
            this.mapComponent.fitBounds(
              { lat: bounds.sw.latitude, lng: bounds.sw.longitude },
              { lat: bounds.ne.latitude, lng: bounds.ne.longitude }
            );
          } else if (this.mapComponent) {
            this.mapComponent.centerOn(city.latitude, city.longitude, 12);
          }
        },
        error: (error) => {
          console.error('Error fetching city bounds:', error);
          if (this.mapComponent) {
            this.mapComponent.centerOn(city.latitude, city.longitude, 12);
          }
        }
      });
  }

  onCityClearRequested(): void {
    this.filtersState.cityQuery = '';
    this.citySuggestions = [];
    if (this.mapComponent) {
      this.mapComponent.centerOn(50.0647, 19.9450, 12);
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

  onServiceSelected(service: MapPin): void {
    this.selectedServiceId = service.id;
    if (this.mapComponent) {
      this.mapComponent.centerOn(service.latitude, service.longitude, 15);
    }
    if (this.isMobileView) {
      this.showMapView = true;
    }
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
    console.log('Map initialized');
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
    this.selectedServiceId = pin.id;
    // Load service details if needed
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
      setTimeout(() => {
        this.mapComponent.invalidateSize();
      }, 100);
    }
  }
}