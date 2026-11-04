import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarDayData,
  CalendarOrder,
  ORDER_STAGES,
  OrderStage,
  Technician,
  daysSince,
  getOrderStage
} from '../../../../shared/models/service-calendar.models';

type SortKey = 'stage' | 'bike' | 'client' | 'technician' | 'since' | 'price' | 'date';

export interface TechnicianChange {
  order: CalendarOrder;
  technicianId: number | null;
}

@Component({
  selector: 'app-calendar-day-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-day-view.component.html',
  styleUrls: ['./calendar-day-view.component.css']
})
export class CalendarDayViewComponent {
  private orders = signal<CalendarOrder[]>([]);

  @Input() set data(value: CalendarDayData) {
    this.orders.set(value?.orders ?? []);
  }
  @Input() technicians: Technician[] = [];
  /** Pigułki etapów nad tabelą; na telefonie filtrowanie jest w panelu paska mobilnego */
  @Input() showStageFilter = true;
  /** Nagłówki etapów nad kartami (wyłączane w panelu dnia pod siatką kalendarza) */
  @Input() showGroupTitles = true;
  /** Filtr etapu sterowany z zewnątrz (panel filtrów na telefonie) */
  @Input() set stage(value: OrderStage | null) {
    this.activeStage.set(value);
  }
  /** Lista z całego miesiąca: dodaje kolumnę z datą i sortuje po niej */
  @Input() set showDate(value: boolean) {
    this.dateColumn.set(value);
    this.sortKey.set(value ? 'date' : 'stage');
    this.sortAsc.set(true);
  }

  @Output() orderClick = new EventEmitter<CalendarOrder>();
  @Output() acceptBike = new EventEmitter<CalendarOrder>();
  @Output() startProgress = new EventEmitter<CalendarOrder>();
  @Output() markReadyForPickup = new EventEmitter<CalendarOrder>();
  @Output() markCompleted = new EventEmitter<CalendarOrder>();
  @Output() backToProgress = new EventEmitter<CalendarOrder>();
  @Output() technicianChange = new EventEmitter<TechnicianChange>();

  readonly dateColumn = signal(false);
  readonly stages = ORDER_STAGES;
  readonly activeStage = signal<OrderStage | null>(null);
  readonly sortKey = signal<SortKey>('stage');
  readonly sortAsc = signal(true);

  /** Zlecenia aktywne (z etapem) — zakończone/anulowane nie są listowane */
  private readonly activeOrders = computed(() => this.orders().filter(o => getOrderStage(o.status) !== null));

  readonly stageCounts = computed(() => {
    const counts = new Map<OrderStage, number>();
    for (const o of this.activeOrders()) {
      const stage = getOrderStage(o.status)!;
      counts.set(stage, (counts.get(stage) ?? 0) + 1);
    }
    return counts;
  });

  readonly totalCount = computed(() => this.activeOrders().length);

  readonly visibleOrders = computed(() => {
    const stage = this.activeStage();
    const list = this.activeOrders().filter(o => !stage || getOrderStage(o.status) === stage);
    const key = this.sortKey();
    const dir = this.sortAsc() ? 1 : -1;
    return [...list].sort((a, b) => dir * this.compare(a, b, key) || a.id - b.id);
  });

  readonly stageGroups = computed(() => {
    const orders = this.visibleOrders();
    return ORDER_STAGES
      .map(stage => ({ stage, orders: orders.filter(o => getOrderStage(o.status) === stage.id) }))
      .filter(g => g.orders.length > 0);
  });

  setStage(stage: OrderStage | null): void {
    this.activeStage.set(stage);
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return '⇅';
    return this.sortAsc() ? '▲' : '▼';
  }

