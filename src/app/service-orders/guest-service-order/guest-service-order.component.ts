import { Component, OnInit, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators,
  FormArray,
  FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/notification.service';
import { BikeFormService, BikeFormData } from '../../home/bike-form.service';
import { ServicePackage } from '../../service-package/service-package.model';
import { ServicePackageService } from '../../service-package/service-package.service';
import { EnumerationService } from '../../core/enumeration.service';
import { CreateGuestServiceOrderRequest } from '../service-order.model';
import { Observable, of, catchError, map } from 'rxjs';

// Angular Material imports 
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDatePickerFilter, CUSTOM_DATE_FORMATS } from '../custom-date-picker-filter';
import { CustomDateAdapter } from '../custom-date-adapter';
import { environment } from '../../core/api-config';
import { ServiceSlotAvailability } from '../../service-slots/service-slot.service';

@Component({
  selector: 'app-guest-service-order',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' },
    { provide: DateAdapter, useClass: CustomDateAdapter }
  ],
  templateUrl: './guest-service-order.component.html',
  styleUrls: ['./guest-service-order.component.css']
})
export class GuestServiceOrderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private bikeFormService = inject(BikeFormService);
  private servicePackageService = inject(ServicePackageService);
  private enumerationService = inject(EnumerationService);
  private http = inject(HttpClient);
  private isBrowser: boolean;

  // Ustawienia datepickera
  dateFilter = CustomDatePickerFilter.dateFilter;
  minDate: Date;
  maxDate: Date;

  // Dane z formularza
  bikesData: BikeFormData[] = [];
  
  // Aktualny krok formularza
  currentStep = 1;
  
  // Dostępne pakiety serwisowe
  availablePackages: ServicePackage[] = [];
  loadingPackages = true;
  selectedPackageId: number | null = null;
  
  // Cities
  cities: string[] = [];
  loadingCities = true;
  
  // Validator dla daty odbioru (niedziela-czwartek)
  pickupDateControl = new FormControl('', [
    Validators.required,
    this.dateValidator.bind(this)
  ]);
  
  // Formularz danych kontaktowych
  contactForm: FormGroup;

  // Akceptacja regulaminu
  termsAccepted = new FormControl(false, [Validators.requiredTrue]);
  
  // Stany UI
  isSubmitting = false;
  isSuccess = false;
  orderIds: number[] = [];
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Ustawienie minimalnej i maksymalnej daty
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow;
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    this.maxDate = maxDate;
    
    // Inicjalizacja formularza z nowymi polami adresowymi
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      pickupStreet: ['', Validators.required],
      pickupBuildingNumber: ['', Validators.required],
      pickupCity: ['', Validators.required],
      notes: ['']
    });
  }
  
  // Validator sprawdzający czy wybrana data to niedziela-czwartek
  dateValidator(control: FormControl): {[key: string]: any} | null {
    if (!control.value) {
      return { required: true };
    }
    
    const selectedDate = new Date(control.value);
    const dayOfWeek = selectedDate.getDay();
    
    // Sprawdź dzień tygodnia (0 = niedziela, 4 = czwartek)
    if (dayOfWeek > 4) { // Piątek i sobota nie są dozwolone
      return { invalidDay: true };
    }
    
    return null;
  }
  
  ngOnInit(): void {
    console.log("GuestServiceOrderComponent initialized");
    
    // Skip initialization on server
    if (!this.isBrowser) {
      return;
    }
    
    // Pobierz dane rowerów z serwisu
    this.bikesData = this.bikeFormService.getBikesDataValue();
    console.log("Bikes data from service:", this.bikesData);
    
    // Jeżeli nie ma danych o rowerach, przekieruj na stronę główną
    if (!this.bikesData || this.bikesData.length === 0) {
      console.log("No bikes data found in service!");
      this.notificationService.warning('Nie wprowadzono danych o rowerach.');
      this.router.navigate(['/']);
      return;
    }
    
    // Sprawdź maksymalną liczbę rowerów dozwoloną na zamówienie
    this.getMaxBikesPerOrder().subscribe({
      next: (maxBikes) => {
        // Jeśli liczba rowerów przekracza limit, pokaż ostrzeżenie
        if (this.bikesData.length > maxBikes) {
          this.notificationService.warning(`Maksymalna liczba rowerów na jedno zamówienie to ${maxBikes}. Niektóre rowery mogą zostać pominięte.`);
          // Przytnij listę rowerów do dozwolonego limitu
          this.bikesData = this.bikesData.slice(0, maxBikes);
          // Zaktualizuj dane w serwisie
          this.bikeFormService.setBikesData(this.bikesData);
        }
      }
    });
    
    // Załaduj pakiety serwisowe
    this.loadServicePackages();
    
    // Załaduj miasta
    this.loadCities();
  }
  
  private loadServicePackages(): void {
    if (!this.isBrowser) return;
    
    this.loadingPackages = true;
    console.log("Starting to load service packages...");
    
    this.servicePackageService.getActivePackages().subscribe({
      next: (packages: ServicePackage[]) => {
        console.log("Received service packages:", packages);
        this.availablePackages = packages || [];
        this.loadingPackages = false;
      },
      error: (error) => {
        console.error('Failed to load service packages:', error);
        this.notificationService.error('Nie udało się załadować pakietów serwisowych.');
        this.loadingPackages = false;
        this.availablePackages = [];
      }
    });
  }
  
  // Metoda do pobierania maksymalnej liczby rowerów na zamówienie
  getMaxBikesPerOrder(): Observable<number> {
    if (!this.isBrowser) {
      return of(5); // Default value for server
    }
    
    // Get current date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    return this.http.get<ServiceSlotAvailability>(`${environment.apiUrl}/service-slots/availability?date=${formattedDate}`)
      .pipe(
        map(response => response.maxBikesPerOrder || 5), // Default to 5 if not specified
        catchError(error => {
          console.error('Error fetching max bikes per order:', error);
          return of(5); // Default value if error
        })
      );
  }
  
  private loadCities(): void {
    if (!this.isBrowser) return;
    
    this.loadingCities = true;
    
    this.enumerationService.getCities().subscribe({
      next: (cities: string[]) => {
        this.cities = cities;
        this.loadingCities = false;
      },
      error: (error: any) => {
        console.error('Failed to load cities:', error);
        this.notificationService.error('Nie udało się załadować listy miast');
        this.loadingCities = false;
        this.cities = [];
      }
    });
  }
  
  // Wybór pakietu serwisowego
  selectPackage(packageId: number): void {
    this.selectedPackageId = packageId;
  }
  
  // Pobranie informacji o wybranym pakiecie
  getSelectedPackageInfo(): ServicePackage | null {
    if (!this.selectedPackageId) return null;
    return this.availablePackages.find(p => p.id === this.selectedPackageId) || null;
  }
  
  // Nawigacja między krokami formularza
  nextStep(): void {
    if (this.currentStep === 1 && !this.selectedPackageId) {
      this.notificationService.warning('Wybierz pakiet serwisowy aby kontynuować.');
      return;
    }
    
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }
  
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  // Walidacja pól formularza
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
  
  // Sprawdza czy formularz kontaktowy i data są poprawne
  isContactFormValid(): boolean {
    return this.contactForm.valid && this.pickupDateControl.valid;
  }
  
  // Wysłanie formularza zamówienia
  submitOrder(): void {
    if (!this.isBrowser) return;
    
    if (this.contactForm.invalid || !this.termsAccepted.value || !this.selectedPackageId || this.pickupDateControl.invalid) {
      // Oznacz wszystkie pola jako dotknięte, żeby pokazać walidację
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
      this.pickupDateControl.markAsTouched();
      this.termsAccepted.markAsTouched();
      
      this.notificationService.warning('Wypełnij wszystkie wymagane pola formularza.');
      return;
    }
    
    this.isSubmitting = true;
    
    // Przygotuj dane do wysłania z nowymi polami adresowymi
    const pickupDate = this.pickupDateControl.value;
    if (!pickupDate) {
      this.notificationService.error('Wybierz datę odbioru');
      this.isSubmitting = false;
      return;
    }
    
    // Format date properly - ensure we have a Date object
    let formattedPickupDate: string;
    if (pickupDate && typeof pickupDate === 'object' && 'getFullYear' in pickupDate) {
      // It's a Date object
      const dateObj = pickupDate as Date;
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      formattedPickupDate = `${year}-${month}-${day}T00:00:00.000Z`;
    } else {
      // If it's already a string, use it as is
      formattedPickupDate = String(pickupDate);
    }
    
    const orderData: CreateGuestServiceOrderRequest = {
      // Dane użytkownika
      email: this.contactForm.get('email')?.value || '',
      phone: this.contactForm.get('phone')?.value || '',
      
      // Nowe pola adresowe
      pickupStreet: this.contactForm.get('pickupStreet')?.value || '',
      pickupBuildingNumber: this.contactForm.get('pickupBuildingNumber')?.value || '',
      pickupCity: this.contactForm.get('pickupCity')?.value || '',
      transportNotes: this.contactForm.get('notes')?.value || '',
      
      // Dane rowerów
      bicycles: this.bikesData.map(bike => ({
        brand: bike.brand,
        model: bike.model || '',
        additionalInfo: bike.additionalInfo || ''
      })),
      
      // Dane zamówienia
      servicePackageId: this.selectedPackageId!,
      pickupDate: formattedPickupDate
    };
    
    console.log('Sending order data with new address format:', orderData);
    
    // Wyślij dane do API
    this.http.post(`${environment.apiUrl}/guest-orders/service`, orderData)
      .subscribe({
        next: (response: any) => {
          console.log('Order submission successful:', response);
          this.isSubmitting = false;
          this.isSuccess = true;
          
          // Zapisz identyfikatory zamówień, jeśli są dostępne
          if (response.orderIds && Array.isArray(response.orderIds)) {
            this.orderIds = response.orderIds;
          }
          
          this.currentStep = 4; // Krok potwierdzenia
          this.notificationService.success('Zamówienie zostało złożone pomyślnie!');
          
          // Wyczyść dane formularza
          this.bikeFormService.clearData();
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error submitting order:', error);
          
          let errorMsg = 'Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.';
          
          // Sprawdź czy serwer zwrócił konkretny komunikat błędu
          if (error.error && error.error.message) {
            errorMsg = error.error.message;
          }
          
          this.notificationService.error(errorMsg);
        }
      });
  }
  
  // Nawigacja do rejestracji
  goToRegistration(): void {
    this.router.navigate(['/register']);
  }
  
  // Nawigacja do logowania
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  
  // Powrót do strony głównej
  goToHome(): void {
    this.router.navigate(['/']);
  }
}