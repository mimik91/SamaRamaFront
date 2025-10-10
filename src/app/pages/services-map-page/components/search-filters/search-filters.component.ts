// src/app/pages/services-map-page/components/search-filters/search-filters.component.ts

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  CitySuggestion, 
  MapPin, 
  CoverageCategory, 
  SearchFiltersState 
} from '../../services/map.models';

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.css']
})
export class SearchFiltersComponent {
  // Inputs - dane z rodzica (Smart Container)
  @Input() isMobileView = false;
  @Input() citySuggestions: CitySuggestion[] = [];
  @Input() serviceSuggestions: MapPin[] = [];
  @Input() citySearchLoading = false;
  @Input() serviceSearchLoading = false;
  @Input() coverageCategories: CoverageCategory[] = [];
  @Input() filtersState: SearchFiltersState = {
    cityQuery: '',
    serviceQuery: '',
    verifiedOnly: false,
    selectedCoverageIds: []
  };

  // Outputs - zdarzenia dla rodzica
  @Output() citySearchChanged = new EventEmitter<string>();
  @Output() citySelected = new EventEmitter<CitySuggestion>();
  @Output() cityClearRequested = new EventEmitter<void>();
  
  @Output() serviceSearchChanged = new EventEmitter<string>();
  @Output() serviceSelected = new EventEmitter<MapPin>();
  @Output() serviceClearRequested = new EventEmitter<void>();
  
  @Output() verifiedOnlyChanged = new EventEmitter<boolean>();
  @Output() advancedFiltersToggled = new EventEmitter<void>();
  @Output() coverageToggled = new EventEmitter<number>();
  @Output() advancedFiltersApplied = new EventEmitter<void>();
  @Output() advancedFiltersCleared = new EventEmitter<void>();
 


  // Stan lokalny (tylko UI)
  citySearchFocused = false;
  serviceSearchFocused = false;
  showAdvancedFilters = false;
  isBrowser: boolean;
  filtersExpanded = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  
  // Pozycje dropdown (dla fixed positioning)
  cityDropdownStyle: any = {};
  serviceDropdownStyle: any = {};
  
  // Wyszukiwarka filtrów
  filterSearchQuery = '';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-box') && !target.closest('.advanced-filters-panel')) {
      this.citySearchFocused = false;
      this.serviceSearchFocused = false;
    }
  }

  // Oblicz pozycję dropdown dla city search
  calculateCityDropdownPosition(inputElement: HTMLElement): void {
    const rect = inputElement.getBoundingClientRect();
    this.cityDropdownStyle = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    };
  }

  // Oblicz pozycję dropdown dla service search
  calculateServiceDropdownPosition(inputElement: HTMLElement): void {
    const rect = inputElement.getBoundingClientRect();
    this.serviceDropdownStyle = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    };
  }

  ngOnInit(): void {
    if (this.isBrowser && window.innerWidth <= 768) {
      this.filtersExpanded = false;
    }
  
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isBrowser) return;
        if (window.innerWidth > 768 && !this.filtersExpanded) {
    }
  }

  getActiveFiltersCount(): number {
    let count = 0;
    
    if (this.filtersState.cityQuery) count++;
    if (this.filtersState.serviceQuery) count++;
    if (this.filtersState.verifiedOnly) count++;
    count += this.filtersState.selectedCoverageIds.length;
    
    return count;
  }

  // City search methods
  onCitySearchChange(): void {
    this.citySearchChanged.emit(this.filtersState.cityQuery);
    if (this.filtersState.cityQuery.length >= 3) {
      this.citySearchFocused = true;
    } else {
      this.citySearchFocused = false;
    }
  }

  onCitySelect(city: CitySuggestion): void {
    this.filtersState.cityQuery = city.name;
    this.citySearchFocused = false;
    this.citySelected.emit(city);
  }

  clearCitySearch(): void {
    this.filtersState.cityQuery = '';
    this.citySearchFocused = false;
    this.cityClearRequested.emit();
  }

  onCityFocus(event: FocusEvent): void {
    this.citySearchFocused = true;
    const inputElement = event.target as HTMLElement;
    this.calculateCityDropdownPosition(inputElement);
  }

  // Service search methods
  onServiceSearchChange(): void {
    this.serviceSearchChanged.emit(this.filtersState.serviceQuery);
    if (this.filtersState.serviceQuery.length >= 3) {
      this.serviceSearchFocused = true;
    } else {
      this.serviceSearchFocused = false;
    }
  }

  onServiceSelect(service: MapPin): void {
    this.serviceSearchFocused = false;
    this.serviceSelected.emit(service);
  }

  clearServiceSearch(): void {
    this.filtersState.serviceQuery = '';
    this.serviceSearchFocused = false;
    this.serviceClearRequested.emit();
  }

  onServiceFocus(event: FocusEvent): void {
    this.serviceSearchFocused = true;
    const inputElement = event.target as HTMLElement;
    this.calculateServiceDropdownPosition(inputElement);
  }

  // Filter search (frontend only)
  get filteredCoverageCategories(): CoverageCategory[] {
    if (!this.filterSearchQuery || this.filterSearchQuery.length < 2) {
      return this.coverageCategories;
    }

    const query = this.filterSearchQuery.toLowerCase();
    return this.coverageCategories
      .map(category => ({
        ...category,
        coverages: category.coverages.filter(coverage => 
          coverage.name.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.coverages.length > 0);
  }

  clearFilterSearch(): void {
    this.filterSearchQuery = '';
  }

  // Filter methods
  onVerifiedOnlyChange(): void {
    this.verifiedOnlyChanged.emit(this.filtersState.verifiedOnly);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.advancedFiltersToggled.emit();
  }

  toggleCoverage(coverageId: number): void {
    this.coverageToggled.emit(coverageId);
  }

   toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  isCoverageSelected(coverageId: number): boolean {
    return this.filtersState.selectedCoverageIds.includes(coverageId);
  }

  applyAdvancedFilters(): void {
    this.advancedFiltersApplied.emit();
    if (this.isMobileView) {
      this.showAdvancedFilters = false;
    }
  }

  clearAdvancedFilters(): void {
    this.advancedFiltersCleared.emit();
  }

  get hasActiveFilters(): boolean {
    return this.filtersState.selectedCoverageIds.length > 0 || this.filtersState.verifiedOnly;
  }

  clearAllFilters(): void {
  this.clearCitySearch();
  this.clearServiceSearch();
  this.clearFilterSearch();
  this.advancedFiltersCleared.emit();
}

closeFiltersPanel(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.advancedFiltersToggled.emit();
}

}