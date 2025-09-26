import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../core/notification.service';
import { environment } from '../core/api-config';
import { firstValueFrom, Observable, of, timer, Subscription } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

interface BikeRepairCoverageCategory {
  id: number;
  name: string;
  displayOrder?: number;
}

interface BikeRepairCoverage {
  id: number;
  name: string;
  categoryId: number;
}

interface BikeRepairCoverageMapDto {
  coveragesByCategory: { [key: string]: BikeRepairCoverage[] };
}

@Component({
  selector: 'app-service-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './service-registration.component.html',
  styleUrls: ['./service-registration.component.css']
})
export class ServiceRegistrationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  // Formularze dla różnych etapów
  basicInfoForm!: FormGroup;
  coverageForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // Stan komponentu
  currentStep = 1;
  totalSteps = 3;
  isSubmitting = false;
  isSuccess = false;
  isLoadingCoverages = false;
  isExistingService = false;
  serviceId: number | null = null;
  registeredServiceId: number | null = null;

  // Stan sprawdzania suffixu
  isCheckingSuffix = false;
  suffixCheckResult: 'available' | 'taken' | null = null;
  private suffixStatusSubscription?: Subscription;

  // Dane coverage
  availableCoverages: BikeRepairCoverageMapDto | null = null;
  categories: BikeRepairCoverageCategory[] = [];
  selectedCoverages: { [categoryId: number]: number[] } = {};
  customCoverages: { [categoryId: number]: string[] } = {};
  customCategories: { name: string; coverages: string[] }[] = [];

  constructor() {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      contactPerson: ['', [Validators.required, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      serviceName: ['', [Validators.required, Validators.maxLength(50)]],
      suffix: ['', [Validators.maxLength(100)], [this.suffixAsyncValidator.bind(this)]],
      website: ['', [Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(1500)]],
      street: ['', [Validators.maxLength(255)]],
      building: ['', [Validators.maxLength(20)]],
      flat: ['', [Validators.maxLength(20)]],
      postalCode: ['', [Validators.maxLength(10)]],
      city: ['', [Validators.maxLength(100)]]
    });

    this.coverageForm = this.fb.group({
      // Dynamiczne pola będą dodawane dla każdej kategorii
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Nasłuchuj zmian statusu pola suffix
    this.setupSuffixStatusListener();
  }

  private setupSuffixStatusListener(): void {
    this.suffixStatusSubscription = this.basicInfoForm.get('suffix')?.statusChanges.subscribe(status => {
      const suffixControl = this.basicInfoForm.get('suffix');
      
      if (status === 'PENDING') {
        this.isCheckingSuffix = true;
        this.suffixCheckResult = null;
      } else {
        this.isCheckingSuffix = false;
        
        if (suffixControl?.valid && suffixControl.value && suffixControl.value.trim()) {
          this.suffixCheckResult = 'available';
        } else if (suffixControl?.hasError('suffixTaken')) {
          this.suffixCheckResult = 'taken';
        } else {
          this.suffixCheckResult = null;
        }
      }
    });
  }

  // Asynchroniczny walidator suffixu
  private suffixAsyncValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    // Jeśli pole jest puste, nie sprawdzamy
    if (!control.value || control.value.trim() === '') {
      return of(null);
    }

    const trimmedValue = control.value.trim();

    return timer(500).pipe( // Debounce 500ms
      switchMap(() => this.checkSuffixAvailability(trimmedValue)),
      map(isTaken => {
        return isTaken ? { suffixTaken: true } : null;
      }),
      catchError(() => {
        // W przypadku błędu API, nie blokujemy formularza
        console.error('Error checking suffix availability');
        return of(null);
      })
    );
  }

  // Metoda sprawdzająca dostępność suffixu
  private checkSuffixAvailability(suffix: string): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/bike-services/check-suffix`, {
      params: { suffix: suffix }
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    if (confirmPassword?.hasError('mismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  ngOnInit(): void {
    // Sprawdź parametry URL i wypełnij formularz jeśli są dostępne
    this.route.queryParams.subscribe(params => {
      if (params['serviceId']) {
        this.isExistingService = true;
        this.serviceId = +params['serviceId'];
        
        // Wypełnij formularz danymi z parametrów URL
        this.basicInfoForm.patchValue({
          serviceName: params['serviceName'] || '',
          phoneNumber: params['phoneNumber'] || '',
          street: params['street'] || '',
          building: params['building'] || '',
          flat: params['flat'] || '',
          city: params['city'] || '',
          description: params['description'] || ''
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.suffixStatusSubscription) {
      this.suffixStatusSubscription.unsubscribe();
    }
  }

  private loadAvailableCoverages(): void {
    this.isLoadingCoverages = true;
    this.http.get<BikeRepairCoverageMapDto>(`${environment.apiUrl}/bike-services/repair-coverage/all`)
      .subscribe({
        next: (data) => {
          this.availableCoverages = data;
          this.setupCoverageForm(data);
          this.isLoadingCoverages = false;
        },
        error: (error) => {
          console.error('Error loading coverages:', error);
          this.notificationService.error('Błąd podczas ładowania dostępnych usług.');
          this.isLoadingCoverages = false;
          // W przypadku błędu, cofnij do kroku 1
          this.currentStep = 1;
        }
      });
  }

  private setupCoverageForm(data: BikeRepairCoverageMapDto): void {
    // Przekonwertuj mapę na tablicę kategorii - klucze to stringi reprezentujące DTO
    this.categories = Object.keys(data.coveragesByCategory).map((categoryKey) => {
      // Parse string w formacie "BikeRepairCoverageCategoryDto(id=1, name=Typ roweru, displayOrder=1)"
      const idMatch = categoryKey.match(/id=(\d+)/);
      const nameMatch = categoryKey.match(/name=([^,)]+)/);
      const displayOrderMatch = categoryKey.match(/displayOrder=(\d+)/);
      
      return {
        id: idMatch ? parseInt(idMatch[1]) : 0,
        name: nameMatch ? nameMatch[1] : '',
        displayOrder: displayOrderMatch ? parseInt(displayOrderMatch[1]) : 0
      };
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Zainicjalizuj selectedCoverages dla każdej kategorii
    this.categories.forEach(category => {
      this.selectedCoverages[category.id] = [];
      this.customCoverages[category.id] = [''];
    });
  }

  // Metody pomocnicze dla formularzy
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getCharacterCount(form: FormGroup, fieldName: string): number {
    const field = form.get(fieldName);
    return field ? (field.value?.length || 0) : 0;
  }

  // Metody zarządzania krokami
  nextStep(): void {
    if (this.currentStep === 1 && this.basicInfoForm.valid) {
      // Przechodzenie do kroku 2 - załaduj coverage'y
      if (!this.availableCoverages) {
        this.loadAvailableCoverages();
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      this.currentStep = 3;
    } else if (this.currentStep === 1) {
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      Object.keys(this.basicInfoForm.controls).forEach(key => {
        const control = this.basicInfoForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.warning('Wypełnij wszystkie wymagane pola formularza.');
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Metody zarządzania coverage
  getCoveragesForCategory(categoryId: number): BikeRepairCoverage[] {
    if (!this.availableCoverages) return [];
    
    // Znajdź klucz kategorii na podstawie ID
    for (const [categoryKey, coverages] of Object.entries(this.availableCoverages.coveragesByCategory)) {
      const idMatch = categoryKey.match(/id=(\d+)/);
      if (idMatch && parseInt(idMatch[1]) === categoryId) {
        return coverages;
      }
    }
    return [];
  }

  toggleCoverage(categoryId: number, coverageId: number): void {
    if (!this.selectedCoverages[categoryId]) {
      this.selectedCoverages[categoryId] = [];
    }

    const index = this.selectedCoverages[categoryId].indexOf(coverageId);
    if (index > -1) {
      this.selectedCoverages[categoryId].splice(index, 1);
    } else {
      this.selectedCoverages[categoryId].push(coverageId);
    }
  }

  isCoverageSelected(categoryId: number, coverageId: number): boolean {
    return this.selectedCoverages[categoryId]?.includes(coverageId) || false;
  }

  addCustomCoverage(categoryId: number): void {
    if (!this.customCoverages[categoryId]) {
      this.customCoverages[categoryId] = [];
    }
    this.customCoverages[categoryId].push('');
  }

  removeCustomCoverage(categoryId: number, index: number): void {
    if (this.customCoverages[categoryId]) {
      this.customCoverages[categoryId].splice(index, 1);
    }
  }

  updateCustomCoverage(categoryId: number, index: number, value: string): void {
    if (this.customCoverages[categoryId]) {
      this.customCoverages[categoryId][index] = value;
    

      // JeÅ›li to ostatnie pole i nie jest puste, dodaj nowe
      if (index === this.customCoverages[categoryId].length - 1 && value.trim()) {
        this.addCustomCoverage(categoryId);
      }
    }
  }

  updateCustomCategoryItem(categoryIndex: number, itemIndex: number, value: string): void {
    this.customCategories[categoryIndex].coverages[itemIndex] = value;
    
    // Jeśli to ostatnie pole i nie jest puste, dodaj nowe
    const coverages = this.customCategories[categoryIndex].coverages;
    if (itemIndex === coverages.length - 1 && value.trim()) {
      this.addCustomCategoryItem(categoryIndex);
    }
  }

  addCustomCategory(): void {
    this.customCategories.push({ name: '', coverages: [''] });
  }

  removeCustomCategory(index: number): void {
    this.customCategories.splice(index, 1);
  }

  updateCustomCategoryName(index: number, name: string): void {
    this.customCategories[index].name = name;
  }

  addCustomCategoryItem(categoryIndex: number): void {
    this.customCategories[categoryIndex].coverages.push('');
  }

  removeCustomCategoryItem(categoryIndex: number, itemIndex: number): void {
    this.customCategories[categoryIndex].coverages.splice(itemIndex, 1);
  }

  trackByFn(index: number, item: any): number {
  return index; // Używamy indeksu, ponieważ elementy są stringami
}

  

  // Finalizacja rejestracji
  async finalizeRegistration(): Promise<void> {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.warning('Wypełnij poprawnie dane hasła.');
      return;
    }

    this.isSubmitting = true;

    try {
      // 1. Zarejestruj serwis
      console.log('Rejestrowanie serwisu...');
      const serviceData = this.buildServiceData();
      const serviceResponse = await this.registerBikeService(serviceData);
      
      if (!serviceResponse || !serviceResponse.id) {
        throw new Error('Nie otrzymano ID zarejestrowanego serwisu');
      }
      
      this.registeredServiceId = serviceResponse.id;
      console.log('Serwis zarejestrowany z ID:', this.registeredServiceId);

      // 2. Zarejestruj użytkownika serwisu
      console.log('Rejestrowanie użytkownika...');
      await this.registerServiceUser();
      console.log('Użytkownik zarejestrowany');

      // 3. Przypisz coverage'y - OPCJONALNE, nie blokuj rejestracji jeśli się nie uda
      try {
        console.log('Przypisywanie coverage...');
        await this.assignCoverages();
        console.log('Coverage przypisane');
      } catch (coverageError) {
        console.warn('Nie udało się przypisać coverage, ale rejestracja przebiegła pomyślnie:', coverageError);
        // Nie rzucaj błędu - coverage można przypisać później w panelu użytkownika
      }

      this.isSubmitting = false;
      this.isSuccess = true;
      this.notificationService.success('Serwis został pomyślnie zarejestrowany!');

    } catch (error: any) {
      this.isSubmitting = false;
      console.error('Error during registration:', error);
      
      // Bardziej szczegółowa obsługa błędów
      if (error?.error?.message) {
        this.notificationService.error(`Błąd rejestracji: ${error.error.message}`);
      } else if (error?.message) {
        this.notificationService.error(`Błąd rejestracji: ${error.message}`);
      } else {
        this.notificationService.error('Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.');
      }
    }
  }

  private buildServiceData(): any {
    const basicData = this.basicInfoForm.value;
    
    return {
      // Pola z BikeService
      name: basicData.serviceName,
      email: basicData.email,
      street: basicData.street,
      building: basicData.building,
      flat: basicData.flat,
      postalCode: basicData.postalCode,
      city: basicData.city,
      phoneNumber: basicData.phoneNumber,
      transportCost: 0,
      transportAvailable: false,
      
      // Pola z BikeServiceRegistered
      suffix: basicData.suffix,
      contactPerson: basicData.contactPerson,
      website: basicData.website,
      description: basicData.description
    };
  }

  private async registerBikeService(serviceData: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/bike-services/register`, serviceData)
      );
      console.log('Service registered successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Error registering bike service:', error);
      throw error;
    }
  }

  private async registerServiceUser(): Promise<any> {
    const userData = {
      email: this.basicInfoForm.value.email,
      password: this.passwordForm.value.password,
      bikeServiceId: this.registeredServiceId
    };

    try {
      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/signup/service`, userData)
      );
      console.log('User registered successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Error registering service user:', error);
      throw error;
    }
  }

  private async assignCoverages(): Promise<any> {
    const coverageData = this.buildCoverageData();
    
    // Sprawdź czy są jakieś dane do przypisania
    const hasData = coverageData.existingCoverageIds.length > 0 || 
                    coverageData.customCoverages.length > 0 || 
                    coverageData.newCategories.length > 0;
    
    if (!hasData) {
      console.log('Brak coverage do przypisania, pomijam...');
      return Promise.resolve({ success: true, message: 'No coverage to assign' });
    }

    try {
      console.log('Wysyłanie coverage data:', coverageData);
      
      const response = await firstValueFrom(
        this.http.put(
          `${environment.apiUrl}/bike-services/repair-coverage/assign/${this.registeredServiceId}`, 
          coverageData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      );
      
      console.log('Coverage assigned successfully:', response);
      return response;
      
    } catch (error: any) {
      console.error('Error assigning coverages:', error);
      console.error('Error details:', {
        status: error?.status,
        statusText: error?.statusText,
        error: error?.error,
        message: error?.message
      });
      throw error;
    }
  }

  private buildCoverageData(): any {
    const data = {
      existingCoverageIds: [] as number[],
      newCategories: [] as any[],
      customCoverages: [] as any[]
    };

    // 1. Zbierz wybrane istniejące coverage'y
    this.categories.forEach(category => {
      const selectedIds = this.selectedCoverages[category.id] || [];
      data.existingCoverageIds.push(...selectedIds);

      // 2. Dodaj niestandardowe coverage'y do istniejących kategorii
      const customCoveragesForCategory = this.customCoverages[category.id] || [];
      customCoveragesForCategory.forEach(coverageName => {
        if (coverageName.trim()) {
          data.customCoverages.push({
            categoryName: category.name, // używamy nazwy kategorii zamiast ID
            coverageName: coverageName.trim()
          });
        }
      });
    });

    // 3. Dodaj nowe kategorie (tylko nazwy, bez coverage'ów)
    const uniqueCategoryNames = new Set<string>();
    
    this.customCategories.forEach(customCategory => {
      if (customCategory.name.trim()) {
        const categoryName = customCategory.name.trim();
        
        // Dodaj kategorię tylko raz (eliminuj duplikaty w żądaniu)
        if (!uniqueCategoryNames.has(categoryName)) {
          data.newCategories.push({
            name: categoryName
          });
          uniqueCategoryNames.add(categoryName);
        }

        // 4. Dodaj coverage'y dla nowych kategorii jako customCoverages
        customCategory.coverages.forEach(coverageName => {
          if (coverageName.trim()) {
            data.customCoverages.push({
              categoryName: categoryName,
              coverageName: coverageName.trim()
            });
          }
        });
      }
    });

    console.log('Simplified coverage data built:', data);
    return data;
  }

  // Nawigacja
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    if (this.currentStep === 1) {
      if (this.isExistingService) {
        this.router.navigate(['/']);
      } else {
        this.goToHome();
      }
    } else {
      this.prevStep();
    }
  }
}