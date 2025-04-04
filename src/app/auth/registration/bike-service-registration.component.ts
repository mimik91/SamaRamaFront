import { Component, OnInit, inject, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ServiceRegistrationData } from '../auth.service';

@Component({
  selector: 'app-bike-service-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="registration-card">
        <h1 class="title">Rejestracja Serwisu Rowerowego</h1>
        
        <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
          <!-- Basic Information -->
          <div class="section">
            <h2 class="section-title">Informacje podstawowe</h2>
            
            <div class="form-group">
              <label for="name">Nazwa serwisu *</label>
              <input 
                type="text" 
                id="name" 
                formControlName="name" 
                class="form-control" 
                [class.is-invalid]="isFieldInvalid('name')"
              >
              <div class="error-message" *ngIf="isFieldInvalid('name')">
                Nazwa serwisu jest wymagana
              </div>
            </div>
            
            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email" 
                class="form-control"
                [class.is-invalid]="isFieldInvalid('email')"
              >
              <div class="error-message" *ngIf="isFieldInvalid('email')">
                Wprowadź poprawny adres email
              </div>
            </div>
            
            <div class="form-group">
              <label for="password">Hasło *</label>
              <input 
                type="password" 
                id="password" 
                formControlName="password" 
                class="form-control"
                [class.is-invalid]="isFieldInvalid('password')"
              >
              <div class="error-message" *ngIf="isFieldInvalid('password')">
                Hasło musi mieć co najmniej 6 znaków
              </div>
            </div>
            
            <div class="form-group">
              <label for="phoneNumber">Telefon kontaktowy dla klientów *</label>
              <input 
                type="tel" 
                id="phoneNumber" 
                formControlName="phoneNumber" 
                class="form-control"
                [class.is-invalid]="isFieldInvalid('phoneNumber')"
                placeholder="123456789"
              >
              <div class="error-message" *ngIf="isFieldInvalid('phoneNumber')">
                Wprowadź poprawny numer telefonu (9 cyfr)
              </div>
            </div>
            
            <div class="form-group">
              <label for="businessPhone">Telefon kontaktowy dla kontrahentów</label>
              <input 
                type="tel" 
                id="businessPhone" 
                formControlName="businessPhone" 
                class="form-control"
                placeholder="123456789"
              >
            </div>
          </div>
          
          <!-- Location Information -->
          <div class="section">
            <h2 class="section-title">Lokalizacja</h2>
            
            <div class="form-row">
              <div class="form-group col-md-8">
                <label for="street">Ulica *</label>
                <input 
                  type="text" 
                  id="street" 
                  formControlName="street" 
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('street')"
                >
                <div class="error-message" *ngIf="isFieldInvalid('street')">
                  Ulica jest wymagana
                </div>
              </div>
              
              <div class="form-group col-md-2">
                <label for="building">Numer budynku *</label>
                <input 
                  type="text" 
                  id="building" 
                  formControlName="building" 
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('building')"
                >
                <div class="error-message" *ngIf="isFieldInvalid('building')">
                  Wymagane
                </div>
              </div>
              
              <div class="form-group col-md-2">
                <label for="flat">Nr lokalu</label>
                <input 
                  type="text" 
                  id="flat" 
                  formControlName="flat" 
                  class="form-control"
                >
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group col-md-8">
                <label for="city">Miasto *</label>
                <input 
                  type="text" 
                  id="city" 
                  formControlName="city" 
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('city')"
                >
                <div class="error-message" *ngIf="isFieldInvalid('city')">
                  Miasto jest wymagane
                </div>
              </div>
              
              <div class="form-group col-md-4">
                <label for="postalCode">Kod pocztowy</label>
                <input 
                  type="text" 
                  id="postalCode" 
                  formControlName="postalCode" 
                  class="form-control"
                  placeholder="00-000"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label>Wskaż lokalizację na mapie *</label>
              <div id="map" class="map-container"></div>
              <p class="map-help-text">Kliknij na mapie, aby zaznaczyć lokalizację serwisu</p>
              
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="latitude">Szerokość geograficzna</label>
                  <input 
                    type="text" 
                    id="latitude" 
                    formControlName="latitude" 
                    class="form-control"
                    readonly
                  >
                </div>
                
                <div class="form-group col-md-6">
                  <label for="longitude">Długość geograficzna</label>
                  <input 
                    type="text" 
                    id="longitude" 
                    formControlName="longitude" 
                    class="form-control"
                    readonly
                  >
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goToLogin()">
              Masz już konto? Zaloguj się
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="registrationForm.invalid || isSubmitting"
            >
              {{ isSubmitting ? 'Rejestracja w toku...' : 'Zarejestruj serwis' }}
            </button>
          </div>
          
          <div class="message-container">
            <div *ngIf="errorMessage" class="error-alert">
              {{ errorMessage }}
            </div>
            <div *ngIf="successMessage" class="success-alert">
              {{ successMessage }}
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .registration-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 30px;
      margin-bottom: 40px;
    }
    
    .title {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
      font-size: 1.8rem;
    }
    
    .section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    
    .section-title {
      color: #444;
      font-size: 1.2rem;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ddd;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-row {
      display: flex;
      margin-right: -10px;
      margin-left: -10px;
    }
    
    .col-md-2 {
      flex: 0 0 16.666667%;
      max-width: 16.666667%;
      padding-right: 10px;
      padding-left: 10px;
    }
    
    .col-md-4 {
      flex: 0 0 33.333333%;
      max-width: 33.333333%;
      padding-right: 10px;
      padding-left: 10px;
    }
    
    .col-md-6 {
      flex: 0 0 50%;
      max-width: 50%;
      padding-right: 10px;
      padding-left: 10px;
    }
    
    .col-md-8 {
      flex: 0 0 66.666667%;
      max-width: 66.666667%;
      padding-right: 10px;
      padding-left: 10px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }
    
    .form-control {
      display: block;
      width: 100%;
      padding: 10px 12px;
      font-size: 1rem;
      line-height: 1.5;
      color: #495057;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid #ced4da;
      border-radius: 4px;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    
    .form-control:focus {
      color: #495057;
      background-color: #fff;
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
    
    .is-invalid {
      border-color: #dc3545;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 5px;
    }
    
    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
    }
    
    .btn {
      display: inline-block;
      font-weight: 400;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      user-select: none;
      border: 1px solid transparent;
      padding: 10px 20px;
      font-size: 1rem;
      line-height: 1.5;
      border-radius: 4px;
      transition: all 0.15s ease-in-out;
      cursor: pointer;
    }
    
    .btn-primary {
      color: #fff;
      background-color: #007bff;
      border-color: #007bff;
    }
    
    .btn-primary:hover {
      background-color: #0069d9;
      border-color: #0062cc;
    }
    
    .btn-primary:disabled {
      background-color: #007bff;
      border-color: #007bff;
      opacity: 0.65;
      cursor: not-allowed;
    }
    
    .btn-secondary {
      color: #fff;
      background-color: #6c757d;
      border-color: #6c757d;
    }
    
    .btn-secondary:hover {
      background-color: #5a6268;
      border-color: #545b62;
    }
    
    .message-container {
      margin-top: 20px;
    }
    
    .error-alert {
      padding: 12px;
      border-radius: 4px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .success-alert {
      padding: 12px;
      border-radius: 4px;
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .map-container {
      height: 300px;
      border-radius: 4px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
    }
    
    .map-help-text {
      font-size: 0.85rem;
      color: #6c757d;
      margin-bottom: 15px;
    }
  `]
})
export class BikeServiceRegistrationComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  registrationForm: FormGroup;
  isSubmitting = false;
  errorMessage: string = '';
  successMessage: string = '';
  isBrowser: boolean;
  private map: any;
  private marker: any;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    this.registrationForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      businessPhone: ['', Validators.pattern('^[0-9]{9}$')],
      street: ['', Validators.required],
      building: ['', Validators.required],
      flat: [''],
      city: ['Kraków', Validators.required],
      postalCode: [''],
      latitude: ['50.061', Validators.required],
      longitude: ['19.937', Validators.required],
      description: [''] // Added description field
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadMapScript();
    }
  }
  
  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initializeMapWhenReady();
    }
  }
  
  private loadMapScript(): void {
    if (!document.getElementById('leaflet-script')) {
      // Load Leaflet CSS
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      leafletCss.crossOrigin = '';
      document.head.appendChild(leafletCss);
      
      // Load Leaflet JS
      const leafletScript = document.createElement('script');
      leafletScript.id = 'leaflet-script';
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      leafletScript.crossOrigin = '';
      document.body.appendChild(leafletScript);
    }
  }
  
  private initializeMapWhenReady(): void {
    const checkLeaflet = setInterval(() => {
      // @ts-ignore
      if (window.L) {
        clearInterval(checkLeaflet);
        this.initializeMap();
      }
    }, 100);
    
    // Safety timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkLeaflet);
      if (!this.map) {
        this.errorMessage = 'Nie udało się załadować mapy. Odśwież stronę.';
      }
    }, 5000);
  }
  
  private initializeMap(): void {
    try {
      // Get initial coordinates from form
      const initialLat = parseFloat(this.registrationForm.get('latitude')?.value || '50.061');
      const initialLng = parseFloat(this.registrationForm.get('longitude')?.value || '19.937');
      
      // @ts-ignore
      this.map = L.map('map').setView([initialLat, initialLng], 12);
      
      // @ts-ignore
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);
      
      // Add initial marker
      // @ts-ignore
      this.marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(this.map);
      this.marker.bindPopup('Lokalizacja serwisu').openPopup();
      
      // Update form when marker is dragged
      this.marker.on('dragend', (event: any) => {
        const position = event.target.getLatLng();
        this.registrationForm.patchValue({
          latitude: position.lat.toFixed(8),
          longitude: position.lng.toFixed(8)
        });
      });
      
      // Allow setting marker by clicking on map
      this.map.on('click', (e: any) => {
        const position = e.latlng;
        this.marker.setLatLng(position);
        
        this.registrationForm.patchValue({
          latitude: position.lat.toFixed(8),
          longitude: position.lng.toFixed(8)
        });
      });
      
    } catch (err) {
      console.error('Error initializing map:', err);
      this.errorMessage = 'Wystąpił błąd podczas inicjalizacji mapy.';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  goToLogin(): void {
    this.router.navigate(['/login-serviceman']);
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const formData = this.registrationForm.value;
      
      const serviceData: ServiceRegistrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        businessPhone: formData.businessPhone || '',
        street: formData.street,
        building: formData.building,
        flat: formData.flat || '',
        city: formData.city,
        postalCode: formData.postalCode || '',
        description: formData.description || '',
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };
      
      console.log('Submitting service data:', serviceData);
      
      // Cast to ServiceRegistrationData type
      this.authService.registerService(serviceData).subscribe({
        next: () => {
          this.successMessage = 'Rejestracja zakończona sukcesem! Za chwilę zostaniesz przekierowany na stronę logowania.';
          setTimeout(() => {
            this.router.navigate(['/login-serviceman']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Registration error:', error);
          this.errorMessage = error.error?.message || 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registrationForm.controls).forEach(key => {
        const control = this.registrationForm.get(key);
        control?.markAsTouched();
      });
      
      this.errorMessage = 'Wypełnij wszystkie wymagane pola formularza.';
    }
  }
}