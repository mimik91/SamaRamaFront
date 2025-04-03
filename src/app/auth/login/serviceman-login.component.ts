import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-serviceman-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2 class="title">Logowanie Serwisu Rowerowego</h2>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control"
              [class.is-invalid]="isFieldInvalid('email')"
              required
            >
            <div class="error-feedback" *ngIf="isFieldInvalid('email')">
              Wprowadź poprawny adres email
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">Hasło</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control"
              [class.is-invalid]="isFieldInvalid('password')"
              required
            >
            <div class="error-feedback" *ngIf="isFieldInvalid('password')">
              Hasło jest wymagane
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              type="button"
              class="btn btn-secondary"
              (click)="goToRegistration()"
            >
              Zarejestruj nowy serwis
            </button>
            
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="loginForm.invalid || isSubmitting"
            >
              {{ isSubmitting ? 'Logowanie...' : 'Zaloguj się' }}
            </button>
          </div>
          
          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div *ngIf="successMessage" class="success-message">
            {{ successMessage }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 500px;
      margin: 40px auto;
      padding: 20px;
    }
    
    .login-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 30px;
    }
    
    .title {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
      font-size: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }
    
    .form-control {
      display: block;
      width: 100%;
      padding: 10px 12px;
      font-size: 1rem;
      line-height: 1.5;
      color: #495057;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid #ced4da;
      border-radius: 4px;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    
    .form-control:focus {
      color: #495057;
      background-color: #fff;
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
    
    .is-invalid {
      border-color: #dc3545;
    }
    
    .error-feedback {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 5px;
    }
    
    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
    }
    
    .btn {
      display: inline-block;
      font-weight: 400;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      user-select: none;
      border: 1px solid transparent;
      padding: 10px 20px;
      font-size: 1rem;
      line-height: 1.5;
      border-radius: 4px;
      transition: all 0.15s ease-in-out;
      cursor: pointer;
    }
    
    .btn-primary {
      color: #fff;
      background-color: #007bff;
      border-color: #007bff;
    }
    
    .btn-primary:hover {
      background-color: #0069d9;
      border-color: #0062cc;
    }
    
    .btn-primary:disabled {
      background-color: #007bff;
      border-color: #007bff;
      opacity: 0.65;
      cursor: not-allowed;
    }
    
    .btn-secondary {
      color: #fff;
      background-color: #6c757d;
      border-color: #6c757d;
    }
    
    .btn-secondary:hover {
      background-color: #5a6268;
      border-color: #545b62;
    }
    
    .error-message {
      padding: 12px;
      border-radius: 4px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      margin-top: 20px;
    }
    
    .success-message {
      padding: 12px;
      border-radius: 4px;
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      margin-top: 20px;
    }
  `]
})
export class ServicemanLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  goToRegistration() {
    this.router.navigate(['/register-serviceman']);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      this.isSubmitting = true;
      this.successMessage = 'Logowanie w toku...';
      
      this.authService.loginService(credentials).subscribe({
        next: (response) => {
          this.authService.setToken(response.token);
          this.successMessage = 'Logowanie udane!';
          
          setTimeout(() => {
            this.router.navigate(['/welcome']);
          }, 1000);
        },
        error: (error) => {
          console.error('Logowanie nie powiodło się', error);
          this.errorMessage = 'Logowanie nie powiodło się. Sprawdź dane logowania.';
          this.successMessage = '';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }
}