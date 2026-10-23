import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../environments/environments';
import { CycloPickLogoComponent } from '../../shared/cyclopick-logo/cyclopick-logo.component';
import {
  ReservationSuccessData,
  RESERVATION_SUCCESS_GA_KEY,
  loadReservationSuccess
} from './reservation-success.model';

declare function gtag(...args: unknown[]): void;
declare global {
  interface Window { dataLayer: unknown[]; }
}

/**
 * Ekran po wysłaniu prośby o rezerwację (/sukces). Dane przychodzą z formularza przez router state,
 * a po odświeżeniu (F5) z sessionStorage. Bez danych (wejście bezpośrednie) pokazujemy wersję uproszczoną.
 *
 * UWAGA: trasa jest renderowana tylko po stronie klienta (RenderMode.Client), ale nadal chronimy
 * dostęp do window/sessionStorage przez isPlatformBrowser.
 */
@Component({
  selector: 'app-reservation-success',
  standalone: true,
  imports: [CommonModule, RouterLink, CycloPickLogoComponent],
  templateUrl: './reservation-success.component.html',
  styleUrls: ['./reservation-success.component.css']
})
export class ReservationSuccessComponent implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private meta = inject(Meta);
  private authService = inject(AuthService);

  data: ReservationSuccessData | null = null;
  isClient = false;

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.isClient = this.authService.isClient();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const fromState = (history.state as { reservation?: ReservationSuccessData } | null)?.reservation;
    this.data = fromState ?? loadReservationSuccess();
    this.fireGa4EventOnce();
  }

  get plannedDateLabel(): string | null {
    const iso = this.data?.plannedDate;
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d).toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  goHome(): void {
    this.router.navigate([environment.links.homepage]);
  }

  /** Konwersja liczona raz na rezerwację - po F5 flaga w sessionStorage blokuje duplikat. */
  private fireGa4EventOnce(): void {
    try {
      if (sessionStorage.getItem(RESERVATION_SUCCESS_GA_KEY)) return;
      sessionStorage.setItem(RESERVATION_SUCCESS_GA_KEY, '1');
    } catch {
      // brak sessionStorage - w najgorszym razie konwersja policzy się ponownie po F5
    }

    try {
      gtag('event', 'konwersja_sukces', {
        event_category: 'konwersja',
        event_label: 'rezerwacja'
      });
      // Jawny obiekt {event: ...} - gtag() wysyła do dataLayer surowy obiekt arguments,
      // którego trigger Custom Event w GTM nie rozpoznaje.
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
}
