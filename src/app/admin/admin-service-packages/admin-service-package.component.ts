import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicePackage } from '../../service-package/service-package.model';
import { ServicePackageService } from '../../service-package/service-package.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-admin-service-packages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-service-package.component.html',
  styleUrls: ['./admin-service-package.component.css']
})
export class AdminServicePackagesComponent implements OnInit {
  private servicePackageService = inject(ServicePackageService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Data
  servicePackages: ServicePackage[] = [];
  selectedPackage: ServicePackage | null = null;
  
  // State
  loading = true;
  saving = false;
  error: string | null = null;
  isEditing = false;
  isAddingNew = false;
  
  // Forms
  packageForm: FormGroup;
  
  constructor() {
    this.packageForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      price: [0, [Validators.required, Validators.min(0)]],
      active: [true],
      displayOrder: [0, [Validators.min(0)]],
      features: this.fb.array([])
    });
  }
  
  get featuresArray(): FormArray {
    return this.packageForm.get('features') as FormArray;
  }

  ngOnInit(): void {
    this.loadServicePackages();
  }
  
  private loadServicePackages(): void {
    this.loading = true;
    this.error = null;
    
    this.servicePackageService.getAllPackages().subscribe({
      next: (packages) => {
        this.servicePackages = packages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading service packages:', err);
        this.error = 'Nie udało się załadować pakietów serwisowych. Spróbuj ponownie później.';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }
  
  selectPackage(packageId: number): void {
    this.selectedPackage = this.servicePackages.find(p => p.id === packageId) || null;
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  startEditing(): void {
    if (!this.selectedPackage) return;
    
    this.resetForm();
    this.packageForm.patchValue({
      code: this.selectedPackage.code,
      name: this.selectedPackage.name,
      description: this.selectedPackage.description || '',
      price: this.selectedPackage.price,
      active: this.selectedPackage.active !== false, // Default to true if undefined
      displayOrder: this.selectedPackage.displayOrder || 0
    });
    
    // Add features
    if (this.selectedPackage.features) {
      this.selectedPackage.features.forEach(feature => {
        this.addFeature(feature);
      });
    }
    
    this.isEditing = true;
    this.isAddingNew = false;
  }
  
  startAddingNew(): void {
    this.resetForm();
    this.selectedPackage = null;
    this.isEditing = false;
    this.isAddingNew = true;
    
    // Add a few empty feature fields
    for (let i = 0; i < 3; i++) {
      this.addFeature();
    }
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  private resetForm(): void {
    this.packageForm.reset({
      code: '',
      name: '',
      description: '',
      price: 0,
      active: true,
      displayOrder: 0
    });
    
    // Clear features array
    while (this.featuresArray.length !== 0) {
      this.featuresArray.removeAt(0);
    }
  }
  
  addFeature(value: string = ''): void {
    this.featuresArray.push(this.fb.control(value, [Validators.required]));
  }
  
  removeFeature(index: number): void {
    this.featuresArray.removeAt(index);
  }
  
  savePackage(): void {
    if (this.packageForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.packageForm.controls).forEach(key => {
        const control = this.packageForm.get(key);
        control?.markAsTouched();
      });
      
      // Also mark all features as touched
      for (let i = 0; i < this.featuresArray.length; i++) {
        this.featuresArray.at(i).markAsTouched();
      }
      
      this.notificationService.warning('Formularz zawiera błędy. Popraw je przed zapisaniem.');
      return;
    }
    
    this.saving = true;
    
    const packageData = {
      code: this.packageForm.value.code,
      name: this.packageForm.value.name,
      description: this.packageForm.value.description || undefined,
      price: Number(this.packageForm.value.price),
      active: this.packageForm.value.active,
      displayOrder: Number(this.packageForm.value.displayOrder) || undefined,
      features: this.featuresArray.value.filter((feature: string) => feature.trim() !== '')
    };
    
    if (this.isAddingNew) {
      // Create new package
      this.servicePackageService.createPackage(packageData).subscribe({
        next: (response) => {
          this.notificationService.success('Pakiet serwisowy został utworzony');
          this.saving = false;
          this.isAddingNew = false;
          this.loadServicePackages();
        },
        error: (err) => {
          console.error('Error creating service package:', err);
          this.saving = false;
          this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas tworzenia pakietu');
        }
      });
    } else if (this.isEditing && this.selectedPackage) {
      // Update existing package
      this.servicePackageService.updatePackage(this.selectedPackage.id, packageData).subscribe({
        next: () => {
          this.notificationService.success('Pakiet serwisowy został zaktualizowany');
          this.saving = false;
          this.isEditing = false;
          this.loadServicePackages();
        },
        error: (err) => {
          console.error('Error updating service package:', err);
          this.saving = false;
          this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas aktualizacji pakietu');
        }
      });
    }
  }
  
  togglePackageActive(packageId: number, active: boolean): void {
    this.servicePackageService.togglePackageActive(packageId, active).subscribe({
      next: () => {
        const status = active ? 'aktywowany' : 'dezaktywowany';
        this.notificationService.success(`Pakiet został ${status}`);
        this.loadServicePackages();
      },
      error: (err) => {
        console.error('Error toggling package active state:', err);
        this.notificationService.error('Nie udało się zmienić statusu pakietu');
      }
    });
  }
  
  deletePackage(packageId: number): void {
    if (confirm('Czy na pewno chcesz usunąć ten pakiet serwisowy? Ta operacja jest nieodwracalna.')) {
      this.servicePackageService.deletePackage(packageId).subscribe({
        next: () => {
          this.notificationService.success('Pakiet serwisowy został usunięty');
          if (this.selectedPackage && this.selectedPackage.id === packageId) {
            this.selectedPackage = null;
          }
          this.loadServicePackages();
        },
        error: (err) => {
          console.error('Error deleting service package:', err);
          this.notificationService.error('Nie udało się usunąć pakietu serwisowego');
        }
      });
    }
  }
  
  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}