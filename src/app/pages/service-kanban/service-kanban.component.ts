import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { ServiceCalendarService } from '../service-calendar/services/service-calendar.service';
import { NotificationService } from '../../core/notification.service';
import { OrderDetailsModalComponent } from '../service-calendar/modals/order-details-modal/order-details-modal.component';
import { AcceptBikeModalComponent } from '../service-calendar/modals/accept-bike-modal/accept-bike-modal.component';
import { BikeServiceNameIdDto } from '../../shared/models/bike-service-common.models';
import {
  CalendarOrder,
  CalendarOrderStatus,
  Technician,
  getWeekStart,
  formatCalendarDate
} from '../../shared/models/service-calendar.models';

interface KanbanColumn {
  id: string;
  statuses: CalendarOrderStatus[];
  dropStatus: CalendarOrderStatus;
  label: string;
  color: string;
  bgColor: string;
  orders: CalendarOrder[];
}

const STATUS_COLORS: Record<string, { color: string; bgColor: string }> = {
  PENDING_CONFIRMATION:     { color: '#d97706', bgColor: '#fef3c7' },
  CONFIRMED:                { color: '#2563eb', bgColor: '#eff6ff' },
  WAITING_FOR_BIKE:         { color: '#2563eb', bgColor: '#eff6ff' },
  IN_PROGRESS:              { color: '#ea580c', bgColor: '#fff7ed' },
  WAITING_FOR_PARTS:        { color: '#7c3aed', bgColor: '#f5f3ff' },
  AWAITING_CLIENT_DECISION: { color: '#4f46e5', bgColor: '#eef2ff' },
  READY_FOR_PICKUP:         { color: '#16a34a', bgColor: '#f0fdf4' },
  COMPLETED:                { color: '#64748b', bgColor: '#f8fafc' },
  REJECTED:                 { color: '#dc2626', bgColor: '#fef2f2' },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION:     'Nowa rezerwacja',
  CONFIRMED:                'Potwierdzona',
  WAITING_FOR_BIKE:         'Oczekuje na rower',
  IN_PROGRESS:              'W trakcie naprawy',
  WAITING_FOR_PARTS:        'Oczekuje na części',
  AWAITING_CLIENT_DECISION: 'Decyzja klienta',
  READY_FOR_PICKUP:         'Gotowe do odbioru',
  COMPLETED:                'Zakończone',
  REJECTED:                 'Odrzucone',
};

