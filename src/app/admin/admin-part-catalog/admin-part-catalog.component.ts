import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { PartCatalogService } from '../../pages/service-admin-panel/service-admin-pricelist/part-catalog.service';
import { PartCatalogItemDto } from '../../shared/models/part-catalog.models';

/**
 * Admin porządkuje katalog części "po fakcie" — nowe nazwy dodają serwisy swobodnie (bez
 * kolejki zatwierdzania), więc jedyna praca admina to zmiana błędnych nazw, usuwanie
 * nieużywanych i scalanie duplikatów (np. "łańcuch" -> "Łańcuch KMC X11").
 */
@Component({
  selector: 'app-admin-part-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-part-catalog.component.html',
  styleUrls: ['./admin-part-catalog.component.css']
})
export class AdminPartCatalogComponent implements OnInit {
  private partCatalogService = inject(PartCatalogService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = true;
  items: PartCatalogItemDto[] = [];
  searchQuery = '';

  newName = '';
  isCreating = false;

  editingId: number | null = null;
  editingName = '';
  isSavingEdit = false;

  deletingId: number | null = null;

  mergeSourceId: number | null = null;
  mergeTargetId: number | null = null;
  isMerging = false;

  get filteredItems(): PartCatalogItemDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(item => item.name.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.loadItems();
  }

  private loadItems(): void {
    this.loading = true;
    this.partCatalogService.listPartCatalogItems().subscribe({
      next: (items) => {
        this.items = items.sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować katalogu części.');
        this.loading = false;
      }
    });
  }

  createItem(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.isCreating = true;
    this.partCatalogService.createPartCatalogItem(name).subscribe({
      next: () => {
        this.isCreating = false;
        this.newName = '';
        this.notificationService.success('Dodano pozycję katalogu.');
        this.loadItems();
      },
      error: () => {
        this.isCreating = false;
        this.notificationService.error('Nie udało się dodać pozycji.');
      }
    });
  }

  startEdit(item: PartCatalogItemDto): void {
    this.editingId = item.id;
    this.editingName = item.name;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingName = '';
  }

  saveEdit(item: PartCatalogItemDto): void {
    const name = this.editingName.trim();
    if (!name || name === item.name) {
      this.cancelEdit();
      return;
    }
    this.isSavingEdit = true;
    this.partCatalogService.updatePartCatalogItem(item.id, name).subscribe({
      next: () => {
        this.isSavingEdit = false;
        this.cancelEdit();
        this.notificationService.success('Nazwa zaktualizowana.');
        this.loadItems();
      },
      error: () => {
        this.isSavingEdit = false;
        this.notificationService.error('Nie udało się zapisać nazwy.');
      }
    });
  }

  deleteItem(item: PartCatalogItemDto): void {
    if (!confirm(`Usunąć "${item.name}" z katalogu?`)) return;
    this.deletingId = item.id;
    this.partCatalogService.deletePartCatalogItem(item.id, false).subscribe({
      next: () => this.afterDelete(item),
      error: (err) => {
        if (err?.error?.requiresForce) {
          const count = err.error.serviceCount ?? 0;
          if (confirm(`Ta część ma ustawioną cenę w ${count} serwisach. Usunąć mimo to razem z tymi cenami?`)) {
            this.partCatalogService.deletePartCatalogItem(item.id, true).subscribe({
              next: () => this.afterDelete(item),
              error: () => {
                this.deletingId = null;
                this.notificationService.error('Nie udało się usunąć pozycji.');
              }
            });
            return;
          }
        }
        this.deletingId = null;
        if (!err?.error?.requiresForce) {
          this.notificationService.error('Nie udało się usunąć pozycji.');
        }
      }
    });
  }

  private afterDelete(item: PartCatalogItemDto): void {
    this.deletingId = null;
    this.notificationService.success(`Usunięto "${item.name}".`);
    if (this.mergeSourceId === item.id) this.mergeSourceId = null;
    if (this.mergeTargetId === item.id) this.mergeTargetId = null;
    this.loadItems();
  }

  get mergeSourceName(): string | null {
    return this.items.find(i => i.id === this.mergeSourceId)?.name ?? null;
  }

  get mergeTargetName(): string | null {
    return this.items.find(i => i.id === this.mergeTargetId)?.name ?? null;
  }

  merge(): void {
    if (!this.mergeSourceId || !this.mergeTargetId || this.mergeSourceId === this.mergeTargetId) return;
    const sourceName = this.mergeSourceName;
    const targetName = this.mergeTargetName;
    if (!confirm(`Scalić "${sourceName}" w "${targetName}"? Ta operacja jest nieodwracalna — "${sourceName}" zniknie z katalogu.`)) return;

    this.isMerging = true;
    this.partCatalogService.mergePartCatalogItems(this.mergeSourceId, this.mergeTargetId).subscribe({
      next: (res) => {
        this.isMerging = false;
        this.mergeSourceId = null;
        this.mergeTargetId = null;
        this.notificationService.success(`Scalono "${sourceName}" w "${targetName}" (przeniesiono ${res.pricesMoved} cen).`);
        this.loadItems();
      },
      error: () => {
        this.isMerging = false;
        this.notificationService.error('Nie udało się scalić pozycji.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}
