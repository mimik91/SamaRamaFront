import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n.service';
import {
  CalendarViewMode,
  CalendarMode,
  Technician,
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
  @Input() loading: boolean = false;
  /** Liczba rowerów w wybranym dniu (null poza widokiem dnia) */
  @Input() bikesCount: number | null = null;
  /** Lista obejmuje cały miesiąc (desktop) — nawigacja i etykieta miesięczne */
  @Input() monthScope = false;
  /** Tryb strony „Statusy zleceń": zamiast nawigacji dat tytuł */
  @Input() statusesMode = false;
  @Input() statusesSubtitle = '';
  @Input() technicians: Technician[] = [];
  /** null = wszyscy, -1 = nieprzypisani (UNASSIGNED_TECHNICIAN_FILTER), inaczej id serwisanta */
  @Input() selectedTechnicianId: number | null = null;

  @Output() viewChange = new EventEmitter<CalendarViewMode>();
  @Output() modeChange = new EventEmitter<CalendarMode>();
  @Output() dateChange = new EventEmitter<Date>();
  @Output() acceptReservationClick = new EventEmitter<void>();
  @Output() acceptBikeClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() limitClick = new EventEmitter<void>();
  @Output() statusesClick = new EventEmitter<void>();
  @Output() technicianFilterChange = new EventEmitter<number | null>();

  private get byMonth(): boolean {
    return this.currentView !== 'day' || this.monthScope;
  }

  get showLoadPill(): boolean {
    return this.currentView === 'day' && !this.monthScope && this.bikesCount !== null;
  }

  get isOverLimit(): boolean {
    return this.bikesCount !== null && this.bikesCount > this.maxBikesPerDay;
  }

  get isFull(): boolean {
    return this.bikesCount !== null && this.bikesCount === this.maxBikesPerDay;
  }

  get progressPercent(): number {
    if (this.bikesCount === null || !this.maxBikesPerDay) return 0;
    return Math.min(100, (this.bikesCount / this.maxBikesPerDay) * 100);
  }

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  /**
   * Zwraca etykiete daty dla aktualnego widoku
   */
  get dateLabel(): string {
    return this.byMonth ? this.formatMonthLabel(this.selectedDate) : this.formatDayLabel(this.selectedDate);
  }

  private formatDayLabel(date: Date): string {
    const day = date.getDate();
    const monthKey = getMonthNameKey(date.getMonth());
    const month = this.t(monthKey);
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
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
    // W trybie Statusów currentView nie odzwierciedla aktywnego widoku, więc zawsze emitujemy
    if (this.statusesMode || view !== this.currentView) {
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

    if (this.byMonth) {
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }

    this.dateChange.emit(newDate);
  }

  goToNext(): void {
    const newDate = new Date(this.selectedDate);

    if (this.byMonth) {
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
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

  onTechnicianFilter(value: string): void {
    this.technicianFilterChange.emit(value === '' ? null : Number(value));
  }

  onStatuses(): void {
    this.statusesClick.emit();
  }

  onLimitClick(): void {
    this.limitClick.emit();
  }

  onRefresh(): void {
    this.refreshClick.emit();
  }
}
