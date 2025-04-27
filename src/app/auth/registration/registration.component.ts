import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, UserRegistrationData } from '../auth.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registrationForm: FormGroup;
  isServiceman: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;

  constructor() {
    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]]
    });
  }

  ngOnInit(): void {
    // Determine user type based on route data
    this.route.data.subscribe(data => {
      this.isServiceman = data['userType'] === 'serviceman';
      
      if (this.isServiceman) {
        // W przypadku serwisantów przekieruj do nowego komponentu
        this.router.navigate(['/register-serviceman']);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      // Create data structure matching UserRegistrationDto
      const clientData: UserRegistrationData = {
        email: this.registrationForm.value.email,
        firstName: this.registrationForm.value.firstName,
        lastName: this.registrationForm.value.lastName,
        phoneNumber: this.registrationForm.value.phoneNumber,
        password: this.registrationForm.value.password
      };
      
      this.authService.registerClient(clientData).subscribe({
        next: (response) => {
          this.successMessage = 'Rejestracja zakończona sukcesem! Na Twój adres email został wysłany link weryfikacyjny. Sprawdź swoją skrzynkę odbiorczą i potwierdź rejestrację.';
          // Wydłużamy czas wyświetlania komunikatu o sukcesie
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 5000);
        },
        error: (error: any) => {
          console.error('Registration failed', error);
          this.errorMessage = error.error?.message || 'Rejestracja nie powiodła się. Spróbuj ponownie.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registrationForm.controls).forEach(key => {
        const control = this.registrationForm.get(key);
        control?.markAsTouched();
      });
      
      this.errorMessage = 'Wypełnij wszystkie wymagane pola formularza.';
    }
  }
}