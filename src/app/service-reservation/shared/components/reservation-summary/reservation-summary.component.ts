import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environments';
import { CostLineView, SummaryCardView } from '../../reservation-form.models';

/**
 * Krok 2: karty z podsumowaniem, koszty, miejsce na kupon (ng-content), zgody i przyciski.
 * Dane podają powłoki (guest i express) — komponent nie zna szczegółów żadnego z formularzy.
 */
@Component({
  selector: 'app-reservation-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-summary.component.html',
  styleUrls: ['../../reservation-form.shared.css', './reservation-summary.component.css']
})
export class ReservationSummaryComponent {
  @Input() heading = 'Podsumowanie zamówienia';
  @Input() description = 'Sprawdź dane przed złożeniem zamówienia';
  @Input() cards: SummaryCardView[] = [];
  @Input() costTitle = 'Podsumowanie kosztów';
  @Input() costs: CostLineView[] = [];
  /** Informacja pod kartami (np. „Serwis zostanie wybrany przez CycloPick..."). */
  @Input() infoNote: string | null = null;
  @Input({ required: true }) termsControl!: FormControl<boolean | null>;
  @Input() termsDataScope = 'imię, numer telefonu, adres e-mail, adres odbioru oraz dane roweru';
  @Input() submitLabel = 'Złóż zamówienie';
  @Input() submittingLabel = 'Wysyłanie...';
  @Input() submitting = false;
  @Output() back = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  readonly links = environment.links;
}
