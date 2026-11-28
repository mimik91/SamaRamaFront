import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsideRowView } from '../../reservation-form.models';

/** Panel boczny „Twoja rezerwacja": podgląd wybranych opcji + przycisk przejścia do podsumowania. */
@Component({
  selector: 'app-reservation-aside',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-aside.component.html',
  styleUrls: ['../../reservation-form.shared.css', './reservation-aside.component.css']
})
export class ReservationAsideComponent {
  @Input() title = 'Twoja rezerwacja';
  @Input() rows: AsideRowView[] = [];
  @Input() submitLabel = 'Przejdź do podsumowania';
  @Input() note = 'Nic jeszcze nie wysyłasz – sprawdzisz wszystko w kroku 2.';
  @Output() next = new EventEmitter<void>();
}
