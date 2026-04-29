import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../core/i18n.service';
import { NotificationService } from '../../core/notification.service';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { AuthService } from '../../auth/auth.service';
import { ServiceCalendarService } from './services/service-calendar.service';
import { CalendarHeaderComponent } from './components/calendar-header/calendar-header.component';
import { CalendarDayViewComponent } from './components/calendar-day-view/calendar-day-view.component';
import { CalendarWeekViewComponent } from './components/calendar-week-view/calendar-week-view.component';
import { CreateOrderModalComponent } from './modals/create-order-modal/create-order-modal.component';
import { OrderDetailsModalComponent } from './modals/order-details-modal/order-details-modal.component';
import { AcceptBikeModalComponent } from './modals/accept-bike-modal/accept-bike-modal.component';
import { CalendarSettingsModalComponent } from './modals/calendar-settings-modal/calendar-settings-modal.component';
import { MarkReadyModalComponent } from './modals/mark-ready-modal/mark-ready-modal.component';
import {
  BikeServiceNameIdDto,
} from '../../shared/models/bike-service-common.models';
import {
  CalendarViewMode,
  CalendarMode,
  CalendarConfig,
  CalendarDayData,
  CalendarWeekData,
  CalendarOrder,
  CalendarOrderStatus,
  Technician,
  CalendarLoadingState,
  DEFAULT_CALENDAR_LOADING_STATE,
  formatCalendarDate,
  getWeekStart,
  sortOrdersByStatus,
  countBikesForLimit,
  getOrderClientKey
} from '../../shared/models/service-calendar.models';

