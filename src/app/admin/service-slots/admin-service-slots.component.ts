// src/app/admin/service-slots/admin-service-slots.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificationService } from '../../core/notification.service';
import { environment } from '../../environments/environments';
import { ServiceSlotService } from '../../service-slots/service-slot.service';
import { AuthService } from '../../auth/auth.service'; // DODANO

export interface ServiceSlotConfig {
  id?: number;
  startDate: string;
  endDate?: string | null;
  maxBikesPerDay: number;
  maxBikesPerOrder: number;
  active?: boolean;
}

@Component({
  selector: 'app-admin-service-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-service-slots.component.html',
  styleUrls: ['./admin-service-slots.component.css']
})
export class AdminServiceSlotsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private serviceSlotService = inject(ServiceSlotService);
  private authService = inject(AuthService); // DODANO

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
  
  constructor() {
    this.slotConfigForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: [''],
      maxBikesPerDay: [10, [Validators.required, Validators.min(1)]],
      maxBikesPerOrder: [5, [Validators.required, Validators.min(1)]],
      active: [true]
    });
  }
  
  ngOnInit(): void {
    console.log('AdminServiceSlotsComponent initialized');
    console.log('User logged in:', this.authService.isLoggedIn());
    console.log('User role:', this.authService.getUserRole());
    console.log('Has admin privileges:', this.authService.hasAdminPrivileges());
    console.log('Auth token exists:', !!this.authService.getToken());
    
    this.loadServiceSlotConfigs();
  }
  
  private loadServiceSlotConfigs(): void {
    this.loading = true;
    this.error = null;
    
    // DODAJ DEBUGOWANIE TOKENU
    const token = this.authService.getToken();
    console.log('Loading service slot configs...');
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.error('No authentication token available');
      this.error = 'Brak tokenu uwierzytelniającego';
      this.loading = false;
      return;
    }
    
    // DODAJ RĘCZNE NAGŁÓWKI JEŚLI POTRZEBA
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    console.log('Making request to:', `${environment.apiUrl}/service-slots/config/active`);
    
    // Get active configurations
    this.http.get<ServiceSlotConfig[]>(`${environment.apiUrl}/service-slots/config/active`, { headers }).subscribe({
      next: (configs) => {
        console.log('Active configs loaded:', configs);
        this.activeConfigs = configs;
        this.loadFutureConfigs();
      },
      error: (err) => {
        console.error('Error loading active slot configs:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error body:', err.error);
        
        if (err.status === 401) {
          this.error = 'Brak uprawnień do dostępu. Sprawdź czy jesteś zalogowany jako administrator.';
          // Opcjonalnie przekieruj do logowania
          // this.authService.logout();
          // this.router.navigate(['/login']);
        } else {
          this.error = 'Nie udało się załadować aktywnych konfiguracji slotów';
        }
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }
  
  private loadFutureConfigs(): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<ServiceSlotConfig[]>(`${environment.apiUrl}/service-slots/config/future`, { headers }).subscribe({
      next: (configs) => {
        console.log('Future configs loaded:', configs);
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
  
  // ... reszta metod pozostaje bez zmian
  
  selectConfig(config: ServiceSlotConfig): void {
    this.selectedConfig = config;
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  startEditing(): void {
    if (!this.selectedConfig) return;
    
    this.resetForm();
    
    this.slotConfigForm.patchValue({
      startDate: this.formatDateForInput(this.selectedConfig.startDate),
      endDate: this.selectedConfig.endDate ? this.formatDateForInput(this.selectedConfig.endDate) : '',
      maxBikesPerDay: this.selectedConfig.maxBikesPerDay,
      maxBikesPerOrder: this.selectedConfig.maxBikesPerOrder,
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
      active: true
    });
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.isAddingNew = false;
  }
  
  saveConfig(): void {
    if (this.slotConfigForm.invalid) {
      Object.keys(this.slotConfigForm.controls).forEach(key => {
        const control = this.slotConfigForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificationService.warning('Formularz zawiera błędy. Popraw je przed zapisaniem.');
      return;
    }
    
    this.saving = true;
    
    const configData: any = {
      startDate: this.formatDateForApi(this.slotConfigForm.value.startDate),
      endDate: this.slotConfigForm.value.endDate ? this.formatDateForApi(this.slotConfigForm.value.endDate) : null,
      maxBikesPerDay: Number(this.slotConfigForm.value.maxBikesPerDay),
      maxBikesPerOrder: Number(this.slotConfigForm.value.maxBikesPerOrder),
    };
    
    console.log('Sending config data:', configData);
    
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    if (this.isAddingNew) {
      this.http.post(`${environment.apiUrl}/service-slots/config`, configData, { headers }).subscribe({
        next: () => {
          this.notificationService.success('Konfiguracja slotów została utworzona');
          this.saving = false;
          this.isAddingNew = false;
          this.loadServiceSlotConfigs();
          this.serviceSlotService.clearCache();
        },
        error: (err) => {
          console.error('Error creating slot config:', err);
          this.saving = false;
          this.notificationService.error(err.error?.message || 'Wystąpił błąd podczas tworzenia konfiguracji');
        }
      });
    } else if (this.isEditing && this.selectedConfig) {
      configData['id'] = this.selectedConfig.id;
      
      this.http.put(`${environment.apiUrl}/service-slots/config/${this.selectedConfig.id}`, configData, { headers }).subscribe({
        next: () => {
          this.notificationService.success('Konfiguracja slotów została zaktualizowana');
          this.saving = false;
          this.isEditing = false;
          this.loadServiceSlotConfigs();
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
      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`${environment.apiUrl}/service-slots/config/${id}`, { headers }).subscribe({
        next: () => {
          this.notificationService.success('Konfiguracja slotów została usunięta');
          if (this.selectedConfig && this.selectedConfig.id === id) {
            this.selectedConfig = null;
          }
          this.loadServiceSlotConfigs();
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
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.slotConfigForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
}