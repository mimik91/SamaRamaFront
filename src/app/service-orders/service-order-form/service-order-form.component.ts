import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormControl, 
  FormGroup, 
  ReactiveFormsModule, 
  ValidationErrors,
  Validators 
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BicycleService } from '../../bicycles/bicycle.service';
import { Bicycle } from '../../bicycles/bicycle.model';
import { 
  CreateServiceOrderRequest, 
  ServicePackage, 
  ServicePackageInfo 
} from '../service-order.model';
import { ServiceOrderService } from '../../service-orders/service-orders.service';
import { NotificationService } from '../../core/notification.service';
import { EnumerationService } from '../../core/enumeration.service';

@Component({
  selector: 'app-service-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-order-form.component.html',
  styleUrls: ['./service-order-form.component.css']
})
export class ServiceOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bicycleService = inject(BicycleService);
  private serviceOrderService = inject(ServiceOrderService);
  private notificationService = inject(NotificationService);
  private enumerationService = inject(EnumerationService);
  
  // Dane roweru
  bicycleId!: number;
  bicycle: Bicycle | null = null;
  
  // Kontrolki formularza
  currentStep = 1;
  selectedPackage: ServicePackage | null = null;
  
  // Data odbioru z walidacją dni tygodnia (niedziela-czwartek)
  pickupDateControl: FormControl = new FormControl('', [
    Validators.required,
    this.dateValidator.bind(this)
  ]);
  
  addressForm: FormGroup = this.fb.group({
    street: ['', [Validators.required]],
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
  
  // Dostępne pakiety serwisowe - początkowo puste, będą załadowane z API
  availablePackages: ServicePackageInfo[] = [];
  
  // Dostępne typy pakietów
  servicePackageTypes: ServicePackage[] = [];
  
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
    
    // Pobierz typy pakietów serwisowych
    this.enumerationService.getServicePackageTypes().subscribe({
      next: (types) => {
        this.servicePackageTypes = types;
      },
      error: (error) => {
        console.error('Nie udało się pobrać typów pakietów:', error);
        // Domyślne wartości na wypadek błędu
        this.servicePackageTypes = ['BASIC', 'EXTENDED', 'FULL'];
      }
    });
    
    // Pobierz pakiety serwisowe z API
    this.enumerationService.getServicePackages().subscribe({
      next: (packages) => {
        // Konwertuj obiekt na tablicę
        this.availablePackages = Object.values(packages);
      },
      error: (error) => {
        console.error('Nie udało się pobrać pakietów serwisowych:', error);
        // W przypadku błędu, wyświetl komunikat użytkownikowi
        this.notificationService.error('Wystąpił błąd podczas pobierania pakietów serwisowych');
        
        // Stwórz minimalne pakiety serwisowe aby interfejs mógł działać
        this.availablePackages = [
          {
            type: 'BASIC',
            name: 'Przegląd podstawowy',
            price: 200,
            description: 'Podstawowy przegląd',
            features: ['Podstawowe czynności serwisowe']
          },
          {
            type: 'EXTENDED',
            name: 'Przegląd rozszerzony',
            price: 350,
            description: 'Rozszerzony przegląd',
            features: ['Rozszerzone czynności serwisowe']
          },
          {
            type: 'FULL',
            name: 'Przegląd pełny',
            price: 600,
            description: 'Pełny przegląd',
            features: ['Pełny zakres czynności serwisowych']
          }
        ];
      }
    });
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
  
  // Walidator sprawdzający czy wybrana data jest od niedzieli do czwartku
  private dateValidator(control: FormControl): ValidationErrors | null {
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
    
    // Sprawdź dzień tygodnia (0 = niedziela, 4 = czwartek)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek > 4) { // Piątek i sobota są niedozwolone
      return { invalidDay: true };
    }
    
    return null;
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
  
  isDateAndAddressValid(): boolean {
    return this.pickupDateControl.valid && this.addressForm.valid;
  }
  
  // Metody do obsługi interfejsu
  selectPackage(packageType: ServicePackage): void {
    this.selectedPackage = packageType;
  }
  
  getSelectedPackageInfo(): ServicePackageInfo {
    if (!this.selectedPackage) {
      // Jeśli nie wybrano pakietu, zwróć pierwszy dostępny
      return this.availablePackages.length > 0 ? 
        this.availablePackages[0] : 
        { 
          type: 'BASIC', 
          name: 'Przegląd podstawowy', 
          price: 200, 
          description: 'Podstawowy przegląd', 
          features: [] 
        };
    }
    
    // Znajdź pakiet w dostępnych pakietach
    const packageInfo = this.availablePackages.find(p => p.type === this.selectedPackage);
    if (packageInfo) {
      return packageInfo;
    }
    
    // Fallback - jeśli nie znaleziono pakietu
    return { 
      type: this.selectedPackage, 
      name: this.selectedPackage, 
      price: 0, 
      description: '', 
      features: [] 
    };
  }
  
  nextStep(): void {
    if (this.currentStep < 3) {
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
      pickupAddress: `${this.addressForm.get('street')?.value}, ${this.addressForm.get('city')?.value}`,
      additionalNotes: this.addressForm.get('additionalNotes')?.value || undefined
    };
    
    // Wyślij zamówienie do API
    this.serviceOrderService.createServiceOrder(serviceOrder).subscribe({
      next: (response: {orderId: string}) => {
        this.isSubmitting = false;
        this.orderId = response.orderId;
        this.currentStep = 4; // Przejdź do potwierdzenia
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