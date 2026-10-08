import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Wymagane potwierdzenie przed zgłoszeniem roweru jako skradziony — informuje, że zgłoszenie
 * NIE trafia na policję, tylko do wewnętrznej, publicznie dostępnej bazy CycloPick (wyszukiwarka
 * na stronie + API). Egzekwowane też po stronie backendu (acknowledgedNoPolice), więc to okno
 * nie jest jedynym zabezpieczeniem — patrz PLANNED_CHANGES.md, wpis nr 6.
 */
@Component({
  selector: 'app-stolen-bike-acknowledgment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ack-modal-overlay" (click)="onOverlayClick($event)">
      <div class="ack-modal-content">
        <h3>Zanim zgłosisz rower jako skradziony</h3>
        <p>
          To zgłoszenie <strong>nie trafia na policję</strong> — jeśli jeszcze tego nie zrobiłeś/aś,
          zgłoś kradzież również na policji.
        </p>
        <p>
          Zgłoszenie trafia do <strong>wewnętrznej bazy CycloPick</strong>, publicznie dostępnej
          przez wyszukiwarkę na stronie i API — zdjęcia roweru i numer ramy będą widoczne dla
          każdego, kto go wyszuka.
        </p>
        <label class="ack-checkbox-row">
          <input type="checkbox" [(ngModel)]="acknowledged" />
          Rozumiem
        </label>
        <div class="ack-modal-actions">
          <button class="ack-btn ack-btn--secondary" (click)="cancelled.emit()">Anuluj</button>
          <button class="ack-btn ack-btn--primary" [disabled]="!acknowledged" (click)="confirmed.emit()">
            Zgłoś rower jako skradziony
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ack-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .ack-modal-content {
      background: var(--color-white);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-lg);
      padding: 24px;
      max-width: 440px;
      width: 100%;
    }
    .ack-modal-content h3 {
      margin: 0 0 12px;
      color: var(--text-primary);
      font-size: 1.15rem;
    }
    .ack-modal-content p {
      margin: 0 0 12px;
      color: var(--text-secondary, #555);
      font-size: 0.92rem;
      line-height: 1.5;
    }
    .ack-checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 16px 0;
      cursor: pointer;
    }
    .ack-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
    .ack-btn {
      padding: 10px 18px;
      border: none;
      border-radius: var(--radius-btn);
      font-weight: 600;
      cursor: pointer;
    }
    .ack-btn--primary {
      background: var(--color-danger);
      color: var(--color-white);
    }
    .ack-btn--primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .ack-btn--secondary {
      background: var(--color-white);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
    }
  `]
})
export class StolenBikeAcknowledgmentModalComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  acknowledged = false;

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('ack-modal-overlay')) {
      this.cancelled.emit();
    }
  }
}
