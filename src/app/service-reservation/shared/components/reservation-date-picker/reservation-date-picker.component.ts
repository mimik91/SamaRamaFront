import { AfterViewInit, Component, DoCheck, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCalendar, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { ReservationFormStore } from '../../reservation-form.store';
import { dateToStr, formatWeekdayDate } from '../../reservation-form.utils';

/** Karta „Termin": zawsze widoczny kalendarz, wybrany dzień, dostępność i komunikaty. */
@Component({
  selector: 'app-reservation-date-picker',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' }
  ],
  templateUrl: './reservation-date-picker.component.html',
  styleUrls: ['../../reservation-form.shared.css', './reservation-date-picker.component.css']
})
export class ReservationDatePickerComponent implements AfterViewInit, DoCheck {
  @Input({ required: true }) store!: ReservationFormStore;
  @Input() cardNumber: number | null = null;
  @Input() title = 'Termin';
  @Input() label = 'Wybierz dzień serwisu';

  @ViewChild(MatCalendar) private calendar?: MatCalendar<Date>;

  readonly formatWeekdayDate = formatWeekdayDate;

  private lastShownKey = '';

  ngAfterViewInit(): void {
    this.syncCalendar();
  }

  ngDoCheck(): void {
    this.syncCalendar();
  }

  /**
   * Termin ustawiony z zewnątrz (preselekcja najbliższego dnia, powrót z płatności) ma być
   * widoczny w kalendarzu — przesuwamy aktywny miesiąc na wybrany dzień.
   */
  private syncCalendar(): void {
    const selected = this.store.selectedDateObj;
    if (!selected || !this.calendar) return;
    const key = dateToStr(selected);
    if (key === this.lastShownKey) return;
    this.lastShownKey = key;
    Promise.resolve().then(() => { if (this.calendar) this.calendar.activeDate = selected; });
  }

  get invalid(): boolean {
    return this.store.isFieldInvalid('plannedDate');
  }

  get errors(): Record<string, unknown> | null {
    return this.store.reservationForm.get('plannedDate')?.errors ?? null;
  }

  get acceptedDaysList(): string {
    return this.store.acceptedDaysHint.replace('Dostępne dni: ', '');
  }
}
