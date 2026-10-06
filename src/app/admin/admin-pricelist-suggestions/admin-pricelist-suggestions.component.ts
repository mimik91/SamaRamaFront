import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { PricelistService } from '../../pages/service-admin-panel/service-admin-pricelist/pricelist.service';
import { PricelistCategoryDto } from '../../shared/models/service-pricelist.models';
import { PricelistSuggestionDto } from '../../shared/models/pricelist-suggestion.models';

/**
 * Kolejka sugestii nowych pozycji cennika — wpisy powstają automatycznie, gdy serwis w planie
 * naprawy wpisze nazwę usługi bez dopasowania do istniejącego cennika (patrz backend PricelistService).
 * Zatwierdzenie tworzy nową pozycję cennika i wycenia ją u zgłaszających serwisów (cena > 0 zł);
 * odrzucenie po prostu usuwa wpis, bez pamięci — ta sama nazwa może wrócić przy kolejnym zgłoszeniu.
 */
@Component({
  selector: 'app-admin-pricelist-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pricelist-suggestions.component.html',
  styleUrls: ['./admin-pricelist-suggestions.component.css']
})
export class AdminPricelistSuggestionsComponent implements OnInit {
  private pricelistService = inject(PricelistService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = true;
  suggestions: PricelistSuggestionDto[] = [];
  categories: PricelistCategoryDto[] = [];

  finalNames: Record<number, string> = {};
  selectedCategoryIds: Record<number, number | null> = {};

  approvingId: number | null = null;
  rejectingId: number | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.pricelistService.adminListSuggestions().subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
        this.finalNames = {};
        this.selectedCategoryIds = {};
        for (const suggestion of suggestions) {
          this.finalNames[suggestion.id] = suggestion.originalName;
          this.selectedCategoryIds[suggestion.id] = null;
        }
        this.pricelistService.adminListCategories().subscribe({
          next: (categories) => {
            this.categories = categories.sort((a, b) => a.displayOrder - b.displayOrder);
            this.loading = false;
          },
          error: () => {
            this.notificationService.error('Nie udało się załadować kategorii cennika.');
            this.loading = false;
          }
        });
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować sugestii cennikowych.');
        this.loading = false;
      }
    });
  }

  totalProposals(suggestion: PricelistSuggestionDto): number {
    return suggestion.submissions.filter(s => s.proposedPrice > 0).length;
  }

  approve(suggestion: PricelistSuggestionDto): void {
    const finalName = (this.finalNames[suggestion.id] ?? '').trim();
    const categoryId = this.selectedCategoryIds[suggestion.id];
    if (!finalName || !categoryId) return;

    if (!confirm(`Zatwierdzić sugestię jako "${finalName}"? Zgłaszające serwisy z ceną > 0 zł dostaną wpis w swoim cenniku.`)) {
      return;
    }

    this.approvingId = suggestion.id;
    this.pricelistService.adminApproveSuggestion(suggestion.id, { finalName, categoryId }).subscribe({
      next: (res) => {
        this.approvingId = null;
        this.notificationService.success(`Zatwierdzono "${finalName}" (wyceniono u ${res.pricedServices} serwisów).`);
        this.loadData();
      },
      error: (err) => {
        this.approvingId = null;
        this.notificationService.error(err?.error?.message ?? 'Nie udało się zatwierdzić sugestii.');
      }
    });
  }

  reject(suggestion: PricelistSuggestionDto): void {
    if (!confirm(`Odrzucić sugestię "${suggestion.originalName}"? Ta sama nazwa może wrócić przy kolejnym zgłoszeniu.`)) {
      return;
    }
    this.rejectingId = suggestion.id;
    this.pricelistService.adminRejectSuggestion(suggestion.id).subscribe({
      next: () => {
        this.rejectingId = null;
        this.notificationService.success('Sugestia odrzucona.');
        this.loadData();
      },
      error: () => {
        this.rejectingId = null;
        this.notificationService.error('Nie udało się odrzucić sugestii.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-pricelist']);
  }
}
