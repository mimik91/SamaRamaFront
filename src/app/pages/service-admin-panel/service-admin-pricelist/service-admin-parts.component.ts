import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartCatalogService } from './part-catalog.service';
import { NotificationService } from '../../../core/notification.service';
import { MyPartPriceDto } from '../../../shared/models/part-catalog.models';

/**
 * Zakładka "Części" w panelu cennika serwisu. Świadomie NIE kopiuje wzorca bulk
 * edit-all/save-all ze ServiceAdminPricelistComponent — każda cena zapisywana jest
 * pojedynczo, tym samym upsertem co auto-sync z planu naprawy, więc obie ścieżki się nie gryzą.
 */
@Component({
  selector: 'app-service-admin-parts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-admin-parts.component.html',
  styleUrls: ['./service-admin-parts.component.css']
})
export class ServiceAdminPartsComponent implements OnInit {
  private partCatalogService = inject(PartCatalogService);
  private notificationService = inject(NotificationService);

  @Input() serviceId!: number;

  isLoading = true;
  loadError = false;

  items: MyPartPriceDto[] = [];
  searchQuery = '';

  /** id pozycji aktualnie zapisywanej — blokuje przycisk tylko dla tego wiersza */
  savingId: number | null = null;
  /** lokalna kopia edytowanej ceny per wiersz, żeby nie mutować listy przed zapisem */
  draftPrices: Record<number, number | null> = {};

  get filteredItems(): MyPartPriceDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(item => item.name.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.loadItems();
  }

  private loadItems(): void {
    this.isLoading = true;
    this.loadError = false;
    this.partCatalogService.getMyPartPrices(this.serviceId).subscribe({
      next: (items) => {
        this.items = items;
        this.draftPrices = {};
        for (const item of items) {
          this.draftPrices[item.partCatalogItemId] = item.price;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
      }
    });
  }

  onPriceInput(partCatalogItemId: number, value: number | null): void {
    this.draftPrices[partCatalogItemId] = value;
  }

  hasUnsavedChange(item: MyPartPriceDto): boolean {
    return this.draftPrices[item.partCatalogItemId] !== item.price;
  }

  savePrice(item: MyPartPriceDto): void {
    const draft = this.draftPrices[item.partCatalogItemId];
    if (draft === null || draft === undefined || draft <= 0) {
      this.notificationService.warning('Podaj cenę większą od zera.');
      return;
    }
    this.savingId = item.partCatalogItemId;
    this.partCatalogService.updateMyPartPrice(this.serviceId, item.partCatalogItemId, draft).subscribe({
      next: () => {
        this.savingId = null;
        item.price = draft;
        this.notificationService.success(`Cena "${item.name}" zapisana.`);
      },
      error: () => {
        this.savingId = null;
        this.notificationService.error('Nie udało się zapisać ceny. Spróbuj ponownie.');
      }
    });
  }
}
