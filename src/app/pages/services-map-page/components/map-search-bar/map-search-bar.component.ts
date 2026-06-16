import {
  Component, Input, Output, EventEmitter, ViewChild, ElementRef,
  HostListener, inject, PLATFORM_ID,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CitySuggestion,
  MapPin,
  CoverageCategory,
  SearchFiltersState
} from '../../../../shared/models/map.models';

@Component({
  selector: 'app-map-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './map-search-bar.component.html',
  styleUrls: ['./map-search-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapSearchBarComponent {
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  readonly isBrowser = isPlatformBrowser(this.platformId);

  @Input() citySuggestions: CitySuggestion[] = [];
  @Input() serviceSuggestions: MapPin[] = [];
  @Input() citySearchLoading = false;
  @Input() serviceSearchLoading = false;
  @Input() coverageCategories: CoverageCategory[] = [];
  @Input() filtersState: SearchFiltersState = {
    cityQuery: '', serviceQuery: '', verifiedOnly: false, selectedCoverageIds: []
  };
  @Input() servicesListUrl = '/serwisy';

  @Output() citySearchChanged = new EventEmitter<string>();
  @Output() citySelected = new EventEmitter<CitySuggestion>();
  @Output() cityClearRequested = new EventEmitter<void>();
  @Output() serviceSearchChanged = new EventEmitter<string>();
  @Output() serviceSelected = new EventEmitter<MapPin>();
  @Output() serviceClearRequested = new EventEmitter<void>();
  @Output() coverageToggled = new EventEmitter<number>();
  @Output() advancedFiltersCleared = new EventEmitter<void>();

  @ViewChild('filterSearchInput') filterSearchInputRef?: ElementRef<HTMLInputElement>;

  filtersOpen = false;
  filterSearch = '';
  citySearchFocused = false;
  serviceSearchFocused = false;
  cityDropdownStyle: Record<string, string> = {};
  serviceDropdownStyle: Record<string, string> = {};

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.filtersOpen || this.citySearchFocused || this.serviceSearchFocused) {
      this.filtersOpen = false;
      this.citySearchFocused = false;
      this.serviceSearchFocused = false;
      this.filterSearch = '';
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-field') && !target.closest('.autocomplete-dropdown')) {
      this.citySearchFocused = false;
      this.serviceSearchFocused = false;
      this.cdr.markForCheck();
    }
    if (!target.closest('.btn-filters') && !target.closest('.filter-panel')) {
      if (this.filtersOpen) {
        this.filtersOpen = false;
        this.cdr.markForCheck();
      }
    }
  }

  get activeFilterCount(): number {
    return this.filtersState.selectedCoverageIds.length;
  }

  get selectedCoverages(): Array<{ id: number; name: string }> {
    const result: Array<{ id: number; name: string }> = [];
    for (const cat of this.coverageCategories) {
      for (const coverage of cat.coverages) {
        if (this.filtersState.selectedCoverageIds.includes(coverage.id)) {
          result.push({ id: coverage.id, name: coverage.name });
        }
      }
    }
    return result;
  }

  get filteredCategories(): CoverageCategory[] {
    const q = this.filterSearch.trim().toLowerCase();
    if (!q) return this.coverageCategories;
    return this.coverageCategories
      .map(cat => ({
        ...cat,
        coverages: cat.coverages.filter(c => c.name.toLowerCase().includes(q))
      }))
      .filter(cat => cat.coverages.length > 0);
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
    if (!this.filtersOpen) {
      this.filterSearch = '';
    } else if (this.isBrowser) {
      setTimeout(() => this.filterSearchInputRef?.nativeElement.focus(), 50);
    }
    this.cdr.markForCheck();
  }

  // ── City ──────────────────────────────────────

  onCitySearchChange(): void {
    this.citySearchChanged.emit(this.filtersState.cityQuery);
    this.citySearchFocused = this.filtersState.cityQuery.length >= 3;
    this.cdr.markForCheck();
  }

  onCityFocus(event: FocusEvent): void {
    this.citySearchFocused = true;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.cityDropdownStyle = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 280)}px`
    };
    this.cdr.markForCheck();
  }

  onCitySelect(city: CitySuggestion): void {
    this.filtersState.cityQuery = city.cityName;
    this.citySearchFocused = false;
    this.citySelected.emit(city);
    this.cdr.markForCheck();
  }

  onCityEnter(): void {
    if (this.citySuggestions.length > 0) this.onCitySelect(this.citySuggestions[0]);
  }

  clearCitySearch(): void {
    this.filtersState.cityQuery = '';
    this.citySearchFocused = false;
    this.cityClearRequested.emit();
    this.cdr.markForCheck();
  }

  // ── Service ───────────────────────────────────

  onServiceSearchChange(): void {
    this.serviceSearchChanged.emit(this.filtersState.serviceQuery);
    this.serviceSearchFocused = this.filtersState.serviceQuery.length >= 3;
    this.cdr.markForCheck();
  }

  onServiceFocus(event: FocusEvent): void {
    this.serviceSearchFocused = true;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.serviceDropdownStyle = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 280)}px`
    };
    this.cdr.markForCheck();
  }

  onServiceSelect(service: MapPin): void {
    this.serviceSearchFocused = false;
    this.serviceSelected.emit(service);
    this.cdr.markForCheck();
  }

  onServiceEnter(): void {
    if (this.serviceSuggestions.length > 0) this.onServiceSelect(this.serviceSuggestions[0]);
  }

  clearServiceSearch(): void {
    this.filtersState.serviceQuery = '';
    this.serviceSearchFocused = false;
    this.serviceClearRequested.emit();
    this.cdr.markForCheck();
  }

  // ── Coverage filters ──────────────────────────

  isCoverageSelected(coverageId: number): boolean {
    return this.filtersState.selectedCoverageIds.includes(coverageId);
  }

  toggleCoverage(coverageId: number): void {
    this.coverageToggled.emit(coverageId);
  }

  clearAllFilters(): void {
    this.filtersState.selectedCoverageIds = [];
    this.advancedFiltersCleared.emit();
    this.cdr.markForCheck();
  }

  // ── TrackBy ───────────────────────────────────

  trackByCityName(_: number, city: CitySuggestion): string { return city.cityName; }
  trackByServiceId(_: number, service: MapPin): number { return service.id; }
  trackByCategoryId(_: number, cat: CoverageCategory): number { return cat.category.id; }
  trackByCoverageId(_: number, coverage: { id: number }): number { return coverage.id; }
}
