import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/notification.service';
import { environment } from '../../core/api-config';
import { ServiceSlotService } from '../../service-slots/service-slot.service';

export interface ServiceSlotConfig {
  id?: number;
  startDate: string;
  endDate?: string;
  maxBikesPerDay: number;
  maxBikesPerOrder: number;
  availableDays: number[];
  active: boolean;
}

@Component({
  selector: 'app-admin-service-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-service-slots.component.ts',
  styleUrls: ['./admin-service-slots.component.css']
})
export class AdminServiceSlotsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private serviceSlotService = inject(ServiceSlotService);

  // UI states
  loading = true;
  saving = false;
  error: string | null = null;
  
  // Service slot configs
  activeConfigs: ServiceSlotConfig[] = [];
  futureConfigs: ServiceSlotConfig[] = [];
  selectedConfig: ServiceSlotConfig | null = null;
  isEditing = false;
  isAddingNew = false;
  
  // Form
  slotConfigForm: FormGroup;
  
  // Days mapping for better readability
  dayNames = [
    'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'
  ];
  
  constructor() {
    this.slotConfigForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: [''],
      maxBikesPerDay: [10, [Validators.required, Validators.min(1)]],
      maxBikesPerOrder: [5, [Validators.required, Validators.min(1)]],
      availableDays: [this.fb.array([
        { value: true, disabled: false }, // Sunday
        { value: true, disabled: false }, // Monday
        { value: true, disabled: false }, // Tuesday
        { value: true, disabled: false }, // Wednesday
        { value: true, disabled: false }, // Thursday
        { value: false, disabled: false }, // Friday
        { value: false, disabled: false }  // Saturday
      ])],
      active: [true]
    });
  }
  
  ngOnInit(): void {
    this.loadServiceSlotConfigs();
  }
  
  private loadServiceSlotConfigs(): void {
    this.loading = true;
    
    // Get active configurations
    this.http.get<ServiceSlotConfig[]>(`${environment.apiUrl}/service-slots/config/active`).subscribe({
      next: (configs) => {
        this.activeConfigs = configs;
        this.loadFutureConfigs();
      },
      error: (err) => {
        console.error('Error loading active slot configs:', err);
        this.error = 'Nie udało się załadować aktywnych konfiguracji slotów';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }
  
  private loadFutureConfigs(): void {
    this.http.get<ServiceSlotConfig[]>(`${environment.apiUrl}/service-slots/config/future`).subscribe({
      next: (configs) => {
        this.futureConfigs = configs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading future slot configs:', err);
        this.error = 'Nie udało się załadować przyszłych konfiguracji slotów';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }
  
  selectConfig(config: ServiceSlotConfig): void {
    this.selectedConfig = config;
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  startEditing(): void {
    if (!this.selectedConfig) return;
    
    this.resetForm();
    
    // Convert availableDays array to form values
    const availableDaysArray = new Array(7).fill(false);
    this.selectedConfig.availableDays.forEach(day => {
      availableDaysArray[day] = true;
    });
    
    this.slotConfigForm.patchValue({
      startDate: this.formatDateForInput(this.selectedConfig.startDate),
      endDate: this.selectedConfig.endDate ? this.formatDateForInput(this.selectedConfig.endDate) : '',
      maxBikesPerDay: this.selectedConfig.maxBikesPerDay,
      maxBikesPerOrder: this.selectedConfig.maxBikesPerOrder,
      availableDays: availableDaysArray,
      active: this.selectedConfig.active
    });
    
    this.isEditing = true;
    this.isAddingNew = false;
  }
  
  startAddingNew(): void {
    this.resetForm();
    this.selectedConfig = null;
    this.isEditing = false;
    this.isAddingNew = true;
  }
  
  private resetForm(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.slotConfigForm.reset({
      startDate: this.formatDateForInput(tomorrow.toISOString().split('T')[0]),
      endDate: '',
      maxBikesPerDay: 10,
      maxBikesPerOrder: 5,
      availableDays: [true, true, true, true, true, false, false], // Sun-Thu enabled
      active: true
    });
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  saveConfig(): void {
    if (this.slotConfigForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.slotConfigForm.controls).forEach(key => {
        const control = this.slotConfigForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificationService.warning('Formularz zawiera błędy. Popraw je przed zapisaniem.');
      return;
    }
    
    this.saving = true;
    
    // Convert availableDays from boolean array to day indices
    const availableDaysValues = this.slotConfigForm.value.availableDays;
    const availableDays = availableDaysValues
      .map((isAvailable: boolean, index: number) => ({ isAvailable, index }))
      .filter(item => item.isAvailable)
      .map(item => item.index);
    
    const configData: ServiceSlotConfig = {
      startDate: this.formatDateForApi(this.slotConfigForm.value.startDate),
      endDate: this.slotConfigForm.value.endDate ? this.formatDateForApi(this.slotConfigForm.value.endDate) : undefined,
      maxBikesPerDay: Number(this.slotConfigForm.value.maxBikesPerDay),
      maxBikesPerOrder: Number(this.slotConfigForm.value.maxBikesPerOrder),
      availableDays: availableDays,
      active: this.slotConfigForm.value.active
    };
    
    if (this.isAddingNew) {
      // Create new config
      this.http.post(`${environment.apiUrl}/service-slots/config`, configData).subscribe({
        next: () => {
          this.notificationService.success('Konfiguracja slotów została utworzona');
          this.saving = false;
          this.isAddingNew = false;
          this.loadServiceSlotConfigs();
          
          // Clear the service slot cache
          this.serviceSlotService.clearCache();
        },
        error: (err) => {
          console.error('Error creating slot config:', err);
          this.saving = false;
          this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas tworzenia konfiguracji');
        }
      });
    } else if (this.isEditing && this.selectedConfig) {
      // Update existing config
      configData.id = this.selectedConfig.id;
      
      this.http.put(`${environment.apiUrl}/service-slots/config/${this.selectedConfig.id}`, configData).subscribe({
        next: () => {
          this.notificationService.success('Konfiguracja slotów została zaktualizowana');
          this.saving = false;
          this.isEditing = false;
          this.loadServiceSlotConfigs();
          
          // Clear the service slot cache
          this.serviceSlotService.clearCache();
        },
        error: (err) => {
          console.error('Error updating slot config:', err);
          this.saving = false;
          this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas aktualizacji konfiguracji');
        }
      });
    }
  }
  
  deleteConfig(id: number | undefined): void {
    if (!id) return;
    
    if (confirm('Czy na pewno chcesz usunąć tę konfigurację slotów? Ta operacja jest nieodwracalna.')) {
      this.http.delete(`${environment.apiUrl}/service-slots/config/${id}`).subscribe({
        next: () => {
          this.notificationService.success('Konfiguracja slotów została usunięta');
          if (this.selectedConfig && this.selectedConfig.id === id) {
            this.selectedConfig = null;
          }
          this.loadServiceSlotConfigs();
          
          // Clear the service slot cache
          this.serviceSlotService.clearCache();
        },
        error: (err) => {
          console.error('Error deleting slot config:', err);
          this.notificationService.error('Nie udało się usunąć konfiguracji slotów');
        }
      });
    }
  }
  
  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
  
  // Helper methods for date formatting
  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
  
  private formatDateForApi(dateString: string): string {
    return dateString;
  }
  
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return 'Bezterminowo';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  getAvailableDaysDisplay(days: number[]): string {
    if (!days || days.length === 0) return 'Brak';
    
    return days.map(day => this.dayNames[day]).join(', ');
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.slotConfigForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
}