import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/notification.service';
import { environment } from '../../environments/environments';

interface ExpressOrder {
  transportOrderId: number | null;
  serviceOrderIds: number[];
  plannedDate: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string | null;
  bikes: { serviceOrderId: number; brand: string; model: string }[];
  pickupAddress: string | null;
  status: string;
  statusLabel: string;
}

interface ExpressConfig {
  active: boolean;
  dailyBikeLimit: number | null;
  acceptedDays: string[];
  estimatedReservationDay: string | null;
}

interface ServiceOption {
  id: number;
  name: string;
  city: string;
  address: string;
}

interface ExpressPackage {
  id: number;
  packageLevel: string;
  packageLevelDisplayName: string;
  customName: string | null;
  displayName: string;
  bikeTypes: string[];
  price: number;
  description: string | null;
  active: boolean;
}

interface PackagesConfig {
  id: number;
  active: boolean;
  generalDescription: string | null;
  comment: string | null;
  defaultBikeType: string | null;
  packages: ExpressPackage[];
}

const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: { [k: string]: string } = {
  MONDAY: 'Pon', TUESDAY: 'Wt', WEDNESDAY: 'Śr',
  THURSDAY: 'Czw', FRIDAY: 'Pt', SATURDAY: 'Sob', SUNDAY: 'Nd'
};

