import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators,
  FormArray,
  FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { BikeFormService, BikeFormData } from '../../home/bike-form.service';
import { ServicePackage } from '../../service-package/service-package.model';
import { ServicePackageService } from '../../service-package/service-package.service';
import { EnumerationService } from '../../core/enumeration.service';

@Component({
  selector: 'app-guest-service-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  
  // Formularz danych kontaktowych
  contactForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    notes: ['']
  });

  // Akceptacja regulaminu
  termsAccepted = new FormControl(false, [Validators.requiredTrue]);
  
  // Stany UI
  isSubmitting = false;
  isSuccess = false;
  
  ngOnInit(): void {
    console.log("GuestServiceOrderComponent initialized");
    
    // Pobierz dane rowerów z serwisu
    this.bikesData = this.bikeFormService.getBikesDataValue();
    console.log("Bikes data from service:", this.bikesData);
    
    // Jeżeli nie ma danych o rowerach, przekieruj na stronę główną, ale dodaj więcej informacji o tym co się dzieje
    if (!this.bikesData || this.bikesData.length === 0) {
      console.log("No bikes data found in service!");
      this.notificationService.warning('Nie wprowadzono danych o rowerach.');
      this.router.navigate(['/']);
      return;
    }
    
    // Załaduj pakiety serwisowe
    this.loadServicePackages();
    
    // Załaduj miasta
    this.loadCities();
  }
  
  private loadServicePackages(): void {
    this.loadingPackages = true;
    console.log("Starting to load service packages...");
    
    this.servicePackageService.getActivePackages().subscribe({
      next: (packages: ServicePackage[]) => {
        console.log("Received service packages:", packages);
        this.availablePackages = packages || []; // Upewnij się, że zawsze masz tablicę
        this.loadingPackages = false;
      },
      error: (error) => {
        console.error('Failed to load service packages:', error);
        this.notificationService.error('Nie udało się załadować pakietów serwisowych.');
        this.loadingPackages = false;
        this.availablePackages = []; // Ustaw pustą tablicę, aby uniknąć problemów z renderowaniem
      }
    });
  }
  
  private loadCities(): void {
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
        
        // Fallback to empty array
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
  
  // Wysłanie formularza zamówienia
  submitOrder(): void {
    if (this.contactForm.invalid || !this.termsAccepted.value || !this.selectedPackageId) {
      // Oznacz wszystkie pola jako dotknięte, żeby pokazać walidację
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
      this.termsAccepted.markAsTouched();
      
      this.notificationService.warning('Wypełnij wszystkie wymagane pola formularza.');
      return;
    }
    
    this.isSubmitting = true;
    
    // Normanie tutaj byłoby wysłanie danych do API
    // Ale ponieważ użytkownik nie jest zalogowany, możemy tylko przekierować do rejestracji
    
    // Symulacja opóźnienia API
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSuccess = true;
      this.currentStep = 4; // Krok podsumowania
      
      // Opcjonalnie możemy wyczyścić dane w serwisie po pomyślnym zamówieniu
      // this.bikeFormService.clearData();
    }, 1500);
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