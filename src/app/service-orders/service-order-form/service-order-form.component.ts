// Declare global Leaflet type for TypeScript
declare global {
    interface Window {
      L: any;
    }
  }
  
  declare const L: any;import { Component, OnInit, ViewChild, ElementRef, inject, AfterViewInit, OnDestroy } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { 
    FormBuilder, 
    FormControl, 
    FormGroup, 
    ReactiveFormsModule, 
    Validators 
  } from '@angular/forms';
  import { ActivatedRoute, Router } from '@angular/router';
  import { BicycleService } from '../../bicycles/bicycle.service';
  import { Bicycle } from '../../bicycles/bicycle.model';
  import { 
    CreateServiceOrderRequest, 
    SERVICE_PACKAGES, 
    ServicePackage, 
    ServicePackageInfo 
  } from '../service-order.model';
  import { ServiceOrderService } from '../../service-orders/service-orders.service';
  import { NotificationService } from '../../core/notification.service';
  
  @Component({
    selector: 'app-service-order-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './service-order-form.component.html',
    styleUrls: ['./service-order-form.component.css']
  })
  export class ServiceOrderFormComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('pickupMap') pickupMapElement!: ElementRef;
    
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private bicycleService = inject(BicycleService);
    private serviceOrderService = inject(ServiceOrderService);
    private notificationService = inject(NotificationService);
    
    // Dane roweru
    bicycleId!: number;
    bicycle: Bicycle | null = null;
    
    // Kontrolki formularza
    currentStep = 1;
    selectedPackage: ServicePackage | null = null;
    pickupDateControl: FormControl = new FormControl('', [
      Validators.required,
      this.dateValidator.bind(this)
    ]);
    
    addressForm: FormGroup = this.fb.group({
      street: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{3}$/)]],
      city: ['', [Validators.required]],
      additionalNotes: ['']
    });
    
    termsAcceptedControl: FormControl = new FormControl(false, [Validators.requiredTrue]);
    
    // Stany UI
    loading = true;
    isSubmitting = false;
    minDate: string = '';
    maxDate: string = '';
    orderId: string | null = null;
    
    // Mapka Leaflet
    private map: any;
    private marker: any;
    private latitude: number | null = null;
    private longitude: number | null = null;
    
    // Dostępne pakiety serwisowe
    availablePackages: ServicePackageInfo[] = [
      SERVICE_PACKAGES[ServicePackage.BASIC],
      SERVICE_PACKAGES[ServicePackage.EXTENDED],
      SERVICE_PACKAGES[ServicePackage.FULL]
    ];
    
    ngOnInit(): void {
      // Pobierz ID roweru z parametrów URL
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.bicycleId = +id;
          this.loadBicycle(this.bicycleId);
        } else {
          this.loading = false;
        }
      });
      
      // Ustaw min i max datę dla wyboru daty odbioru
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.minDate = this.formatDateForInput(tomorrow);
      
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      this.maxDate = this.formatDateForInput(maxDate);
    }
    
    ngAfterViewInit(): void {
      // Delay to let the component render completely
      setTimeout(() => {
        if (this.pickupMapElement) {
          this.initMap();
        }
      }, 500);
    }
    
    ngOnDestroy(): void {
      // Cleanup if needed
      if (this.map) {
        this.map.remove();
      }
    }
    
    private loadBicycle(id: number): void {
      this.bicycleService.getBicycle(id).subscribe({
        next: (bicycle) => {
          this.bicycle = bicycle;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading bicycle:', error);
          this.notificationService.error('Nie udało się załadować danych roweru');
          this.bicycle = null;
          this.loading = false;
        }
      });
    }
    
    private initMap(): void {
      try {
        // Jeśli Leaflet nie jest zdefiniowany, załaduj go
        if (typeof L === 'undefined') {
          this.loadLeafletScript();
          return;
        }
        
        // Domyślne współrzędne (np. centrum Krakowa)
        const defaultLatLng = [50.0647, 19.9450];
        
        // Inicjalizacja mapy
        this.map = L.map(this.pickupMapElement.nativeElement).setView(defaultLatLng, 13);
        
        // Dodaj warstwy OpenStreetMap
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
        
        // Dodaj marker
        this.marker = L.marker(defaultLatLng, { draggable: true }).addTo(this.map);
        this.marker.bindPopup('Lokalizacja odbioru roweru').openPopup();
        
        // Aktualizuj współrzędne po przeciągnięciu markera
        this.marker.on('dragend', (event: any) => {
          const position = event.target.getLatLng();
          this.latitude = position.lat;
          this.longitude = position.lng;
        });
        
        // Kliknięcie na mapie przesuwa marker
        this.map.on('click', (e: any) => {
          const position = e.latlng;
          this.marker.setLatLng(position);
          this.latitude = position.lat;
          this.longitude = position.lng;
        });
      } catch (err) {
        console.error('Error initializing map:', err);
        this.notificationService.error('Wystąpił błąd podczas inicjalizacji mapy');
      }
    }
    
    // Metoda do załadowania skryptu Leaflet
    private loadLeafletScript(): void {
      // Załaduj CSS Leaflet
      if (!document.getElementById('leaflet-css')) {
        const leafletCss = document.createElement('link');
        leafletCss.id = 'leaflet-css';
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        leafletCss.crossOrigin = '';
        document.head.appendChild(leafletCss);
      }
  
      // Załaduj JS Leaflet
      if (!document.getElementById('leaflet-script')) {
        const leafletScript = document.createElement('script');
        leafletScript.id = 'leaflet-script';
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        leafletScript.crossOrigin = '';
        
        leafletScript.onload = () => {
          // Po załadowaniu inicjalizuj mapę
          setTimeout(() => {
            this.initMap();
          }, 100);
        };
        
        document.body.appendChild(leafletScript);
      }
    }
    
    // Validators
    private dateValidator(control: FormControl): { [key: string]: any } | null {
      if (!control.value) {
        return { required: true };
      }
      
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Sprawdź czy data jest w przyszłości
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (selectedDate < tomorrow) {
        return { min: true };
      }
      
      // Sprawdź czy data nie jest zbyt odległa (max 30 dni)
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 30);
      
      if (selectedDate > maxDate) {
        return { max: true };
      }
      
      return null;
    }
    
    isFieldInvalid(fieldName: string): boolean {
      const field = this.addressForm.get(fieldName);
      return field ? (field.invalid && (field.dirty || field.touched)) : false;
    }
    
    // Metody do obsługi interfejsu
    selectPackage(packageType: ServicePackage): void {
      this.selectedPackage = packageType;
    }
    
    getSelectedPackageInfo(): ServicePackageInfo {
      return this.selectedPackage ? SERVICE_PACKAGES[this.selectedPackage] : SERVICE_PACKAGES[ServicePackage.BASIC];
    }
    
    nextStep(): void {
      if (this.currentStep < 4) {
        this.currentStep++;
      }
    }
    
    prevStep(): void {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    }
    
    cancel(): void {
      this.goBack();
    }
    
    goBack(): void {
      this.router.navigate(['/bicycles']);
    }
    
    goToMain(): void {
      this.router.navigate(['/welcome']);
    }
    
    goToServiceOrders(): void {
      // Tutaj powinniśmy przekierować do listy zamówień serwisowych
      // To trzeba będzie zaimplementować w przyszłości
      this.router.navigate(['/bicycles']);
    }
    
    getBicyclePhotoUrl(bicycleId: number): string {
      return this.bicycleService.getBicyclePhotoUrl(bicycleId);
    }
    
    handleImageError(): void {
      if (this.bicycle) {
        this.bicycle.hasPhoto = false;
      }
    }
    
    // Formatuj datę do formatu yyyy-MM-dd dla kontrolki input type="date"
    private formatDateForInput(date: Date): string {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    submitOrder(): void {
      if (!this.bicycle || !this.selectedPackage || !this.pickupDateControl.valid || !this.addressForm.valid || !this.termsAcceptedControl.value) {
        this.notificationService.error('Upewnij się, że wszystkie pola są poprawnie wypełnione');
        return;
      }
      
      this.isSubmitting = true;
      
      // Stwórz obiekt zamówienia
      const serviceOrder: CreateServiceOrderRequest = {
        bicycleId: this.bicycle.id,
        servicePackage: this.selectedPackage,
        pickupDate: this.pickupDateControl.value,
        pickupAddress: `${this.addressForm.get('street')?.value}, ${this.addressForm.get('postalCode')?.value} ${this.addressForm.get('city')?.value}`,
        additionalNotes: this.addressForm.get('additionalNotes')?.value || undefined
      };
      
      // Dodaj współrzędne jeśli dostępne
      if (this.latitude !== null && this.longitude !== null) {
        serviceOrder.pickupLatitude = this.latitude;
        serviceOrder.pickupLongitude = this.longitude;
      }
      
      // Wyślij zamówienie do API
      this.serviceOrderService.createServiceOrder(serviceOrder).subscribe({
        next: (response: {orderId: string}) => {
          this.isSubmitting = false;
          this.orderId = response.orderId;
          this.currentStep = 5; // Przejdź do potwierdzenia
          this.notificationService.success('Zamówienie zostało złożone pomyślnie!');
        },
        error: (error: any) => {
          this.isSubmitting = false;
          console.error('Error creating service order:', error);
          this.notificationService.error('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
        }
      });
    }
  }