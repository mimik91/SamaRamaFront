import { Component } from '@angular/core';
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
        <div class="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="clock-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        
        <h1>Oczekiwanie na weryfikację</h1>
        
        <div class="message-content">
          <p class="main-message">
            Twój serwis oczekuje na weryfikację przez administratora.
          </p>
          
          <p class="info-message">
            Zazwyczaj proces weryfikacji trwa do <strong>3 dni roboczych</strong>.
          </p>
          
          <p class="notification-message">
            O wyniku weryfikacji zostaniesz powiadomiony:
          </p>
          
          <ul class="notification-methods">
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Emailem
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              SMS
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Telefonicznie
            </li>
          </ul>
        </div>
        
        <div class="action-buttons">
          <button class="logout-btn" (click)="logout()">
            Wyloguj się
          </button>
        </div>
        
        <div class="help-section">
          <p class="help-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Potrzebujesz pomocy? Skontaktuj się z nami pod adresem 
            <a href="mailto:kontakt@cyclopick.pl">kontakt{{"@"}}cyclopick.pl</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pending-verification-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 60px);
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .verification-card {
      width: 100%;
      max-width: 600px;
      padding: 40px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .icon-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .clock-icon {
      color: #667eea;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    h1 {
      margin: 0 0 24px 0;
      color: #2c3e50;
      font-size: 2rem;
      font-weight: 700;
    }

    .message-content {
      text-align: left;
      margin-bottom: 32px;
    }

    .main-message {
      font-size: 1.1rem;
      color: #34495e;
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .info-message {
      font-size: 1rem;
      color: #7f8c8d;
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .info-message strong {
      color: #667eea;
      font-weight: 600;
    }

    .notification-message {
      font-size: 1rem;
      color: #34495e;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .notification-methods {
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
    }

    .notification-methods li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin-bottom: 8px;
      background-color: #f8f9fa;
      border-radius: 8px;
      color: #34495e;
      font-size: 0.95rem;
    }

    .notification-methods li svg {
      color: #667eea;
      flex-shrink: 0;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .logout-btn {
      padding: 12px 32px;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background-color: #c0392b;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
    }

    .help-section {
      padding-top: 24px;
      border-top: 1px solid #ecf0f1;
    }

    .help-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #7f8c8d;
      margin: 0;
      flex-wrap: wrap;
    }

    .help-text svg {
      color: #667eea;
      flex-shrink: 0;
    }

    .help-text a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .help-text a:hover {
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .verification-card {
        padding: 24px;
      }

      h1 {
        font-size: 1.5rem;
      }

      .main-message {
        font-size: 1rem;
      }

      .help-text {
        font-size: 0.85rem;
        text-align: center;
      }
    }
  `]
})
export class ServicePendingVerificationComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}