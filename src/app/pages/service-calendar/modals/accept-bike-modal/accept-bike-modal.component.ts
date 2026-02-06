import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { I18nService } from '../../../../core/i18n.service';
import { NotificationService } from '../../../../core/notification.service';
import { ServiceCalendarService, StolenCheckResponse } from '../../services/service-calendar.service';
import {
  CalendarOrder,
  CreateCalendarOrderDto,
  UpdateCalendarOrderDto,
  formatCalendarDate
} from '../../../../shared/models/service-calendar.models';

type ModalMode = 'select' | 'new';

@Component({
  selector: 'app-accept-bike-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accept-bike-modal.component.html',
  styleUrls: ['./accept-bike-modal.component.css']
})
export class AcceptBikeModalComponent implements OnInit, OnDestroy {
  private i18nService = inject(I18nService);
  private notificationService = inject(NotificationService);
  private calendarService = inject(ServiceCalendarService);

  @Input() serviceId!: number;
  @Input() waitingOrders: CalendarOrder[] = [];
  @Input() preselectedOrder: CalendarOrder | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() bikeAccepted = new EventEmitter<void>();

  // Mode
  mode: ModalMode = 'select';

  // Select mode
  selectedOrderId: number | null = null;

  // New walk-in mode
  bikeBrand: string = '';
  bikeModel: string = '';
  frameNumber: string = '';
  clientEmail: string = '';
  clientPhone: string = '';
  clientName: string = '';
  description: string = '';

  // State
  isSubmitting: boolean = false;
  isLoadingOrder: boolean = false;

