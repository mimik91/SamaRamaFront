import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VerificationService } from '../verification.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(VerificationService);
  private notificationService = inject(NotificationService);


  verificationStatus: 'verifying' | 'success' | 'error' = 'verifying';
  errorMessage: string = '';
  isTokenUsed: boolean = false;

  ngOnInit(): void {
    // Pobierz token z parametrów URL
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.verificationStatus = 'error';
      this.errorMessage = 'Brak tokenu weryfikacyjnego.';
      return;
    }

    // Wywołaj serwis weryfikacji
    this.verificationService.verifyAccount(token).subscribe({
      next: (response) => {
        this.verificationStatus = 'success';
        this.notificationService.success('Konto zostało pomyślnie zweryfikowane!');
        
        // Przekieruj do logowania po 3 sekundach
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },

    

      error: (error) => {
        this.verificationStatus = 'error';
        this.errorMessage = error.error?.message || 'Nie udało się zweryfikować konta. Token może być nieprawidłowy lub wygasł.';
        
        // Sprawdź czy komunikat błędu dotyczy wykorzystanego tokenu
        if (this.errorMessage.includes('Token został już wykorzystany') || 
            this.errorMessage.includes('token już wykorzystany') ||
            this.errorMessage.includes('już wykorzystany')) {
          this.isTokenUsed = true;
        }
        
        this.notificationService.error(this.errorMessage);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}