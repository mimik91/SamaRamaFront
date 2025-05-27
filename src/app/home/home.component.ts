import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EnumerationService } from '../core/enumeration.service';
import { BikeFormService, BikeFormData } from './bike-form.service';
import { ServiceSlotService } from '../service-slots/service-slot.service';
import { HomeHeroComponent } from './home-hero.component';
import { NotificationService } from '../core/notification.service';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    HomeHeroComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private enumerationService = inject(EnumerationService);
  private bikeFormService = inject(BikeFormService);
  private serviceSlotService = inject(ServiceSlotService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private isBrowser: boolean;

  steps = [
    {
      number: 1,
      title: 'Umów się na serwis w swoim serwisie rowerowym',
      description: 'Skontaktuj się z wybranym serwisem i umów termin na serwis Twojego roweru.',
      icon: 'calendar'
    },
    {
      number: 2,
      title: 'Zarejestruj rower w systemie',
      description: 'Dodaj jednoślad do systemu, podając podstawowe informacje.',
      icon: 'file-text'
    },
    {
      number: 3,
      title: 'Wybierz termin odbioru',
      description: 'Wskaż dogodny dzień odbioru (dzień przed umówionym serwisem), a my odbierzemy Twój rower spod wskazanego adresu w godzinach 18:00 - 22:00.',
      icon: 'clock'
    },
    {
      number: 4,
      title: 'Odbierzemy od Ciebie rower',
      description: 'Możesz też przypiąć rower zapięciem na szyfr i przesłać nam lokalizację oraz kod do zapięcia.',
      icon: 'package'
    },
    {
      number: 5,
      title: 'Dostarczymy rower do wybranego serwisu',
      description: 'Bezpiecznie przewieziemy Twój rower do umówionego serwisu na wyznaczony termin.',
      icon: 'truck'
    },
    {
      number: 6,
      title: 'Po zakończeniu serwisu odbierzemy i dostarczymy rower z powrotem',
      description: 'Przywozimy go z powrotem pod wskazany adres, gotowego do jazdy.',
      icon: 'tool'
    }
  ];
  

  bikeForm: FormGroup;
  brands: string[] = [];
  loadingBrands = true;
  formSubmitted = false;
  
  // Maximum bikes per order from service slots configuration
  maxBikesPerOrder = 5; // Default value
  loadingMaxBikes = true;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    this.bikeForm = this.fb.group({
      bikes: this.fb.array([this.createBikeFormGroup()])
    });
    
  }

  ngOnInit(): void {
  this.loadBrands();
  this.loadMaxBikesConfiguration();
  
  // Sprawdzamy, czy mamy zapisane dane formularza w serwisie
  const savedBikesData = this.bikeFormService.getBikesDataValue();
  if (savedBikesData.length > 0) {
    // Jeśli mamy dane, usuwamy domyślny, pusty formularz
    while (this.bikesArray.length !== 0) {
      this.bikesArray.removeAt(0);
    }
    
    // Dodajemy formularze bazując na zapisanych danych
    savedBikesData.forEach(bikeData => {
      const bikeGroup = this.createBikeFormGroup();
      bikeGroup.patchValue(bikeData);
      this.bikesArray.push(bikeGroup);
    });
  }

  // Sprawdź, czy mamy parametr 'section' w URL i przewiń do odpowiedniej sekcji
  if (this.isBrowser) {
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        setTimeout(() => {
          this.scrollToSection(params['section']);
        }, 500); // Małe opóźnienie, aby strona zdążyła się załadować
      }
    });
  }
}

  private loadBrands(): void {
    this.loadingBrands = true;
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => {
        this.brands = brands;
        this.loadingBrands = false;
      },
      error: () => {
        this.loadingBrands = false;
        this.brands = ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott']; // Przykładowe marki jako fallback
      }
    });
  }
  
  private loadMaxBikesConfiguration(): void {
    this.loadingMaxBikes = true;
    
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Get availability for today to determine max bikes
    this.serviceSlotService.getSlotAvailability(formattedDate).subscribe({
      next: (availability) => {
        if (availability && availability.maxBikesPerOrder) {
          this.maxBikesPerOrder = availability.maxBikesPerOrder;
        }
        this.loadingMaxBikes = false;
      },
      error: (error) => {
        console.error('Error loading maximum bikes configuration:', error);
        // Keep default value if error
        this.loadingMaxBikes = false;
      }
    });
  }

  private createBikeFormGroup(): FormGroup {
    return this.fb.group({
      brand: ['', Validators.required],
      model: [''],
      additionalInfo: ['']
    });
  }

  get bikesArray(): FormArray {
    return this.bikeForm.get('bikes') as FormArray;
  }
  
  // Check if more bikes can be added based on server configuration
  canAddMoreBikes(): boolean {
    return this.bikesArray.length < this.maxBikesPerOrder;
  }

  addBike(): void {
    // Check against the dynamic maximum
    if (this.canAddMoreBikes()) {
      this.bikesArray.push(this.createBikeFormGroup());
    } else {
      this.notificationService.warning(`Możesz dodać maksymalnie ${this.maxBikesPerOrder} rowerów. Aby dodać więcej, zarejestruj się lub zaloguj.`);
    }
  }

  removeBike(index: number): void {
    if (this.bikesArray.length > 1) {
      this.bikesArray.removeAt(index);
    }
  }

  isFieldInvalid(index: number, fieldName: string): boolean {
    const field = this.bikesArray.at(index).get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  onSubmit(): void {
    if (this.bikeForm.valid) {
      // Konwertujemy dane formularza do formatu używanego przez serwis
      const bikesData: BikeFormData[] = this.bikesArray.controls.map(control => {
        return {
          brand: control.get('brand')?.value,
          model: control.get('model')?.value,
          additionalInfo: control.get('additionalInfo')?.value
        };
      });
      
      // Zapisujemy dane formularza w serwisie
      this.bikeFormService.setBikesData(bikesData);
      
      // Przekieruj do formularza zamówienia dla gości
      this.router.navigate(['/guest-order']);
    } else {
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      this.markFormGroupTouched(this.bikeForm);
      this.notificationService.warning('Proszę wypełnić wszystkie wymagane pola formularza.');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Metoda wywoływana bezpośrednio przez przycisk
  goToServiceOrder(): void {
    // Zapisujemy dane formularza, niezależnie od walidacji
    const bikesData: BikeFormData[] = this.bikesArray.controls.map(control => {
      return {
        brand: control.get('brand')?.value || 'Nieznana',
        model: control.get('model')?.value || '',
        additionalInfo: control.get('additionalInfo')?.value || ''
      };
    });
    
    // Zapisujemy dane formularza w serwisie
    this.bikeFormService.setBikesData(bikesData);
    
    // Pokazujemy powiadomienie o sukcesie
    this.notificationService.success('Dane roweru zostały zapisane');
    
    // Przekierowanie
    this.router.navigate(['/guest-order']);
  }

  // Metoda do resetowania formularza
  resetForm(): void {
    // Zachowujemy jeden pusty formularz
    while (this.bikesArray.length > 1) {
      this.bikesArray.removeAt(1);
    }
    
    // Resetujemy pierwszy formularz
    this.bikesArray.at(0).reset({
      brand: '',
      model: '',
      additionalInfo: ''
    });
    
    // Resetujemy stan formularza
    this.formSubmitted = false;
    
    // Czyścimy dane w serwisie
    this.bikeFormService.clearData();
    
    // Pokaż powiadomienie
    this.notificationService.info('Formularz został zresetowany');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
  // Metoda do przewijania do sekcji
  scrollToSection(sectionId: string): void {
    if (!this.isBrowser) return;
    
    const element = document.getElementById(sectionId);
    if (element) {
      // Dodajemy offset, aby uwzględnić navbar i inne elementy
      const offset = 80; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}