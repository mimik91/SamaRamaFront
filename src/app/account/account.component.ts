import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../core/notification.service';
import { AccountService, UserProfile, UserUpdateData, PasswordChangeData } from './account.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  loading = true;
  savingProfile = false;
  changingPassword = false;
  
  userProfile: UserProfile | null = null;
  
  constructor() {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  private initForms(): void {
    // Formularz danych profilu
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', [Validators.pattern('^[0-9]{9}$')]]
    });
    
    // Formularz zmiany hasła
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  // Validator sprawdzający czy nowe hasło i potwierdzenie są zgodne
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { mismatch: true };
  }
  
  loadUserProfile(): void {
    this.loading = true;
    
    this.accountService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        
        // Wypełnij formularz danymi
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phoneNumber: profile.phoneNumber || ''
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.notificationService.error('Nie udało się załadować danych użytkownika');
        this.loading = false;
      }
    });
  }
  
  saveProfile(): void {
    if (this.profileForm.invalid) {
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificationService.warning('Formularz zawiera błędy. Popraw je przed zapisaniem.');
      return;
    }
    
    this.savingProfile = true;
    
    const userData: UserUpdateData = {
      firstName: this.profileForm.get('firstName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      phoneNumber: this.profileForm.get('phoneNumber')?.value || null
    };
    
    this.accountService.updateUserProfile(userData).subscribe({
      next: () => {
        this.notificationService.success('Profil został zaktualizowany pomyślnie');
        this.savingProfile = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.notificationService.error('Nie udało się zaktualizować profilu');
        this.savingProfile = false;
      }
    });
  }
  
  changePassword(): void {
    if (this.passwordForm.invalid) {
      // Oznacz wszystkie pola jako dotknięte, aby pokazać błędy walidacji
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificationService.warning('Formularz zawiera błędy. Popraw je przed zapisaniem.');
      return;
    }
    
    this.changingPassword = true;
    
    const passwordData: PasswordChangeData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };
    
    this.accountService.changePassword(passwordData).subscribe({
      next: () => {
        this.notificationService.success('Hasło zostało zmienione pomyślnie');
        this.passwordForm.reset();
        this.changingPassword = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.notificationService.error('Nie udało się zmienić hasła. Sprawdź czy obecne hasło jest poprawne.');
        this.changingPassword = false;
      }
    });
  }
  
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field ? (field.invalid && field.touched) : false;
  }
  
  hasError(form: FormGroup, fieldName: string, errorType: string): boolean {
    const field = form.get(fieldName);
    return field ? (field.hasError(errorType) && field.touched) : false;
  }
  
  goBack(): void {
    this.router.navigate(['/bicycles']);
  }
}