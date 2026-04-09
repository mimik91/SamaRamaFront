import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environments';

declare function gtag(...args: unknown[]): void;

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
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  countdown = REDIRECT_SECONDS;
  typ: 'rezerwacja' | 'transport' | null = null;

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.typ = (this.route.snapshot.queryParamMap.get('typ') as 'rezerwacja' | 'transport') ?? null;

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
        event_label: this.typ ?? 'nieznany'
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

  get heading(): string {
    return this.typ === 'transport'
      ? 'Zamówienie złożone!'
      : 'Rezerwacja złożona!';
  }

  get message(): string {
    return this.typ === 'transport'
      ? 'Twoje zamówienie transportu zostało przyjęte. Kurier skontaktuje się z Tobą wkrótce.'
      : 'Twoja rezerwacja została przyjęta. Serwis skontaktuje się z Tobą wkrótce.';
  }
}
