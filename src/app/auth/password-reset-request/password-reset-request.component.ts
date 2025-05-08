// src/app/auth/password-reset-request/password-reset-request.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordResetService } from '../password-reset.service';

@Component({
  selector: 'app-password-reset-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-reset-request.component.html',
  styleUrls: ['./password-reset-request.component.css']
})
export class PasswordResetRequestComponent {
  private fb = inject(FormBuilder);
  private passwordResetService = inject(PasswordResetService);
  private router = inject(Router);

  resetForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.resetForm.get('email')?.value;

      this.passwordResetService.requestPasswordReset(email).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Wysłaliśmy instrukcje resetowania hasła na podany adres email.';
          this.resetForm.reset();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Wystąpił błąd podczas wysyłania żądania resetowania hasła.';
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.resetForm.controls).forEach(key => {
        const control = this.resetForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field ? (field.invalid && field.touched) : false;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}