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
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <h2>Logowanie Serwisanta</h2>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            formControlName="email" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="password">Hasło</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password" 
            required
          >
        </div>
        
        <div class="login-options">
          <button 
            type="button" 
            (click)="goToRegistration()"
            class="register-button"
          >
            Zarejestruj swój serwis
          </button>
        </div>
        
        <button 
          type="submit" 
          [disabled]="loginForm.invalid"
          class="login-button"
        >
          Zaloguj się
        </button>
        
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
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
    .login-options {
      margin-bottom: 15px;
      display: flex;
      justify-content: center;
    }
    .register-button {
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      color: #333;
    }
    .register-button:hover {
      background-color: #e0e0e0;
    }
    .login-button {
      width: 100%;
      background-color: #4CAF50;
      color: white;
      padding: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .login-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class ServicemanLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  goToRegistration() {
    this.router.navigate(['/register-serviceman']);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      
      this.authService.loginService(credentials).subscribe({
        next: (response) => {
          this.router.navigate(['/service-panel']);
        },
        error: (error) => {
          console.error('Logowanie nie powiodło się', error);
          this.errorMessage = 'Logowanie nie powiodło się. Sprawdź dane logowania.';
        }
      });
    }
  }
}