  // Stolen check
  stolenCheckResult: StolenCheckResponse | null = null;
  isCheckingStolen: boolean = false;
  private frameNumber$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Pełne dane zlecenia (pobrane z API)
  private fullOrderData: CalendarOrder | null = null;

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  ngOnInit(): void {
    // Setup stolen check debounce
    this.frameNumber$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(frameNumber => {
      this.performStolenCheck(frameNumber);
    });

    // If preselected order is provided, switch to walk-in mode and fetch full data
    if (this.preselectedOrder) {
      this.mode = 'new';
      this.loadFullOrderDetails(this.preselectedOrder.id);
    }
    // If no waiting orders, switch to new mode automatically
    else if (this.waitingOrders.length === 0) {
      this.mode = 'new';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFrameNumberChange(value: string): void {
    this.frameNumber = value;
    if (value.trim().length >= 3) {
      this.frameNumber$.next(value.trim());
    } else {
      this.stolenCheckResult = null;
    }
  }

  private performStolenCheck(frameNumber: string): void {
    this.isCheckingStolen = true;
    this.stolenCheckResult = null;

    this.calendarService.checkStolenBike(frameNumber).subscribe({
      next: (result) => {
        this.stolenCheckResult = result;
        this.isCheckingStolen = false;
      },
      error: () => {
        // W razie bledu API nie blokujemy - po prostu nie pokazujemy wyniku
        this.stolenCheckResult = null;
        this.isCheckingStolen = false;
      }
    });
  }

  /**
   * Pobiera pełne dane zlecenia z API i wypełnia formularz
   */
  private loadFullOrderDetails(orderId: number): void {
    this.isLoadingOrder = true;

    this.calendarService.getOrder(this.serviceId, orderId).subscribe({
      next: (orderData: CalendarOrder) => {
        this.fullOrderData = orderData;
        this.prefillFromOrder(orderData);
        this.isLoadingOrder = false;
      },
      error: (err: any) => {
        // W razie błędu użyj danych z preselectedOrder (mogą być niekompletne)
        console.error('Error loading full order details:', err);
        if (this.preselectedOrder) {
          this.prefillFromOrder(this.preselectedOrder);
        }
        this.isLoadingOrder = false;
      }
    });
  }

  /**
   * Wypełnia formularz danymi z istniejącego zlecenia
   * Obsługuje zarówno nową strukturę zagnieżdżoną (bicycle.*, client.*) jak i starą płaską
   */
  private prefillFromOrder(order: any): void {
    // Dane roweru - z obiektu bicycle lub płaskiej struktury
    this.bikeBrand = order.bicycle?.brand || order.bicycleBrand || '';
    this.bikeModel = order.bicycle?.model || order.bicycleModel || '';
    this.frameNumber = order.bicycle?.frameNumber || order.bicycleFrameNumber || '';

    // Dane klienta - z obiektu client lub płaskiej struktury
    if (order.client) {
      const firstName = order.client.firstName || '';
      const lastName = order.client.lastName || '';
      this.clientName = `${firstName} ${lastName}`.trim();
      this.clientEmail = this.filterSyntheticEmail(order.client.email || '');
      this.clientPhone = order.client.phone || '';
    } else {
      this.clientName = order.clientName || '';
      this.clientEmail = this.filterSyntheticEmail(order.clientEmail || '');
      this.clientPhone = order.clientPhone || '';
    }
  }

  /**
   * Filtruje syntetyczne emaile backendowe (kończące się na @local.cyclopick.pl)
   */
  private filterSyntheticEmail(email: string): string {
    if (email.endsWith('@local.cyclopick.pl')) {
      return '';
    }
    return email;
  }

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  setMode(mode: ModalMode): void {
    this.mode = mode;
    // Reset selection when switching modes
    this.selectedOrderId = null;
  }

  get selectedOrder(): CalendarOrder | undefined {
    return this.waitingOrders.find(o => o.id === this.selectedOrderId);
  }

  get isFormValid(): boolean {
    if (this.mode === 'select') {
      return this.selectedOrderId !== null;
    } else {
      // Walk-in: brand + (email OR phone)
      return !!(
        this.bikeBrand.trim() &&
        (this.clientEmail.trim() || this.clientPhone.trim())
      );
    }
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;

    if (this.mode === 'select' && this.selectedOrderId) {
      // Accept existing order from list - only change status to IN_PROGRESS
      this.changeStatusToInProgress(this.selectedOrderId);
    } else if (this.mode === 'new' && this.preselectedOrder) {
      // Accept preselected order - first update data from form, then change status
      this.acceptPreselectedOrder(this.preselectedOrder.id);
    } else {
      // Create new walk-in order directly in IN_PROGRESS status
      this.createWalkInOrder();
    }
  }

  /**
   * Przyjmuje preselektowane zlecenie - najpierw aktualizuje dane, potem zmienia status
   */
  private acceptPreselectedOrder(orderId: number): void {
    // Przygotuj dane do aktualizacji z formularza
    const nameParts = this.clientName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const updateData: UpdateCalendarOrderDto = {
      brand: this.bikeBrand.trim(),
      model: this.bikeModel.trim() || undefined,
      frameNumber: this.frameNumber.trim(),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: this.clientEmail.trim() || undefined,
      phone: this.clientPhone.trim() || undefined,
      description: this.description.trim() || undefined
    };

    // Najpierw aktualizuj dane zlecenia
    this.calendarService.updateOrder(this.serviceId, orderId, updateData).subscribe({
      next: () => {
        // Po udanej aktualizacji danych, zmień status na IN_PROGRESS
        this.changeStatusToInProgress(orderId);
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.update_order_failed'));
        this.isSubmitting = false;
        console.error('Error updating order data:', err);
      }
    });
  }

  /**
   * Zmienia status zlecenia na IN_PROGRESS
   */
  private changeStatusToInProgress(orderId: number): void {
    this.calendarService.updateOrderStatus(this.serviceId, orderId, 'IN_PROGRESS').subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.bike_accepted'));
        this.isSubmitting = false;
        this.bikeAccepted.emit();
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.accept_bike_failed'));
        this.isSubmitting = false;
        console.error('Error accepting bike:', err);
      }
    });
  }

  /**
   * Tworzy nowe zlecenie walk-in i zmienia status na IN_PROGRESS
   */
  private createWalkInOrder(): void {
    const orderData: CreateCalendarOrderDto = {
      email: this.clientEmail.trim() || 'walkin@service.local',
      phone: this.clientPhone.trim() || '',
      firstName: this.clientName.trim() || 'Klient',
      lastName: 'z ulicy',
      brand: this.bikeBrand.trim(),
      model: this.bikeModel.trim() || undefined,
      frameNumber: this.frameNumber.trim(),
      plannedDate: formatCalendarDate(new Date()),
      description: this.description.trim() || undefined
    };

    this.calendarService.createOrder(this.serviceId, orderData).subscribe({
      next: (createdOrder) => {
        // Now update status to IN_PROGRESS
        this.calendarService.updateOrderStatus(this.serviceId, createdOrder.id, 'IN_PROGRESS').subscribe({
          next: () => {
            this.notificationService.success(this.t('service_calendar.messages.bike_accepted'));
            this.isSubmitting = false;
            this.bikeAccepted.emit();
          },
          error: (err: any) => {
            // Order created but status update failed - still notify success
            this.notificationService.success(this.t('service_calendar.messages.order_created'));
            this.isSubmitting = false;
            this.bikeAccepted.emit();
            console.error('Error updating status after create:', err);
          }
        });
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.create_order_failed'));
        this.isSubmitting = false;
        console.error('Error creating walk-in order:', err);
      }
    });
  }
}
