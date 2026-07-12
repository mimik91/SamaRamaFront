import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environments';

declare function gtag(...args: unknown[]): void;

const REDIRECT_SECONDS = 5;

@Component({
  selector: 'app-transport-payment-success',
  standalone: true,
  imports: [],
  templateUrl: './transport-payment-success.component.html',
  styleUrls: ['./transport-payment-success.component.css']
})
export class TransportPaymentSuccessComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  countdown = REDIRECT_SECONDS;
  readonly heading = 'Zamówienie transportu opłacone!';
  readonly message = 'Twoja płatność została potwierdzona. Kurier skontaktuje się z Tobą w celu ustalenia szczegółów odbioru roweru.';

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fireGa4Event();
      this.startCountdown();
    } else {
      this.router.navigate([environment.links.homepage], { replaceUrl: true });
    }
  }

  private fireGa4Event(): void {
    try {
      gtag('event', 'konwersja_sukces', {
        event_category: 'konwersja',
        event_label: 'transport'
      });
    } catch {
      // gtag niedostępny
    }
  }

  private startCountdown(): void {
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.goHome();
      }
    }, 1000);
  }

  goHome(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.router.navigate([environment.links.homepage], { replaceUrl: true });
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
