import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n.service';
import {
  CalendarOrder,
  getStatusColor,
  getStatusI18nKey
} from '../../../../shared/models/service-calendar.models';

export type OrderAction = 'cancel' | 'confirm' | 'acceptBike' | 'readyForPickup' | 'completed' | 'backToProgress';

@Component({
  selector: 'app-order-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-bar.component.html',
  styleUrls: ['./order-bar.component.css']
})
export class OrderBarComponent {
  private i18nService = inject(I18nService);

  @Input() order!: CalendarOrder;
  @Input() compact: boolean = false;
  @Input() showTechnician: boolean = false;
  @Input() showActions: boolean = true;

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

  get statusColor(): string {
    return getStatusColor(this.order.status);
  }

  get statusLabel(): string {
    const key = getStatusI18nKey(this.order.status);
    return this.t(key);
  }

  get bikeInfo(): string {
    // Safely get brand and model, handling null/undefined
    const brand = (this.order?.bicycleBrand ?? '').toString().trim();
    const model = (this.order?.bicycleModel ?? '').toString().trim();

    if (brand && model) {
      return `${brand} ${model}`;
    }
    if (brand) {
      return brand;
    }
    if (model) {
      return model;
    }
    // Fallback - show order ID if no bike info
    return `Zlecenie #${this.order?.id || '?'}`;
  }

  get customerName(): string {
    return this.order.clientName || '';
  }

  get availableActions(): OrderAction[] {
    if (this.compact) return [];

    switch (this.order.status) {
      case 'PENDING_CONFIRMATION':
        return ['cancel', 'confirm'];
      case 'CONFIRMED':
      case 'WAITING_FOR_BIKE':
        return ['cancel', 'acceptBike'];
      case 'IN_PROGRESS':
        return ['readyForPickup'];
      case 'WAITING_FOR_PARTS':
        return ['backToProgress', 'readyForPickup'];
      case 'AWAITING_CLIENT_DECISION':
        return ['backToProgress', 'readyForPickup'];
      case 'READY_FOR_PICKUP':
        return ['completed'];
      default:
        return [];
    }
  }

  onClick(event: Event): void {
    event.stopPropagation();
    this.orderClick.emit(this.order);
  }

  onCancelClick(event: Event): void {
    event.stopPropagation();
    if (confirm(this.t('service_calendar.confirm.cancel_order'))) {
      this.cancelOrder.emit(this.order);
    }
  }

  onConfirmClick(event: Event): void {
    event.stopPropagation();
    if (confirm(this.t('service_calendar.confirm.confirm_order'))) {
      this.confirmOrder.emit(this.order);
    }
  }

  onAcceptBikeClick(event: Event): void {
    event.stopPropagation();
    // Otwiera modal przyjęcia roweru z danymi zlecenia (bez potwierdzenia)
    this.acceptBike.emit(this.order);
  }

  onReadyForPickupClick(event: Event): void {
    event.stopPropagation();
    if (confirm(this.t('service_calendar.confirm.ready_for_pickup'))) {
      this.markReadyForPickup.emit(this.order);
    }
  }

  onCompletedClick(event: Event): void {
    event.stopPropagation();
    if (confirm(this.t('service_calendar.confirm.completed'))) {
      this.markCompleted.emit(this.order);
    }
  }

  onBackToProgressClick(event: Event): void {
    event.stopPropagation();
    // Wznów nie wymaga potwierdzenia
    this.backToProgress.emit(this.order);
  }
}
