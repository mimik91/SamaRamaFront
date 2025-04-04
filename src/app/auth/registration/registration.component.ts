import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, UserRegistrationData, ServiceRegistrationData } from '../auth.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="register-container">
      <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
        <h2>
          {{ isServiceman ? 'Rejestracja Serwisanta' : 'Rejestracja Klienta' }}
        </h2>

        <ng-container *ngIf="!isServiceman">
          <div class="form-group">
            <label for="firstName">Imię</label>
            <input
              type="text"
              id="firstName"
              formControlName="firstName"
              required
            />
          </div>

          <div class="form-group">
            <label for="lastName">Nazwisko</label>
            <input
              type="text"
              id="lastName"
              formControlName="lastName"
              required
            />
          </div>
        </ng-container>

        <ng-container *ngIf="isServiceman">
          <div class="form-group">
            <label for="name">Nazwa serwisu</label>
            <input type="text" id="name" formControlName="name" required />
          </div>

          <div class="form-group">
            <label for="street">Ulica</label>
            <input
              type="text"
              id="street"
              formControlName="street"
              required
            />
          </div>

          <div class="form-group">
            <label for="building">Numer budynku</label>
            <input
              type="text"
              id="building"
              formControlName="building"
              required
            />
          </div>

          <div class="form-group">
            <label for="flat">Numer lokalu</label>
            <input
              type="text"
              id="flat"
              formControlName="flat"
            />
          </div>

          <div class="form-group">
            <label for="postalCode">Kod pocztowy</label>
            <input
              type="text"
              id="postalCode"
              formControlName="postalCode"
            />
          </div>

          <div class="form-group">
            <label for="city">Miasto</label>
            <input type="text" id="city" formControlName="city" required />
          </div>

          <div class="form-group">
            <label for="description">Opis serwisu</label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
            ></textarea>
          </div>
        </ng-container>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" formControlName="email" required />
        </div>

        <div class="form-group">
          <label for="phoneNumber">Numer Telefonu</label>
          <input
            type="tel"
            id="phoneNumber"
            formControlName="phoneNumber"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Hasło</label>
          <input
            type="password"
            id="password"
            formControlName="password"
            required
          />
        </div>

        <button type="submit" [disabled]="registrationForm.invalid">
          Zarejestruj się
        </button>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .register-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
      }
      .form-group {
        margin-bottom: 15px;
      }
      .error-message {
        color: red;
        margin-top: 10px;
      }
    `,
  ],
})
export class RegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registrationForm: FormGroup;
  isServiceman: boolean = false;
  errorMessage: string = '';

  constructor() {
    this.registrationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Determine user type based on route data
    this.route.data.subscribe(data => {
      this.isServiceman = data['userType'] === 'serviceman';
      
      if (this.isServiceman) {
        this.registrationForm.addControl('name', this.fb.control('', Validators.required));
        this.registrationForm.addControl('street', this.fb.control('', Validators.required));
        this.registrationForm.addControl('building', this.fb.control('', Validators.required));
        this.registrationForm.addControl('flat', this.fb.control(''));
        this.registrationForm.addControl('postalCode', this.fb.control(''));
        this.registrationForm.addControl('city', this.fb.control('', Validators.required));
        this.registrationForm.addControl('businessPhone', this.fb.control(''));
        this.registrationForm.addControl('latitude', this.fb.control(null));
        this.registrationForm.addControl('longitude', this.fb.control(null));
        this.registrationForm.addControl('description', this.fb.control(''));
      } else {
        this.registrationForm.addControl('firstName', this.fb.control('', Validators.required));
        this.registrationForm.addControl('lastName', this.fb.control('', Validators.required));
      }
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const userData = this.registrationForm.value;
      
      if (this.isServiceman) {
        // Create data structure matching BikeServiceDto
        const serviceData: ServiceRegistrationData = {
          name: userData.name,
          street: userData.street,
          building: userData.building,
          flat: userData.flat || '',
          postalCode: userData.postalCode || '',
          city: userData.city,
          phoneNumber: userData.phoneNumber,
          businessPhone: userData.businessPhone || '',
          email: userData.email,
          latitude: userData.latitude,
          longitude: userData.longitude,
          description: userData.description || '',
          password: userData.password
        };
        
        this.authService.registerService(serviceData).subscribe({
          next: (response) => {
            this.router.navigate(['/login-serviceman']);
          },
          error: (error: any) => {
            console.error('Registration failed', error);
            this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          }
        });
      } else {
        // Create data structure matching UserRegistrationDto
        const clientData: UserRegistrationData = {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          password: userData.password
        };
        
        this.authService.registerClient(clientData).subscribe({
          next: (response) => {
            this.router.navigate(['/login']);
          },
          error: (error: any) => {
            console.error('Registration failed', error);
            this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          }
        });
      }
    }
  }
}