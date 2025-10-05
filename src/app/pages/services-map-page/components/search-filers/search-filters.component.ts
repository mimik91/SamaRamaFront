// src/app/pages/services-map-page/components/search-filters/search-filters.component.ts

import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-box') && !target.closest('.advanced-filters-panel')) {
      this.citySearchFocused = false;
      this.serviceSearchFocused = false;
    }
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

  onCityFocus(): void {
    this.citySearchFocused = true;
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

  onServiceFocus(): void {
    this.serviceSearchFocused = true;
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
}