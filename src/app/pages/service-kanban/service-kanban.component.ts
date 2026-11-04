import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { ServiceCalendarService } from '../service-calendar/services/service-calendar.service';
import { NotificationService } from '../../core/notification.service';
import { OrderDetailsModalComponent } from '../service-calendar/modals/order-details-modal/order-details-modal.component';
import { AcceptBikeModalComponent } from '../service-calendar/modals/accept-bike-modal/accept-bike-modal.component';
import { MarkReadyModalComponent } from '../service-calendar/modals/mark-ready-modal/mark-ready-modal.component';
import { CreateOrderModalComponent } from '../service-calendar/modals/create-order-modal/create-order-modal.component';
import { BikeServiceNameIdDto } from '../../shared/models/bike-service-common.models';
import {
  CalendarOrder,
  CalendarOrderStatus,
  Technician,
  getWeekStart,
  formatCalendarDate,
  getOrderClientKey,
  daysSince,
  OrderSearchFilter,
  EMPTY_ORDER_SEARCH_FILTER,
  matchesOrderFilter,
  hasActiveFilter,
  matchesTechnicianFilter
} from '../../shared/models/service-calendar.models';
import { CalendarHeaderComponent } from '../service-calendar/components/calendar-header/calendar-header.component';
import { OrdersMobileToolbarComponent, OrdersView } from '../service-calendar/components/orders-mobile-toolbar/orders-mobile-toolbar.component';
import { OrderSearchComponent } from '../../shared/components/order-search/order-search.component';

interface KanbanSection {
  label: string;
  colorVar: string;
  statuses: CalendarOrderStatus[];
}

interface KanbanColumnDef {
  id: string;
  label: string;
  mobileLabel: string;
  colorVar: string;
  statuses: CalendarOrderStatus[];
  /** Status ustawiany po upuszczeniu karty w kolumnie (brak = upuszczanie niedozwolone) */
  dropStatus?: CalendarOrderStatus;
  /** Sekcje z nagłówkiem wewnątrz kolumny — gdy brak, kolumna jest płaska */
  sections?: KanbanSection[];
}

interface KanbanColumn extends KanbanColumnDef {
  orders: CalendarOrder[];
  /** Są zlecenia wymagające reakcji (nowe rezerwacje, nieprzeczytane wiadomości) */
  needsAttention: boolean;
}

interface CardAction {
  label: string;
  cls: 'respond' | 'accept' | 'start' | 'ready' | 'resume' | 'done';
  status: CalendarOrderStatus | null;
}

const COLUMN_DEFS: KanbanColumnDef[] = [
  {
    id: 'reservations',
    label: 'Rezerwacje',
    mobileLabel: 'Rezerwacje',
    colorVar: '--color-accent-orange',
    statuses: ['PENDING_CONFIRMATION', 'AWAITING_CLIENT_DATE_CONFIRMATION', 'CONFIRMED', 'WAITING_FOR_BIKE'],
    sections: [
      { label: 'Do odpowiedzi', colorVar: '--color-accent-orange', statuses: ['PENDING_CONFIRMATION', 'AWAITING_CLIENT_DATE_CONFIRMATION'] },
      { label: 'Potwierdzone · czekają na rower', colorVar: '--status-waiting-bike', statuses: ['CONFIRMED', 'WAITING_FOR_BIKE'] }
    ]
  },
  {
    id: 'queue',
    label: 'W kolejce',
    mobileLabel: 'W kolejce',
    colorVar: '--color-teal-400',
    statuses: ['IN_QUEUE', 'WAITING_FOR_PARTS', 'AWAITING_CLIENT_DECISION'],
    dropStatus: 'IN_QUEUE'
  },
  {
    id: 'in_progress',
    label: 'W trakcie',
    mobileLabel: 'W trakcie',
    colorVar: '--color-success',
    statuses: ['IN_PROGRESS'],
    dropStatus: 'IN_PROGRESS'
  },
  {
    id: 'ready',
    label: 'Gotowe do odbioru',
    mobileLabel: 'Do odbioru',
    colorVar: '--color-primary',
    statuses: ['READY_FOR_PICKUP'],
    dropStatus: 'READY_FOR_PICKUP'
  }
];

