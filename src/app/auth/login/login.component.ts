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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
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
      password: ['', [Validators.required, Validators.minLength(6)]],
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
  
          // Add a delay to see the success message
          setTimeout(() => {
            console.log('User role:', this.authService.getUserRole());
            
            // Poprawiona logika przekierowywania
            if (this.authService.isAdmin() || this.authService.isModerator()) {
              this.router.navigate(['/admin-dashboard']);
            } else if (this.authService.isClient()) {
              this.router.navigate(['/bicycles']);
            } else if (this.authService.isService()) {
              this.router.navigate(['/service-panel']);
            } else {
              // Domyślne przekierowanie jeśli nie rozpoznano roli
              this.router.navigate(['/bicycles']);
            }
          }, 1000);
        },
        error: (error) => {
          console.error('Logowanie nie powiodło się', error);
          this.errorMessage =
            'Logowanie nie powiodło się. Sprawdź dane logowania.';
          this.successMessage = '';
          this.isSubmitting = false;
        },
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