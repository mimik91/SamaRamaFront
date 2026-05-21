import { Component, OnInit, OnDestroy, HostListener, Input, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../core/i18n.service';
import { environment } from '../../../environments/environments';
import { ServicePackagesService } from './service-packages.service';
import { parsePrice, formatPrice } from '../../../shared/models/service-pricelist.models';
import {
  ServicePackageDto,
  ServicePackagesConfigDto,
  PackageLevel,
  CreatePackageDto,
  UpdatePackageDto,
  PackagesConfigSettingsDto,
  EditingPackage,
  } from '../../../shared/models/service-packages.models';

@Component({
  selector: 'app-service-admin-packages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-admin-packages.component.html',
  styleUrls: ['./service-admin-packages.component.css']
})
export class ServiceAdminPackagesComponent implements OnInit, OnDestroy {
  private packagesService = inject(ServicePackagesService);
  private i18nService = inject(I18nService);
  private platformId = inject(PLATFORM_ID);
  private readonly apiUrl = `${environment.apiUrl}${environment.endpoints.bikeServicesRegistered.base}`;

  @Input() serviceId!: number;

  isLoading = true;
  isSaving = false;
  isEditingSettings = false;
  error: string = '';
  successMessage: string = '';

  packagesConfig: ServicePackagesConfigDto | null = null;
  allBikeTypes: string[] = [];
  selectedBikeType: string | null = null;

  generalDescription: string = '';
  comment: string = '';
  defaultBikeType: string | null = null;
  configActive: boolean = false;
  originalSettings: PackagesConfigSettingsDto | null = null;

  editingPackages = new Map<PackageLevel, EditingPackage>();
  PackageLevel = PackageLevel;

  ngOnInit(): void {
    if (!this.serviceId) {
      this.error = 'pricelist.packages.errors.no_service_id';
      this.isLoading = false;
      return;
    }
    this.loadPackages();
  }

  loadPackages(): void {
    this.isLoading = true;
    this.error = '';

    Promise.all([
      this.packagesService.getMyPackagesConfig(this.serviceId).toPromise(),
      this.packagesService.getBikeTypes(this.serviceId).toPromise()
    ])
      .then(([config, bikeTypes]) => {
        if (config && bikeTypes) {
          this.packagesConfig = config;
          this.allBikeTypes = bikeTypes.sort((a, b) => a.localeCompare(b, 'pl'));

          this.generalDescription = config.generalDescription || '';
          this.comment = config.comment || '';
          this.defaultBikeType = config.defaultBikeType;
          this.configActive = config.active;

          if (this.allBikeTypes.length > 0 && !this.selectedBikeType) {
            this.selectedBikeType = this.defaultBikeType || this.allBikeTypes[0];
          }

          this.isLoading = false;
        }
      })
      .catch(err => {
        console.error('Error loading packages:', err);
        this.error = 'pricelist.packages.errors.load_failed';
        this.isLoading = false;
      });
  }

  // ===== USTAWIENIA GLOBALNE =====

  startEditingSettings(): void {
    this.originalSettings = {
      generalDescription: this.generalDescription,
      comment: this.comment,
      defaultBikeType: this.defaultBikeType,
      active: this.configActive
    };
    this.isEditingSettings = true;
    this.successMessage = '';
    this.error = '';
  }

  cancelEditingSettings(): void {
    if (this.originalSettings) {
      this.generalDescription = this.originalSettings.generalDescription || '';
      this.comment = this.originalSettings.comment || '';
      this.defaultBikeType = this.originalSettings.defaultBikeType;
      this.configActive = this.originalSettings.active;
      this.originalSettings = null;
    }
    this.isEditingSettings = false;
    this.error = '';
  }

  saveSettings(): void {
    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    const settings: PackagesConfigSettingsDto = {
      generalDescription: this.generalDescription || null,
      comment: this.comment || null,
      defaultBikeType: this.defaultBikeType,
      active: this.configActive
    };

    this.packagesService.updatePackagesConfigSettings(this.serviceId, settings)
      .subscribe({
        next: () => {
          this.successMessage = 'pricelist.packages.messages.settings_saved';
          this.isEditingSettings = false;
          this.isSaving = false;
          this.originalSettings = null;
          this.loadPackages();
          setTimeout(() => { this.successMessage = ''; }, 5000);
        },
        error: (err) => {
          console.error('Error saving settings:', err);
          this.error = err.error?.error || 'pricelist.packages.errors.save_settings_failed';
          this.isSaving = false;
        }
      });
  }

  // ===== FILTROWANIE PAKIETÓW =====

  getFilteredPackages(): ServicePackageDto[] {
    if (!this.packagesConfig || !this.selectedBikeType) return [];
    return this.packagesService.filterPackagesByBikeType(
      this.packagesConfig.packages,
      this.selectedBikeType
    );
  }

  getPackageByLevel(level: PackageLevel): ServicePackageDto | undefined {
    return this.getFilteredPackages().find(pkg => pkg.packageLevel === level);
  }

  // ===== TWORZENIE/EDYCJA PAKIETU =====

  startCreatingPackage(level: PackageLevel): void {
    this.editingPackages.set(level, {
      packageId: null,
      packageLevel: level,
      customName: '',
      bikeTypes: this.selectedBikeType ? new Set([this.selectedBikeType]) : new Set(),
      price: null,
      description: '',
      active: true
    });
    this.successMessage = '';
    this.error = '';
    this.initTextareaHeights();
  }

  startEditingPackage(pkg: ServicePackageDto): void {
    this.editingPackages.set(pkg.packageLevel, {
      packageId: pkg.id,
      packageLevel: pkg.packageLevel,
      customName: pkg.customName || '',
      bikeTypes: new Set(pkg.bikeTypes),
      price: pkg.price,
      description: pkg.description || '',
      active: pkg.active
    });
    this.successMessage = '';
    this.error = '';
    this.initTextareaHeights();
  }

  getEditingPackage(level: PackageLevel): EditingPackage | undefined {
    return this.editingPackages.get(level);
  }

  private initTextareaHeights(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      document.querySelectorAll('.package-form textarea').forEach(el => {
        const ta = el as HTMLTextAreaElement;
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      });
    }, 0);
  }

  autoResizeTextarea(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  ngOnDestroy(): void {
    for (const [, pkg] of this.editingPackages) {
      if (pkg.bikeTypes.size === 0 || !pkg.price || pkg.price <= 0) continue;
      const bikeTypesArray = Array.from(pkg.bikeTypes);
      if (pkg.packageId === null) {
        this.packagesService.createPackage(this.serviceId, {
          packageLevel: pkg.packageLevel,
          customName: pkg.customName || null,
          bikeTypes: bikeTypesArray,
          price: pkg.price,
          description: pkg.description || null,
          active: pkg.active
        }).subscribe();
      } else {
        this.packagesService.updatePackage(pkg.packageId, {
          customName: pkg.customName || null,
          bikeTypes: bikeTypesArray,
          price: pkg.price,
          description: pkg.description || null,
          active: pkg.active
        }).subscribe();
      }
    }
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    if (!isPlatformBrowser(this.platformId) || this.editingPackages.size === 0) return;

    const sessionStr = localStorage.getItem('auth_session');
    if (!sessionStr) return;

    try {
      const session = JSON.parse(sessionStr) as { token: string };
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };

      for (const [, pkg] of this.editingPackages) {
        if (pkg.bikeTypes.size === 0 || !pkg.price || pkg.price <= 0) continue;
        const bikeTypesArray = Array.from(pkg.bikeTypes);
        if (pkg.packageId === null) {
          fetch(`${this.apiUrl}/my-service/packages?serviceId=${this.serviceId}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              packageLevel: pkg.packageLevel,
              customName: pkg.customName || null,
              bikeTypes: bikeTypesArray,
              price: pkg.price,
              description: pkg.description || null,
              active: pkg.active
            }),
            keepalive: true
          });
        } else {
          fetch(`${this.apiUrl}/my-service/packages/${pkg.packageId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              customName: pkg.customName || null,
              bikeTypes: bikeTypesArray,
              price: pkg.price,
              description: pkg.description || null,
              active: pkg.active
            }),
            keepalive: true
          });
        }
      }
    } catch { /* best-effort */ }
  }

  cancelEditingPackage(level: PackageLevel): void {
    this.editingPackages.delete(level);
    this.error = '';
  }

  toggleBikeType(level: PackageLevel, bikeType: string): void {
    const pkg = this.editingPackages.get(level);
    if (!pkg) return;
    if (pkg.bikeTypes.has(bikeType)) {
      pkg.bikeTypes.delete(bikeType);
    } else {
      pkg.bikeTypes.add(bikeType);
    }
  }

  isBikeTypeSelected(level: PackageLevel, bikeType: string): boolean {
    return this.editingPackages.get(level)?.bikeTypes.has(bikeType) || false;
  }

  savePackage(level: PackageLevel): void {
    const editingPackage = this.editingPackages.get(level);
    if (!editingPackage) return;

    if (editingPackage.bikeTypes.size === 0) {
      this.error = 'pricelist.packages.validation.bike_types_required';
      return;
    }

    if (!editingPackage.price || editingPackage.price <= 0) {
      this.error = 'pricelist.packages.validation.price_required';
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    const bikeTypesArray = Array.from(editingPackage.bikeTypes);

    if (editingPackage.packageId === null) {
      const createDto: CreatePackageDto = {
        packageLevel: editingPackage.packageLevel,
        customName: editingPackage.customName || null,
        bikeTypes: bikeTypesArray,
        price: editingPackage.price,
        description: editingPackage.description || null,
        active: editingPackage.active
      };

      this.packagesService.createPackage(this.serviceId, createDto)
        .subscribe({
          next: () => {
            this.successMessage = 'pricelist.packages.messages.package_created';
            this.editingPackages.delete(level);
            this.isSaving = false;
            this.loadPackages();
            setTimeout(() => { this.successMessage = ''; }, 5000);
          },
          error: (err) => {
            console.error('Error creating package:', err);
            this.error = err.error?.error || 'pricelist.packages.errors.create_failed';
            this.isSaving = false;
          }
        });
    } else {
      const updateDto: UpdatePackageDto = {
        customName: editingPackage.customName || null,
        bikeTypes: bikeTypesArray,
        price: editingPackage.price,
        description: editingPackage.description || null,
        active: editingPackage.active
      };

      this.packagesService.updatePackage(editingPackage.packageId, updateDto)
        .subscribe({
          next: () => {
            this.successMessage = 'pricelist.packages.messages.package_updated';
            this.editingPackages.delete(level);
            this.isSaving = false;
            this.loadPackages();
            setTimeout(() => { this.successMessage = ''; }, 5000);
          },
          error: (err) => {
            console.error('Error updating package:', err);
            this.error = err.error?.error || 'pricelist.packages.errors.update_failed';
            this.isSaving = false;
          }
        });
    }
  }

  onPriceChange(level: PackageLevel, newPrice: string): void {
    const pkg = this.editingPackages.get(level);
    if (!pkg) return;
    pkg.price = parsePrice(newPrice);
  }

  // ===== USUWANIE PAKIETU =====

  deletePackage(pkg: ServicePackageDto): void {
    if (!confirm(this.t('pricelist.packages.confirm.delete_package'))) return;

    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    this.packagesService.deletePackage(pkg.id)
      .subscribe({
        next: () => {
          this.successMessage = 'pricelist.packages.messages.package_deleted';
          this.isSaving = false;
          this.loadPackages();
          setTimeout(() => { this.successMessage = ''; }, 5000);
        },
        error: (err) => {
          console.error('Error deleting package:', err);
          this.error = err.error?.error || 'pricelist.packages.errors.delete_failed';
          this.isSaving = false;
        }
      });
  }

  // ===== POMOCNICZE METODY =====

  getPackageLevelDisplayName(level: PackageLevel): string {
    return this.packagesService.getPackageLevelDisplayName(level);
  }

  getAllPackageLevels(): PackageLevel[] {
    return this.packagesService.getAllPackageLevels();
  }

  isEditingPackageLevel(level: PackageLevel): boolean {
    return this.editingPackages.has(level);
  }

  formatPrice(price: number): string {
    return formatPrice(price);
  }

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  trackByBikeType(index: number, bikeType: string): string {
    return bikeType;
  }

  trackByPackageId(index: number, pkg: ServicePackageDto): number {
    return pkg.id;
  }
}
