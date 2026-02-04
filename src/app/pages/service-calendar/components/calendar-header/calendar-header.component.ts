import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n.service';
import {
  CalendarViewMode,
  CalendarMode,
  formatCalendarDate,
  getWeekStart,
  getWeekEnd,
  getMonthNameKey
} from '../../../../shared/models/service-calendar.models';

@Component({
  selector: 'app-calendar-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-header.component.html',
  styleUrls: ['./calendar-header.component.css']
})
export class CalendarHeaderComponent {
  private i18nService = inject(I18nService);

  @Input() currentView: CalendarViewMode = 'week';
  @Input() calendarMode: CalendarMode = 'SIMPLE';
  @Input() selectedDate: Date = new Date();
  @Input() maxBikesPerDay: number = 10;
  @Input() showTechnicianButton: boolean = false;

  @Output() viewChange = new EventEmitter<CalendarViewMode>();
  @Output() modeChange = new EventEmitter<CalendarMode>();
  @Output() dateChange = new EventEmitter<Date>();
  @Output() acceptReservationClick = new EventEmitter<void>();
  @Output() acceptBikeClick = new EventEmitter<void>();
  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  /**
   * Zwraca etykiete daty dla aktualnego widoku
   */
  get dateLabel(): string {
    switch (this.currentView) {
      case 'day':
        return this.formatDayLabel(this.selectedDate);
      case 'week':
        return this.formatWeekLabel(this.selectedDate);
      case 'month':
        return this.formatMonthLabel(this.selectedDate);
      default:
        return '';
    }
  }

  private formatDayLabel(date: Date): string {
    const day = date.getDate();
    const monthKey = getMonthNameKey(date.getMonth());
    const month = this.t(monthKey);
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private formatWeekLabel(date: Date): string {
    const start = getWeekStart(date);
    const end = getWeekEnd(date);

    const startDay = start.getDate();
    const endDay = end.getDate();

    if (start.getMonth() === end.getMonth()) {
      const monthKey = getMonthNameKey(start.getMonth());
      const month = this.t(monthKey);
      return `${startDay} - ${endDay} ${month} ${start.getFullYear()}`;
    } else {
      const startMonthKey = getMonthNameKey(start.getMonth(), true);
      const endMonthKey = getMonthNameKey(end.getMonth(), true);
      const startMonth = this.t(startMonthKey);
      const endMonth = this.t(endMonthKey);
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${end.getFullYear()}`;
    }
  }

  private formatMonthLabel(date: Date): string {
    const monthKey = getMonthNameKey(date.getMonth());
    const month = this.t(monthKey);
    return `${month} ${date.getFullYear()}`;
  }

  // ============================================
  // NAWIGACJA WIDOKOW
  // ============================================

  setView(view: CalendarViewMode): void {
    if (view !== this.currentView) {
      this.viewChange.emit(view);
    }
  }

  // ============================================
  // PRZELACZNIK TRYBU
  // ============================================

  setMode(mode: CalendarMode): void {
    if (mode !== this.calendarMode) {
      this.modeChange.emit(mode);
    }
  }

  // ============================================
  // NAWIGACJA DAT
  // ============================================

  goToToday(): void {
    this.dateChange.emit(new Date());
  }

  goToPrevious(): void {
    const newDate = new Date(this.selectedDate);

    switch (this.currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    this.dateChange.emit(newDate);
  }

  goToNext(): void {
    const newDate = new Date(this.selectedDate);

    switch (this.currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    this.dateChange.emit(newDate);
  }

  // ============================================
  // AKCJE
  // ============================================

  onAcceptReservation(): void {
    this.acceptReservationClick.emit();
  }

  onAcceptBike(): void {
    this.acceptBikeClick.emit();
  }
}
