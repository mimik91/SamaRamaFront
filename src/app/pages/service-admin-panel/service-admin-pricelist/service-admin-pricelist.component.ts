import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PricelistService,
  CategoryWithPrices,
  PricelistItemWithPrice,
  ServicePricelistDto,
  ServicePricelistUpdateDto
} from './pricelist.service';

@Component({
  selector: 'app-service-admin-pricelist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-admin-pricelist.component.html',
  styleUrls: ['./service-admin-pricelist.component.css']
})
export class ServiceAdminPricelistComponent implements OnInit {
  private pricelistService = inject(PricelistService);

  @Input() serviceId!: number;

  // Stan komponentu
  isLoading = true;
  isEditing = false;
  isSaving = false;
  error: string = '';
  successMessage: string = '';

  // Dane cennika
  categoriesWithPrices: CategoryWithPrices[] = [];
  pricelistInfo: string = '';
  pricelistNote: string = '';
  pricelistActive: boolean = false;

  // Oryginalne dane (do anulowania zmian)
  originalData: {
    categoriesWithPrices: CategoryWithPrices[];
    pricelistInfo: string;
    pricelistNote: string;
    pricelistActive: boolean;
  } | null = null;

  // Filtrowanie
  searchQuery: string = '';
  selectedCategoryId: number | null = null;
  showOnlyAssigned: boolean = false;

  // Zwijanie kategorii - mapa: categoryId -> isExpanded
  expandedCategories: Map<number, boolean> = new Map();

  ngOnInit(): void {
    if (!this.serviceId) {
      this.error = 'Brak ID serwisu';
      this.isLoading = false;
      return;
    }
    this.loadPricelist();
  }

  loadPricelist(): void {
    this.isLoading = true;
    this.error = '';

    // Pobierz oba źródła danych równocześnie
    Promise.all([
      this.pricelistService.getAllAvailableItems().toPromise(),
      this.pricelistService.getMyPricelist(this.serviceId).toPromise()
    ])
      .then(([availableItems, servicePricelist]) => {
        if (availableItems && servicePricelist) {
          // Połącz dane
          this.categoriesWithPrices = this.pricelistService.mergeItemsWithPrices(
            availableItems,
            servicePricelist
          );

          // Inicjalizuj wszystkie kategorie jako rozwinięte
          this.categoriesWithPrices.forEach(cat => {
            if (!this.expandedCategories.has(cat.category.id)) {
              this.expandedCategories.set(cat.category.id, true);
            }
          });

          // Ustaw dodatkowe pola
          this.pricelistInfo = servicePricelist.pricelistInfo || '';
          this.pricelistNote = servicePricelist.pricelistNote || '';
          this.pricelistActive = servicePricelist.pricelistActive;

          this.isLoading = false;
        }
      })
      .catch(err => {
        console.error('Error loading pricelist:', err);
        this.error = 'Nie udało się załadować cennika. Spróbuj ponownie.';
        this.isLoading = false;
      });
  }

  // ===== EDYCJA =====

  startEditing(): void {
    // Zapisz oryginalne dane
    this.originalData = {
      categoriesWithPrices: JSON.parse(JSON.stringify(this.categoriesWithPrices)),
      pricelistInfo: this.pricelistInfo,
      pricelistNote: this.pricelistNote,
      pricelistActive: this.pricelistActive
    };
    this.isEditing = true;
    this.successMessage = '';
    this.error = '';
  }

  cancelEditing(): void {
    if (this.originalData) {
      // Przywróć oryginalne dane
      this.categoriesWithPrices = this.originalData.categoriesWithPrices;
      this.pricelistInfo = this.originalData.pricelistInfo;
      this.pricelistNote = this.originalData.pricelistNote;
      this.pricelistActive = this.originalData.pricelistActive;
      this.originalData = null;
    }
    this.isEditing = false;
    this.error = '';
  }