@Component({
  selector: 'app-admin-express-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './admin-express-service.component.html',
  styleUrls: ['./admin-express-service.component.css']
})
export class AdminExpressServiceComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  activeTab: 'orders' | 'config' | 'packages' = 'orders';

  // Orders
  orders: ExpressOrder[] = [];
  loadingOrders = false;

  // Assignment modal
  showAssignModal = false;
  assigningOrder: ExpressOrder | null = null;
  serviceSearchQuery = '';
  serviceSearchResults: ServiceOption[] = [];
  searchingServices = false;
  selectedService: ServiceOption | null = null;
  assigning = false;

  // Config
  config: ExpressConfig | null = null;
  loadingConfig = false;
  savingConfig = false;
  configForm!: FormGroup;
  readonly allDays = ALL_DAYS;
  readonly dayLabels = DAY_LABELS;

  // Packages
  packagesConfig: PackagesConfig | null = null;
  loadingPackages = false;
  savingPackage = false;
  savingPackagesConfigActive = false;
  editingPackageId: number | null = null;
  showNewPackageForm = false;
  editForm: {
    customName: string;
    price: string;
    description: string;
    active: boolean;
    bikeTypes: string;
  } = { customName: '', price: '', description: '', active: true, bikeTypes: '' };
  newPackageForm: {
    packageLevel: string;
    customName: string;
    price: string;
    description: string;
    active: boolean;
    bikeTypes: string;
  } = { packageLevel: 'BASIC', customName: '', price: '', description: '', active: true, bikeTypes: '' };
  readonly packageLevels = ['BASIC', 'ADVANCED', 'FULL'];
  readonly packageLevelLabels: { [k: string]: string } = {
    BASIC: 'Podstawowy', ADVANCED: 'Rozszerzony', FULL: 'Pełny'
  };

  ngOnInit(): void {
    this.configForm = this.fb.group({
      active: [false],
      dailyBikeLimit: [null, [Validators.min(1), Validators.max(100)]],
      estimatedReservationDay: [null]
    });

    this.loadOrders();
    this.loadConfig();
    this.loadPackages();
  }

  selectTab(tab: 'orders' | 'config' | 'packages'): void {
    this.activeTab = tab;
  }

  // ===== ORDERS =====

  loadOrders(): void {
    this.loadingOrders = true;
    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.orders}`;
    this.http.get<ExpressOrder[]>(url).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loadingOrders = false;
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować zleceń ekspresowych');
        this.loadingOrders = false;
      }
    });
  }

  openAssignModal(order: ExpressOrder): void {
    this.assigningOrder = order;
    this.selectedService = null;
    this.serviceSearchQuery = '';
    this.serviceSearchResults = [];
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.assigningOrder = null;
    this.selectedService = null;
    this.serviceSearchQuery = '';
    this.serviceSearchResults = [];
  }

  onServiceSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.serviceSearchQuery = q;
    if (q.length < 2) {
      this.serviceSearchResults = [];
      return;
    }
    this.searchingServices = true;
    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.services}`;
    this.http.get<ServiceOption[]>(url, { params: { q } }).subscribe({
      next: (results) => {
        this.serviceSearchResults = results;
        this.searchingServices = false;
      },
      error: () => { this.searchingServices = false; }
    });
  }

  selectServiceForAssign(service: ServiceOption): void {
    this.selectedService = service;
    this.serviceSearchQuery = service.name;
    this.serviceSearchResults = [];
  }

  confirmAssign(): void {
    if (!this.assigningOrder || !this.selectedService || this.assigning) return;

    const transportOrderId = this.assigningOrder.transportOrderId;
    if (!transportOrderId) {
      this.notificationService.error('To zlecenie nie ma powiązanego zamówienia transportowego');
      return;
    }

    this.assigning = true;
    const url = environment.endpoints.admin.expressService.assignOrder
      .replace(':id', String(transportOrderId));
    this.http.post(`${environment.apiUrl}${url}`, null, {
      params: { serviceId: String(this.selectedService.id) }
    }).subscribe({
      next: () => {
        this.notificationService.success(`Zlecenie przypisane do ${this.selectedService!.name}`);
        this.assigning = false;
        this.closeAssignModal();
        this.loadOrders();
      },
      error: (err) => {
        const msg = err.error?.message || 'Nie udało się przypisać zlecenia';
        this.notificationService.error(msg);
        this.assigning = false;
      }
    });
  }

  formatBikes(bikes: { brand: string; model: string }[]): string {
    return bikes.map(b => `${b.brand}${b.model ? ' ' + b.model : ''}`).join(', ');
  }

  // ===== CONFIG =====

  loadConfig(): void {
    this.loadingConfig = true;
    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.config}`;
    this.http.get<ExpressConfig>(url).subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.configForm.patchValue({
          active: cfg.active,
          dailyBikeLimit: cfg.dailyBikeLimit,
          estimatedReservationDay: cfg.estimatedReservationDay
        });
        this.loadingConfig = false;
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować konfiguracji');
        this.loadingConfig = false;
      }
    });
  }

  isDaySelected(day: string): boolean {
    return this.config?.acceptedDays?.includes(day) ?? false;
  }

  toggleDay(day: string): void {
    if (!this.config) return;
    const days = [...(this.config.acceptedDays || [])];
    const idx = days.indexOf(day);
    if (idx >= 0) {
      days.splice(idx, 1);
    } else {
      days.push(day);
    }
    this.config = { ...this.config, acceptedDays: days };
  }

  saveConfig(): void {
    if (this.savingConfig) return;
    this.savingConfig = true;

    const formVal = this.configForm.value;
    const payload = {
      active: formVal.active,
      dailyBikeLimit: formVal.dailyBikeLimit ?? null,
      acceptedDays: this.config?.acceptedDays ?? [],
      estimatedReservationDay: formVal.estimatedReservationDay || null
    };

    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.config}`;
    this.http.put(url, payload).subscribe({
      next: () => {
        this.notificationService.success('Konfiguracja zapisana');
        this.savingConfig = false;
        this.loadConfig();
      },
      error: (err) => {
        const msg = err.error?.message || 'Nie udało się zapisać konfiguracji';
        this.notificationService.error(msg);
        this.savingConfig = false;
      }
    });
  }

  // ===== PACKAGES =====

  loadPackages(): void {
    this.loadingPackages = true;
    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.packages}`;
    this.http.get<PackagesConfig>(url).subscribe({
      next: (cfg) => {
        this.packagesConfig = cfg;
        this.loadingPackages = false;
      },
      error: () => {
        this.loadingPackages = false;
      }
    });
  }

  togglePackagesConfigActive(): void {
    if (!this.packagesConfig || this.savingPackagesConfigActive) return;

    const newActive = !this.packagesConfig.active;
    this.savingPackagesConfigActive = true;
    const payload = {
      generalDescription: this.packagesConfig.generalDescription,
      comment: this.packagesConfig.comment,
      defaultBikeType: this.packagesConfig.defaultBikeType,
      active: newActive
    };

    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.packagesConfig}`;
    this.http.put(url, payload).subscribe({
      next: () => {
        this.notificationService.success(newActive ? 'Sekcja pakietów opublikowana' : 'Sekcja pakietów ukryta');
        this.savingPackagesConfigActive = false;
        this.loadPackages();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Nie udało się zmienić statusu sekcji pakietów');
        this.savingPackagesConfigActive = false;
      }
    });
  }

  startEditPackage(pkg: ExpressPackage): void {
    this.editingPackageId = pkg.id;
    this.showNewPackageForm = false;
    this.editForm = {
      customName: pkg.customName ?? '',
      price: String(pkg.price ?? ''),
      description: pkg.description ?? '',
      active: pkg.active,
      bikeTypes: (pkg.bikeTypes ?? []).join(', ')
    };
  }

  cancelEditPackage(): void {
    this.editingPackageId = null;
  }

  saveEditPackage(packageId: number): void {
    if (this.savingPackage) return;
    this.savingPackage = true;
    const payload = {
      customName: this.editForm.customName || null,
      price: parseFloat(this.editForm.price) || 0,
      description: this.editForm.description || null,
      active: this.editForm.active,
      bikeTypes: this.editForm.bikeTypes ? this.editForm.bikeTypes.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.packages}/${packageId}`;
    this.http.put(url, payload).subscribe({
      next: () => {
        this.notificationService.success('Pakiet zapisany');
        this.savingPackage = false;
        this.editingPackageId = null;
        this.loadPackages();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Nie udało się zapisać pakietu');
        this.savingPackage = false;
      }
    });
  }

  openNewPackageForm(): void {
    this.showNewPackageForm = true;
    this.editingPackageId = null;
    this.newPackageForm = { packageLevel: 'BASIC', customName: '', price: '', description: '', active: true, bikeTypes: '' };
  }

  cancelNewPackage(): void {
    this.showNewPackageForm = false;
  }

  saveNewPackage(): void {
    if (this.savingPackage) return;
    this.savingPackage = true;
    const payload = {
      packageLevel: this.newPackageForm.packageLevel,
      customName: this.newPackageForm.customName || null,
      price: parseFloat(this.newPackageForm.price) || 0,
      description: this.newPackageForm.description || null,
      active: this.newPackageForm.active,
      bikeTypes: this.newPackageForm.bikeTypes ? this.newPackageForm.bikeTypes.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.packages}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.notificationService.success('Pakiet dodany');
        this.savingPackage = false;
        this.showNewPackageForm = false;
        this.loadPackages();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Nie udało się dodać pakietu');
        this.savingPackage = false;
      }
    });
  }

  deletePackage(packageId: number): void {
    if (!confirm('Usunąć ten pakiet?')) return;
    const url = `${environment.apiUrl}${environment.endpoints.admin.expressService.packages}/${packageId}`;
    this.http.delete(url).subscribe({
      next: () => {
        this.notificationService.success('Pakiet usunięty');
        this.loadPackages();
      },
      error: () => this.notificationService.error('Nie udało się usunąć pakietu')
    });
  }
}
