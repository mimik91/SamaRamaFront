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
        
        <button 
          type="submit" 
          [disabled]="loginForm.invalid"
        >
          Zaloguj się
        </button>
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
  `]
})
export class ServicemanLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      
      this.authService.loginServiceman(credentials).subscribe({
        next: (response) => {
          this.authService.setToken(response.token);
          this.router.navigate(['/serviceman-dashboard']);
        },
        error: (error) => {
          console.error('Logowanie nie powiodło się', error);
        }
      });
    }
  }
}