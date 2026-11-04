import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarOrder,
  EMPTY_ORDER_SEARCH_FILTER,
  ORDER_STAGES,
  OrderSearchFilter,
  OrderStage,
  Technician,
  UNASSIGNED_TECHNICIAN_FILTER,
  getOrderStage,
  hasActiveFilter
} from '../../../../shared/models/service-calendar.models';
import { OrderSearchComponent } from '../../../../shared/components/order-search/order-search.component';

export type OrdersView = 'list' | 'calendar' | 'statuses';

interface ActiveChip {
  key: 'stage' | 'technician' | 'search';
  label: string;
}

/**
 * Wspólny pasek mobilny dla Listy, Kalendarza i Statusów:
 * przełącznik widoków + ustawienia, nawigacja dat, zwijany panel filtrów i dolny pasek akcji.
 */
@Component({
  selector: 'app-orders-mobile-toolbar',
  standalone: true,
  imports: [CommonModule, OrderSearchComponent],
  templateUrl: './orders-mobile-toolbar.component.html',
  styleUrls: ['./orders-mobile-toolbar.component.css']
})
export class OrdersMobileToolbarComponent {
  @ViewChild(OrderSearchComponent) private search?: OrderSearchComponent;

  @Input() view: OrdersView = 'list';
  @Input() date: Date = new Date();
  @Input() bikesCount: number | null = null;
  @Input() maxBikesPerDay = 10;
  @Input() technicians: Technician[] = [];
  @Input() selectedTechnicianId: number | null = null;
  @Input() stage: OrderStage | null = null;
  /** Zlecenia, z których liczone są etapy w filtrze (po filtrach serwisanta i klienta) */
  @Input() stageOrders: CalendarOrder[] = [];
  @Input() allOrders: CalendarOrder[] = [];

  @Output() viewChange = new EventEmitter<OrdersView>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() today = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<OrderSearchFilter>();
  @Output() technicianChange = new EventEmitter<number | null>();
  @Output() stageChange = new EventEmitter<OrderStage | null>();
  @Output() reservationClick = new EventEmitter<void>();
  @Output() bikeClick = new EventEmitter<void>();

  readonly stages = ORDER_STAGES;
  readonly unassigned = UNASSIGNED_TECHNICIAN_FILTER;

  open = false;
  private searchFilter: OrderSearchFilter = { ...EMPTY_ORDER_SEARCH_FILTER };

  get showStageFilter(): boolean {
    return this.view !== 'statuses';
  }

  get placeholder(): string {
    return this.showStageFilter ? 'Szukaj, filtruj etap i serwisanta' : 'Szukaj klienta, filtruj serwisanta';
  }

  get isOverLimit(): boolean {
    return this.bikesCount !== null && this.bikesCount > this.maxBikesPerDay;
  }

  get progressPercent(): number {
    if (this.bikesCount === null || !this.maxBikesPerDay) return 0;
    return Math.min(100, (this.bikesCount / this.maxBikesPerDay) * 100);
  }

  get activeStageOrders(): CalendarOrder[] {
    return this.stageOrders.filter(o => getOrderStage(o.status) !== null);
  }

  stageCount(stage: OrderStage): number {
    return this.activeStageOrders.filter(o => getOrderStage(o.status) === stage).length;
  }

  get chips(): ActiveChip[] {
    const chips: ActiveChip[] = [];
    if (this.showStageFilter && this.stage) {
      chips.push({ key: 'stage', label: ORDER_STAGES.find(s => s.id === this.stage)?.label ?? '' });
    }
    if (this.selectedTechnicianId !== null) {
      const label = this.selectedTechnicianId === UNASSIGNED_TECHNICIAN_FILTER
        ? 'Bez serwisanta'
        : this.technicians.find(t => t.id === this.selectedTechnicianId)?.nickname ?? '';
      chips.push({ key: 'technician', label });
    }
    if (hasActiveFilter(this.searchFilter)) {
      chips.push({ key: 'search', label: 'Klient' });
    }
    return chips;
  }

  setView(view: OrdersView): void {
    if (view !== this.view) this.viewChange.emit(view);
  }

  onStage(value: string): void {
    this.stageChange.emit(value === '' ? null : (value as OrderStage));
  }

  onTechnician(value: string): void {
    this.technicianChange.emit(value === '' ? null : Number(value));
  }

  onSearch(filter: OrderSearchFilter): void {
    this.searchFilter = filter;
    this.searchChange.emit(filter);
  }

  removeChip(chip: ActiveChip): void {
    if (chip.key === 'stage') this.stageChange.emit(null);
    if (chip.key === 'technician') this.technicianChange.emit(null);
    if (chip.key === 'search') this.search?.reset();
  }

  clearAll(): void {
    this.stageChange.emit(null);
    this.technicianChange.emit(null);
    this.search?.reset();
  }
}
