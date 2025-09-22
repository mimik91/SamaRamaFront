import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../core/notification.service';
import { environment } from '../core/api-config';

@Component({
  selector: 'app-service-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-registration.component.html',
  styleUrls: ['./service-registration.component.css']
})
export class ServiceRegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  registrationForm: FormGroup;
  isSubmitting = false;
  isSuccess = false;
  maxDataLength = 2000; // Zwiększone dla nowych pól
  dataLengthExceeded = false;
  isExistingService = false; // Czy to rejestracja istniejącego serwisu z mapy
  serviceId: number | null = null;

  constructor() {
    this.registrationForm = this.fb.group({
      contactPerson: ['', [Validators.required, Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      serviceName: ['', [Validators.required, Validators.maxLength(50)]],
      website: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1500)]],
      street: ['', [Validators.maxLength(50)]],
      building: ['', [Validators.maxLength(10)]],
      flat: ['', [Validators.maxLength(10)]],
      city: ['', [Validators.maxLength(30)]]
    });
  }

  ngOnInit(): void {
    // Sprawdź parametry URL i wypełnij formularz jeśli są dostępne
    this.route.queryParams.subscribe(params => {
      if (params['serviceId']) {
        this.isExistingService = true;
        this.serviceId = +params['serviceId'];
        
        // Wypełnij formularz danymi z parametrów URL
        this.registrationForm.patchValue({
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getCharacterCount(fieldName: string): number {
    const field = this.registrationForm.get(fieldName);
    return field ? (field.value?.length || 0) : 0;
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      Object.keys(this.registrationForm.controls).forEach(key => {
        const control = this.registrationForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificationService.warning('Wypełnij wszystkie wymagane pola formularza.');
      return;
    }

    const formValues = this.registrationForm.value;
    
    // Przygotuj dane w zależności od typu rejestracji
    let serviceData: string;
    
    if (this.isExistingService && this.serviceId) {
      // Rejestracja istniejącego serwisu z dodatkowymi danymi
      serviceData = this.formatExistingServiceData(formValues);
    } else {
      // Nowa rejestracja serwisu
      serviceData = this.formatNewServiceData(formValues);
    }
    
    // Sprawdź długość danych
    if (serviceData.length > this.maxDataLength) {
      this.dataLengthExceeded = true;
      this.notificationService.error(`Dane przekraczają maksymalną długość ${this.maxDataLength} znaków. Proszę skrócić wprowadzone informacje.`);
      return;
    }
    
    this.isSubmitting = true;
    this.dataLengthExceeded = false;
    
    console.log(`Długość danych: ${serviceData.length}/${this.maxDataLength} znaków`);
    
    // Wyślij dane do API
    const endpoint = this.isExistingService 
      ? `${environment.apiUrl}/guest-orders/existing-service-registration`
      : `${environment.apiUrl}/guest-orders/service-registration`;
    
    const payload = this.isExistingService 
      ? { serviceId: this.serviceId, data: serviceData }
      : [serviceData];
    
    this.http.post(endpoint, payload)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isSuccess = true;
          const message = this.isExistingService 
            ? 'Zgłoszenie aktualizacji serwisu zostało wysłane. Skontaktujemy się z Tobą wkrótce.'
            : 'Zgłoszenie zostało wysłane. Skontaktujemy się z Tobą wkrótce.';
          this.notificationService.success(message);
          
          // Wyczyść formularz po sukcesie
          this.registrationForm.reset();
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error submitting service registration:', error);
          this.notificationService.error('Wystąpił błąd podczas wysyłania zgłoszenia. Spróbuj ponownie później.');
        }
      });
  }

  private formatNewServiceData(formValues: any): string {
    // Format dla nowego serwisu: K:kontakt|T:telefon|E:email|S:nazwa|W:website|D:opis|A:adres
    const addressParts = [
      formValues.street,
      formValues.building,
      formValues.flat ? `m.${formValues.flat}` : '',
      formValues.city
    ].filter(part => part && part.trim()).join(' ');

    return [
      `K:${formValues.contactPerson}`,
      `T:${formValues.phoneNumber}`,
      `E:${formValues.email}`,
      `S:${formValues.serviceName}`,
      formValues.website ? `W:${formValues.website}` : '',
      formValues.description ? `D:${formValues.description}` : '',
      addressParts ? `A:${addressParts}` : ''
    ].filter(part => part).join('|');
  }

  private formatExistingServiceData(formValues: any): string {
    // Format dla istniejącego serwisu: wszystkie dostępne informacje
    const addressParts = [
      formValues.street,
      formValues.building,
      formValues.flat ? `m.${formValues.flat}` : '',
      formValues.city
    ].filter(part => part && part.trim()).join(' ');

    return [
      `ID:${this.serviceId}`,
      `K:${formValues.contactPerson}`,
      `T:${formValues.phoneNumber}`,
      `E:${formValues.email}`,
      `S:${formValues.serviceName}`,
      formValues.website ? `W:${formValues.website}` : '',
      formValues.description ? `D:${formValues.description}` : '',
      addressParts ? `A:${addressParts}` : ''
    ].filter(part => part).join('|');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    if (this.isExistingService) {
      this.router.navigate(['/']);
    } else {
      this.goToHome();
    }
  }
}