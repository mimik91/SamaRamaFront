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
  CalendarMode,
  Technician,
  ClientLookupResult,
  ClientBike
} from '../../../../shared/models/service-calendar.models';

export type CreateOrderMode = 'reservation' | 'acceptBike';

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

  // Form data
  customerEmail: string = '';
  customerPhone: string = '';
  customerFirstName: string = '';
  customerLastName: string = '';

  bikeBrand: string = '';
  bikeModel: string = '';

  orderDate: string = '';
  orderNotes: string = '';
  selectedTechnicianId: number | null = null;

  // State
  isSubmitting: boolean = false;

  // Brand autocomplete
  allBrands: string[] = [];
  filteredBrands: string[] = [];
  showBrandDropdown: boolean = false;
  loadingBrands: boolean = false;

  // Client lookup
  foundClient: ClientLookupResult | null = null;
  clientBikes: ClientBike[] = [];
  isLookingUpClient: boolean = false;
  selectedBikeId: number | null = null;
  private destroy$ = new Subject<void>();

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
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

    // Load brands for autocomplete
    this.loadBrands();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // BRAND AUTOCOMPLETE
  // ============================================

  private loadBrands(): void {
    this.loadingBrands = true;
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => {
        this.allBrands = brands;
        this.loadingBrands = false;
      },
      error: (err) => {
        console.error('Error loading brands:', err);
        this.loadingBrands = false;
      }
    });
  }

  onBrandInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.bikeBrand = query;

    if (query.length >= 3) {
      this.filteredBrands = this.allBrands.filter(brand =>
        brand.toLowerCase().includes(query.toLowerCase())
      );
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
    if (!this.customerEmail) {
      this.resetClientLookup();
      return;
    }
    if (this.customerEmail.length >= 5 && this.customerEmail.includes('@') && this.customerEmail.includes('.')) {
      this.performClientLookup(this.customerEmail, undefined);
    }
  }

  onPhoneBlur(): void {
    if (!this.customerPhone) {
      this.resetClientLookup();
      return;
    }
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

  onBikeSelected(bikeId: number | null): void {
    if (bikeId === null) {
      this.bikeBrand = '';
      this.bikeModel = '';
      return;
    }
    const bike = this.clientBikes.find(b => b.id === bikeId);
    if (bike) {
      this.bikeBrand = bike.brand;
      this.bikeModel = bike.model;
    }
  }

  resetClientLookup(): void {
    this.foundClient = null;
    this.clientBikes = [];
    this.selectedBikeId = null;
    this.bikeBrand = '';
    this.bikeModel = '';
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
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  get isFormValid(): boolean {
    const hasClient = !!(
      this.foundClient ||
      (this.customerFirstName.trim() && (this.customerEmail.trim() || this.customerPhone.trim()))
    );
    const hasBike = !!(this.selectedBikeId || this.bikeBrand.trim());
    return !!(hasClient && hasBike && this.orderDate);
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;

    const orderData: CreateCalendarOrderDto = {
      // Dane klienta
      ...(this.foundClient
        ? { clientId: this.foundClient.id }
        : {
            email: this.customerEmail.trim() || undefined,
            phone: this.customerPhone.trim() || undefined,
            firstName: this.customerFirstName.trim(),
            lastName: this.customerLastName.trim() || undefined
          }
      ),
      // Dane roweru
      ...(this.selectedBikeId
        ? { existingBicycleId: this.selectedBikeId }
        : {
            brand: this.bikeBrand.trim(),
            model: this.bikeModel.trim() || undefined
          }
      ),
      plannedDate: this.orderDate,
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
