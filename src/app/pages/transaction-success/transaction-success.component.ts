import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { environment } from '../../environments/environments';

declare function gtag(...args: unknown[]): void;
declare global {
  interface Window { dataLayer: unknown[]; }
}

const REDIRECT_SECONDS = 30; // TYMCZASOWO wydłużone do testów Tag Assistant - przywrócić do 5 po teście

/**
 * Wspólny komponent dla stron sukcesu potransakcyjnego (rezerwacja, płatność za transport,
 * płatność za serwis ekspresowy) - wcześniej 3 niemal identyczne kopie (order-success,
 * express-service-success, transport-payment-success). Treść (heading/message/eventLabel)
 * przychodzi z route.data, patrz app.routes.ts.
 *
 * UWAGA: nigdy nie wywołuj router.navigate()/setTimeout(...navigate) tutaj bez isPlatformBrowser
 * - podczas SSR blokuje renderowanie na kilka sekund. To prywatna, jednorazowa strona wynikowa
 * zamówienia - nie potrzebuje żadnej nawigacji podczas SSR, wystarczy że się wyrenderuje
 * (statyczna treść) z noindex.
 */
@Component({
  selector: 'app-transaction-success',
  standalone: true,
  imports: [],
  templateUrl: './transaction-success.component.html',
  styleUrls: ['./transaction-success.component.css']
})
export class TransactionSuccessComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private meta = inject(Meta);

  countdown = REDIRECT_SECONDS;
  heading = '';
  message = '';
  private eventLabel = '';

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.heading = data['heading'] ?? 'Dziękujemy!';
    this.message = data['message'] ?? '';
    this.eventLabel = data['eventLabel'] ?? '';

    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    if (isPlatformBrowser(this.platformId)) {
      this.fireGa4Event();
      this.startCountdown();
    }
  }

  private fireGa4Event(): void {
    try {
      gtag('event', 'konwersja_sukces', {
        event_category: 'konwersja',
        event_label: this.eventLabel
      });
      // Push jawnego obiektu {event: ...} - gtag() wysyła do dataLayer surowy
      // obiekt arguments, którego trigger Custom Event w GTM nie rozpoznaje.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'konwersja_sukces',
        event_category: 'konwersja',
        event_label: this.eventLabel
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
