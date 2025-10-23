import { Component, OnInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EnumerationService } from '../../core/enumeration.service';
import { BikeFormService, BikeFormData } from '../../home/bike-form.service';
import { ServiceSlotService } from '../../service-slots/service-slot.service';
import { HomeHeroComponent } from '../../home/home-hero.component';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    HomeHeroComponent,
  ],
  templateUrl: './how-it-works-page.component.html',
  styleUrls: ['./how-it-works-page.component.css']
})
export class HowItWorksPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private enumerationService = inject(EnumerationService);
  private bikeFormService = inject(BikeFormService);
  private serviceSlotService = inject(ServiceSlotService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private isBrowser: boolean;

  // Aktywny widok sekcji "Jak działamy"
  activeHowItWorksView: 'transport' | 'service' = 'transport';
  formSubmitted = false;

  transportSteps = [
    {
      number: 1,
      title: 'Umów się na serwis w swoim serwisie rowerowym',
      description: 'Skontaktuj się z wybranym serwisem i umów termin na serwis Twojego roweru.',
      icon: 'calendar'
    },
    {
      number: 2,
      title: 'Wypełnij formularz na naszej stronie',
      description: 'Dodaj rower do systemu, podaj wymagane dane i wybierz dzień odbioru (dzień przed serwisem). Odbierzemy go spod wskazanego adresu w godzinach 18:00—22:00.',
      icon: 'file-text'
    },
    {
      number: 3,
      title: 'Odbierzemy rower i zawieziemy do serwisu',
      description: 'Możesz też przypiąć rower zapięciem na szyfr i przesłać nam lokalizację oraz kod do zapięcia.',
      icon: 'truck'
    },
    {
      number: 4,
      title: 'Po zakończonym serwisie dostarczymy Ci rower z powrotem',
      description: 'Przywozimy go z powrotem pod wskazany adres, gotowego do jazdy.',
      icon: 'tool'
    }
  ];

  serviceSteps = [
    {
      number: 1,
      title: 'Zarejestruj rower w systemie',
      description: 'Dodaj jednoślad do systemu, podając podstawowe informacje.',
      icon: 'file-text'
    },
    {
      number: 2,
      title: 'Wybierz termin odbioru',
      description: 'Wskaż dogodny dzień odbioru, a my odbierzemy Twój rower spod wskazanego adresu w godzinach 18:00 - 22:00.',
      icon: 'clock'
    },
    {
      number: 3,
      title: 'Odbierzemy od Ciebie rower',
      description: 'Możesz też przypiąć rower zapięciem na szyfr i przesłać nam lokalizację oraz kod do zapięcia.',
      icon: 'package'
    },
    {
      number: 4,
      title: 'Bezpiecznie przewieziemy Twój rower do współpracującego z nami serwisu',
      description: 'Bezpiecznie przewieziemy Twój rower do współpracującego z nami serwisu.',
      icon: 'truck'
    },
    {
      number: 5,
      title: 'Po zakończeniu serwisu odbierzemy i dostarczymy rower z powrotem',
      description: 'Przywozimy go z powrotem pod wskazany adres, gotowego do jazdy.',
      icon: 'tool'
    },
    {
      number: 6,
      title: 'Płatność przy odbiorze',
      description: 'Płacisz za serwis przy odbiorze roweru za pomocą gotówki lub aplikacji BLIK.',
      icon: 'credit-card'
    }
  ];

  bikeForm: FormGroup;
  brands: string[] = [];
  loadingBrands = true;
  maxBikesPerOrder = 5; // Default value
  loadingMaxBikes = true;

  // Getter dla aktualnych kroków
  get currentSteps() {
    return this.activeHowItWorksView === 'transport' ? this.transportSteps : this.serviceSteps;
  }

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
          }, 500);
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
        this.brands = ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott'];
      }
    });
  }
  
  private loadMaxBikesConfiguration(): void {
    this.loadingMaxBikes = true;
    
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    this.serviceSlotService.getSlotAvailability(formattedDate).subscribe({
      next: (availability) => {
        if (availability && availability.maxBikesPerOrder) {
          this.maxBikesPerOrder = availability.maxBikesPerOrder;
        }
        this.loadingMaxBikes = false;
      },
      error: (error) => {
        console.error('Error loading maximum bikes configuration:', error);
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
  
  canAddMoreBikes(): boolean {
    return this.bikesArray.length < this.maxBikesPerOrder;
  }

  addBike(): void {
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
      const bikesData: BikeFormData[] = this.bikesArray.controls.map(control => {
        return {
          brand: control.get('brand')?.value,
          model: control.get('model')?.value,
          additionalInfo: control.get('additionalInfo')?.value
        };
      });
      
      this.bikeFormService.setBikesData(bikesData);
      this.router.navigate(['/guest-order']);
    } else {
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

  goToServiceOrder(): void {
    const bikesData: BikeFormData[] = this.bikesArray.controls.map(control => {
      return {
        brand: control.get('brand')?.value || 'Nieznana',
        model: control.get('model')?.value || '',
        additionalInfo: control.get('additionalInfo')?.value || ''
      };
    });
    
    this.bikeFormService.setBikesData(bikesData);
    this.notificationService.success('Dane roweru zostały zapisane');
    this.router.navigate(['/guest-order']);
  }

  resetForm(): void {
    while (this.bikesArray.length > 1) {
      this.bikesArray.removeAt(1);
    }
    
    this.bikesArray.at(0).reset({
      brand: '',
      model: '',
      additionalInfo: ''
    });
    
    this.formSubmitted = false;
    this.bikeFormService.clearData();
    this.notificationService.info('Formularz został zresetowany');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
  scrollToSection(sectionId: string): void {
    if (!this.isBrowser) return;
    
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  switchHowItWorksView(view: 'transport' | 'service'): void {
    this.router.navigate(['/']);
  }

  goToMap(): void {
    this.router.navigate(['/']);
  }
}