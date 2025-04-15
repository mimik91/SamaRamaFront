import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../core/notification.service';
import { AccountService } from './account.service';

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

  userForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  submitting = false;
  changingPassword = false;

  constructor() {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', [Validators.pattern('^[0-9]{9}$')]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  loadUserData(): void {
    this.loading = true;
    this.accountService.getUserProfile().subscribe({
      next: (user) => {
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.notificationService.error('Nie udało się załadować danych użytkownika');
        this.loading = false;
      }
    });
  }

  onSubmitUserData(): void {
    if (this.userForm.invalid) {
      return;
    }

    this.submitting = true;
    const userData = {
      firstName: this.userForm.get('firstName')?.value,
      lastName: this.userForm.get('lastName')?.value,
      phoneNumber: this.userForm.get('phoneNumber')?.value || null
    };

    this.accountService.updateUserProfile(userData).subscribe({
      next: () => {
        this.notificationService.success('Dane zostały zaktualizowane pomyślnie');
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error updating user data:', error);
        this.notificationService.error('Nie udało się zaktualizować danych użytkownika');
        this.submitting = false;
      }
    });
  }

  onSubmitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.changingPassword = true;
    const passwordData = {
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

  goBack(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin-dashboard']);
    } else if (this.authService.isClient()) {
      this.router.navigate(['/bicycles']);
    } else if (this.authService.isService()) {
      this.router.navigate(['/service-panel']);
    } else {
      this.router.navigate(['/']);
    }
  }
}