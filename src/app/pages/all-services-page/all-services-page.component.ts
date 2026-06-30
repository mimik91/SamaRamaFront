import {
  Component, OnInit, OnDestroy, Inject, PLATFORM_ID,
  HostListener, inject, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MapService } from '../services-map-page/services/map.service';
import { MapPin, MapServicesRequestDto } from '../../shared/models/map.models';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { environment } from '../../environments/environments';
import { CityConfig } from '../city-services-page/city-services-page.component';

@Component({
  selector: 'app-all-services-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './all-services-page.component.html',
  styleUrls: ['./all-services-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllServicesPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private seoService = inject(SeoService);
  private cdr = inject(ChangeDetectorRef);

  readonly cities: CityConfig[] = [...environment.settings.seoCities].sort((a, b) =>
    a.name.localeCompare(b.name, 'pl')
  );

  readonly footerCities: CityConfig[] = environment.settings.seoCities.filter(
    city => environment.settings.seoFooterCities.includes(city.slug)
  );

  services: MapPin[] = [];
  loading = true;
  error = false;
  totalServices = 0;
  currentPage = 0;
  hasMore = false;
  loadingMore = false;

  // City autocomplete state
  cityInputValue = '';
  filteredCities: CityConfig[] = [];
  showCitySuggestions = false;
  isCityInputFocused = false;
  activeSuggestionIndex = -1;

  loadingAction: { serviceId: number; type: string } | null = null;

  isServiceLoading(serviceId: number): boolean {
    return this.loadingAction?.serviceId === serviceId;
  }

  isLoadingAction(serviceId: number, type: string): boolean {
    return this.loadingAction?.serviceId === serviceId && this.loadingAction?.type === type;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mapService: MapService,
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.city-autocomplete-wrapper')) {
      this.showCitySuggestions = false;
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    this.updateMetaTags();
    this.loadServices(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.seoService.removeStructuredData();
  }

  private loadServices(page: number): void {
    if (page === 0) {
      this.loading = true;
    } else {
      this.loadingMore = true;
    }

    const request: MapServicesRequestDto = {
      type: 'event',
      bounds: undefined,
      page,
      perPage: 50
    };

    this.mapService.getServices(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            if (page === 0) {
              this.services = response.data;
            } else {
              this.services = [...this.services, ...response.data];
            }
            this.totalServices = response.total;
            this.currentPage = page;
            this.hasMore = this.services.length < response.total;

            if (page === 0 && this.services.length > 0) {
              this.updateStructuredData();
            }
          }
          this.loading = false;
          this.loadingMore = false;
          this.error = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = true;
          this.loading = false;
          this.loadingMore = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadMore(): void {
    if (!this.loadingMore && this.hasMore) {
      this.loadServices(this.currentPage + 1);
    }
  }

  // City autocomplete
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
    this.isCityInputFocused = true;
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
    this.cdr.markForCheck();
  }

  navigateToMap(): void {
    this.router.navigate(['/mapa-serwisow']);
  }

  navigateToServiceOnMap(service: MapPin): void {
    this.router.navigate(['/mapa-serwisow'], {
      queryParams: { lat: service.latitude, lng: service.longitude, zoom: '16' }
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
          if (response?.suffix) {
            this.router.navigate(['/', response.suffix, 'zamow-transport']);
          }
        },
        error: () => {
          this.loadingAction = null;
          this.cdr.markForCheck();
        }
      });
  }

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
          if (response?.suffix) {
            this.router.navigate([response.suffix]);
          }
        },
        error: () => {
          this.loadingAction = null;
          this.cdr.markForCheck();
        }
      });
  }

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
          if (response?.suffix) {
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

  trackByServiceId(index: number, service: MapPin): number {
    return service.id;
  }

  trackByCitySlug(index: number, city: CityConfig): string {
    return city.slug;
  }

  private updateMetaTags(): void {
    const titleText = 'Serwisy rowerowe w Polsce – pełna lista warsztatów | CycloPick';
    const description = 'Przeglądaj pełną listę serwisów rowerowych w całej Polsce. Znajdź warsztat rowerowy blisko Ciebie, zarezerwuj wizytę lub zamów transport roweru.';

    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'keywords', content: 'serwisy rowerowe Polska, lista serwisów rowerowych, warsztaty rowerowe, naprawa rowerów' });
    this.seoService.setCanonical('https://www.cyclopick.pl/serwisy');
  }

  private updateStructuredData(): void {
    const itemList = SchemaOrgHelper.generateItemList(
      this.services.map(service => ({
        name: service.name,
        address: service.address || undefined,
        telephone: service.phoneNumber || undefined
      })),
      'Serwisy rowerowe w Polsce'
    );

    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'CycloPick', url: environment.siteUrl },
      { name: 'Serwisy rowerowe w Polsce', url: `${environment.siteUrl}/serwisy` }
    ]);

    const schemas = [itemList, breadcrumb].filter(Boolean);
    if (schemas.length > 0) {
      this.seoService.addMultipleStructuredData(schemas);
    }
  }
}