@Component({
  selector: 'app-service-calendar',
  standalone: true,
  imports: [
    CommonModule,
    CalendarHeaderComponent,
    CalendarDayViewComponent,
    CalendarWeekViewComponent,
    CreateOrderModalComponent,
    OrderDetailsModalComponent,
    AcceptBikeModalComponent,
    CalendarSettingsModalComponent,
    MarkReadyModalComponent
  ],
  templateUrl: './service-calendar.component.html',
  styleUrls: ['./service-calendar.component.css']
})
export class ServiceCalendarComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(BikeServiceVerificationService);
  private authService = inject(AuthService);
  private calendarService = inject(ServiceCalendarService);
  private i18nService = inject(I18nService);
  private notificationService = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);

  // Suffix z URL
  private currentSuffix: string = '';

  // Serwisy uzytkownika
  myServices: BikeServiceNameIdDto[] = [];
  selectedServiceId: number | null = null;
  reservationAvailable: boolean = false;
  transportAvailable: boolean = false;

  // Konfiguracja kalendarza
  calendarConfig: CalendarConfig | null = null;

  // Aktualny widok
  currentView: CalendarViewMode = isPlatformBrowser(this.platformId) && window.innerWidth < 768 ? 'day' : 'week';
  calendarMode: CalendarMode = 'SIMPLE';

  // Wybrana data
  selectedDate: Date = new Date();

  // Dane kalendarza
  dayData: CalendarDayData | null = null;
  weekData: CalendarWeekData | null = null;

  // Mobile infinite scroll
  isMobile = false;
  mobileDays: CalendarDayData[] = [];
  private mobileEarliestWeekStart: Date | null = null;
  private mobileLatestWeekStart: Date | null = null;
  private loadingMobilePrev = false;
  private loadingMobileNext = false;
  private readonly resizeHandler = (): void => { this.isMobile = window.innerWidth < 768; };

  // Serwisanci
  technicians: Technician[] = [];

  // Stan ladowania
  loadingState: CalendarLoadingState = { ...DEFAULT_CALENDAR_LOADING_STATE };
  servicesError: string = '';

  // Modale
  showCreateOrderModal = false;
  showOrderDetailsModal = false;
  showAcceptBikeModal = false;
  showSettingsModal = false;
  showMarkReadyModal = false;
  selectedOrder: CalendarOrder | null = null;
  preselectedDate: string | null = null;
  createOrderMode: 'reservation' | 'acceptBike' = 'reservation';
  preselectedOrderForAccept: CalendarOrder | null = null;
  markReadyOrder: CalendarOrder | null = null;
  markReadySiblings: CalendarOrder[] = [];

  // Gettery dla szablonu
  get isLoadingServices(): boolean {
    return this.loadingState.isLoadingConfig;
  }

  get isLoadingData(): boolean {
    return this.loadingState.isLoadingOrders;
  }

  /**
   * Zlecenia w statusie WAITING_FOR_BIKE (dla modala "Przyjmij rower")
   */
  get waitingForBikeOrders(): CalendarOrder[] {
    return this.getAllOrders().filter(o => o.status === 'WAITING_FOR_BIKE');
  }

  /**
   * Metoda tlumaczenia dla szablonu
   */
  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  ngOnInit(): void {
    this.currentSuffix = this.route.snapshot.paramMap.get('suffix') || '';
    this.reservationAvailable = this.authService.getActiveServiceReservationAvailable();
    this.transportAvailable = this.authService.getActiveServiceTransportAvailable();
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 768;
      window.addEventListener('resize', this.resizeHandler);
    }
    this.loadMyServices();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Laduje liste serwisow uzytkownika
   */
  loadMyServices(): void {
    console.log('[Calendar] Loading services...');
    this.loadingState.isLoadingConfig = true;
    this.servicesError = '';

    this.verificationService.getMyServices().subscribe({
      next: (services: BikeServiceNameIdDto[]) => {
        console.log('[Calendar] Services loaded:', services);
        this.myServices = services;
        this.loadingState.isLoadingConfig = false;

        if (services.length > 0) {
          this.selectedServiceId = services[0].id;
          this.loadCalendarConfig();
        } else {
          console.log('[Calendar] No services found for user');
        }
      },
      error: (err: any) => {
        this.servicesError = this.t('service_calendar.errors.load_services_failed');
        this.loadingState.isLoadingConfig = false;
        console.error('[Calendar] Error loading services:', err);
      }
    });
  }

  /**
   * Obsluguje zmiane wybranego serwisu
   */
  onServiceChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedServiceId = Number(select.value);
    this.refreshReservationAvailable();
    this.loadCalendarConfig();
  }

  private refreshReservationAvailable(): void {
    this.verificationService.checkVerificationStatus().subscribe({
      next: (status) => {
        this.reservationAvailable = status.reservationAvailable ?? false;
        this.transportAvailable = status.transportAvailable ?? false;
        this.authService.setActiveServiceReservationAvailable(this.reservationAvailable);
        this.authService.setActiveServiceTransportAvailable(this.transportAvailable);
      },
      error: () => { /* zostaw poprzednią wartość */ }
    });
  }

  /**
   * Laduje konfiguracje kalendarza
   */
  loadCalendarConfig(): void {
    if (!this.selectedServiceId) return;

    console.log('[Calendar] Loading config for service:', this.selectedServiceId);
    this.loadingState.isLoadingConfig = true;

    this.calendarService.getConfig(this.selectedServiceId).subscribe({
      next: (config: CalendarConfig) => {
        console.log('[Calendar] Config loaded:', config);
        this.calendarConfig = config;
        this.calendarMode = 'SIMPLE';
        this.loadingState.isLoadingConfig = false;
        this.resetMobileDays();
        this.loadTechnicians();
        this.loadCalendarData();
      },
      error: (err: any) => {
        console.log('[Calendar] Config error, using defaults:', err);
        this.calendarConfig = { id: 0, viewMode: 'SIMPLE', maxBikesPerDay: 10 };
        this.calendarMode = 'SIMPLE';
        this.loadingState.isLoadingConfig = false;
        this.resetMobileDays();
        this.loadTechnicians();
        this.loadCalendarData();
      }
    });
  }

  /**
   * Laduje liste serwisantow
   */
  loadTechnicians(): void {
    if (!this.selectedServiceId) return;

    this.loadingState.isLoadingTechnicians = true;

    this.calendarService.getTechnicians(this.selectedServiceId).subscribe({
      next: (technicians: Technician[]) => {
        this.technicians = technicians.filter(t => t.isActive);
        this.loadingState.isLoadingTechnicians = false;
      },
      error: (err: any) => {
        this.technicians = [];
        this.loadingState.isLoadingTechnicians = false;
        console.error('Error loading technicians:', err);
      }
    });
  }

  /**
   * Laduje dane kalendarza w zaleznosci od widoku
   */
  loadCalendarData(): void {
    if (!this.selectedServiceId) return;

    this.loadingState.isLoadingOrders = true;

    if (this.currentView === 'week' && this.isMobile) {
      this.initMobileDays();
      return;
    }

    switch (this.currentView) {
      case 'day':
        this.loadDayView();
        break;
      case 'week':
        this.loadWeekView();
        break;
    }
  }

  /**
   * Laduje dane dla widoku dnia - uzywa tego samego API co widok tygodniowy
   * dla spojnosci danych (bicycleBrand, bicycleModel, etc.)
   */
  private loadDayView(): void {
    const startDate = formatCalendarDate(getWeekStart(this.selectedDate));
    const selectedDateStr = formatCalendarDate(this.selectedDate);

    this.calendarService.getWeekView(this.selectedServiceId!, startDate).subscribe({
      next: (data: CalendarWeekData) => {
        this.weekData = data;

        const orders = sortOrdersByStatus(data.ordersByDay[selectedDateStr] || []);
        this.dayData = {
          date: selectedDateStr,
          orders: orders,
          bikesCount: countBikesForLimit(orders),
          maxBikesPerDay: data.maxBikesPerDay || this.calendarConfig?.maxBikesPerDay || 10
        };

        this.loadingState.isLoadingOrders = false;
      },
      error: (err: any) => {
        this.loadingState.isLoadingOrders = false;
        console.error('Error loading day view:', err);
      }
    });
  }

  private loadWeekView(): void {
    const startDate = formatCalendarDate(getWeekStart(this.selectedDate));
    this.calendarService.getWeekView(this.selectedServiceId!, startDate).subscribe({
      next: (data: CalendarWeekData) => {
        this.weekData = data;
        this.loadingState.isLoadingOrders = false;
      },
      error: (err: any) => {
        this.loadingState.isLoadingOrders = false;
        console.error('Error loading week view:', err);
      }
    });
  }

  // ============================================
  // MOBILE INFINITE SCROLL
  // ============================================

  private resetMobileDays(): void {
    this.mobileDays = [];
    this.mobileEarliestWeekStart = null;
    this.mobileLatestWeekStart = null;
    this.loadingMobilePrev = false;
    this.loadingMobileNext = false;
  }

  private initMobileDays(): void {
    const weekStart = getWeekStart(new Date());
    this.mobileEarliestWeekStart = new Date(weekStart);
    this.mobileLatestWeekStart = new Date(weekStart);

    this.calendarService.getWeekView(this.selectedServiceId!, formatCalendarDate(weekStart)).subscribe({
      next: (data: CalendarWeekData) => {
        this.weekData = data;
        this.mobileDays = this.weekDataToDays(data);
        this.loadingState.isLoadingOrders = false;
      },
      error: (err: any) => {
        this.loadingState.isLoadingOrders = false;
        console.error('Error loading mobile days:', err);
      }
    });
  }

  onLoadPreviousDays(): void {
    if (!this.selectedServiceId || this.loadingMobilePrev || !this.mobileEarliestWeekStart) return;
    this.loadingMobilePrev = true;

    const prevWeekStart = new Date(this.mobileEarliestWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const savedEarliest = this.mobileEarliestWeekStart;
    this.mobileEarliestWeekStart = prevWeekStart;

    this.calendarService.getWeekView(this.selectedServiceId, formatCalendarDate(prevWeekStart)).subscribe({
      next: (data: CalendarWeekData) => {
        this.mobileDays = [...this.weekDataToDays(data), ...this.mobileDays];
        this.loadingMobilePrev = false;
      },
      error: () => {
        this.mobileEarliestWeekStart = savedEarliest;
        this.loadingMobilePrev = false;
      }
    });
  }

  onLoadNextDays(): void {
    if (!this.selectedServiceId || this.loadingMobileNext || !this.mobileLatestWeekStart) return;
    this.loadingMobileNext = true;

    const nextWeekStart = new Date(this.mobileLatestWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const savedLatest = this.mobileLatestWeekStart;
    this.mobileLatestWeekStart = nextWeekStart;

    this.calendarService.getWeekView(this.selectedServiceId, formatCalendarDate(nextWeekStart)).subscribe({
      next: (data: CalendarWeekData) => {
        this.mobileDays = [...this.mobileDays, ...this.weekDataToDays(data)];
        this.loadingMobileNext = false;
      },
      error: () => {
        this.mobileLatestWeekStart = savedLatest;
        this.loadingMobileNext = false;
      }
    });
  }

  private weekDataToDays(data: CalendarWeekData): CalendarDayData[] {
    const maxBikesPerDay = data.maxBikesPerDay || this.calendarConfig?.maxBikesPerDay || 10;
    return Object.keys(data.ordersByDay).sort().map(date => {
      const orders = sortOrdersByStatus(data.ordersByDay[date] || []);
      return { date, orders, bikesCount: countBikesForLimit(orders), maxBikesPerDay };
    });
  }

  // ============================================
  // ZDARZENIA Z HEADERA
  // ============================================

  onViewChange(view: CalendarViewMode): void {
    this.currentView = view;
    this.loadCalendarData();
  }

  onDateChange(date: Date): void {
    this.selectedDate = date;
    this.loadCalendarData();
  }

  onAcceptReservationClick(): void {
    this.preselectedDate = formatCalendarDate(this.selectedDate);
    this.createOrderMode = 'reservation';
    this.showCreateOrderModal = true;
  }

  onAcceptBikeClick(): void {
    this.preselectedOrderForAccept = null; // Bez preselektowanego zlecenia - pełny modal
    this.showAcceptBikeModal = true;
  }

  // ============================================
  // ZDARZENIA Z WIDOKOW
  // ============================================

  onOrderClick(order: CalendarOrder): void {
    this.selectedOrder = order;
    this.showOrderDetailsModal = true;
  }

  onDayClick(date: Date): void {
    this.selectedDate = date;
    this.currentView = 'day';
    this.loadCalendarData();
  }

  // ============================================
  // ZDARZENIA Z MODALI
  // ============================================

  onCreateOrderClose(): void {
    this.showCreateOrderModal = false;
    this.preselectedDate = null;
  }

  onOrderCreated(): void {
    this.showCreateOrderModal = false;
    this.preselectedDate = null;
    this.loadCalendarData();
  }

  onOrderDetailsClose(): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
  }

  onOrderUpdated(): void {
    this.loadCalendarData();
  }

  onAcceptBikeModalClose(): void {
    this.showAcceptBikeModal = false;
    this.preselectedOrderForAccept = null;
  }

  onBikeAccepted(): void {
    this.showAcceptBikeModal = false;
    this.preselectedOrderForAccept = null;
    this.loadCalendarData();
  }

  onAcceptBikeFromDetails(order: CalendarOrder): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
    this.preselectedOrderForAccept = order;
    this.showAcceptBikeModal = true;
  }

  // ============================================
  // AKCJE NA ZLECENIACH (PRZYCISKI SZYBKICH AKCJI)
  // ============================================

  /**
   * Anuluje zlecenie (usuwa z kalendarza)
   */
  onCancelOrder(order: CalendarOrder): void {
    this.calendarService.deleteOrder(order.id).subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.order_cancelled'));
        this.loadCalendarData();
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.cancel_order_failed'));
        console.error('Error cancelling order:', err);
      }
    });
  }

  /**
   * Potwierdza zlecenie (PENDING_CONFIRMATION -> CONFIRMED -> WAITING_FOR_BIKE)
   * Backend wymaga przejscia przez CONFIRMED, wiec robimy to automatycznie
   */
  onConfirmOrder(order: CalendarOrder): void {
    // Krok 1: PENDING_CONFIRMATION -> CONFIRMED
    this.calendarService.updateOrderStatus(this.selectedServiceId!, order.id, 'CONFIRMED').subscribe({
      next: () => {
        // Krok 2: CONFIRMED -> WAITING_FOR_BIKE
        this.calendarService.updateOrderStatus(this.selectedServiceId!, order.id, 'WAITING_FOR_BIKE').subscribe({
          next: () => {
            this.notificationService.success(this.t('service_calendar.messages.order_confirmed'));
            this.loadCalendarData();
          },
          error: (err: any) => {
            // Przynajmniej pierwszy krok sie udal
            this.notificationService.success(this.t('service_calendar.messages.order_confirmed'));
            this.loadCalendarData();
            console.error('Error updating to WAITING_FOR_BIKE:', err);
          }
        });
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.confirm_order_failed'));
        console.error('Error confirming order:', err);
      }
    });
  }

  /**
   * Otwiera modal przyjęcia roweru z preselektowanym zleceniem
   */
  onAcceptBike(order: CalendarOrder): void {
    this.preselectedOrderForAccept = order;
    this.showAcceptBikeModal = true;
  }

  private getAllOrders(): CalendarOrder[] {
    const fromWeek = Object.values(this.weekData?.ordersByDay ?? {}).flat();
    const fromDay = this.dayData?.orders ?? [];
    const fromMobile = this.mobileDays.flatMap(d => d.orders);
    const seen = new Set<number>();
    return [...fromWeek, ...fromDay, ...fromMobile].filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  }

  private updateOrderLocally(orderId: number, newStatus: CalendarOrderStatus): void {
    const applyUpdate = (orders: CalendarOrder[]): CalendarOrder[] =>
      orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);

    if (this.weekData) {
      for (const dateKey of Object.keys(this.weekData.ordersByDay)) {
        if (this.weekData.ordersByDay[dateKey].some(o => o.id === orderId)) {
          this.weekData = {
            ...this.weekData,
            ordersByDay: {
              ...this.weekData.ordersByDay,
              [dateKey]: sortOrdersByStatus(applyUpdate(this.weekData.ordersByDay[dateKey]))
            }
          };
          break;
        }
      }
    }
    if (this.dayData?.orders.some(o => o.id === orderId)) {
      this.dayData = { ...this.dayData, orders: sortOrdersByStatus(applyUpdate(this.dayData.orders)) };
    }
    if (this.mobileDays.some(d => d.orders.some(o => o.id === orderId))) {
      this.mobileDays = this.mobileDays.map(d =>
        d.orders.some(o => o.id === orderId)
          ? { ...d, orders: sortOrdersByStatus(applyUpdate(d.orders)) }
          : d
      );
    }
  }

  /**
   * Oznacza jako gotowe do odbioru — otwiera modal z wyborem rodzeństwa i powiadomieniem
   */
  onMarkReadyForPickup(order: CalendarOrder): void {
    this.markReadyOrder = order;
    this.markReadySiblings = this.findEligibleSiblings(order);
    this.showMarkReadyModal = true;
  }

  onMarkReadyClose(): void {
    this.showMarkReadyModal = false;
    this.markReadyOrder = null;
    this.markReadySiblings = [];
  }

  onMarkReadyCompleted(processedIds: number[]): void {
    this.showMarkReadyModal = false;
    this.markReadyOrder = null;
    this.markReadySiblings = [];
    for (const id of processedIds) {
      this.updateOrderLocally(id, 'READY_FOR_PICKUP');
    }
  }

  private readonly ELIGIBLE_FOR_READY: CalendarOrderStatus[] = [
    'IN_PROGRESS', 'WAITING_FOR_PARTS', 'AWAITING_CLIENT_DECISION'
  ];

  private findEligibleSiblings(order: CalendarOrder): CalendarOrder[] {
    const key = getOrderClientKey(order);
    return this.getAllOrders().filter(o =>
      o.id !== order.id &&
      getOrderClientKey(o) === key &&
      this.ELIGIBLE_FOR_READY.includes(o.status)
    );
  }

  /**
   * Oznacza jako zakonczone (READY_FOR_PICKUP -> COMPLETED)
   */
  onMarkCompleted(order: CalendarOrder): void {
    this.calendarService.updateOrderStatus(this.selectedServiceId!, order.id, 'COMPLETED').subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.order_completed'));
        this.updateOrderLocally(order.id, 'COMPLETED');
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.complete_order_failed'));
        console.error('Error completing order:', err);
      }
    });
  }

  /**
   * Rozpoczyna prace nad zleceniem (IN_QUEUE -> IN_PROGRESS)
   */
  onStartProgress(order: CalendarOrder): void {
    this.calendarService.updateOrderStatus(this.selectedServiceId!, order.id, 'IN_PROGRESS').subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.work_started'));
        this.updateOrderLocally(order.id, 'IN_PROGRESS');
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.update_status_failed'));
        console.error('Error starting progress:', err);
      }
    });
  }

  /**
   * Wznawia prace nad zleceniem (WAITING_FOR_PARTS/AWAITING_CLIENT_DECISION -> IN_PROGRESS)
   */
  onBackToProgress(order: CalendarOrder): void {
    this.calendarService.updateOrderStatus(this.selectedServiceId!, order.id, 'IN_PROGRESS').subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.status_updated'));
        this.updateOrderLocally(order.id, 'IN_PROGRESS');
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.update_status_failed'));
        console.error('Error updating status:', err);
      }
    });
  }

  // ============================================
  // NAWIGACJA
  // ============================================

  onSettingsUpdated(updated: CalendarConfig): void {
    this.calendarConfig = updated;
  }

  goToProfileSettings(): void {
    if (this.currentSuffix) {
      this.router.navigate([`/${this.currentSuffix}/panel-administratora/profil`]);
    }
  }
}
