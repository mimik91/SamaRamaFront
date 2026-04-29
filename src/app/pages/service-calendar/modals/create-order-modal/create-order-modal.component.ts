import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { I18nService } from '../../../../core/i18n.service';
import { NotificationService } from '../../../../core/notification.service';
import { EnumerationService } from '../../../../core/enumeration.service';
import { ServiceCalendarService } from '../../services/service-calendar.service';
import {
  CreateCalendarOrderDto,
  BikeInOrderDto,
  CalendarMode,
  Technician,
  ClientLookupResult,
  ClientBike
} from '../../../../shared/models/service-calendar.models';

export type CreateOrderMode = 'reservation' | 'acceptBike';

interface BikeEntry {
  existingBikeId: number | null;
  brand: string;
  model: string;
  filteredBrands: string[];
  showDropdown: boolean;
}

@Component({
  selector: 'app-create-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-order-modal.component.html',
  styleUrls: ['./create-order-modal.component.css']
})
export class CreateOrderModalComponent implements OnInit, OnDestroy {
  private i18nService = inject(I18nService);
  private notificationService = inject(NotificationService);
  private calendarService = inject(ServiceCalendarService);
  private enumerationService = inject(EnumerationService);
  private elementRef = inject(ElementRef);

  @Input() serviceId!: number;
  @Input() preselectedDate: string | null = null;
  @Input() technicians: Technician[] = [];
  @Input() calendarMode: CalendarMode = 'SIMPLE';
  @Input() mode: CreateOrderMode = 'reservation';

  @Output() close = new EventEmitter<void>();
  @Output() orderCreated = new EventEmitter<void>();

  // Dane klienta
  customerEmail: string = '';
  customerPhone: string = '';
  customerFirstName: string = '';
  customerLastName: string = '';

  // Tablica rowerów
  bikes: BikeEntry[] = [this.createEmptyBike()];

  // Dane zlecenia
  orderDate: string = '';
  orderTime: string = '00:00';
  orderNotes: string = '';

  readonly hours: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutes: string[] = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  get orderHour(): string { return this.orderTime.split(':')[0] ?? '00'; }
  set orderHour(h: string) { this.orderTime = `${h}:${this.orderMinute}`; }
  get orderMinute(): string { return this.orderTime.split(':')[1] ?? '00'; }
  set orderMinute(m: string) { this.orderTime = `${this.orderHour}:${m}`; }

  selectedTechnicianId: number | null = null;

  isSubmitting: boolean = false;

  allBrands: string[] = [];
  loadingBrands: boolean = false;

  foundClient: ClientLookupResult | null = null;
  clientBikes: ClientBike[] = [];
  isLookingUpClient: boolean = false;

  private destroy$ = new Subject<void>();

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  private createEmptyBike(): BikeEntry {
    return { existingBikeId: null, brand: '', model: '', filteredBrands: [], showDropdown: false };
  }

