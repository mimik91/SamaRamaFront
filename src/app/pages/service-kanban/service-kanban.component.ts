import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
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
  status: CalendarOrderStatus;
  label: string;
  color: string;
  bgColor: string;
  orders: CalendarOrder[];
}

const COLUMN_DEFS: Omit<KanbanColumn, 'orders'>[] = [
  { status: 'PENDING_CONFIRMATION', label: 'Nowe rezerwacje',      color: '#d97706', bgColor: '#fef3c7' },
  { status: 'WAITING_FOR_BIKE',     label: 'Oczekuje na rower',    color: '#2563eb', bgColor: '#eff6ff' },
  { status: 'IN_PROGRESS',          label: 'W trakcie naprawy',    color: '#ea580c', bgColor: '#fff7ed' },
  { status: 'WAITING_FOR_PARTS',    label: 'Oczekuje na części',   color: '#7c3aed', bgColor: '#f5f3ff' },
  { status: 'AWAITING_CLIENT_DECISION', label: 'Decyzja klienta', color: '#4f46e5', bgColor: '#eef2ff' },
  { status: 'READY_FOR_PICKUP',     label: 'Gotowe do odbioru',    color: '#16a34a', bgColor: '#f0fdf4' },
  { status: 'COMPLETED',            label: 'Zakończone',           color: '#64748b', bgColor: '#f8fafc' },
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

  // Bieżący tydzień – punkt startowy ładowania
  currentWeekStart: Date = getWeekStart(new Date());

  // Modal
  selectedOrder: CalendarOrder | null = null;
  showOrderDetails = false;
  showAcceptBike = false;
  preselectedOrderForAccept: CalendarOrder | null = null;

  // Top scrollbar sync
  @ViewChild('topScrollbar') topScrollbar!: ElementRef<HTMLDivElement>;
  @ViewChild('topScrollbarInner') topScrollbarInner!: ElementRef<HTMLDivElement>;
  @ViewChild('boardEl') boardEl!: ElementRef<HTMLDivElement>;
  private _syncing = false;

  onTopScroll(): void {
    if (this._syncing || !this.boardEl) return;
    this._syncing = true;
    this.boardEl.nativeElement.scrollLeft = this.topScrollbar.nativeElement.scrollLeft;
    this._syncing = false;
  }

  onBoardScroll(): void {
    if (this._syncing || !this.topScrollbar) return;
    this._syncing = true;
    this.topScrollbar.nativeElement.scrollLeft = this.boardEl.nativeElement.scrollLeft;
    this._syncing = false;
  }

  private updateScrollbarWidth(): void {
    setTimeout(() => {
      if (this.topScrollbarInner?.nativeElement && this.boardEl?.nativeElement) {
        this.topScrollbarInner.nativeElement.style.width =
          this.boardEl.nativeElement.scrollWidth + 'px';
      }
    }, 50);
  }

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

    // Ładujemy: poprzedni tydzień + bieżący + następny (3 równoległe wywołania)
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
      // CONFIRMED traktujemy jak WAITING_FOR_BIKE
      const status = order.status === 'CONFIRMED' ? 'WAITING_FOR_BIKE' : order.status;
      const col = cols.find(c => c.status === status);
      if (col) col.orders.push(order);
    }
    // Sortuj karty po dacie rosnąco
    for (const col of cols) {
      col.orders.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
    }
    this.columns = cols;
    this.updateScrollbarWidth();
  }

  // ===== Drag & Drop =====

  /** Lista ID wszystkich list – potrzebna żeby cdkDropList wiedział między jakimi listami można przenosić */
  get columnIds(): string[] {
    return this.columns.map(c => 'col-' + c.status);
  }

  onCardDrop(event: CdkDragDrop<CalendarOrder[]>, targetColumn: KanbanColumn): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    // Jeśli jest oczekujący ruch, zatwierdź go od razu przed nowym
    if (this.pendingMove) this.commitMove();

    const order: CalendarOrder = event.previousContainer.data[event.previousIndex];
    const newStatus = targetColumn.status;

    // Przesuń kartę w UI natychmiast
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    // Zapamiętaj ruch – daj 5s na cofnięcie
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

    this.calendarService.updateOrderStatus(this.selectedServiceId, move.order.id, move.newStatus).subscribe({
      next: () => { move.order.status = move.newStatus; },
      error: () => {
        // Cofnij w UI przy błędzie API
        transferArrayItem(move.toContainer, move.fromContainer, move.toIndex, move.fromIndex);
        this.notificationService.error('Nie udało się zmienić statusu zlecenia.');
      }
    });
  }

  undoMove(): void {
    if (!this.pendingMove) return;
    const move = this.pendingMove;
    clearTimeout(move.timer);
    this.pendingMove = null;
    // Przywróć kartę do poprzedniej kolumny
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
    this.calendarService.updateOrderStatus(this.selectedServiceId, order.id, status).subscribe({
      next: () => { this.loadKanbanData(); },
      error: () => this.notificationService.error('Nie udało się zmienić statusu.')
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

  // ===== Navigation helpers =====

  get waitingForBikeOrders(): CalendarOrder[] {
    return this.columns.find(c => c.status === 'WAITING_FOR_BIKE')?.orders ?? [];
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

  getColumnCount(col: KanbanColumn): number {
    return col.orders.length;
  }

  totalActiveOrders(): number {
    return this.columns
      .filter(c => c.status !== 'COMPLETED')
      .reduce((sum, c) => sum + c.orders.length, 0);
  }
}
