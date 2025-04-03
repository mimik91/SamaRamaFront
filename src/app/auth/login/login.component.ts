import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <h2>Logowanie Klienta</h2>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" formControlName="email" required />
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

        <div class="login-options">
          <button type="button" (click)="goToRegistration()">
            Stwórz nowe konto
          </button>
        </div>

        <button type="submit" [disabled]="loginForm.invalid">
          Zaloguj się
        </button>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-message">
          {{ successMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [
    `
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
      .success-message {
        color: green;
        margin-top: 10px;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  goToRegistration() {
    this.router.navigate(['/register']);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;

      this.successMessage = 'Próba logowania...';

      this.authService.loginClient(credentials).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          this.successMessage = 'Logowanie udane!';

          // Store the token
          this.authService.setToken(response.token);

          // Add a delay to see the success message
          setTimeout(() => {
            console.log('Navigating to welcome page');
            this.router.navigate(['/welcome']).then((success) => {
              console.log('Navigation result:', success);
            });
          }, 1000);
        },
        error: (error) => {
          console.error('Logowanie nie powiodło się', error);
          this.errorMessage =
            'Logowanie nie powiodło się. Sprawdź dane logowania.';
          this.successMessage = '';
        },
      });
    }
  }
}