  ngOnInit(): void {
    const today = new Date();
    const todayFormatted = this.formatDate(today);

    if (this.mode === 'acceptBike') {
      this.orderDate = todayFormatted;
    } else if (this.preselectedDate) {
      this.orderDate = this.preselectedDate;
    } else {
      this.orderDate = todayFormatted;
    }

    this.loadBrands();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // ZARZĄDZANIE TABLICĄ ROWERÓW
  // ============================================

  addBike(): void {
    this.bikes.push(this.createEmptyBike());
  }

  removeBike(i: number): void {
    this.bikes.splice(i, 1);
  }

  // ============================================
  // BRAND AUTOCOMPLETE (indeksowane)
  // ============================================

  private loadBrands(): void {
    this.loadingBrands = true;
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => { this.allBrands = brands; this.loadingBrands = false; },
      error: (err) => { console.error('Error loading brands:', err); this.loadingBrands = false; }
    });
  }

  onBrandInput(event: Event, i: number): void {
    const query = (event.target as HTMLInputElement).value;
    this.bikes[i].brand = query;
    if (query.length >= 3) {
      this.bikes[i].filteredBrands = this.allBrands.filter(b => b.toLowerCase().includes(query.toLowerCase()));
      this.bikes[i].showDropdown = this.bikes[i].filteredBrands.length > 0;
    } else {
      this.bikes[i].showDropdown = false;
    }
  }

  onBrandFocus(i: number): void {
    if (this.bikes[i].brand.length >= 3 && this.bikes[i].filteredBrands.length > 0) {
      this.bikes[i].showDropdown = true;
    }
  }

  selectBrand(brand: string, i: number): void {
    this.bikes[i].brand = brand;
    this.bikes[i].showDropdown = false;
  }

  expandAllBrands(i: number): void {
    this.bikes[i].filteredBrands = [...this.allBrands];
    this.bikes[i].showDropdown = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.bikes.forEach(b => b.showDropdown = false);
    }
  }

  // ============================================
  // CLIENT LOOKUP
  // ============================================

  onEmailBlur(): void {
    if (this.foundClient || this.isLookingUpClient) return;
    if (!this.customerEmail) { this.resetClientLookup(); return; }
    if (this.customerEmail.length >= 5 && this.customerEmail.includes('@') && this.customerEmail.includes('.')) {
      this.performClientLookup(this.customerEmail, undefined);
    }
  }

  onPhoneBlur(): void {
    if (this.foundClient || this.isLookingUpClient) return;
    if (!this.customerPhone) { this.resetClientLookup(); return; }
    const digits = this.customerPhone.replace(/\D/g, '');
    if (digits.length >= 9) {
      this.performClientLookup(undefined, this.customerPhone);
    }
  }

  private performClientLookup(email?: string, phone?: string): void {
    this.isLookingUpClient = true;
    this.calendarService.lookupClient(email, phone).subscribe({
      next: (client) => {
        this.foundClient = client;
        this.customerFirstName = client.firstName;
        this.customerLastName = client.lastName || '';
        if (email && client.phone) this.customerPhone = client.phone;
        if (phone && client.email) this.customerEmail = client.email;
        this.isLookingUpClient = false;
        this.loadClientBikes(client.id);
      },
      error: () => {
        this.foundClient = null;
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

  onBikeSelected(bikeId: number | null, i: number): void {
    if (bikeId === null) {
      this.bikes[i].brand = '';
      this.bikes[i].model = '';
      return;
    }
    const bike = this.clientBikes.find(b => b.id === bikeId);
    if (bike) {
      this.bikes[i].brand = bike.brand;
      this.bikes[i].model = bike.model;
    }
  }

  resetClientLookup(): void {
    this.foundClient = null;
    this.clientBikes = [];
    this.bikes = [this.createEmptyBike()];
  }

  // ============================================
  // FORM
  // ============================================

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.onClose();
  }

  onClose(): void { this.close.emit(); }

  get isFormValid(): boolean {
    const hasClient = !!(
      this.foundClient ||
      (this.customerFirstName.trim() && (this.customerEmail.trim() || this.customerPhone.trim()))
    );
    const allBikesValid = this.bikes.every(bike => bike.existingBikeId !== null || bike.brand.trim());
    return !!(hasClient && allBikesValid && this.orderDate);
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;

    const bicycles: BikeInOrderDto[] = this.bikes.map(bike =>
      bike.existingBikeId !== null
        ? { existingBicycleId: bike.existingBikeId }
        : {
            brand: bike.brand.trim(),
            model: bike.model.trim() || undefined
          }
    );

    const orderData: CreateCalendarOrderDto = {
      ...(this.foundClient
        ? { clientId: this.foundClient.id }
        : {
            email: this.customerEmail.trim() || undefined,
            phone: this.customerPhone.trim() || undefined,
            firstName: this.customerFirstName.trim(),
            lastName: this.customerLastName.trim() || undefined
          }
      ),
      bicycles,
      plannedDate: this.orderDate,
      plannedTime: this.orderTime && this.orderTime !== '00:00' ? this.orderTime : undefined,
      description: this.orderNotes.trim() || undefined,
      assignedTechnicianId: this.selectedTechnicianId || undefined,
      initialStatus: this.mode === 'acceptBike' ? 'IN_PROGRESS' : undefined
    };

    this.calendarService.createOrder(this.serviceId, orderData).subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.order_created'));
        this.isSubmitting = false;
        this.orderCreated.emit();
      },
      error: (err: any) => {
        this.notificationService.error(this.t('service_calendar.errors.create_order_failed'));
        this.isSubmitting = false;
        console.error('Error creating order:', err);
      }
    });
  }
}
