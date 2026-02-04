import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../core/i18n.service';
import { NotificationService } from '../../core/notification.service';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { ServiceCalendarService } from './services/service-calendar.service';
import { CalendarHeaderComponent } from './components/calendar-header/calendar-header.component';
import { CalendarDayViewComponent } from './components/calendar-day-view/calendar-day-view.component';
import { CalendarWeekViewComponent } from './components/calendar-week-view/calendar-week-view.component';
import { CreateOrderModalComponent } from './modals/create-order-modal/create-order-modal.component';
import { OrderDetailsModalComponent } from './modals/order-details-modal/order-details-modal.component';
import { AcceptBikeModalComponent } from './modals/accept-bike-modal/accept-bike-modal.component';
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
  Technician,
  CalendarLoadingState,
  DEFAULT_CALENDAR_LOADING_STATE,
  formatCalendarDate,
  getWeekStart
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
    AcceptBikeModalComponent
  ],
  templateUrl: './service-calendar.component.html',
  styleUrls: ['./service-calendar.component.css']
})
export class ServiceCalendarComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(BikeServiceVerificationService);
  private calendarService = inject(ServiceCalendarService);
  private i18nService = inject(I18nService);
  private notificationService = inject(NotificationService);

  // Suffix z URL
  private currentSuffix: string = '';

  // Serwisy uzytkownika
  myServices: BikeServiceNameIdDto[] = [];
  selectedServiceId: number | null = null;

  // Konfiguracja kalendarza
  calendarConfig: CalendarConfig | null = null;

  // Aktualny widok
  currentView: CalendarViewMode = 'week';
  calendarMode: CalendarMode = 'SIMPLE';

  // Wybrana data
  selectedDate: Date = new Date();

  // Dane kalendarza
  dayData: CalendarDayData | null = null;
  weekData: CalendarWeekData | null = null;

  // Serwisanci
  technicians: Technician[] = [];

  // Stan ladowania
  loadingState: CalendarLoadingState = { ...DEFAULT_CALENDAR_LOADING_STATE };
  servicesError: string = '';

  // Modale
  showCreateOrderModal = false;
  showOrderDetailsModal = false;
  showAcceptBikeModal = false;
  selectedOrder: CalendarOrder | null = null;
  preselectedDate: string | null = null;
  createOrderMode: 'reservation' | 'acceptBike' = 'reservation';
  preselectedOrderForAccept: CalendarOrder | null = null;

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
    const allOrders: CalendarOrder[] = [];

    // Zbierz zlecenia z aktualnego widoku
    if (this.dayData?.orders) {
      allOrders.push(...this.dayData.orders);
    }
    if (this.weekData?.ordersByDay) {
      Object.values(this.weekData.ordersByDay).forEach(orders => {
        allOrders.push(...orders);
      });
    }

    // Filtruj tylko WAITING_FOR_BIKE i usun duplikaty
    const uniqueOrders = new Map<number, CalendarOrder>();
    allOrders
      .filter(o => o.status === 'WAITING_FOR_BIKE')
      .forEach(o => uniqueOrders.set(o.id, o));

    return Array.from(uniqueOrders.values());
  }

  /**
   * Metoda tlumaczenia dla szablonu
   */
  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  ngOnInit(): void {
    // Pobierz suffix z URL
    this.currentSuffix = this.route.snapshot.paramMap.get('suffix') || '';
    this.loadMyServices();
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
    this.loadCalendarConfig();
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
        // Wymuszamy tryb SIMPLE (zaawansowany tymczasowo wyłączony)
        this.calendarMode = 'SIMPLE';
        this.loadingState.isLoadingConfig = false;
        this.loadTechnicians();
        this.loadCalendarData();
      },
      error: (err: any) => {
        console.log('[Calendar] Config error, using defaults:', err);
        // Jesli nie ma konfiguracji, uzyj domyslnej
        this.calendarConfig = {
          id: 0,
          viewMode: 'SIMPLE',
          maxBikesPerDay: 10
        };
        this.calendarMode = 'SIMPLE';
        this.loadingState.isLoadingConfig = false;
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
        // Zapisz dane tygodniowe (moze sie przydac przy przelaczaniu widokow)
        this.weekData = data;

        // Wyodrebnij dane dla wybranego dnia
        const orders = data.ordersByDay[selectedDateStr] || [];
        this.dayData = {
          date: selectedDateStr,
          orders: orders,
          bikesCount: orders.length,
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
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
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

  /**
   * Oznacza jako gotowe do odbioru (IN_PROGRESS -> READY_FOR_PICKUP)
   */
  onMarkReadyForPickup(order: CalendarOrder): void {
    this.calendarService.updateOrderStatus(this.selectedServiceId!, order.id, 'READY_FOR_PICKUP').subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.ready_for_pickup'));
        this.loadCalendarData();
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.ready_for_pickup_failed'));
        console.error('Error marking ready for pickup:', err);
      }
    });
  }

  /**
   * Oznacza jako zakonczone (READY_FOR_PICKUP -> COMPLETED)
   */
  onMarkCompleted(order: CalendarOrder): void {
    this.calendarService.updateOrderStatus(this.selectedServiceId!, order.id, 'COMPLETED').subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.order_completed'));
        this.loadCalendarData();
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.complete_order_failed'));
        console.error('Error completing order:', err);
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
        this.loadCalendarData();
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

  goToProfileSettings(): void {
    if (this.currentSuffix) {
      this.router.navigate([`/${this.currentSuffix}/panel-administratora/profil`]);
    }
  }
}
