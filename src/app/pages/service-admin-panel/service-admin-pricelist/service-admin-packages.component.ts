import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../core/i18n.service';
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
export class ServiceAdminPackagesComponent implements OnInit {
  private packagesService = inject(ServicePackagesService);
  private i18nService = inject(I18nService);

  @Input() serviceId!: number;

  // Stan komponentu
  isLoading = true;
  isSaving = false;
  isEditingSettings = false;
  error: string = '';
  successMessage: string = '';

  // Dane pakietów
  packagesConfig: ServicePackagesConfigDto | null = null;
  allBikeTypes: string[] = [];
  selectedBikeType: string | null = null;

  // Ustawienia globalne
  generalDescription: string = '';
  comment: string = '';
  defaultBikeType: string | null = null;
  configActive: boolean = false;
  originalSettings: PackagesConfigSettingsDto | null = null;

  // Edycja pakietu
  editingPackage: EditingPackage | null = null;
  PackageLevel = PackageLevel; // Eksport do template

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
          
          // Ustaw globalne ustawienia
          this.generalDescription = config.generalDescription || '';
          this.comment = config.comment || '';
          this.defaultBikeType = config.defaultBikeType;
          this.configActive = config.active;

          // Automatycznie wybierz domyślny typ roweru lub pierwszy z listy
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

          // Odśwież dane
          this.loadPackages();

          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
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
    if (!this.packagesConfig || !this.selectedBikeType) {
      return [];
    }
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
    this.editingPackage = {
      packageId: null,
      packageLevel: level,
      customName: '',
      bikeTypes: this.selectedBikeType ? new Set([this.selectedBikeType]) : new Set(),
      price: null,
      description: '',
      active: true
    };
    this.successMessage = '';
    this.error = '';
  }

  startEditingPackage(pkg: ServicePackageDto): void {
    this.editingPackage = {
      packageId: pkg.id,
      packageLevel: pkg.packageLevel,
      customName: pkg.customName || '',
      bikeTypes: new Set(pkg.bikeTypes),
      price: pkg.price,
      description: pkg.description || '',
      active: pkg.active
    };
    this.successMessage = '';
    this.error = '';
  }

  cancelEditingPackage(): void {
    this.editingPackage = null;
    this.error = '';
  }

  toggleBikeType(bikeType: string): void {
    if (!this.editingPackage) return;

    if (this.editingPackage.bikeTypes.has(bikeType)) {
      this.editingPackage.bikeTypes.delete(bikeType);
    } else {
      this.editingPackage.bikeTypes.add(bikeType);
    }
  }

  isBikeTypeSelected(bikeType: string): boolean {
    return this.editingPackage?.bikeTypes.has(bikeType) || false;
  }

  savePackage(): void {
    if (!this.editingPackage) return;

    // Walidacja
    if (this.editingPackage.bikeTypes.size === 0) {
      this.error = 'pricelist.packages.validation.bike_types_required';
      return;
    }

    if (!this.editingPackage.price || this.editingPackage.price <= 0) {
      this.error = 'pricelist.packages.validation.price_required';
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    const bikeTypesArray = Array.from(this.editingPackage.bikeTypes);

    if (this.editingPackage.packageId === null) {
      // Tworzenie nowego pakietu
      const createDto: CreatePackageDto = {
        packageLevel: this.editingPackage.packageLevel,
        customName: this.editingPackage.customName || null,
        bikeTypes: bikeTypesArray,
        price: this.editingPackage.price,
        description: this.editingPackage.description || null,
        active: this.editingPackage.active
      };

      this.packagesService.createPackage(this.serviceId, createDto)
        .subscribe({
          next: () => {
            this.successMessage = 'pricelist.packages.messages.package_created';
            this.editingPackage = null;
            this.isSaving = false;
            this.loadPackages();

            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          },
          error: (err) => {
            console.error('Error creating package:', err);
            this.error = err.error?.error || 'pricelist.packages.errors.create_failed';
            this.isSaving = false;
          }
        });
    } else {
      // Aktualizacja istniejącego pakietu
      const updateDto: UpdatePackageDto = {
        customName: this.editingPackage.customName || null,
        bikeTypes: bikeTypesArray,
        price: this.editingPackage.price,
        description: this.editingPackage.description || null,
        active: this.editingPackage.active
      };

      this.packagesService.updatePackage(this.editingPackage.packageId, updateDto)
        .subscribe({
          next: () => {
            this.successMessage = 'pricelist.packages.messages.package_updated';
            this.editingPackage = null;
            this.isSaving = false;
            this.loadPackages();

            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          },
          error: (err) => {
            console.error('Error updating package:', err);
            this.error = err.error?.error || 'pricelist.packages.errors.update_failed';
            this.isSaving = false;
          }
        });
    }
  }

  // ===== USUWANIE PAKIETU =====

  deletePackage(pkg: ServicePackageDto): void {
    if (!confirm(this.t('pricelist.packages.confirm.delete_package'))) {
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    this.packagesService.deletePackage(pkg.id)
      .subscribe({
        next: () => {
          this.successMessage = 'pricelist.packages.messages.package_deleted';
          this.isSaving = false;
          this.loadPackages();

          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
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
    return this.editingPackage?.packageLevel === level;
  }

  onPriceChange(newPrice: string): void {
    if (!this.editingPackage) return;
    this.editingPackage.price = parsePrice(newPrice);
  }

  formatPrice(price: number): string {
    return formatPrice(price);
  }

  // Pomocnicza metoda do tłumaczeń
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