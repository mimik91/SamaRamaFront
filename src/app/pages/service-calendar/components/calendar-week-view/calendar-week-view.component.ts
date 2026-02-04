import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n.service';
import { OrderBarComponent } from '../order-bar/order-bar.component';
import {
  CalendarWeekData,
  CalendarDayData,
  CalendarOrder,
  CalendarMode,
  Technician,
  parseCalendarDate,
  isToday,
  isSameDay,
  getDayNameKey
} from '../../../../shared/models/service-calendar.models';

@Component({
  selector: 'app-calendar-week-view',
  standalone: true,
  imports: [CommonModule, OrderBarComponent],
  templateUrl: './calendar-week-view.component.html',
  styleUrls: ['./calendar-week-view.component.css']
})
export class CalendarWeekViewComponent {
  private i18nService = inject(I18nService);

  @Input() data!: CalendarWeekData;
  @Input() selectedDate: Date = new Date();
  @Input() calendarMode: CalendarMode = 'SIMPLE';
  @Input() technicians: Technician[] = [];
  @Input() maxBikesPerDay: number = 10;

  @Output() orderClick = new EventEmitter<CalendarOrder>();
  @Output() dayClick = new EventEmitter<Date>();
  @Output() cancelOrder = new EventEmitter<CalendarOrder>();
  @Output() confirmOrder = new EventEmitter<CalendarOrder>();
  @Output() acceptBike = new EventEmitter<CalendarOrder>();
  @Output() markReadyForPickup = new EventEmitter<CalendarOrder>();
  @Output() markCompleted = new EventEmitter<CalendarOrder>();
  @Output() backToProgress = new EventEmitter<CalendarOrder>();

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  /**
   * Transformuje ordersByDay na tablice dni (days)
   */
  get days(): CalendarDayData[] {
    if (!this.data?.ordersByDay) return [];

    const dates = Object.keys(this.data.ordersByDay).sort();
    return dates.map(date => {
      const orders = this.data.ordersByDay[date] || [];
      return {
        date,
        orders,
        bikesCount: orders.length,
        maxBikesPerDay: this.maxBikesPerDay
      };
    });
  }

  /**
   * Sprawdza czy dzien jest dzisiaj
   */
  isDayToday(dayData: CalendarDayData): boolean {
    const date = parseCalendarDate(dayData.date);
    return isToday(date);
  }

  /**
   * Sprawdza czy dzien jest wybrany
   */
  isDaySelected(dayData: CalendarDayData): boolean {
    const date = parseCalendarDate(dayData.date);
    return isSameDay(date, this.selectedDate);
  }

  /**
   * Zwraca nazwe dnia tygodnia
   */
  getDayName(dayData: CalendarDayData): string {
    const date = parseCalendarDate(dayData.date);
    const key = getDayNameKey(date.getDay(), true);
    return this.t(key);
  }

  /**
   * Zwraca numer dnia
   */
  getDayNumber(dayData: CalendarDayData): number {
    const date = parseCalendarDate(dayData.date);
    return date.getDate();
  }

  /**
   * Zwraca klase dla pojemnosci dnia
   */
  getCapacityClass(dayData: CalendarDayData): string {
    if (!dayData.maxBikesPerDay) return 'low';
    const percent = (dayData.bikesCount / dayData.maxBikesPerDay) * 100;
    if (percent >= 100) return 'full';
    if (percent >= 75) return 'high';
    if (percent >= 50) return 'medium';
    return 'low';
  }

  /**
   * Obsluga klikniecia w dzien
   */
  onDayClick(dayData: CalendarDayData): void {
    const date = parseCalendarDate(dayData.date);
    this.dayClick.emit(date);
  }

  /**
   * Obsluga klikniecia w zlecenie
   */
  onOrderClick(order: CalendarOrder): void {
    this.orderClick.emit(order);
  }

  onCancelOrder(order: CalendarOrder): void {
    this.cancelOrder.emit(order);
  }

  onConfirmOrder(order: CalendarOrder): void {
    this.confirmOrder.emit(order);
  }

  onAcceptBike(order: CalendarOrder): void {
    this.acceptBike.emit(order);
  }

  onMarkReadyForPickup(order: CalendarOrder): void {
    this.markReadyForPickup.emit(order);
  }

  onMarkCompleted(order: CalendarOrder): void {
    this.markCompleted.emit(order);
  }

  onBackToProgress(order: CalendarOrder): void {
    this.backToProgress.emit(order);
  }
}
