import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n.service';
import { OrderBarComponent } from '../order-bar/order-bar.component';
import {
  CalendarDayData,
  CalendarOrder,
  CalendarMode,
  Technician
} from '../../../../shared/models/service-calendar.models';

@Component({
  selector: 'app-calendar-day-view',
  standalone: true,
  imports: [CommonModule, OrderBarComponent],
  templateUrl: './calendar-day-view.component.html',
  styleUrls: ['./calendar-day-view.component.css']
})
export class CalendarDayViewComponent {
  private i18nService = inject(I18nService);

  @Input() data!: CalendarDayData;
  @Input() calendarMode: CalendarMode = 'SIMPLE';
  @Input() technicians: Technician[] = [];

  @Output() orderClick = new EventEmitter<CalendarOrder>();
  @Output() cancelOrder = new EventEmitter<CalendarOrder>();
  @Output() confirmOrder = new EventEmitter<CalendarOrder>();
  @Output() acceptBike = new EventEmitter<CalendarOrder>();
  @Output() markReadyForPickup = new EventEmitter<CalendarOrder>();
  @Output() markCompleted = new EventEmitter<CalendarOrder>();
  @Output() backToProgress = new EventEmitter<CalendarOrder>();

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  get capacityPercent(): number {
    if (!this.data.maxBikesPerDay) return 0;
    return Math.min(100, (this.data.bikesCount / this.data.maxBikesPerDay) * 100);
  }

  get capacityClass(): string {
    if (this.capacityPercent >= 100) return 'full';
    if (this.capacityPercent >= 75) return 'high';
    if (this.capacityPercent >= 50) return 'medium';
    return 'low';
  }

  /**
   * Zwraca zlecenia dla danego serwisanta (tryb zaawansowany)
   */
  getOrdersForTechnician(technicianId: number): CalendarOrder[] {
    if (this.data.technicianOrders && this.data.technicianOrders[technicianId]) {
      return this.data.technicianOrders[technicianId];
    }
    return this.data.orders.filter(o => o.assignedTechnicianId === technicianId);
  }

  /**
   * Zwraca zlecenia nieprzypisane (tryb zaawansowany)
   */
  get unassignedOrders(): CalendarOrder[] {
    if (this.data.unassignedOrders) {
      return this.data.unassignedOrders;
    }
    return this.data.orders.filter(o => !o.assignedTechnicianId);
  }

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
