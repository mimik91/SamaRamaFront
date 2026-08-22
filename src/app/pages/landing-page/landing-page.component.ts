import {
  Component, OnInit, OnDestroy, HostListener, inject, ChangeDetectionStrategy, ChangeDetectorRef,
  Inject, PLATFORM_ID, NgZone, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Meta, Title, DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MapService } from '../services-map-page/services/map.service';
import { StatsSummaryDto, CitySuggestion } from '../../shared/models/map.models';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { environment } from '../../environments/environments';
import { CityConfig } from '../city-services-page/city-services-page.component';
import { ServiceProfileService, PartnerLogoDto } from '../service-profile/service-profile.service';
import { ServiceSearchFiltersComponent, ServiceListFiltersChange } from '../../shared/components/service-search-filters/service-search-filters.component';
import { PoradnikArticleCardComponent } from '../poradnik/poradnik-article-card/poradnik-article-card.component';
import { PORADNIK_ARTICLES } from '../poradnik/poradnik-articles.data';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ServiceSearchFiltersComponent, PoradnikArticleCardComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private seoService = inject(SeoService);
  private cdr = inject(ChangeDetectorRef);
  private profileService = inject(ServiceProfileService);
  private ngZone = inject(NgZone);

  @ViewChild('partnerTrack') partnerTrackRef!: ElementRef<HTMLElement>;

  readonly cities: CityConfig[] = [...environment.settings.seoCities].sort((a, b) =>
    a.name.localeCompare(b.name, 'pl')
  );

  readonly footerCities: CityConfig[] = environment.settings.seoCities.filter(
    city => environment.settings.seoFooterCities.includes(city.slug)
  );

  // Pełny proces rezerwacji (6 kroków) — rozbudowane o krok 4 (potwierdzenie wizyty przez serwis)
  // względem skróconej wersji na /jak-dzialamy
  readonly steps = [
    {
      icon: 'search',
      title: 'Znajdź serwis rowerowy',
      description: 'Przeszukaj katalog setek serwisów w całej Polsce — filtruj po mieście i rodzaju usługi, by znaleźć ten najbliższy Ciebie.'
    },
    {
      icon: 'clock',
      title: 'Sprawdź dostępne terminy i cennik',
      description: 'Zobacz godziny otwarcia, opinie innych klientów i orientacyjne ceny usług, zanim się zdecydujesz.'
    },
    {
      icon: 'calendar',
      title: 'Zarezerwuj wizytę online',
      description: 'Wybierz dogodny termin i wyślij zgłoszenie rezerwacji w kilka minut — bez telefonowania.'
    },
    {
      icon: 'check-circle',
      title: 'Poczekaj na potwierdzenie wizyty przez serwis',
      description: 'Serwis potwierdzi Twoją rezerwację — otrzymasz powiadomienie, gdy termin zostanie zaakceptowany.'
    },
    {
      icon: 'tool',
      title: 'Przyjedź z rowerem w umówionym terminie',
      description: 'Serwis już na Ciebie czeka — zero kolejek, zero niespodzianek.'
    },
    {
      icon: 'credit-card',
      title: 'Odbierz naprawiony rower',
      description: 'Zapłać na miejscu i wróć na trasę — z pewnością, że rower jest w dobrych rękach.'
    }
  ];

  statsSummary: StatsSummaryDto | null = null;

  // Poradnik rowerowy — teaser (3 najnowsze artykuły), pod paskiem partnerów
  readonly latestArticles = PORADNIK_ARTICLES.slice(0, 3);

  // Tło hero – przez sanitizer, żeby Angular nie blokował url() ze spacją w nazwie pliku
  heroBgStyle!: SafeStyle;

  // City autocomplete state
  cityInputValue = '';
  filteredCities: CityConfig[] = [];
  showCitySuggestions = false;
  activeSuggestionIndex = -1;

  // Miejscowości spoza sztywnej listy seoCities — dociągane z backendu (jak na /mapa-serwisow),
  // pokazywane tylko gdy filteredCities jest puste. Wybór przenosi na mapę wycentrowaną na tę lokalizację.
  dynamicCitySuggestions: CitySuggestion[] = [];
  private citySearchSubject = new Subject<string>();

  // Wyszukiwarka (nazwa + usługi) — nie filtruje niczego na miejscu, tylko nawiguje do /serwisy
  // (lub /serwisy/{miasto}, jeśli miasto wybrane) z parametrami w URL — patrz onSearchSubmit
  serviceNameQuery = '';
  selectedCoverageIds: number[] = [];
  // Panel wyszukiwania jest domyślnie węższy — rozszerza się, gdy rozwinięty jest filtr usług
  searchFiltersExpanded = false;

  // Pasek partnerów — loga serwisów z rezerwacją online (marquee, requestAnimationFrame)
  partnerLogos: PartnerLogoDto[] = [];
  private marqueeRafId: number | null = null;
  private marqueePos = 0;
  private marqueeHalfWidth = 0;
  private readonly MARQUEE_SPEED = 0.6;

  isDragging = false;
  private dragStartX = 0;
  private dragStartPos = 0;

  private readonly onMouseMoveBound = (e: MouseEvent) => this.onMouseMove(e);
  private readonly onMouseUpBound = () => this.onDragEnd();
  private readonly onTouchMoveBound = (e: TouchEvent) => this.onTouchMove(e);
  private readonly onTouchEndBound = () => this.onDragEnd();

  constructor(
    private router: Router,
    private mapService: MapService,
    private meta: Meta,
    private title: Title,
    private sanitizer: DomSanitizer,
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
    this.citySearchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(query => this.performDynamicCitySearch(query));

    this.heroBgStyle = this.sanitizer.bypassSecurityTrustStyle(
      "url('assets/images/pictures/serwisanci rowerowi w pracy.webp')"
    );
    this.setMetaTags();
    this.setCanonicalUrl();
    this.loadStatsSummary();
    this.loadPartnerLogos();
    this.updateStructuredData();
  }

  private loadStatsSummary(): void {
    this.mapService.getStatsSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.statsSummary = stats;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.seoService.removeStructuredData();
    this.stopMarquee();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mousemove', this.onMouseMoveBound);
      document.removeEventListener('mouseup', this.onMouseUpBound);
      document.removeEventListener('touchmove', this.onTouchMoveBound);
      document.removeEventListener('touchend', this.onTouchEndBound);
    }
  }

  // ============================================================
  // PASEK PARTNERÓW (marquee)
  // ============================================================

  private loadPartnerLogos(): void {
    this.profileService.getReservationServicesLogos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logos) => {
          this.partnerLogos = logos;
          this.cdr.markForCheck();
          // Dajemy czas na wyrenderowanie *ngFor przed pomiarem szerokości
          setTimeout(() => this.startMarquee(), 100);
        },
        error: () => { /* pasek po prostu nie wyświetli się */ }
      });
  }

  private startMarquee(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const track = this.partnerTrackRef?.nativeElement;
    if (!track) return;

    this.marqueeHalfWidth = track.scrollWidth / 2;
    if (this.marqueeHalfWidth === 0) return;

    this.stopMarquee();

    this.ngZone.runOutsideAngular(() => {
      const step = () => {
        if (!this.isDragging) {
          this.marqueePos += this.MARQUEE_SPEED;
          if (this.marqueePos >= this.marqueeHalfWidth) {
            this.marqueePos = 0;
          }
          track.style.transform = `translateX(-${this.marqueePos}px)`;
        }
        this.marqueeRafId = requestAnimationFrame(step);
      };
      this.marqueeRafId = requestAnimationFrame(step);
    });
  }

  private stopMarquee(): void {
    if (this.marqueeRafId !== null) {
      cancelAnimationFrame(this.marqueeRafId);
      this.marqueeRafId = null;
    }
  }

  onMouseDown(e: MouseEvent): void {
    this.startDrag(e.clientX);
    document.addEventListener('mousemove', this.onMouseMoveBound);
    document.addEventListener('mouseup', this.onMouseUpBound);
  }

  onTouchStart(e: TouchEvent): void {
    this.startDrag(e.touches[0].clientX);
    document.addEventListener('touchmove', this.onTouchMoveBound, { passive: true });
    document.addEventListener('touchend', this.onTouchEndBound);
  }

  private startDrag(clientX: number): void {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartPos = this.marqueePos;
  }

  private onMouseMove(e: MouseEvent): void {
    this.handleDragMove(e.clientX);
  }

  private onTouchMove(e: TouchEvent): void {
    this.handleDragMove(e.touches[0].clientX);
  }

  private handleDragMove(clientX: number): void {
    if (!this.isDragging) return;
    const delta = this.dragStartX - clientX;
    let newPos = this.dragStartPos + delta;
    newPos = ((newPos % this.marqueeHalfWidth) + this.marqueeHalfWidth) % this.marqueeHalfWidth;
    this.marqueePos = newPos;
    const track = this.partnerTrackRef?.nativeElement;
    if (track) track.style.transform = `translateX(-${this.marqueePos}px)`;
  }

  private onDragEnd(): void {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMoveBound);
    document.removeEventListener('mouseup', this.onMouseUpBound);
    document.removeEventListener('touchmove', this.onTouchMoveBound);
    document.removeEventListener('touchend', this.onTouchEndBound);
  }

  // ============================================================
  // WYSZUKIWARKA — nawiguje do /serwisy (lub /serwisy/{miasto}) z filtrami w query params;
  // sam wynik pokazuje się na stronie docelowej (city-services-page), nie tutaj
  // ============================================================

  private buildSearchQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.serviceNameQuery.trim()) {
      params['search'] = this.serviceNameQuery.trim();
    }
    if (this.selectedCoverageIds.length > 0) {
      params['coverageIds'] = this.selectedCoverageIds.join(',');
    }
    return params;
  }

  onFiltersChanged(change: ServiceListFiltersChange): void {
    this.selectedCoverageIds = change.coverageIds;
  }

  onSearchSubmit(): void {
    const queryParams = this.buildSearchQueryParams();
    this.router.navigate(['/serwisy'], { queryParams });
  }

  clearServiceNameSearch(): void {
    this.serviceNameQuery = '';
    this.cdr.markForCheck();
  }

  // City autocomplete — wybór miasta nawiguje do /serwisy/{miasto}, zachowując ewentualne
  // wyszukiwanie po nazwie / filtr usług już wprowadzone w wyszukiwarce
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
      case 'Enter': {
        event.preventDefault();
        const index = this.activeSuggestionIndex >= 0 ? this.activeSuggestionIndex : 0;
        if (index < this.filteredCities.length) {
          if (this.filteredCities[index]) {
            this.selectCity(this.filteredCities[index]);
          }
        } else {
          const dynamicCity = this.dynamicCitySuggestions[index - this.filteredCities.length];
          if (dynamicCity) this.selectDynamicCity(dynamicCity);
        }
        break;
      }
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
    const queryParams = this.buildSearchQueryParams();
    this.router.navigate(['/serwisy', city.slug], { queryParams });
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
    this.cdr.markForCheck();
  }

  trackByCitySlug(index: number, city: CityConfig): string {
    return city.slug;
  }

  trackByCityName(index: number, city: CitySuggestion): string {
    return city.cityName;
  }

  // Backend nie zwraca nazwy serwisu w PartnerLogoDto (tylko suffix/logoUrl/serviceId) —
  // czytelna nazwa do alt tekstu logo wyprowadzona ze suffixu, WERSALIKAMI
  partnerDisplayName(suffix: string): string {
    return suffix.replace(/-/g, ' ').toUpperCase();
  }

  // Odmiana "zweryfikowany warsztat" przez liczbę (1 / 2-4 / 5+) do etykiety paska partnerów
  get partnersBarLabel(): string {
    const n = this.partnerLogos.length;
    const mod10 = n % 10;
    const mod100 = n % 100;
    const isFew = mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14);

    if (n === 1) return '1 zweryfikowany warsztat już rezerwuje się online przez CycloPick';
    if (isFew) return `${n} zweryfikowane warsztaty już rezerwują się online przez CycloPick`;
    return `${n} zweryfikowanych warsztatów już rezerwuje się online przez CycloPick`;
  }

  private setMetaTags(): void {
    const titleText = 'Znajdź i zarezerwuj serwis rowerowy w Polsce | CycloPick';
    const description = 'Setki sprawdzonych serwisów rowerowych w całej Polsce. Wyszukaj warsztat w swoim mieście, sprawdź opinie i zarezerwuj wizytę online — bez dzwonienia.';

    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'keywords', content: 'serwis rowerowy, rezerwacja serwisu rowerowego online, naprawa roweru, warsztat rowerowy, katalog serwisów rowerowych, CycloPick' });
  }

  private setCanonicalUrl(): void {
    this.seoService.setCanonical('https://www.cyclopick.pl/');
  }

  private updateStructuredData(): void {
    const schemas = [
      SchemaOrgHelper.generateOrganization(),
      SchemaOrgHelper.generateWebSite()
    ].filter(Boolean);

    if (schemas.length > 0) {
      this.seoService.addMultipleStructuredData(schemas);
    }
  }
}
