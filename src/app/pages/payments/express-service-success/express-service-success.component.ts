import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environments';

declare function gtag(...args: unknown[]): void;

const REDIRECT_SECONDS = 5;

@Component({
  selector: 'app-express-service-success',
  standalone: true,
  imports: [],
  templateUrl: './express-service-success.component.html',
  styleUrls: ['./express-service-success.component.css']
})
export class ExpressServiceSuccessComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  countdown = REDIRECT_SECONDS;
  readonly heading = 'Wizyta serwisowa opłacona!';
  readonly message = 'Twoja płatność została potwierdzona. Wizyta w serwisie ekspresowym CycloPick została zarezerwowana — potwierdzenie otrzymasz na e-mail.';

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
        event_label: 'serwis-ekspresowy'
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
