import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';

@Component({
  selector: 'app-complete-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complete-registration.component.html',
  styleUrls: ['./complete-registration.component.css']
})
export class CompleteRegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private apiUrl = `${environment.apiUrl}${environment.endpoints.auth}`;

  registrationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  terminalError = '';
  token = '';

  // Errors that make the form permanently unusable — hide it and show a clear message
  private readonly terminalMessages = [
    'Nieprawidłowy token aktywacyjny',
    'Token został już wykorzystany',
    'Token wygasł',
    'Hasło zostało już ustawione'
  ];

  constructor() {
    this.registrationForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registrationForm.valid && this.token) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const password = this.registrationForm.get('password')?.value;

      this.http.post<{ message: string }>(
        `${this.apiUrl}/complete-registration`,
        { token: this.token, password }
      ).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.successMessage = response?.message || 'Hasło zostało ustawione. Możesz się teraz zalogować.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.isSubmitting = false;
          const message: string = error.error?.message || 'Wystąpił błąd podczas aktywacji konta.';
          const isTerminal = this.terminalMessages.some(t => message.startsWith(t));
          if (isTerminal) {
            this.terminalError = message;
          } else {
            this.errorMessage = message;
          }
        }
      });
    } else {
      Object.keys(this.registrationForm.controls).forEach(key => {
        this.registrationForm.get(key)?.markAsTouched();
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? (field.invalid && field.touched) : false;
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? (field.hasError(errorType) && field.touched) : false;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
