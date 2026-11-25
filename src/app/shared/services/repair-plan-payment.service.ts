import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { PaymentService } from '../../core/payment.service';
import { InitiatePaymentResponse } from '../models/payment.models';

/** Dla kogo opłacamy dopłatę: zalogowany klient (zlecenie z jego konta) albo gość z tokenem z linku w mailu. */
export interface RepairPlanPaymentTarget {
  orderId?: number;
  guestToken?: string;
}

/**
 * Opłacenie dopłaty do planu naprawy (serwis ekspresowy) przez PayU.
 * Kwotę zawsze wylicza backend z bazy — front przekazuje tylko, którego zlecenia dotyczy płatność.
 * Zapamiętuje adres, na który payment-return wraca po płatności (karta roweru albo strona gościa).
 */
@Injectable({ providedIn: 'root' })
export class RepairPlanPaymentService {
  private paymentService = inject(PaymentService);
  private platformId = inject(PLATFORM_ID);

  pay(target: RepairPlanPaymentTarget, returnUrl: string): Observable<InitiatePaymentResponse> {
    const orderData: Record<string, unknown> = target.guestToken
      ? { guestToken: target.guestToken }
      : { orderId: target.orderId };

    return this.paymentService.initiatePayment({ orderType: 'REPAIR_PLAN', orderData }).pipe(
      tap(response => {
        if (!isPlatformBrowser(this.platformId)) return;
        if (!response.redirectUrl) {
          // bez adresu PayU nie ma dokąd przekierować — błąd trafia do wywołującego, który zdejmuje flagę ładowania
          throw new Error('Brak adresu płatności');
        }
        sessionStorage.setItem('pendingPaymentOrderType', 'REPAIR_PLAN');
        sessionStorage.setItem('pendingPaymentReturnUrl', returnUrl);
        sessionStorage.removeItem('pendingReservationSuccess');
        if (response.payuOrderId) {
          sessionStorage.setItem('pendingPayuOrderId', response.payuOrderId);
        }
        window.location.href = response.redirectUrl;
      })
    );
  }
}
