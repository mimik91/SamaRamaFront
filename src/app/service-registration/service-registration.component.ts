import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  registrationForm: FormGroup;
  isSubmitting = false;
  isSuccess = false;
  maxDataLength = 255;
  dataLengthExceeded = false;

  constructor() {
    this.registrationForm = this.fb.group({
      contactPerson: ['', [Validators.required, Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      serviceName: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  // Zmiana metody onSubmit() w service-registration.component.ts

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

  // Przygotuj dane do zapisania
  const formValues = this.registrationForm.value;
  
  // Połącz wszystkie dane w jeden string z przejściami do nowej linii
  const serviceData = `K:${formValues.contactPerson}|T:${formValues.phoneNumber}|E:${formValues.email}|S:${formValues.serviceName}`;
  
  // Sprawdź długość danych
  if (serviceData.length > this.maxDataLength) {
    this.dataLengthExceeded = true;
    this.notificationService.error(`Dane przekraczają maksymalną długość ${this.maxDataLength} znaków. Proszę skrócić wprowadzone informacje.`);
    return;
  }
  
  this.isSubmitting = true;
  this.dataLengthExceeded = false;
  
  console.log(`Długość danych: ${serviceData.length}/${this.maxDataLength} znaków`);
  
  // Wyślij dane do API - ZMIENIONY ENDPOINT
  this.http.post(`${environment.apiUrl}/admin/service-registration`, [serviceData])
    .subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSuccess = true;
        this.notificationService.success('Zgłoszenie zostało wysłane. Skontaktujemy się z Tobą wkrótce.');
        
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

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}