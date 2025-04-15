import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-serviceman-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './serviceman-login.component.html',
  styleUrls: ['../login/login.component.css'] // Reużywamy style z komponentu logowania klienta
})
export class ServicemanLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;

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
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = 'Próba logowania...';
      
      const credentials = this.loginForm.value;
      
      this.authService.loginService(credentials).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          this.successMessage = 'Logowanie udane!';
          
          // Dodaj opóźnienie, aby użytkownik zobaczył komunikat o powodzeniu
          setTimeout(() => {
            // Determine redirect URL based on role (for admins logged in as serviceman)
            if (this.authService.isAdmin()) {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/service-panel']);
            }
          }, 1000);
        },
        error: (error) => {
          console.error('Logowanie nie powiodło się', error);
          this.errorMessage = 'Logowanie nie powiodło się. Sprawdź dane logowania.';
          this.successMessage = '';
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  // Pomocnicza funkcja do zaznaczenia wszystkich pól jako dotknięte
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}