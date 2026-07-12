import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environments';

declare function gtag(...args: unknown[]): void;
declare global {
  interface Window { dataLayer: unknown[]; }
}

const REDIRECT_SECONDS = 5;

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css']
})
export class OrderSuccessComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  countdown = REDIRECT_SECONDS;
  readonly heading = 'Rezerwacja złożona!';
  readonly message = 'Twoja rezerwacja została przyjęta. Serwis skontaktuje się z Tobą wkrótce.';

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
        event_label: 'rezerwacja'
      });
      // Push jawnego obiektu {event: ...} - gtag() wysyła do dataLayer surowy
      // obiekt arguments, którego trigger Custom Event w GTM nie rozpoznaje.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'konwersja_sukces',
        event_category: 'konwersja',
        event_label: 'rezerwacja'
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
