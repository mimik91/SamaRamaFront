import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of, timer } from 'rxjs';
import { catchError, switchMap, takeWhile } from 'rxjs/operators';
import { PaymentService } from '../../../core/payment.service';
import { environment } from '../../../environments/environments';
import { PaymentOrderType, PaymentStatus, PaymentStatusResponse } from '../../../shared/models/payment.models';

const POLL_INTERVAL_MS = 15_000;

/** Adres powrotu przyjmujemy tylko wewnętrzny (ścieżka aplikacji) — wartość pochodzi z sessionStorage. */
function toInternalUrl(url: string | null): string | null {
  return url && url.startsWith('/') && !url.startsWith('//') && !url.includes('\\') ? url : null;
}

@Component({
  selector: 'app-payment-return',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './payment-return.component.html',
  styleUrls: ['./payment-return.component.css']
})
export class PaymentReturnComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private platformId = inject(PLATFORM_ID);

  status: PaymentStatus = 'PENDING';
  isChecking = false;
  isRechecking = false;
  lastCheckedAt: Date | null = null;
  readonly homepageLink = environment.links.homepage;
  /** Adres zlecenia, z którego klient poszedł opłacić dopłatę do planu naprawy (null dla innych płatności) */
  returnUrl: string | null = null;
  /** Dopłata opłacona, ale nie znamy zlecenia, do którego wrócić (np. powrót z aplikacji banku w innej karcie) */
  repairPlanPaidWithoutReturn = false;

  private pollSub: Subscription | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (sessionStorage.getItem('pendingPaymentOrderType') === 'REPAIR_PLAN') {
      this.returnUrl = toInternalUrl(sessionStorage.getItem('pendingPaymentReturnUrl'));
    }

    const payuOrderId =
      this.route.snapshot.queryParamMap.get('orderId') ??
      sessionStorage.getItem('pendingPayuOrderId');

    if (payuOrderId) {
      sessionStorage.removeItem('pendingPayuOrderId');
      this.startPolling(payuOrderId);
    } else {
      const statusParam = this.route.snapshot.queryParamMap.get('status')?.toUpperCase() as PaymentStatus | null;
      this.applyStatus(statusParam ?? 'PENDING');
    }
  }

  /** serverOrderType: rodzaj płatności z backendu — ma pierwszeństwo przed (możliwie nieaktualnym) zapisem w sessionStorage. */
  private applyStatus(status: PaymentStatus, serverOrderType?: PaymentOrderType): void {
    if (status === 'SUCCESS') {
      this.isChecking = true;
      const orderType = serverOrderType ?? sessionStorage.getItem('pendingPaymentOrderType');
      sessionStorage.removeItem('pendingPaymentOrderType');
      if (orderType === 'REPAIR_PLAN') {
        // Dopłata do planu naprawy: wracamy na kartę zlecenia (zalogowany klient) albo stronę z linku (gość)
        const returnUrl = toInternalUrl(sessionStorage.getItem('pendingPaymentReturnUrl'));
        sessionStorage.removeItem('pendingPaymentReturnUrl');
        if (!returnUrl) {
          // Brak zapisu (inna karta/urządzenie): nie wiemy, dokąd wrócić — pokazujemy potwierdzenie dopłaty
          this.isChecking = false;
          this.repairPlanPaidWithoutReturn = true;
          return;
        }
        const target = this.router.parseUrl(returnUrl);
        target.queryParams = { ...target.queryParams, doplata: 'ok' };
        this.router.navigateByUrl(target, { replaceUrl: true });
        return;
      }
      const isReservation = sessionStorage.getItem('pendingReservationSuccess') === '1';
      sessionStorage.removeItem('pendingReservationSuccess');
      if (isReservation && orderType !== 'SERVICE_ORDER') {
        this.router.navigate(['/sukces'], { replaceUrl: true });
        return;
      }
      const successPath = orderType === 'SERVICE_ORDER' ? 'serwis-ekspresowy' : 'transport';
      this.router.navigate(['/platnosc/sukces', successPath], { replaceUrl: true });
      return;
    }
    this.status = status;
  }

  private startPolling(payuOrderId: string): void {
    this.isChecking = true;
    let isFirst = true;
    let consecutiveErrors = 0;
    const MAX_ERRORS = 3;

    this.pollSub = timer(0, POLL_INTERVAL_MS).pipe(
      switchMap(() => {
        if (!isFirst) this.isRechecking = true;
        return this.paymentService.getPaymentStatus(payuOrderId).pipe(
          catchError(() => {
            consecutiveErrors++;
            this.isRechecking = false;
            this.lastCheckedAt = new Date();
            if (consecutiveErrors >= MAX_ERRORS) {
              return of<PaymentStatusResponse>({ status: 'ERROR' });
            }
            return of<PaymentStatusResponse>({ status: 'PENDING' });
          })
        );
      }),
      takeWhile(response => response.status === 'PENDING', true)
    ).subscribe({
      next: (response) => {
        if (response.status !== 'PENDING') consecutiveErrors = 0;
        this.isChecking = false;
        this.isRechecking = false;
        this.lastCheckedAt = new Date();
        isFirst = false;
        this.applyStatus(response.status, response.orderType);
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  goBackToOrder(): void {
    const url = toInternalUrl(this.returnUrl);
    if (url) {
      this.router.navigateByUrl(url);
    }
  }

  goHome(): void {
    this.router.navigate([this.homepageLink]);
  }
}
