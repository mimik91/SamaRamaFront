import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-service-pending-verification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pending-verification-container">
      <div class="verification-card">
        <span class="icon-container" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="clock-icon">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 2"></path>
          </svg>
        </span>

        <h1>Sprawdzamy Twój serwis</h1>

        <p class="main-message">
          Twój serwis oczekuje na weryfikację przez zespół CycloPick. Zwykle trwa to do
          <strong>3 dni roboczych</strong>. O wyniku damy znać e-mailem, SMS-em albo telefonicznie.
        </p>

        <ol class="steps">
          <li class="step step--done">
            <span class="step-marker" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"></path></svg>
            </span>
            <span class="step-text">
              <strong>Rejestracja serwisu</strong>
              <span>Zgłoszenie zostało wysłane</span>
            </span>
          </li>
          <li class="step step--current">
            <span class="step-marker" aria-hidden="true"><span class="step-dot"></span></span>
            <span class="step-text">
              <strong>Weryfikacja przez CycloPick</strong>
              <span>W toku — sprawdzamy dane i adres serwisu</span>
            </span>
          </li>
          <li class="step">
            <span class="step-marker" aria-hidden="true"></span>
            <span class="step-text">
              <strong>Profil widoczny dla klientów</strong>
              <span>Ustawisz godziny otwarcia, cennik i rezerwację online</span>
            </span>
          </li>
        </ol>

        <div class="action-buttons">
          <button type="button" class="logout-btn" (click)="logout()">Wyloguj się</button>
        </div>

        <p class="help-text">
          Masz pytania? Napisz na
          <a href="mailto:kontakt@cyclopick.pl">kontakt{{"@"}}cyclopick.pl</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .pending-verification-container {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: calc(100vh - 60px);
      padding: var(--spacing-8) var(--spacing-4) var(--spacing-12);
      background: var(--color-slate-50);
      box-sizing: border-box;
    }

    .verification-card {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-4);
      padding: var(--spacing-8);
      background: var(--color-white);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-modal);
      text-align: center;
      box-sizing: border-box;
    }

    .icon-container {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--color-success-bg);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h1 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.75rem;
      line-height: var(--line-height-tight);
      font-weight: 800;
    }

    .main-message {
      margin: 0;
      color: var(--text-secondary);
      font-size: 1rem;
      max-width: 46ch;
    }

    .main-message strong {
      color: var(--text-primary);
    }

    .steps {
      list-style: none;
      margin: var(--spacing-2) 0;
      padding: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
      text-align: left;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-3);
    }

    .step-marker {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid var(--border-color-gray-medium);
      background: var(--color-white);
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .step--done .step-marker {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-white);
    }

    .step--current .step-marker {
      border-color: var(--color-primary);
    }

    .step-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-primary);
    }

    .step-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .step-text strong {
      color: var(--text-primary);
    }

    .step-text span {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .step:not(.step--done):not(.step--current) .step-text strong {
      color: var(--text-secondary);
    }

    .action-buttons {
      display: flex;
      justify-content: center;
    }

    .logout-btn {
      min-height: 44px;
      padding: 0 var(--spacing-6);
      background: var(--color-white);
      color: var(--text-primary);
      border: 1px solid var(--border-color-gray-medium);
      border-radius: var(--radius-button);
      font: inherit;
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }

    .logout-btn:hover {
      border-color: var(--color-danger);
      color: var(--color-danger-dark);
    }

    .help-text {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .help-text a {
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
      text-decoration: none;
    }

    .help-text a:hover {
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .verification-card {
        padding: var(--spacing-5);
      }

      h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ServicePendingVerificationComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
