import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { BikeServiceService } from './bike-service.service';

export interface BikeService {
  id: number;
  name: string;
  street: string;
  building: string;
  flat?: string;
  postalCode?: string;
  city: string;
  phoneNumber: string;
  businessPhone?: string;
  email: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  verified: boolean;
  active: boolean;
  createdAt: string;
  lastModifiedAt?: string;
}

@Component({
  selector: 'app-admin-bike-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-bike-services.component.html',
  styleUrls: ['./admin-bike-services.component.css']
})
export class AdminBikeServicesComponent implements OnInit {
  private bikeServiceService = inject(BikeServiceService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Data
  bikeServices: BikeService[] = [];
  filteredServices: BikeService[] = [];
  selectedService: BikeService | null = null;
  
  // State
  loading = true;
  saving = false;
  error: string | null = null;
  isEditing = false;
  isAddingNew = false;
  showImportDialogFlag = false;
  
  // Forms
  serviceForm: FormGroup;
  searchTerm: string = '';
  statusFilter: string = 'all';
  
  // File upload
  selectedFile: File | null = null;
  isImporting = false;
  
  constructor() {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      street: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      building: ['', [Validators.required, Validators.maxLength(10)]],
      flat: ['', [Validators.maxLength(10)]],
      postalCode: ['', [Validators.pattern(/^\d{2}-\d{3}$/)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      businessPhone: ['', [Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      latitude: ['', [Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.min(-180), Validators.max(180)]],
      description: ['', [Validators.maxLength(1000)]],
      verified: [false],
      active: [true]
    });
  }
  
  ngOnInit(): void {
    this.loadBikeServices();
  }
  
  private loadBikeServices(): void {
    this.loading = true;
    this.error = null;
    
    this.bikeServiceService.getAllBikeServices().subscribe({
      next: (services) => {
        this.bikeServices = services;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading bike services:', err);
        this.error = 'Nie udało się załadować serwisów rowerowych. Spróbuj ponownie później.';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }
  
  applyFilters(): void {
    let filtered = [...this.bikeServices];
    
    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(term) ||
        service.city.toLowerCase().includes(term) ||
        service.email.toLowerCase().includes(term) ||
        service.street.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'active') {
        filtered = filtered.filter(service => service.active);
      } else if (this.statusFilter === 'inactive') {
        filtered = filtered.filter(service => !service.active);
      } else if (this.statusFilter === 'verified') {
        filtered = filtered.filter(service => service.verified);
      } else if (this.statusFilter === 'unverified') {
        filtered = filtered.filter(service => !service.verified);
      }
    }
    
    this.filteredServices = filtered;
  }
  
  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.applyFilters();
  }
  
  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter = target.value;
    this.applyFilters();
  }
  
  selectService(service: BikeService): void {
    this.selectedService = service;
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  startEditing(): void {
    if (!this.selectedService) return;
    
    this.resetForm();
    this.serviceForm.patchValue({
      name: this.selectedService.name,
      street: this.selectedService.street,
      building: this.selectedService.building,
      flat: this.selectedService.flat || '',
      postalCode: this.selectedService.postalCode || '',
      city: this.selectedService.city,
      phoneNumber: this.selectedService.phoneNumber,
      businessPhone: this.selectedService.businessPhone || '',
      email: this.selectedService.email,
      latitude: this.selectedService.latitude || '',
      longitude: this.selectedService.longitude || '',
      description: this.selectedService.description || '',
      verified: this.selectedService.verified,
      active: this.selectedService.active
    });
    
    this.isEditing = true;
    this.isAddingNew = false;
  }
  
  startAddingNew(): void {
    this.resetForm();
    this.selectedService = null;
    this.isEditing = false;
    this.isAddingNew = true;
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  private resetForm(): void {
    this.serviceForm.reset({
      name: '',
      street: '',
      building: '',
      flat: '',
      postalCode: '',
      city: '',
      phoneNumber: '',
      businessPhone: '',
      email: '',
      latitude: '',
      longitude: '',
      description: '',
      verified: false,
      active: true
    });
  }
  
  saveService(): void {
    if (this.serviceForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.serviceForm.controls).forEach(key => {
        const control = this.serviceForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificationService.warning('Formularz zawiera błędy. Popraw je przed zapisaniem.');
      return;
    }
    
    this.saving = true;
    
    const serviceData = {
      ...this.serviceForm.value,
      latitude: this.serviceForm.value.latitude ? Number(this.serviceForm.value.latitude) : null,
      longitude: this.serviceForm.value.longitude ? Number(this.serviceForm.value.longitude) : null
    };
    
    if (this.isAddingNew) {
      // Create new service
      this.bikeServiceService.createBikeService(serviceData).subscribe({
        next: () => {
          this.notificationService.success('Serwis rowerowy został utworzony');
          this.saving = false;
          this.isAddingNew = false;
          this.loadBikeServices();
        },
        error: (err) => {
          console.error('Error creating bike service:', err);
          this.saving = false;
          this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas tworzenia serwisu');
        }
      });
    } else if (this.isEditing && this.selectedService) {
      // Update existing service
      this.bikeServiceService.updateBikeService(this.selectedService.id, serviceData).subscribe({
        next: () => {
          this.notificationService.success('Serwis rowerowy został zaktualizowany');
          this.saving = false;
          this.isEditing = false;
          this.loadBikeServices();
        },
        error: (err) => {
          console.error('Error updating bike service:', err);
          this.saving = false;
          this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas aktualizacji serwisu');
        }
      });
    }
  }
  
  deleteService(id: number): void {
    if (confirm('Czy na pewno chcesz usunąć ten serwis rowerowy? Ta operacja jest nieodwracalna.')) {
      this.bikeServiceService.deleteBikeService(id).subscribe({
        next: () => {
          this.notificationService.success('Serwis rowerowy został usunięty');
          if (this.selectedService && this.selectedService.id === id) {
            this.selectedService = null;
          }
          this.loadBikeServices();
        },
        error: (err) => {
          console.error('Error deleting bike service:', err);
          this.notificationService.error('Nie udało się usunąć serwisu rowerowego');
        }
      });
    }
  }
  
  toggleServiceStatus(id: number, currentStatus: boolean): void {
    const service = this.bikeServices.find(s => s.id === id);
    if (!service) return;
    
    const updatedData = { ...service, active: !currentStatus };
    
    this.bikeServiceService.updateBikeService(id, updatedData).subscribe({
      next: () => {
        const status = !currentStatus ? 'aktywowany' : 'dezaktywowany';
        this.notificationService.success(`Serwis został ${status}`);
        this.loadBikeServices();
      },
      error: (err) => {
        console.error('Error toggling service status:', err);
        this.notificationService.error('Nie udało się zmienić statusu serwisu');
      }
    });
  }
  
  // CSV Import functionality
  openImportDialog(): void {
    this.showImportDialogFlag = true;
    this.selectedFile = null;
  }
  
  closeImportDialog(): void {
    this.showImportDialogFlag = false;
    this.selectedFile = null;
  }
  
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.notificationService.error('Wybierz plik CSV');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.notificationService.error('Plik jest za duży (maksymalnie 10MB)');
        return;
      }
      
      this.selectedFile = file;
    }
  }
  
  importFromCsv(): void {
    if (!this.selectedFile) {
      this.notificationService.warning('Wybierz plik CSV');
      return;
    }
    
    this.isImporting = true;
    
    this.bikeServiceService.importFromCsv(this.selectedFile).subscribe({
      next: (response) => {
        this.isImporting = false;
        this.closeImportDialog();
        this.notificationService.success(`Import zakończony pomyślnie. ${response.message || 'Dane zostały zaimportowane.'}`);
        this.loadBikeServices();
      },
      error: (err) => {
        console.error('Error importing CSV:', err);
        this.isImporting = false;
        this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas importu pliku CSV');
      }
    });
  }
  
  // Helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
  
  getFullAddress(service: BikeService): string {
    const parts = [service.street, service.building];
    if (service.flat) parts.push(`m. ${service.flat}`);
    if (service.postalCode) parts.push(service.postalCode);
    parts.push(service.city);
    return parts.join(', ');
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}