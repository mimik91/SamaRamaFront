import {
  Component, EventEmitter, Output, OnInit, OnDestroy, HostListener,
  ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MapService } from '../../../pages/services-map-page/services/map.service';
import {
  CoverageCategory,
  BikeRepairCoverageCategoryDto,
  BikeRepairCoverageDto
} from '../../models/map.models';

export interface ServiceListFiltersChange {
  coverageIds: number[];
}

export interface CoverageSuggestion {
  coverage: BikeRepairCoverageDto;
  categoryName: string;
}

@Component({
  selector: 'app-service-search-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-search-filters.component.html',
  styleUrls: ['./service-search-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceSearchFiltersComponent implements OnInit, OnDestroy {
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);
  private destroy$ = new Subject<void>();

  @Output() filtersChanged = new EventEmitter<ServiceListFiltersChange>();
  @Output() expandedChange = new EventEmitter<boolean>();

  selectedCoverageIds: number[] = [];
  coverageCategories: CoverageCategory[] = [];
  /** Szukaj wśród dostępnych usług — pokazuje rozwijaną listę podpowiedzi pod inputem (wzorem szukania miasta) */
  filterSearchQuery = '';
  suggestions: CoverageSuggestion[] = [];
  showSuggestions = false;
  /** Panel z checkboxami do przeglądania usług po kategoriach — domyślnie zwinięty */
  filtersExpanded = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    this.mapService.getAllRepairCoverages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(coverages => {
        if (coverages?.coveragesByCategory) {
          this.coverageCategories = this.parseCoverageCategories(coverages.coveragesByCategory);
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
    this.expandedChange.emit(this.filtersExpanded);
  }

  onFilterSearchInput(): void {
    const query = this.filterSearchQuery.trim().toLowerCase();
    if (!query) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    this.suggestions = this.coverageCategories
      .flatMap(group => group.coverages.map(coverage => ({ coverage, categoryName: group.category.name })))
      .filter(s => s.coverage.name.toLowerCase().includes(query))
      .slice(0, 10);
    this.showSuggestions = this.suggestions.length > 0;
  }

  onFilterSearchFocus(): void {
    if (this.filterSearchQuery.trim() && this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  selectSuggestion(coverageId: number): void {
    this.toggleCoverage(coverageId);
    this.clearFilterSearch();
  }

  clearFilterSearch(): void {
    this.filterSearchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
  }

  isCoverageSelected(coverageId: number): boolean {
    return this.selectedCoverageIds.includes(coverageId);
  }

  toggleCoverage(coverageId: number): void {
    this.selectedCoverageIds = this.isCoverageSelected(coverageId)
      ? this.selectedCoverageIds.filter(id => id !== coverageId)
      : [...this.selectedCoverageIds, coverageId];
    this.filtersChanged.emit({ coverageIds: this.selectedCoverageIds });
  }

  get activeFiltersCount(): number {
    return this.selectedCoverageIds.length;
  }

  clearAllFilters(): void {
    this.selectedCoverageIds = [];
    this.clearFilterSearch();
    this.filtersChanged.emit({ coverageIds: this.selectedCoverageIds });
  }

  trackByCategoryId(index: number, category: CoverageCategory): number {
    return category.category.id;
  }

  trackByCoverageId(index: number, coverage: BikeRepairCoverageDto): number {
    return coverage.id;
  }

  trackBySuggestionId(index: number, suggestion: CoverageSuggestion): number {
    return suggestion.coverage.id;
  }

  // Backend serializuje mapę kategorii z kluczem będącym Java toString() rekordu
  // (np. "BikeRepairCoverageCategoryDto(id=1, name=Typ roweru, displayOrder=1)") — ten sam wzorzec
  // parsowania co w services-map-page.component.ts (tam pozostawiony bez zmian, poza zakresem tego zadania).
  private parseCoverageCategories(coveragesByCategory: { [key: string]: BikeRepairCoverageDto[] }): CoverageCategory[] {
    const categoriesMap = new Map<string, CoverageCategory>();

    Object.entries(coveragesByCategory).forEach(([key, coverages]) => {
      const idMatch = key.match(/id=(\d+)/);
      const nameMatch = key.match(/name=([^,)]+)/);
      const displayOrderMatch = key.match(/displayOrder=(\d+)/);

      if (idMatch && nameMatch && Array.isArray(coverages) && coverages.length > 0) {
        const categoryData: BikeRepairCoverageCategoryDto = {
          id: parseInt(idMatch[1], 10),
          name: nameMatch[1].trim(),
          displayOrder: displayOrderMatch ? parseInt(displayOrderMatch[1], 10) : 0
        };
        categoriesMap.set(key, { category: categoryData, coverages });
      }
    });

    return Array.from(categoriesMap.values())
      .sort((a, b) => (a.category.displayOrder || 0) - (b.category.displayOrder || 0));
  }
}