const COLUMN_DEFS: Omit<KanbanColumn, 'orders'>[] = [
  {
    id: 'reservations',
    statuses: ['PENDING_CONFIRMATION', 'WAITING_FOR_BIKE'],
    dropStatus: 'PENDING_CONFIRMATION',
    label: 'Rezerwacje',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  {
    id: 'in_progress',
    statuses: ['IN_PROGRESS'],
    dropStatus: 'IN_PROGRESS',
    label: 'W trakcie naprawy',
    color: '#ea580c',
    bgColor: '#fff7ed',
  },
  {
    id: 'paused',
    statuses: ['WAITING_FOR_PARTS', 'AWAITING_CLIENT_DECISION'],
    dropStatus: 'WAITING_FOR_PARTS',
    label: 'Wstrzymana naprawa',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
  },
  {
    id: 'done',
    statuses: ['READY_FOR_PICKUP', 'COMPLETED'],
    dropStatus: 'READY_FOR_PICKUP',
    label: 'Zakończone / Do odbioru',
    color: '#16a34a',
    bgColor: '#f0fdf4',
  },
];

@Component({
  selector: 'app-service-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule, OrderDetailsModalComponent, AcceptBikeModalComponent],
  templateUrl: './service-kanban.component.html',
  styleUrls: ['./service-kanban.component.css']
})
export class ServiceKanbanComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(BikeServiceVerificationService);
  private calendarService = inject(ServiceCalendarService);
  private notificationService = inject(NotificationService);

  currentSuffix = '';
  myServices: BikeServiceNameIdDto[] = [];
  selectedServiceId: number | null = null;

  loading = false;
  columns: KanbanColumn[] = COLUMN_DEFS.map(d => ({ ...d, orders: [] }));
  technicians: Technician[] = [];

  currentWeekStart: Date = getWeekStart(new Date());

  // Modal
  selectedOrder: CalendarOrder | null = null;
  showOrderDetails = false;
  showAcceptBike = false;
  preselectedOrderForAccept: CalendarOrder | null = null;

  private updateScrollbarWidth(): void {}

  // Undo move
  pendingMove: {
    order: CalendarOrder;
    fromContainer: CalendarOrder[];
    fromIndex: number;
    toContainer: CalendarOrder[];
    toIndex: number;
    targetLabel: string;
    newStatus: CalendarOrderStatus;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  ngOnInit(): void {
    this.currentSuffix = this.route.snapshot.paramMap.get('suffix') || '';
    this.loadServices();
  }

  private loadServices(): void {
    this.verificationService.getMyServices().subscribe({
      next: (services) => {
        this.myServices = services;
        if (services.length === 1) {
          this.onServiceChange(services[0].id);
        }
      },
      error: () => this.notificationService.error('Nie udało się załadować listy serwisów.')
    });
  }

  onServiceChange(serviceId: number): void {
    this.selectedServiceId = serviceId;
    this.loadTechnicians(serviceId);
    this.loadKanbanData();
  }

  private loadTechnicians(serviceId: number): void {
    this.calendarService.getTechnicians(serviceId).subscribe({
      next: (t) => { this.technicians = t.filter(x => x.isActive); },
      error: () => {}
    });
  }

  loadKanbanData(): void {
    if (!this.selectedServiceId) return;
    this.loading = true;
    const sid = this.selectedServiceId;

    const prevStart = new Date(this.currentWeekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const nextStart = new Date(this.currentWeekStart);
    nextStart.setDate(nextStart.getDate() + 7);

    forkJoin([
      this.calendarService.getWeekView(sid, formatCalendarDate(prevStart)),
      this.calendarService.getWeekView(sid, formatCalendarDate(this.currentWeekStart)),
      this.calendarService.getWeekView(sid, formatCalendarDate(nextStart)),
    ]).subscribe({
      next: ([prev, curr, next]) => {
        const allOrders = this.mergeWeekOrders([prev, curr, next]);
        this.fillColumns(allOrders);
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować zleceń.');
        this.loading = false;
      }
    });
  }

  private mergeWeekOrders(weeks: any[]): CalendarOrder[] {
    const seen = new Set<number>();
    const result: CalendarOrder[] = [];
    for (const week of weeks) {
      const byDay = week.ordersByDay as Record<string, CalendarOrder[]>;
      for (const orders of Object.values(byDay)) {
        for (const order of orders) {
          if (!seen.has(order.id)) {
            seen.add(order.id);
            result.push(order);
          }
        }
      }
    }
    return result;
  }

  private fillColumns(orders: CalendarOrder[]): void {
    const cols = COLUMN_DEFS.map(d => ({ ...d, orders: [] as CalendarOrder[] }));
    for (const order of orders) {
      const status: CalendarOrderStatus = order.status === 'CONFIRMED' ? 'WAITING_FOR_BIKE' : order.status;
      const col = cols.find(c => (c.statuses as string[]).includes(status));
      if (col) col.orders.push(order);
    }
    for (const col of cols) {
      col.orders.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
    }
    this.columns = cols;
    this.updateScrollbarWidth();
  }

  // ===== Drag & Drop =====

  get columnIds(): string[] {
    return this.columns.map(c => 'col-' + c.id);
  }

  onCardDrop(event: CdkDragDrop<CalendarOrder[]>, targetColumn: KanbanColumn): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    if (this.pendingMove) this.commitMove();

    const order: CalendarOrder = event.previousContainer.data[event.previousIndex];
    const newStatus = targetColumn.dropStatus;

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    const timer = setTimeout(() => this.commitMove(), 6000);
    this.pendingMove = {
      order,
      fromContainer: event.previousContainer.data,
      fromIndex: event.previousIndex,
      toContainer: event.container.data,
      toIndex: event.currentIndex,
      targetLabel: targetColumn.label,
      newStatus,
      timer,
    };
  }

  commitMove(): void {
    if (!this.pendingMove || !this.selectedServiceId) { this.pendingMove = null; return; }
    const move = this.pendingMove;
    this.pendingMove = null;
    clearTimeout(move.timer);

    if (move.newStatus === 'READY_FOR_PICKUP' && !move.order.bicycleType?.trim()) {
      transferArrayItem(move.toContainer, move.fromContainer, move.toIndex, move.fromIndex);
      this.notificationService.error('Nie można ustawić statusu "Gotowe do odbioru" — rower nie ma przypisanego typu roweru.');
      return;
    }

    this.calendarService.updateOrderStatus(this.selectedServiceId, move.order.id, move.newStatus).subscribe({
      next: () => { move.order.status = move.newStatus; },
      error: (err: any) => {
        transferArrayItem(move.toContainer, move.fromContainer, move.toIndex, move.fromIndex);
        const msg = err?.error?.message ?? 'Nie udało się zmienić statusu zlecenia.';
        this.notificationService.error(msg);
      }
    });
  }

  undoMove(): void {
    if (!this.pendingMove) return;
    const move = this.pendingMove;
    clearTimeout(move.timer);
    this.pendingMove = null;
    transferArrayItem(move.toContainer, move.fromContainer, move.toIndex, move.fromIndex);
  }

  ngOnDestroy(): void {
    if (this.pendingMove) this.commitMove();
  }

  // ===== Quick actions =====

  onQuickConfirm(order: CalendarOrder, event: Event): void {
    event.stopPropagation();
    if (!this.selectedServiceId) return;
    const sid = this.selectedServiceId;
    this.calendarService.updateOrderStatus(sid, order.id, 'CONFIRMED').subscribe({
      next: () => {
        this.calendarService.updateOrderStatus(sid, order.id, 'WAITING_FOR_BIKE').subscribe({
          next: () => { this.notificationService.success('Rezerwacja potwierdzona.'); this.loadKanbanData(); },
          error: () => this.notificationService.error('Błąd podczas potwierdzania.')
        });
      },
      error: () => this.notificationService.error('Błąd podczas potwierdzania.')
    });
  }

  onQuickAcceptBike(order: CalendarOrder, event: Event): void {
    event.stopPropagation();
    this.preselectedOrderForAccept = order;
    this.showAcceptBike = true;
  }

  onQuickStatusChange(order: CalendarOrder, status: CalendarOrderStatus, event: Event): void {
    event.stopPropagation();
    if (!this.selectedServiceId) return;
    if (status === 'READY_FOR_PICKUP' && !order.bicycleType?.trim()) {
      this.notificationService.error('Nie można ustawić statusu "Gotowe do odbioru" — rower nie ma przypisanego typu roweru.');
      return;
    }
    this.calendarService.updateOrderStatus(this.selectedServiceId, order.id, status).subscribe({
      next: () => { this.loadKanbanData(); },
      error: (err: any) => this.notificationService.error(err?.error?.message ?? 'Nie udało się zmienić statusu.')
    });
  }

  // ===== Card click → OrderDetailsModal =====

  openOrderDetails(order: CalendarOrder): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  onOrderDetailsClose(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
    this.loadKanbanData();
  }

  onOrderUpdated(): void {
    this.loadKanbanData();
  }

  onAcceptBikeFromDetails(order: CalendarOrder): void {
    this.showOrderDetails = false;
    this.preselectedOrderForAccept = order;
    this.showAcceptBike = true;
  }

  onAcceptBikeClose(): void {
    this.showAcceptBike = false;
    this.preselectedOrderForAccept = null;
    this.loadKanbanData();
  }

  // ===== Status helpers =====

  getStatusInfo(status: CalendarOrderStatus): { color: string; bgColor: string } {
    return STATUS_COLORS[status] ?? { color: '#94a3b8', bgColor: '#f8fafc' };
  }

  getStatusLabel(status: CalendarOrderStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  // ===== Navigation helpers =====

  get waitingForBikeOrders(): CalendarOrder[] {
    return this.columns.flatMap(c =>
      c.orders.filter(o => o.status === 'WAITING_FOR_BIKE' || o.status === 'CONFIRMED')
    );
  }

  goToCalendar(): void {
    const encodedSuffix = encodeURIComponent(this.currentSuffix);
    this.router.navigateByUrl(`/${encodedSuffix}/panel-administratora`);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', weekday: 'short' });
  }

  getTechnicianName(technicianId?: number | null): string {
    if (!technicianId) return '';
    return this.technicians.find(t => t.id === technicianId)?.nickname ?? '';
  }

  totalActiveOrders(): number {
    return this.columns.reduce((sum, c) =>
      sum + c.orders.filter(o => o.status !== 'COMPLETED').length, 0
    );
  }
}