const RESERVATION_STATUSES: CalendarOrderStatus[] =
  ['PENDING_CONFIRMATION', 'AWAITING_CLIENT_DATE_CONFIRMATION', 'CONFIRMED', 'WAITING_FOR_BIKE'];

@Component({
  selector: 'app-service-kanban',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    OrderDetailsModalComponent,
    AcceptBikeModalComponent,
    MarkReadyModalComponent,
    CreateOrderModalComponent,
    OrderSearchComponent,
    CalendarHeaderComponent,
    OrdersMobileToolbarComponent
  ],
  templateUrl: './service-kanban.component.html',
  styleUrls: ['./service-kanban.component.css']
})
export class ServiceKanbanComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(BikeServiceVerificationService);
  private calendarService = inject(ServiceCalendarService);
  private notificationService = inject(NotificationService);

  /** Telefon: wspólny pasek mobilny zamiast górnego paska i nagłówka */
  isMobile = false;
  private readonly resizeHandler = (): void => { this.isMobile = window.innerWidth < 768; };

  currentSuffix = '';
  myServices: BikeServiceNameIdDto[] = [];
  selectedServiceId: number | null = null;

  loading = false;
  columns: KanbanColumn[] = COLUMN_DEFS.map(d => ({ ...d, orders: [], needsAttention: false }));
  allOrders: CalendarOrder[] = [];
  technicians: Technician[] = [];
  hasAnyTechnician = false;
  maxBikesPerDay: number | null = null;
  searchFilter: OrderSearchFilter = { ...EMPTY_ORDER_SEARCH_FILTER };

  currentWeekStart: Date = getWeekStart(new Date());

  // Mobile: jedna kolumna na raz, przełączana zakładkami
  activeMobileColumnId: string = COLUMN_DEFS[0].id;

  // Modale
  selectedOrder: CalendarOrder | null = null;
  showOrderDetails = false;
  showAcceptBike = false;
  preselectedOrderForAccept: CalendarOrder | null = null;
  showCreateOrder = false;

  showMarkReadyModal = false;
  markReadyOrder: CalendarOrder | null = null;
  markReadySiblings: CalendarOrder[] = [];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 768;
      window.addEventListener('resize', this.resizeHandler);
    }
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
    this.loadLimit(serviceId);
    this.loadKanbanData();
  }

  private loadTechnicians(serviceId: number): void {
    this.calendarService.getTechnicians(serviceId).subscribe({
      next: (t) => {
        this.technicians = t.filter(x => x.isActive);
        this.hasAnyTechnician = t.length > 0;
      },
      error: () => {}
    });
  }

  private loadLimit(serviceId: number): void {
    this.calendarService.getConfig(serviceId).subscribe({
      next: (config) => this.maxBikesPerDay = config.maxBikesPerDay,
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
        this.fillColumns(this.mergeWeekOrders([prev, curr, next]));
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
      const byDay = week.ordersByDay as Record<string, any[]>;
      for (const orders of Object.values(byDay)) {
        for (const raw of orders) {
          if (!seen.has(raw.id)) {
            seen.add(raw.id);
            // Backend może zwracać bicycle jako zagnieżdżony obiekt lub płaskie pola
            if (raw.bicycle && typeof raw.bicycle === 'object') {
              raw.bicycleType = raw.bicycleType || raw.bicycle.type;
              raw.bicycleBrand = raw.bicycleBrand || raw.bicycle.brand;
              raw.bicycleModel = raw.bicycleModel || raw.bicycle.model;
              raw.bicycleFrameNumber = raw.bicycleFrameNumber || raw.bicycle.frameNumber;
              raw.bicycleFrameMaterial = raw.bicycleFrameMaterial || raw.bicycle.frameMaterial;
              raw.bicycleId = raw.bicycleId || raw.bicycle.id;
            }
            result.push(raw as CalendarOrder);
          }
        }
      }
    }
    return result;
  }

  private fillColumns(orders: CalendarOrder[]): void {
    const cols: KanbanColumn[] = COLUMN_DEFS.map(d => ({ ...d, orders: [], needsAttention: false }));
    for (const order of orders) {
      const col = cols.find(c => c.statuses.includes(order.status));
      if (col) col.orders.push(order);
    }
    for (const col of cols) {
      col.orders.sort((a, b) => (a.plannedDate ?? '').localeCompare(b.plannedDate ?? '') || a.id - b.id);
      col.needsAttention = col.orders.some(o =>
        o.status === 'PENDING_CONFIRMATION' || (o.unreadMessageCount ?? 0) > 0);
    }
    this.columns = cols;
    this.allOrders = cols.flatMap(c => c.orders);
  }

  get filteredColumns(): KanbanColumn[] {
    if (!hasActiveFilter(this.searchFilter) && this.selectedTechnicianId === null) return this.columns;
    const f = this.searchFilter;
    const techId = this.selectedTechnicianId;
    return this.columns.map(col => ({
      ...col,
      orders: col.orders.filter(o => matchesOrderFilter(o, f) && matchesTechnicianFilter(o, techId))
    }));
  }

  sectionOrders(col: KanbanColumn, section: KanbanSection): CalendarOrder[] {
    return col.orders.filter(o => section.statuses.includes(o.status));
  }

  selectedTechnicianId: number | null = null;

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('resize', this.resizeHandler);
  }

  onTechnicianFilterChange(id: number | null): void {
    this.selectedTechnicianId = id;
  }

  onSearchFilterChange(filter: OrderSearchFilter): void {
    this.searchFilter = filter;
  }

  selectMobileColumn(columnId: string): void {
    this.activeMobileColumnId = columnId;
  }

  // ===== Akcje na kartach =====

  action(order: CalendarOrder): CardAction | null {
    switch (order.status) {
      case 'PENDING_CONFIRMATION':
      case 'AWAITING_CLIENT_DATE_CONFIRMATION':
        return { label: 'Odpowiedz', cls: 'respond', status: null };
      case 'CONFIRMED':
      case 'WAITING_FOR_BIKE':
        return { label: 'Przyjmij rower', cls: 'accept', status: null };
      case 'IN_QUEUE':
        return { label: 'Zacznij', cls: 'start', status: 'IN_PROGRESS' };
      case 'IN_PROGRESS':
        return { label: 'Gotowy', cls: 'ready', status: 'READY_FOR_PICKUP' };
      case 'WAITING_FOR_PARTS':
      case 'AWAITING_CLIENT_DECISION':
        return { label: 'Wznów', cls: 'resume', status: 'IN_PROGRESS' };
      case 'READY_FOR_PICKUP':
        return { label: '✓ Odebrany', cls: 'done', status: 'COMPLETED' };
      default:
        return null;
    }
  }

  // ===== Drag & Drop =====

  /** Na telefonie przeciąganie jest wyłączone — zmiany statusu idą przyciskami na kartach */
  get isMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  /** Rezerwacje przyjmuje się przyciskiem „Przyjmij rower", nie przeciąganiem */
  canDrag(order: CalendarOrder): boolean {
    return !RESERVATION_STATUSES.includes(order.status);
  }

  canDropIn(col: KanbanColumn): () => boolean {
    return () => !!col.dropStatus;
  }

  onCardDrop(event: CdkDragDrop<string>, targetColumn: KanbanColumn): void {
    if (event.previousContainer === event.container || !targetColumn.dropStatus) return;
    const order: CalendarOrder = event.item.data;
    if (targetColumn.statuses.includes(order.status)) return;
    this.changeStatus(order, targetColumn.dropStatus);
  }

  runAction(order: CalendarOrder, event: Event): void {
    event.stopPropagation();
    const a = this.action(order);
    if (!a) return;
    if (a.cls === 'respond') {
      this.openOrderDetails(order);
    } else if (a.cls === 'accept') {
      this.preselectedOrderForAccept = order;
      this.showAcceptBike = true;
    } else if (a.status) {
      this.changeStatus(order, a.status);
    }
  }

  private changeStatus(order: CalendarOrder, status: CalendarOrderStatus): void {
    if (!this.selectedServiceId) return;
    if (status === 'READY_FOR_PICKUP') {
      this.markReadyOrder = order;
      this.markReadySiblings = this.findEligibleSiblings(order);
      this.showMarkReadyModal = true;
      return;
    }
    this.calendarService.updateOrderStatus(this.selectedServiceId, order.id, status).subscribe({
      next: () => this.loadKanbanData(),
      error: (err: any) => this.notificationService.error(err?.error?.message ?? 'Nie udało się zmienić statusu.')
    });
  }

  onMarkReadyClose(): void {
    this.showMarkReadyModal = false;
    this.markReadyOrder = null;
    this.markReadySiblings = [];
  }

  onMarkReadyCompleted(_processedIds: number[]): void {
    this.onMarkReadyClose();
    this.loadKanbanData();
  }

  private findEligibleSiblings(order: CalendarOrder): CalendarOrder[] {
    const key = getOrderClientKey(order);
    const eligible: CalendarOrderStatus[] = ['IN_PROGRESS', 'WAITING_FOR_PARTS', 'AWAITING_CLIENT_DECISION'];
    return this.allOrders.filter(o =>
      o.id !== order.id && getOrderClientKey(o) === key && eligible.includes(o.status)
    );
  }

  // ===== Modale =====

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

  onAcceptBikeClick(): void {
    this.preselectedOrderForAccept = null;
    this.showAcceptBike = true;
  }

  onAcceptBikeClose(): void {
    this.showAcceptBike = false;
    this.preselectedOrderForAccept = null;
    this.loadKanbanData();
  }

  onAcceptReservationClick(): void {
    this.showCreateOrder = true;
  }

  onCreateOrderClose(): void {
    this.showCreateOrder = false;
  }

  onOrderCreated(): void {
    this.showCreateOrder = false;
    this.loadKanbanData();
  }

  get waitingForBikeOrders(): CalendarOrder[] {
    return this.allOrders.filter(o => o.status === 'WAITING_FOR_BIKE' || o.status === 'CONFIRMED');
  }

  // ===== Nawigacja =====

  goToCalendar(): void {
    this.router.navigateByUrl(`/${encodeURIComponent(this.currentSuffix)}/panel-administratora`);
  }

  onMobileViewChange(view: OrdersView): void {
    if (view !== 'statuses') this.goToCalendarView(view);
  }

  onViewChange(view: 'day' | 'week' | 'month'): void {
    this.goToCalendarView(view === 'day' ? 'list' : 'calendar');
  }

  goToCalendarView(view: 'list' | 'calendar'): void {
    this.router.navigate([`/${encodeURIComponent(this.currentSuffix)}/panel-administratora`], { queryParams: { view } });
  }

  goToCalendarSettings(): void {
    this.router.navigate([`/${this.currentSuffix}/panel-administratora/profil`], { queryParams: { tab: 'reservations' } });
  }

  // ===== Helpery szablonu =====

  /** "wt., 3.11" */
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr.substring(0, 10) + 'T00:00:00');
    const weekday = d.toLocaleDateString('pl-PL', { weekday: 'short' });
    return `${weekday}, ${d.getDate()}.${d.getMonth() + 1}`;
  }

  /** "27.10" */
  formatShort(dateStr: string | undefined | null): string {
    if (!dateStr) return '';
    return `${dateStr.substring(8, 10)}.${dateStr.substring(5, 7)}`;
  }

  /** Rezerwacje: dzień wizyty; zlecenia w serwisie: data przyjęcia */
  cardDate(order: CalendarOrder): string {
    if (RESERVATION_STATUSES.includes(order.status)) return this.formatDate(order.plannedDate);
    return this.formatShort(order.serviceStartDate ?? order.plannedDate);
  }

  holdReason(order: CalendarOrder): string {
    if (order.status === 'WAITING_FOR_PARTS') return 'czeka na części';
    if (order.status === 'AWAITING_CLIENT_DECISION') return 'czeka na decyzję klienta';
    return '';
  }

  longStayDays(order: CalendarOrder): number | null {
    const days = daysSince(order.serviceStartDate);
    return days !== null && days >= 30 ? days : null;
  }

  hasName(order: CalendarOrder): boolean {
    return !!order.clientName?.trim();
  }

  totalActiveOrders(): number {
    return this.columns.reduce((sum, c) => sum + c.orders.length, 0);
  }

  trackById(_: number, order: CalendarOrder): number {
    return order.id;
  }
}
