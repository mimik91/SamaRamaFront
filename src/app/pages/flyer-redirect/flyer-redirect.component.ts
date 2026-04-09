import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

declare function gtag(...args: unknown[]): void;

@Component({
  selector: 'app-flyer-redirect',
  standalone: true,
  imports: [],
  template: `
    <div class="redirect-wrapper">
      <div class="redirect-box">
        <div class="spinner"></div>
        <p>Przekierowywanie...</p>
      </div>
    </div>
  `,
  styles: [`
    .redirect-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--color-white);
    }
    .redirect-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: var(--color-primary);
      font-size: 1rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class FlyerRedirectComponent implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        gtag('event', 'qr_ulotka', {
          event_category: 'marketing',
          event_label: 'ulotka_qr_kod'
        });
      } catch {
        // gtag niedostępny — ignoruj
      }
    }

    this.router.navigate(['/'], {
      replaceUrl: true,
      queryParams: {
        utm_source: 'ulotka',
        utm_medium: 'qr',
        utm_campaign: 'ulotki'
      }
    });
  }
}
