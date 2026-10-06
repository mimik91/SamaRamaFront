import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { PricelistService } from '../../pages/service-admin-panel/service-admin-pricelist/pricelist.service';
import { PricelistCategoryDto, PricelistItemDto } from '../../shared/models/service-pricelist.models';

/**
 * Admin zarządza cennikiem usług (kategorie + pozycje) — 1:1 wzorzec ekranu katalogu części,
 * z dodatkową grupą po kategoriach i możliwością przenoszenia pozycji między nimi.
 */
@Component({
  selector: 'app-admin-pricelist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pricelist.component.html',
  styleUrls: ['./admin-pricelist.component.css']
})
export class AdminPricelistComponent implements OnInit {
  private pricelistService = inject(PricelistService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = true;
  categories: PricelistCategoryDto[] = [];
  items: PricelistItemDto[] = [];
  searchQuery = '';

  newCategoryName = '';
  isCreatingCategory = false;

  editingCategoryId: number | null = null;
  editingCategoryName = '';
  isSavingCategory = false;

  deletingCategoryId: number | null = null;

  newItemName = '';
  newItemCategoryId: number | null = null;
  isCreatingItem = false;

  editingItemId: number | null = null;
  editingItemName = '';
  editingItemCategoryId: number | null = null;
  isSavingItem = false;

  deletingItemId: number | null = null;

  itemsForCategory(categoryId: number): PricelistItemDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.items
      .filter(item => item.categoryId === categoryId)
      .filter(item => !q || item.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.pricelistService.adminListCategories().subscribe({
      next: (categories) => {
        this.categories = categories.sort((a, b) => a.displayOrder - b.displayOrder);
        this.pricelistService.adminListItems().subscribe({
          next: (items) => {
            this.items = items;
            this.loading = false;
          },
          error: () => {
            this.notificationService.error('Nie udało się załadować pozycji cennika.');
            this.loading = false;
          }
        });
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować kategorii cennika.');
        this.loading = false;
      }
    });
  }

  // ===== Kategorie =====

  createCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) return;
    this.isCreatingCategory = true;
    this.pricelistService.adminCreateCategory(name).subscribe({
      next: () => {
        this.isCreatingCategory = false;
        this.newCategoryName = '';
        this.notificationService.success('Dodano kategorię.');
        this.loadData();
      },
      error: (err) => {
        this.isCreatingCategory = false;
        this.notificationService.error(err?.error?.message ?? 'Nie udało się dodać kategorii.');
      }
    });
  }

  startEditCategory(category: PricelistCategoryDto): void {
    this.editingCategoryId = category.id;
    this.editingCategoryName = category.name;
  }

  cancelEditCategory(): void {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  saveEditCategory(category: PricelistCategoryDto): void {
    const name = this.editingCategoryName.trim();
    if (!name || name === category.name) {
      this.cancelEditCategory();
      return;
    }
    this.isSavingCategory = true;
    this.pricelistService.adminUpdateCategory(category.id, name).subscribe({
      next: () => {
        this.isSavingCategory = false;
        this.cancelEditCategory();
        this.notificationService.success('Nazwa kategorii zaktualizowana.');
        this.loadData();
      },
      error: (err) => {
        this.isSavingCategory = false;
        this.notificationService.error(err?.error?.message ?? 'Nie udało się zapisać nazwy kategorii.');
      }
    });
  }

  deleteCategory(category: PricelistCategoryDto): void {
    const itemCount = this.itemsForCategoryUnfiltered(category.id).length;
    const question = itemCount > 0
      ? `Kategoria "${category.name}" zawiera ${itemCount} pozycji cennika. Usunąć kategorię wraz ze wszystkimi pozycjami?`
      : `Usunąć kategorię "${category.name}"?`;
    if (!confirm(question)) return;

    this.deletingCategoryId = category.id;
    this.pricelistService.adminDeleteCategory(category.id, itemCount > 0).subscribe({
      next: () => {
        this.deletingCategoryId = null;
        this.notificationService.success(`Usunięto kategorię "${category.name}".`);
        this.loadData();
      },
      error: (err) => {
        this.deletingCategoryId = null;
        this.notificationService.error(err?.error?.message ?? 'Nie udało się usunąć kategorii.');
      }
    });
  }

  private itemsForCategoryUnfiltered(categoryId: number): PricelistItemDto[] {
    return this.items.filter(item => item.categoryId === categoryId);
  }

  // ===== Pozycje =====

  createItem(): void {
    const name = this.newItemName.trim();
    if (!name || !this.newItemCategoryId) return;
    this.isCreatingItem = true;
    this.pricelistService.adminCreateItem(name, this.newItemCategoryId).subscribe({
      next: () => {
        this.isCreatingItem = false;
        this.newItemName = '';
        this.notificationService.success('Dodano pozycję cennika.');
        this.loadData();
      },
      error: (err) => {
        this.isCreatingItem = false;
        this.notificationService.error(err?.error?.message ?? 'Nie udało się dodać pozycji.');
      }
    });
  }

  startEditItem(item: PricelistItemDto): void {
    this.editingItemId = item.id;
    this.editingItemName = item.name;
    this.editingItemCategoryId = item.categoryId;
  }

  cancelEditItem(): void {
    this.editingItemId = null;
    this.editingItemName = '';
    this.editingItemCategoryId = null;
  }

  saveEditItem(item: PricelistItemDto): void {
    const name = this.editingItemName.trim();
    const categoryId = this.editingItemCategoryId;
    if (!name || !categoryId) return;
    if (name === item.name && categoryId === item.categoryId) {
      this.cancelEditItem();
      return;
    }
    this.isSavingItem = true;
    this.pricelistService.adminUpdateItem(item.id, name, categoryId).subscribe({
      next: () => {
        this.isSavingItem = false;
        this.cancelEditItem();
        this.notificationService.success('Pozycja cennika zaktualizowana.');
        this.loadData();
      },
      error: (err) => {
        this.isSavingItem = false;
        this.notificationService.error(err?.error?.message ?? 'Nie udało się zapisać pozycji.');
      }
    });
  }

  deleteItem(item: PricelistItemDto): void {
    if (!confirm(`Usunąć pozycję "${item.name}" z cennika?`)) return;
    this.deletingItemId = item.id;
    this.pricelistService.adminDeleteItem(item.id, false).subscribe({
      next: () => this.afterDeleteItem(item),
      error: (err) => {
        if (err?.error?.requiresForce) {
          const count = err.error.serviceCount ?? 0;
          if (confirm(`Ta pozycja ma ustawioną cenę w ${count} serwisach. Usunąć mimo to razem z tymi cenami?`)) {
            this.pricelistService.adminDeleteItem(item.id, true).subscribe({
              next: () => this.afterDeleteItem(item),
              error: () => {
                this.deletingItemId = null;
                this.notificationService.error('Nie udało się usunąć pozycji.');
              }
            });
            return;
          }
        }
        this.deletingItemId = null;
        if (!err?.error?.requiresForce) {
          this.notificationService.error('Nie udało się usunąć pozycji.');
        }
      }
    });
  }

  private afterDeleteItem(item: PricelistItemDto): void {
    this.deletingItemId = null;
    this.notificationService.success(`Usunięto "${item.name}".`);
    this.loadData();
  }

  goToSuggestions(): void {
    this.router.navigate(['/admin-pricelist-suggestions']);
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}
