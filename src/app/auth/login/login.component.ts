// login.component.ts
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
import { VerificationService } from '../verification.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private verificationService = inject(VerificationService);

  loginForm: FormGroup;
  resendVerificationForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;
  isResendingVerification: boolean = false;
  showResendVerification: boolean = false;
  verificationResendSuccess: boolean = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    
    this.resendVerificationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  goToRegistration() {
    this.router.navigate(['/register']);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = 'Próba logowania...';
      
      const credentials = this.loginForm.value;
  
      this.authService.loginClient(credentials).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          this.successMessage = 'Logowanie udane!';
          console.log('Token saved to localStorage:', localStorage.getItem('auth_session'));
  
          // Add a delay to see the success message
          setTimeout(() => {
            console.log('User role:', this.authService.getUserRole());
            
            // Poprawiona logika przekierowywania
            if (this.authService.isAdmin() || this.authService.isModerator()) {
              this.router.navigate(['/admin-dashboard']);
            } else if (this.authService.isClient()) {
              this.router.navigate(['/bicycles']);
            } else {
              // Domyślne przekierowanie jeśli nie rozpoznano roli
              this.router.navigate(['/bicycles']);
            }
          }, 1000);
        },
        error: (error) => {
          console.error('Logowanie nie powiodło się', error);
          
          // Sprawdzenie, czy konto nie jest zweryfikowane
          if (error.error && error.error.message && 
              (error.error.message.includes('not verified') || 
               error.error.message.includes('nie zweryfikowane') ||
               error.error.message.includes('nie zostało zweryfikowane'))) {
            this.errorMessage = 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email lub kliknij poniżej, aby wysłać link weryfikacyjny ponownie.';
            this.showResendVerification = true;
            // Przenieś email z formularza logowania do formularza ponownego wysyłania
            this.resendVerificationForm.patchValue({
              email: this.loginForm.get('email')?.value
            });
          } else {
            this.errorMessage = 'Logowanie nie powiodło się. Sprawdź dane logowania.';
          }
          this.successMessage = '';
          this.isSubmitting = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  // Metoda do ponownego wysłania maila weryfikacyjnego
  resendVerification() {
    if (this.resendVerificationForm.invalid) {
      this.markFormGroupTouched(this.resendVerificationForm);
      return;
    }

    const email = this.resendVerificationForm.get('email')?.value;
    this.isResendingVerification = true;
    this.errorMessage = '';
    
    this.verificationService.resendVerificationEmail(email).subscribe({
      next: (response) => {
        this.isResendingVerification = false;
        this.verificationResendSuccess = true;
        this.showResendVerification = false;
        this.successMessage = 'Link weryfikacyjny został wysłany. Sprawdź swoją skrzynkę pocztową.';
      },
      error: (error) => {
        this.isResendingVerification = false;
        this.errorMessage = error.error?.message || 'Nie udało się wysłać linku weryfikacyjnego. Spróbuj ponownie.';
      }
    });
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
  
  // Funkcja sprawdzająca, czy dane pole formularza jest nieprawidłowe
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return control ? (control.invalid && control.touched) : false;
  }
  
  // Włączanie/wyłączanie formularza ponownego wysyłania
  toggleResendForm() {
    this.showResendVerification = !this.showResendVerification;
    this.verificationResendSuccess = false;
  }
}