  private compare(a: CalendarOrder, b: CalendarOrder, key: SortKey): number {
    switch (key) {
      case 'date': return (a.plannedDate ?? '').localeCompare(b.plannedDate ?? '') || this.stageIndex(a) - this.stageIndex(b);
      case 'stage': return this.stageIndex(a) - this.stageIndex(b);
      case 'bike': return this.bikeName(a).localeCompare(this.bikeName(b), 'pl');
      case 'client': return (a.clientName ?? '').localeCompare(b.clientName ?? '', 'pl');
      case 'technician': return (a.assignedTechnicianNickname ?? 'zzz').localeCompare(b.assignedTechnicianNickname ?? 'zzz', 'pl');
      case 'since': return (a.serviceStartDate ?? '').localeCompare(b.serviceStartDate ?? '');
      case 'price': return (a.estimatedPrice ?? -1) - (b.estimatedPrice ?? -1);
    }
  }

  private stageIndex(order: CalendarOrder): number {
    const stage = getOrderStage(order.status);
    return ORDER_STAGES.findIndex(s => s.id === stage);
  }

  private bikeName(order: CalendarOrder): string {
    return `${order.bicycleBrand ?? ''} ${order.bicycleModel ?? ''}`.trim();
  }

  // ===== Helpery szablonu =====

  stageOf(order: CalendarOrder) {
    return ORDER_STAGES[this.stageIndex(order)];
  }

  onHoldReason(order: CalendarOrder): string {
    if (order.status === 'WAITING_FOR_PARTS') return 'czeka na części';
    if (order.status === 'AWAITING_CLIENT_DECISION') return 'czeka na decyzję klienta';
    return '';
  }

  clientHasName(order: CalendarOrder): boolean {
    return !!order.clientName?.trim();
  }

  inServiceDays(order: CalendarOrder): number | null {
    return daysSince(order.serviceStartDate);
  }

  /** "27.10" lub "dziś" */
  sinceLabel(order: CalendarOrder): string {
    const days = this.inServiceDays(order);
    if (days === null) return '—';
    if (days === 0) return 'dziś';
    return order.serviceStartDate!.substring(8, 10) + '.' + order.serviceStartDate!.substring(5, 7);
  }

  daysLabel(order: CalendarOrder): string {
    const days = this.inServiceDays(order);
    if (days === null) return '';
    if (days === 0) return 'nowe';
    return days === 1 ? '1 dzień' : `${days} dni`;
  }

  isLongStay(order: CalendarOrder): boolean {
    return (this.inServiceDays(order) ?? 0) >= 60;
  }

  /** Tekst i klasa głównego przycisku akcji — zgodne z OrderBarComponent */
  action(order: CalendarOrder): { label: string; cls: string; run: () => void } | null {
    switch (order.status) {
      case 'PENDING_CONFIRMATION':
      case 'AWAITING_CLIENT_DATE_CONFIRMATION':
        return { label: 'Odpowiedz', cls: 'respond', run: () => this.orderClick.emit(order) };
      case 'CONFIRMED':
      case 'WAITING_FOR_BIKE':
        return { label: 'Przyjmij', cls: 'accept', run: () => this.acceptBike.emit(order) };
      case 'IN_QUEUE':
        return { label: 'Zacznij', cls: 'start', run: () => this.startProgress.emit(order) };
      case 'IN_PROGRESS':
        return { label: 'Gotowy', cls: 'ready', run: () => this.markReadyForPickup.emit(order) };
      case 'READY_FOR_PICKUP':
        return { label: '✓ Odebrany', cls: 'done', run: () => this.markCompleted.emit(order) };
      case 'WAITING_FOR_PARTS':
      case 'AWAITING_CLIENT_DECISION':
        return { label: 'Wznów', cls: 'resume', run: () => this.backToProgress.emit(order) };
      default:
        return null;
    }
  }

  runAction(event: Event, order: CalendarOrder): void {
    event.stopPropagation();
    this.action(order)?.run();
  }

  onTechnicianSelect(event: Event, order: CalendarOrder): void {
    event.stopPropagation();
    const value = (event.target as HTMLSelectElement).value;
    this.technicianChange.emit({ order, technicianId: value ? Number(value) : null });
  }

  stop(event: Event): void {
    event.stopPropagation();
  }

  trackById(_: number, order: CalendarOrder): number {
    return order.id;
  }
}
