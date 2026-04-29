import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n.service';
import {
  CalendarOrder,
  CalendarOrderStatus,
  getStatusColor,
  getStatusI18nKey
} from '../../../../shared/models/service-calendar.models';

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

  @Output() orderClick = new EventEmitter<CalendarOrder>();
  @Output() acceptBike = new EventEmitter<CalendarOrder>();
  @Output() startProgress = new EventEmitter<CalendarOrder>();
  @Output() markReadyForPickup = new EventEmitter<CalendarOrder>();
  @Output() markCompleted = new EventEmitter<CalendarOrder>();
  @Output() backToProgress = new EventEmitter<CalendarOrder>();

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  get barStatusColor(): string {
    const s = this.order.status;
    if (s === 'CANCELLED' || s === 'REJECTED' || s === 'AWAITING_CLIENT_DATE_CONFIRMATION') {
      return 'var(--color-slate-400)';
    }
    if (s === 'PENDING_CONFIRMATION') {
      return 'var(--color-navy)';
    }
    if (s === 'WAITING_FOR_BIKE' || s === 'CONFIRMED') {
      return 'var(--color-info)';
    }
    if (s === 'IN_QUEUE') {
      return 'var(--color-teal-400, #4DD0E1)';
    }
    if (s === 'IN_PROGRESS' || s === 'READY_FOR_PICKUP') {
      return 'var(--color-accent)';
    }
    if (s === 'WAITING_FOR_PARTS') return 'var(--status-waiting-parts)';
    if (s === 'AWAITING_CLIENT_DECISION') return 'var(--status-awaiting-decision)';
    return getStatusColor(s);
  }

  get bikeBrand(): string {
    return (this.order?.bicycleBrand ?? '').toString().trim().toUpperCase();
  }

  get bikeModel(): string {
    return (this.order?.bicycleModel ?? '').toString().trim();
  }

  get bikeInfo(): string {
    const brand = this.bikeBrand;
    const model = this.bikeModel;
    if (brand && model) return `${brand} ${model}`;
    if (brand) return brand;
    if (model) return model;
    return `Zlecenie #${this.order?.id || '?'}`;
  }

  get customerName(): string {
    return this.order.clientName || '';
  }

  get showTime(): boolean {
    return !!(this.order.plannedTime && (this.order.status === 'WAITING_FOR_BIKE' || this.order.status === 'CONFIRMED'));
  }

  /** Przycisk w prawym dolnym rogu */
  get actionButton(): 'respond' | 'acceptBike' | 'startProgress' | 'readyForPickup' | 'markCompleted' | 'backToProgress' | null {
    const s = this.order.status;
    if (s === 'PENDING_CONFIRMATION') return 'respond';
    if (s === 'CONFIRMED' || s === 'WAITING_FOR_BIKE') return 'acceptBike';
    if (s === 'IN_QUEUE') return 'startProgress';
    if (s === 'IN_PROGRESS') return 'readyForPickup';
    if (s === 'READY_FOR_PICKUP') return 'markCompleted';
    if (s === 'WAITING_FOR_PARTS' || s === 'AWAITING_CLIENT_DECISION') return 'backToProgress';
    return null;
  }

  // Kolor przycisku = kolor statusu DOCELOWEGO
  get actionButtonColor(): string {
    const btn = this.actionButton;
    if (btn === 'respond') return 'var(--color-accent-orange)';
    if (btn === 'acceptBike') return 'var(--status-in-progress)';    // → IN_QUEUE
    if (btn === 'startProgress') return 'var(--color-primary)';      // → IN_PROGRESS
    if (btn === 'readyForPickup') return 'var(--status-ready)';      // → READY_FOR_PICKUP
    if (btn === 'markCompleted') return 'var(--status-completed)';   // → COMPLETED
    if (btn === 'backToProgress') return 'var(--status-confirmed)';  // → IN_PROGRESS (niebieski)
    return 'var(--status-in-progress)';
  }

  get actionButtonLabel(): string {
    const btn = this.actionButton;
    if (btn === 'respond') return 'ODPOWIEDZ';
    if (btn === 'acceptBike') return 'PRZYJMIJ';
    if (btn === 'startProgress') return 'ZACZNIJ';
    if (btn === 'readyForPickup') return 'GOTOWY';
    if (btn === 'markCompleted') return 'ODEBRANY';
    if (btn === 'backToProgress') return 'WZNÓW';
    return '';
  }

  onClick(event: Event): void {
    event.stopPropagation();
    this.orderClick.emit(this.order);
  }

  onActionClick(event: Event): void {
    event.stopPropagation();
    const btn = this.actionButton;
    if (btn === 'respond') this.orderClick.emit(this.order);
    else if (btn === 'acceptBike') this.acceptBike.emit(this.order);
    else if (btn === 'startProgress') this.startProgress.emit(this.order);
    else if (btn === 'readyForPickup') this.markReadyForPickup.emit(this.order);
    else if (btn === 'markCompleted') this.markCompleted.emit(this.order);
    else if (btn === 'backToProgress') this.backToProgress.emit(this.order);
  }
}
