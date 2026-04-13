import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
// (debounceTime/distinctUntilChanged used for frameNumber stolen check only)
import { I18nService } from '../../../../core/i18n.service';
import { NotificationService } from '../../../../core/notification.service';
import { EnumerationService } from '../../../../core/enumeration.service';
import { ServiceCalendarService, StolenCheckResponse, ReturnTransportRequestDto } from '../../services/service-calendar.service';
import {
  CalendarOrder,
  CreateCalendarOrderDto,
  UpdateCalendarOrderDto,
  formatCalendarDate,
  ClientLookupResult,
  ClientBike
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
  private enumerationService = inject(EnumerationService);
  private elementRef = inject(ElementRef);

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
  bikeType: string = '';
  frameNumber: string = '';
  clientEmail: string = '';
  clientPhone: string = '';
  clientName: string = '';
  description: string = '';

  // State
  isSubmitting: boolean = false;
  isLoadingOrder: boolean = false;
  showValidation: boolean = false;

  // Brand autocomplete
  allBrands: string[] = [];
  filteredBrands: string[] = [];
  showBrandDropdown: boolean = false;

  // Bike types
  bikeTypes: string[] = [];

  // Client lookup
  foundClient: ClientLookupResult | null = null;
  clientFoundBy: 'email' | 'phone' | null = null;
  clientLookingBy: 'email' | 'phone' | null = null;
  clientBikes: ClientBike[] = [];
  isLookingUpClient: boolean = false;
  selectedBikeId: number | null = null;

  // Pickup method
  pickupMethod: 'self' | 'delivery' = 'self';
  deliveryStreet: string = '';
  deliveryBuilding: string = '';
  deliveryCity: string = 'Kraków';
  transportNotes: string = '';

  // Cities
  cities: string[] = [];

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
    // Load brands for autocomplete
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => { this.allBrands = brands; },
      error: (err) => { console.error('Error loading brands:', err); }
    });

    // Load bike types
    this.enumerationService.getEnumeration('BIKE_TYPE').subscribe({
      next: (types) => { this.bikeTypes = types; },
      error: (err) => { console.error('Error loading bike types:', err); }
    });

    // Load cities
    this.enumerationService.getCities().subscribe({
      next: (cities) => { this.cities = cities; },
      error: (err) => { console.error('Error loading cities:', err); }
    });

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

  // ============================================
  // BRAND AUTOCOMPLETE
  // ============================================

  onBrandInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.bikeBrand = query;
    if (query.length >= 3) {
      this.filteredBrands = this.allBrands.filter(b => b.toLowerCase().includes(query.toLowerCase()));
      this.showBrandDropdown = this.filteredBrands.length > 0;
    } else {
      this.showBrandDropdown = false;
    }
  }

  onBrandFocus(): void {
    if (this.bikeBrand.length >= 3 && this.filteredBrands.length > 0) {
      this.showBrandDropdown = true;
    }
  }

  selectBrand(brand: string): void {
    this.bikeBrand = brand;
    this.showBrandDropdown = false;
  }

  expandAllBrands(): void {
    this.filteredBrands = [...this.allBrands];
    this.showBrandDropdown = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showBrandDropdown = false;
    }
  }

  // ============================================
  // CLIENT LOOKUP
  // ============================================

  onEmailBlur(): void {
    if (!this.clientEmail) {
      this.resetClientLookup();
      return;
    }
    if (this.clientEmail.length >= 5 && this.clientEmail.includes('@') && this.clientEmail.includes('.')) {
      this.clientLookingBy = 'email';
      this.performClientLookup(this.clientEmail, undefined);
    }
  }

  onPhoneBlur(): void {
    if (!this.clientPhone) {
      this.resetClientLookup();
      return;
    }
    const digits = this.clientPhone.replace(/\D/g, '');
    if (digits.length >= 9) {
      this.clientLookingBy = 'phone';
      this.performClientLookup(undefined, this.clientPhone);
    }
  }

  private performClientLookup(email?: string, phone?: string): void {
    this.isLookingUpClient = true;
    this.calendarService.lookupClient(email, phone).subscribe({
      next: (client) => {
        this.foundClient = client;
        this.clientFoundBy = email ? 'email' : 'phone';
        this.clientLookingBy = null;
        this.clientName = `${client.firstName} ${client.lastName || ''}`.trim();
        if (email && client.phone) this.clientPhone = client.phone;
        if (phone && client.email) this.clientEmail = client.email;
        this.isLookingUpClient = false;
        this.loadClientBikes(client.id);
      },
      error: () => {
        this.foundClient = null;
        this.clientFoundBy = null;
        this.clientLookingBy = null;
        this.clientBikes = [];
        this.isLookingUpClient = false;
      }
    });
  }

  private loadClientBikes(clientId: number): void {
    this.calendarService.getClientBikes(clientId).subscribe({
      next: (bikes) => { this.clientBikes = bikes; },
      error: () => { this.clientBikes = []; }
    });
  }

  onBikeSelected(bikeId: number | null): void {
    if (bikeId === null) {
      this.bikeBrand = '';
      this.bikeModel = '';
      this.bikeType = '';
      return;
    }
    const bike = this.clientBikes.find(b => b.id === bikeId);
    if (bike) {
      this.bikeBrand = bike.brand;
      this.bikeModel = bike.model;
      this.bikeType = '';
    }
  }

  resetClientLookup(): void {
    this.foundClient = null;
    this.clientFoundBy = null;
    this.clientLookingBy = null;
    this.clientBikes = [];
    this.selectedBikeId = null;
    this.bikeBrand = '';
    this.bikeModel = '';
    this.bikeType = '';
  }

  // ============================================
  // STOLEN CHECK
  // ============================================

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
        this.stolenCheckResult = null;
        this.isCheckingStolen = false;
      }
    });
  }

  // ============================================
  // ORDER LOADING (preselected)
  // ============================================

  private loadFullOrderDetails(orderId: number): void {
    this.isLoadingOrder = true;

    this.calendarService.getOrder(this.serviceId, orderId).subscribe({
      next: (orderData: CalendarOrder) => {
        this.fullOrderData = orderData;
        this.prefillFromOrder(orderData);
        this.isLoadingOrder = false;
      },
      error: (err: any) => {
        console.error('Error loading full order details:', err);
        if (this.preselectedOrder) {
          this.prefillFromOrder(this.preselectedOrder);
        }
        this.isLoadingOrder = false;
      }
    });
  }

  private prefillFromOrder(order: any): void {
    this.bikeBrand = order.bicycle?.brand || order.bicycleBrand || '';
    this.bikeModel = order.bicycle?.model || order.bicycleModel || '';
    this.bikeType = order.bicycle?.type || order.bicycleType || '';
    this.frameNumber = order.bicycle?.frameNumber || order.bicycleFrameNumber || '';

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

  private filterSyntheticEmail(email: string): string {
    if (email.endsWith('@local.cyclopick.pl')) {
      return '';
    }
    return email;
  }

  // ============================================
  // FORM
  // ============================================

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
    this.selectedOrderId = null;
  }

  get selectedOrder(): CalendarOrder | undefined {
    return this.waitingOrders.find(o => o.id === this.selectedOrderId);
  }

  get isDeliveryAddressValid(): boolean {
    if (this.pickupMethod !== 'delivery') return true;
    return !!(this.deliveryStreet.trim() && this.deliveryBuilding.trim() && this.deliveryCity.trim());
  }

  get isFormValid(): boolean {
    if (this.mode === 'select') {
      return this.selectedOrderId !== null && this.isDeliveryAddressValid;
    } else {
      const hasClient = !!(
        this.foundClient ||
        (this.clientEmail.trim() || this.clientPhone.trim())
      );
      const hasBike = !!(this.selectedBikeId || this.bikeBrand.trim());
      const hasType = !!(this.selectedBikeId || this.bikeType.trim());
      return !!(hasClient && hasBike && hasType && this.isDeliveryAddressValid);
    }
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    if (!this.isFormValid) {
      this.showValidation = true;
      return;
    }

    this.isSubmitting = true;

    if (this.mode === 'select' && this.selectedOrderId) {
      this.changeStatusToInProgress(this.selectedOrderId);
    } else if (this.mode === 'new' && this.preselectedOrder) {
      this.acceptPreselectedOrder(this.preselectedOrder.id);
    } else {
      this.createWalkInOrder();
    }
  }

  private acceptPreselectedOrder(orderId: number): void {
    const nameParts = this.clientName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const updateData: UpdateCalendarOrderDto = {
      ...(this.foundClient
        ? { clientId: this.foundClient.id }
        : {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            email: this.clientEmail.trim() || undefined,
            phone: this.clientPhone.trim() || undefined
          }
      ),
      ...(this.selectedBikeId
        ? { existingBicycleId: this.selectedBikeId }
        : {
            brand: this.bikeBrand.trim(),
            model: this.bikeModel.trim() || undefined,
            type: this.bikeType.trim() || undefined,
            frameNumber: this.frameNumber.trim() || undefined
          }
      ),
      description: this.description.trim() || undefined
    };

    this.calendarService.updateOrder(this.serviceId, orderId, updateData).subscribe({
      next: () => {
        this.changeStatusToInProgress(orderId);
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.update_order_failed'));
        this.isSubmitting = false;
        console.error('Error updating order data:', err);
      }
    });
  }

  private changeStatusToInProgress(orderId: number): void {
    this.calendarService.updateOrderStatus(this.serviceId, orderId, 'IN_PROGRESS').subscribe({
      next: () => {
        if (this.pickupMethod === 'delivery') {
          this.createReturnTransport(orderId);
        } else {
          this.notificationService.success(this.t('service_calendar.messages.bike_accepted'));
          this.isSubmitting = false;
          this.bikeAccepted.emit();
        }
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? this.t('service_calendar.errors.accept_bike_failed');
        this.notificationService.error(msg);
        this.isSubmitting = false;
        console.error('Error accepting bike:', err);
      }
    });
  }

  private createReturnTransport(orderId: number): void {
    const data: ReturnTransportRequestDto = {
      deliveryStreet: this.deliveryStreet.trim(),
      deliveryBuilding: this.deliveryBuilding.trim(),
      deliveryCity: this.deliveryCity.trim(),
      transportNotes: this.transportNotes.trim() || undefined
    };
    this.calendarService.createReturnTransport(this.serviceId, orderId, data).subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.bike_accepted'));
        this.isSubmitting = false;
        this.bikeAccepted.emit();
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.return_transport_failed'));
        this.isSubmitting = false;
        console.error('Error creating return transport:', err);
      }
    });
  }

  private createWalkInOrder(): void {
    const orderData: CreateCalendarOrderDto = {
      // Dane klienta
      ...(this.foundClient
        ? { clientId: this.foundClient.id }
        : {
            email: this.clientEmail.trim() || undefined,
            phone: this.clientPhone.trim() || undefined,
            firstName: this.clientName.trim() || 'Klient',
            lastName: undefined
          }
      ),
      // Dane roweru
      ...(this.selectedBikeId
        ? { existingBicycleId: this.selectedBikeId }
        : {
            brand: this.bikeBrand.trim(),
            model: this.bikeModel.trim() || undefined,
            type: this.bikeType.trim() || undefined,
            frameNumber: this.frameNumber.trim() || undefined
          }
      ),
      plannedDate: formatCalendarDate(new Date()),
      description: this.description.trim() || undefined
    };

    this.calendarService.createOrder(this.serviceId, orderData).subscribe({
      next: (createdOrder) => {
        this.calendarService.updateOrderStatus(this.serviceId, createdOrder.id, 'IN_PROGRESS').subscribe({
          next: () => {
            if (this.pickupMethod === 'delivery') {
              this.createReturnTransport(createdOrder.id);
            } else {
              this.notificationService.success(this.t('service_calendar.messages.bike_accepted'));
              this.isSubmitting = false;
              this.bikeAccepted.emit();
            }
          },
          error: (err: any) => {
            const msg = err?.error?.message ?? this.t('service_calendar.errors.accept_bike_failed');
            this.notificationService.error(msg);
            this.isSubmitting = false;
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
