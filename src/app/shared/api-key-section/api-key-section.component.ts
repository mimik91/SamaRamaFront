import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiKeyService } from '../api-key.service';
import { ApiKeyStatus } from '../models/api-key.models';
import { NotificationService } from '../../core/notification.service';

/**
 * Sekcja "Klucz API" (do bazy skradzionych rowerów) — ustawienia konta CLIENT. Klucz jest pokazywany
 * w pełni tylko raz, tuż po wygenerowaniu — poza tym widoczny jest tylko nie-sekretny keyPrefix.
 * Patrz PLANNED_CHANGES.md, wpis nr 6.
 */
@Component({
  selector: 'app-api-key-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-key-section.component.html',
  styleUrls: ['./api-key-section.component.css']
})
export class ApiKeySectionComponent implements OnInit {
  private apiKeyService = inject(ApiKeyService);
  private notificationService = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);

  loading = true;
  generating = false;
  status: ApiKeyStatus | null = null;
  revealedKey: string | null = null;

  ngOnInit(): void {
    this.loadStatus();
  }

  private loadStatus(): void {
    this.loading = true;
    this.apiKeyService.getClientKeyStatus().subscribe({
      next: (status) => {
        this.status = status;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  generate(): void {
    const question = this.status?.hasKey
      ? 'Wygenerowanie nowego klucza unieważni poprzedni. Kontynuować?'
      : 'Wygenerować nowy klucz API?';
    if (!confirm(question)) return;

    this.generating = true;
    this.apiKeyService.generateClientKey().subscribe({
      next: (res) => {
        this.revealedKey = res.apiKey;
        this.generating = false;
        this.loadStatus();
      },
      error: () => {
        this.notificationService.error('Nie udało się wygenerować klucza API.');
        this.generating = false;
      }
    });
  }

  copyRevealedKey(): void {
    if (!isPlatformBrowser(this.platformId) || !this.revealedKey) return;
    navigator.clipboard.writeText(this.revealedKey).then(
      () => this.notificationService.success('Klucz skopiowany do schowka.'),
      () => this.notificationService.error('Nie udało się skopiować klucza.')
    );
  }

  dismissRevealedKey(): void {
    this.revealedKey = null;
  }
}
