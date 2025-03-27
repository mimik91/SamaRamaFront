import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="register-container">
      <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
        <h2>{{ isServiceman ? 'Serviceman Registration' : 'Client Registration' }}</h2>
        
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input type="text" id="firstName" formControlName="firstName" required>
        </div>
        
        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input type="text" id="lastName" formControlName="lastName" required>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" formControlName="email" required>
        </div>
        
        <div class="form-group">
          <label for="phoneNumber">Phone Number</label>
          <input type="tel" id="phoneNumber" formControlName="phoneNumber" required>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" formControlName="password" required>
        </div>
        
        <div class="register-options">
          <button type="button" (click)="switchRegistrationType()">
            Switch to {{ isServiceman ? 'Client' : 'Serviceman' }} Registration
          </button>
        </div>
        
        <button type="submit" [disabled]="registrationForm.invalid">
          Register
        </button>
      </form>
    </div>
  `,
  styles: [`
    .register-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
  `]
})
export class RegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  registrationForm: FormGroup;
  isServiceman: boolean = false;

  constructor() {
    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Determine user type based on route data
    this.route.data.subscribe(data => {
      this.isServiceman = data['userType'] === 'serviceman';
    });
  }

  switchRegistrationType() {
    if (this.isServiceman) {
      this.router.navigate(['/register']); // Go to client registration
    } else {
      this.router.navigate(['/register-serviceman']); // Go to serviceman registration
    }
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      const userData = this.registrationForm.value;
      
      const registrationMethod = this.isServiceman
        ? this.authService.registerServiceman(userData)
        : this.authService.registerClient(userData);
      
      registrationMethod.subscribe({
        next: (response) => {
          // Navigate to login page after successful registration
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration failed', error);
        }
      });
    }
  }
}