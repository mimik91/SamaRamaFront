import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { I18nService } from '../../../../core/i18n.service';
import { NotificationService } from '../../../../core/notification.service';
import { EnumerationService } from '../../../../core/enumeration.service';
import { ServiceCalendarService, ReturnTransportRequestDto } from '../../services/service-calendar.service';
import {
  CalendarOrder,
  CreateCalendarOrderDto,
  UpdateCalendarOrderDto,
  formatCalendarDate,
  ClientLookupResult,
  ClientBike,
  Technician
} from '../../../../shared/models/service-calendar.models';
import { ServiceStolenMatch } from '../../../../shared/models/stolen-bike.models';

const MIN_FRAME_NUMBER_LENGTH = 4;

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
  @Input() technicians: Technician[] = [];
  @Input() hasAnyTechnician = false;

  @Output() close = new EventEmitter<void>();
  @Output() bikeAccepted = new EventEmitter<void>();

  mode: ModalMode = 'select';

  selectedOrderId: number | null = null;

  bikeBrand: string = '';
  bikeModel: string = '';
  bikeType: string = '';
  frameNumber: string = '';
  clientEmail: string = '';
  clientPhone: string = '';
  clientName: string = '';
  description: string = '';

  isSubmitting: boolean = false;
  isLoadingOrder: boolean = false;
  showValidation: boolean = false;

  allBrands: string[] = [];
  filteredBrands: string[] = [];
  showBrandDropdown: boolean = false;

  bikeTypes: string[] = [];

  foundClient: ClientLookupResult | null = null;
  clientFoundBy: 'email' | 'phone' | null = null;
  clientLookingBy: 'email' | 'phone' | null = null;
  clientBikes: ClientBike[] = [];
  isLookingUpClient: boolean = false;
  selectedBikeId: number | null = null;

  selectedTechnicianId: number | null = null;

  pickupMethod: 'self' | 'delivery' = 'self';
  deliveryStreet: string = '';
  deliveryBuilding: string = '';
  deliveryCity: string = 'Kraków';
  transportNotes: string = '';

  cities: string[] = [];

  stolenMatches: ServiceStolenMatch[] = [];
  stolenResolution: 'NONE' | 'OWNED' | 'BLOCKED' | null = null;
  showStolenMatches = false;
  stolenVerificationOpen = false;
  stolenVerificationFrame = '';
  isCheckingStolen: boolean = false;
  isReportingSighting = false;
  stolenCheckVerified: boolean = false;
  private lastStolenCheckKey: string | null = null;
  private orderClientId: number | null = null;
  private destroy$ = new Subject<void>();

  private fullOrderData: CalendarOrder | null = null;

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  ngOnInit(): void {
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => { this.allBrands = brands; },
      error: (err) => { console.error('Error loading brands:', err); }
    });

    this.enumerationService.getEnumeration('BIKE_TYPE').subscribe({
      next: (types) => { this.bikeTypes = types; },
      error: (err) => { console.error('Error loading bike types:', err); }
    });

    this.enumerationService.getCities().subscribe({
      next: (cities) => { this.cities = cities; },
      error: (err) => { console.error('Error loading cities:', err); }
    });

    if (this.preselectedOrder) {
      this.mode = 'new';
      this.loadFullOrderDetails(this.preselectedOrder.id);
    } else if (this.waitingOrders.length === 0) {
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
    if (this.foundClient || this.isLookingUpClient) return;
    if (!this.clientEmail) { this.resetClientLookup(); return; }
    if (this.clientEmail.length >= 5 && this.clientEmail.includes('@') && this.clientEmail.includes('.')) {
      this.clientLookingBy = 'email';
      this.performClientLookup(this.clientEmail, undefined);
    }
  }

  onPhoneBlur(): void {
    if (this.foundClient || this.isLookingUpClient) return;
    if (!this.clientPhone) { this.resetClientLookup(); return; }
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
    this.stolenCheckVerified = false;
  }

  get frameNumberTooShort(): boolean {
    const length = this.frameNumber.trim().length;
    return length > 0 && length < MIN_FRAME_NUMBER_LENGTH;
  }

  get stolenCheckCriteriaMet(): boolean {
    return this.frameNumber.trim().length >= MIN_FRAME_NUMBER_LENGTH
      || (!!this.bikeBrand.trim() && !!this.bikeModel.trim());
  }

  get isStolenCheckStale(): boolean {
    return this.lastStolenCheckKey !== this.currentStolenCheckKey;
  }

  private get currentStolenCheckKey(): string {
    return [
      this.frameNumber.trim().toUpperCase(),
      this.bikeBrand.trim().toLowerCase(),
      this.bikeModel.trim().toLowerCase()
    ].join('|');
  }

  runStolenCheck(): void {
    if (!this.stolenCheckCriteriaMet || this.isCheckingStolen) return;
    this.performStolenCheck();
  }

  private performStolenCheck(): void {
    const frame = this.frameNumber.trim();
    const brand = this.bikeBrand.trim();
    const model = this.bikeModel.trim();

    this.lastStolenCheckKey = this.currentStolenCheckKey;
    this.isCheckingStolen = true;
    this.stolenMatches = [];
    this.stolenResolution = null;
    this.stolenVerificationOpen = false;
    this.stolenCheckVerified = false;
    this.calendarService.checkStolenForService(
      this.serviceId,
      frame.length >= MIN_FRAME_NUMBER_LENGTH ? frame : undefined,
      brand || undefined,
      model || undefined,
      this.resolvedClientId
    ).subscribe({
      next: (response) => {
        this.stolenMatches = response.results;
        this.isCheckingStolen = false;
        if (this.hasStolenHit && this.stolenMatches.every(match => match.ownedByClient)) {
          this.stolenResolution = 'OWNED';
        } else if (this.stolenMatches.some(match => !match.ownedByClient)) {
          this.showStolenMatches = true;
        }
      },
      error: () => {
        this.stolenMatches = [];
        this.isCheckingStolen = false;
      }
    });
  }

  get hasStolenHit(): boolean {
    return this.stolenMatches.length > 0;
  }

  get hasCompletedStolenCheck(): boolean {
    return this.lastStolenCheckKey !== null;
  }

  get resolvedClientId(): number | null {
    return this.foundClient?.id ?? this.orderClientId;
  }

  get canEditVerificationFrame(): boolean {
    return this.selectedBikeId === null || !this.frameNumber.trim();
  }

  openStolenMatches(): void {
    this.showStolenMatches = true;
  }

  closeStolenMatches(): void {
    this.showStolenMatches = false;
    this.stolenVerificationOpen = false;
  }

  openStolenVerification(): void {
    this.stolenVerificationFrame = '';
    this.stolenVerificationOpen = true;
  }

  confirmNoneOfMatches(): void {
    const frame = this.stolenVerificationFrame.trim();
    if (this.canEditVerificationFrame && frame.length >= MIN_FRAME_NUMBER_LENGTH) {
      this.frameNumber = frame;
      this.stolenCheckVerified = true;
    }
    this.stolenResolution = 'NONE';
    this.lastStolenCheckKey = this.currentStolenCheckKey;
    this.closeStolenMatches();
  }

  confirmMatchIsThisBike(match: ServiceStolenMatch): void {
    if (this.isReportingSighting) return;
    if (match.bicycleId === null) {
      this.stolenResolution = 'BLOCKED';
      this.closeStolenMatches();
      return;
    }
    this.isReportingSighting = true;
    this.calendarService.reportStolenSighting(this.serviceId, match.bicycleId).subscribe({
      next: () => {
        this.isReportingSighting = false;
        this.stolenResolution = 'BLOCKED';
        this.closeStolenMatches();
        this.notificationService.info('Właściciel roweru został powiadomiony. Przyjęcie zablokowane.');
      },
      error: (err: any) => {
        this.isReportingSighting = false;
        this.notificationService.error(err?.error?.message ?? 'Nie udało się powiadomić właściciela.');
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
        if (this.preselectedOrder) this.prefillFromOrder(this.preselectedOrder);
        this.isLoadingOrder = false;
      }
    });
  }

  private prefillFromOrder(order: any): void {
    this.bikeBrand = order.bicycle?.brand || order.bicycleBrand || '';
    this.bikeModel = order.bicycle?.model || order.bicycleModel || '';
    this.bikeType = order.bicycle?.type || order.bicycleType || '';
    this.frameNumber = order.bicycle?.frameNumber || order.bicycleFrameNumber || '';
    this.selectedTechnicianId = order.assignedTechnicianId ?? null;

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
    this.orderClientId = order.client?.id ?? order.clientId ?? null;

    if (this.stolenCheckCriteriaMet) {
      this.performStolenCheck();
    }
  }

  private filterSyntheticEmail(email: string): string {
    return email.endsWith('@local.cyclopick.pl') ? '' : email;
  }

  // ============================================
  // FORM
  // ============================================

  onClose(): void { this.close.emit(); }

  setMode(mode: ModalMode): void {
    this.mode = mode;
    this.selectedOrderId = null;
  }

  get selectedOrder(): CalendarOrder | undefined {
    return this.waitingOrders.find(o => o.id === this.selectedOrderId);
  }

  selectWaitingOrder(orderId: number): void {
    this.selectedOrderId = orderId;
    this.selectedTechnicianId = this.selectedOrder?.assignedTechnicianId ?? null;
  }

  /**
   * Widoczność selektora serwisanta: widoczny zawsze, gdy serwis ma wprowadzonego chociaż
   * jednego serwisanta (aktywnego lub nie) — niezależnie od trybu modala czy bieżącego
   * przypisania zlecenia.
   */
  get showTechnicianSelector(): boolean {
    return this.hasAnyTechnician;
  }

  get isDeliveryAddressValid(): boolean {
    if (this.pickupMethod !== 'delivery') return true;
    return !!(this.deliveryStreet.trim() && this.deliveryBuilding.trim() && this.deliveryCity.trim());
  }

  get isFormValid(): boolean {
    if (this.mode === 'select') {
      return this.selectedOrderId !== null && this.isDeliveryAddressValid;
    }
    const hasClient = !!(this.foundClient || (this.clientEmail.trim() || this.clientPhone.trim()));
    const hasBike = !!(this.selectedBikeId || this.bikeBrand.trim());
    const hasType = !!(this.selectedBikeId || this.bikeType.trim());
    return !!(hasClient && hasBike && hasType && this.isDeliveryAddressValid);
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    if (!this.isFormValid) { this.showValidation = true; return; }

    if (this.isStolenCheckStale) {
      if (this.stolenCheckCriteriaMet) {
        this.runStolenCheck();
        this.notificationService.warning('Dane roweru się zmieniły — sprawdziłem numer w bazie. Zobacz wynik i przyjmij ponownie.');
        return;
      }
      this.stolenMatches = [];
      this.stolenResolution = null;
      this.lastStolenCheckKey = null;
    }
    if (this.isCheckingStolen) return;
    if (this.stolenResolution === 'BLOCKED') {
      this.notificationService.error('Rower zgłoszony jako skradziony — nie można go przyjąć. Postępuj zgodnie z zaleceniami.');
      return;
    }
    if (this.hasStolenHit && this.stolenResolution === null) {
      this.showStolenMatches = true;
      this.notificationService.warning('Rozstrzygnij, czy któryś z pasujących rowerów to przyjmowany rower.');
      return;
    }

    this.isSubmitting = true;

    if (this.mode === 'select' && this.selectedOrderId) {
      this.assignTechnicianThenChangeStatus(this.selectedOrderId);
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
        ? {
            existingBicycleId: this.selectedBikeId,
            ...(this.stolenCheckVerified ? { frameNumber: this.frameNumber.trim(), stolenCheckVerified: true } : {})
          }
        : {
            brand: this.bikeBrand.trim(),
            model: this.bikeModel.trim() || undefined,
            type: this.bikeType.trim() || undefined,
            frameNumber: this.frameNumber.trim() || undefined,
            stolenCheckVerified: this.frameNumber.trim() ? this.stolenCheckVerified : undefined
          }
      ),
      description: this.description.trim() || undefined,
      assignedTechnicianId: this.selectedTechnicianId ?? undefined
    };

    this.calendarService.updateOrder(this.serviceId, orderId, updateData).subscribe({
      next: () => { this.changeStatusToInQueue(orderId); },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.update_order_failed'));
        this.isSubmitting = false;
        console.error('Error updating order data:', err);
      }
    });
  }

  private assignTechnicianThenChangeStatus(orderId: number): void {
    const currentTechnicianId = this.selectedOrder?.assignedTechnicianId ?? null;
    if (this.selectedTechnicianId != null && this.selectedTechnicianId !== currentTechnicianId) {
      this.calendarService.updateOrder(this.serviceId, orderId, { assignedTechnicianId: this.selectedTechnicianId }).subscribe({
        next: () => { this.changeStatusToInQueue(orderId); },
        // Nie blokujemy przyjęcia roweru z powodu nieudanego przypisania serwisanta.
        error: () => { this.changeStatusToInQueue(orderId); }
      });
    } else {
      this.changeStatusToInQueue(orderId);
    }
  }

  private changeStatusToInQueue(orderId: number): void {
    this.calendarService.updateOrderStatus(this.serviceId, orderId, 'IN_QUEUE').subscribe({
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
      ...(this.foundClient
        ? { clientId: this.foundClient.id }
        : {
            email: this.clientEmail.trim() || undefined,
            phone: this.clientPhone.trim() || undefined,
            firstName: this.clientName.trim() || 'Klient',
          }
      ),
      bicycles: [
        this.selectedBikeId
          ? {
              existingBicycleId: this.selectedBikeId,
              ...(this.stolenCheckVerified ? { frameNumber: this.frameNumber.trim(), stolenCheckVerified: true } : {})
            }
          : {
              brand: this.bikeBrand.trim(),
              model: this.bikeModel.trim() || undefined,
              type: this.bikeType.trim() || undefined,
              frameNumber: this.frameNumber.trim() || undefined,
              stolenCheckVerified: this.frameNumber.trim() ? this.stolenCheckVerified : undefined
            }
      ],
      plannedDate: formatCalendarDate(new Date()),
      description: this.description.trim() || undefined,
      assignedTechnicianId: this.selectedTechnicianId ?? undefined
    };

    this.calendarService.createOrder(this.serviceId, orderData).subscribe({
      next: (createdOrder) => {
        this.calendarService.updateOrderStatus(this.serviceId, createdOrder.id, 'IN_QUEUE').subscribe({
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