  savePricelist(): void {
    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    // Przygotuj dane do wysłania - tylko itemy z ceną
    const itemsToSend: { [itemId: number]: number } = {};

    this.categoriesWithPrices.forEach(category => {
      category.items.forEach(item => {
        if (item.price !== null && item.price > 0) {
          itemsToSend[item.id] = item.price;
        }
      });
    });

    const updateDto: ServicePricelistUpdateDto = {
      items: itemsToSend,
      pricelistInfo: this.pricelistInfo || null,
      pricelistNote: this.pricelistNote || null,
      pricelistActive: this.pricelistActive
    };

    this.pricelistService.updateMyPricelist(this.serviceId, updateDto)
      .subscribe({
        next: (response) => {
          this.successMessage = 'Cennik został zaktualizowany pomyślnie!';
          this.isEditing = false;
          this.isSaving = false;
          this.originalData = null;

          // Odśwież dane z odpowiedzi
          this.loadPricelist();

          // Ukryj komunikat po 5 sekundach
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error saving pricelist:', err);
          this.error = err.error?.error || 'Nie udało się zapisać cennika. Spróbuj ponownie.';
          this.isSaving = false;
        }
      });
  }

    /**
   * Optymalizacja dla *ngFor - śledzi kategorie po ID.
   */
  trackByCategoryId(index: number, category: CategoryWithPrices): number {
    return category.category.id;
  }

  /**
   * Optymalizacja dla *ngFor - śledzi elementy cennika po ID.
   */
  trackByItemId(index: number, item: PricelistItemWithPrice): number {
    return item.id;
  }

  // ===== POMOCNICZE METODY =====

  onPriceChange(item: PricelistItemWithPrice, newPrice: string): void {
  let cleanedPrice = newPrice.replace(',', '.');
  const regex = /(\.\d{2})\d+/;
  if (regex.test(cleanedPrice)) {
    cleanedPrice = cleanedPrice.replace(regex, '$1');
  }

  const price = parseFloat(cleanedPrice);

  if (cleanedPrice === '' || cleanedPrice === null) {
    item.price = null;
    item.isAssigned = false;
  } else if (!isNaN(price) && price > 0) {
    item.price = Math.round(price * 100) / 100;
    item.isAssigned = true;
  } else {
    item.price = null;
    item.isAssigned = false;
  }
}

  removeItem(item: PricelistItemWithPrice): void {
    item.price = null;
    item.isAssigned = false;
  }

  getFilteredCategories(): CategoryWithPrices[] {
  const isAllCategoriesSelected = (this.selectedCategoryId === null || this.selectedCategoryId === undefined || String(this.selectedCategoryId) === 'null');

  // 2. Jeśli to "Wszystkie kategorie", ustaw selectedId na null. W przeciwnym razie, przekonwertuj na Number.
  const selectedId = isAllCategoriesSelected ? null : Number(this.selectedCategoryId);

  return this.categoriesWithPrices
    .map(category => {
      const filteredItems = category.items.filter(item => {
        // Filtruj po wyszukiwaniu
        const matchesSearch = !this.searchQuery ||
          item.name.toLowerCase().includes(this.searchQuery.toLowerCase());

        // Filtruj po kategorii: !selectedId działa dla null/0/false (czyli "Wszystkie")
        const matchesCategory = !selectedId ||
          category.category.id === selectedId;

        // Filtruj tylko przypisane
        const matchesAssigned = !this.showOnlyAssigned || item.isAssigned;

        return matchesSearch && matchesCategory && matchesAssigned;
      });

      return {
        category: category.category,
        items: filteredItems
      };
    })
    .filter(category => category.items.length > 0);
  }

  getAssignedItemsCount(): number {
    return this.categoriesWithPrices.reduce((count, category) => {
      return count + category.items.filter(item => item.isAssigned).length;
    }, 0);
  }

  getTotalItemsCount(): number {
    return this.categoriesWithPrices.reduce((count, category) => {
      return count + category.items.length;
    }, 0);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategoryId = null;
    this.showOnlyAssigned = false;
  }

  // ===== ZWIJANIE/ROZWIJANIE KATEGORII =====

  toggleCategory(categoryId: number): void {
    const currentState = this.expandedCategories.get(categoryId) ?? true;
    this.expandedCategories.set(categoryId, !currentState);
  }

  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategories.get(categoryId) ?? true;
  }
}
