// src/app/auth/password-reset/password-reset.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../password-reset.service';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private passwordResetService = inject(PasswordResetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  resetForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  token = '';

  constructor() {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get token from query parameters
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.errorMessage = 'Nieprawidłowy token resetowania hasła.';
    }
  }

  // Validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.valid && this.token) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const newPassword = this.resetForm.get('newPassword')?.value;

      this.passwordResetService.resetPassword(this.token, newPassword).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Hasło zostało pomyślnie zmienione.';
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Wystąpił błąd podczas resetowania hasła.';
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.resetForm.controls).forEach(key => {
        const control = this.resetForm.get(key);
        control?.markAsTouched();
      });
      
      if (!this.token) {
        this.errorMessage = 'Nieprawidłowy token resetowania hasła.';
      }
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field ? (field.invalid && field.touched) : false;
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field ? (field.hasError(errorType) && field.touched) : false;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}