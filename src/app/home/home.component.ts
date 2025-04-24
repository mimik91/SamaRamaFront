import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EnumerationService } from '../core/enumeration.service';
import { BikeFormService, BikeFormData } from './bike-form.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private enumerationService = inject(EnumerationService);
  private bikeFormService = inject(BikeFormService);

  bikeForm: FormGroup;
  brands: string[] = [];
  loadingBrands = true;
  formSubmitted = false;
  
  constructor() {
    this.bikeForm = this.fb.group({
      bikes: this.fb.array([this.createBikeFormGroup()])
    });
  }

  ngOnInit(): void {
    this.loadBrands();
    
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

  addBike(): void {
    // Ograniczenie do 5 rowerów
    if (this.bikesArray.length < 5) {
      this.bikesArray.push(this.createBikeFormGroup());
    } else {
      // Opcjonalnie: pokaż powiadomienie lub komunikat
      console.log('Osiągnięto maksymalną liczbę rowerów (5)');
      alert('Możesz dodać maksymalnie 5 rowerów. Aby dodać więcej, zarejestruj się lub zaloguj.');
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
    console.log('onSubmit wywołana');
    console.log('Stan formularza:', this.bikeForm.valid ? 'Formularz poprawny' : 'Formularz niepoprawny');
    console.log('Wartości formularza:', this.bikeForm.value);
    
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
      
      console.log('Form data saved:', bikesData);
      console.log('Przekierowuję do /guest-order');
      
      // Przekieruj do formularza zamówienia dla gości
      this.router.navigate(['/guest-order']);
    } else {
      console.log('Formularz niepoprawny - sprawdzam błędy:');
      
      // Sprawdź błędy w kontrolkach
      this.bikesArray.controls.forEach((control, index) => {
        const brandControl = control.get('brand');
        console.log(`Rower ${index + 1}, marka:`, 
          brandControl?.value, 
          brandControl?.valid ? 'poprawna' : 'niepoprawna', 
          brandControl?.errors);
      });
      
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      this.markFormGroupTouched(this.bikeForm);
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
    console.log('goToServiceOrder wywołana');
    
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
    console.log('Form data saved:', bikesData);
    
    // Bezpośrednie przekierowanie, bez sprawdzania walidacji
    try {
      window.location.href = '/guest-order';
      console.log('Przekierowano przez window.location');
    } catch (e) {
      console.error('Błąd przekierowania przez window.location:', e);
      
      try {
        this.router.navigate(['/guest-order']).then(
          success => console.log('Przekierowanie udane:', success),
          error => console.error('Błąd przekierowania:', error)
        ).catch(e => console.error('Wyjątek podczas przekierowania:', e));
      } catch (e) {
        console.error('Błąd w router.navigate:', e);
      }
    }
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
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}