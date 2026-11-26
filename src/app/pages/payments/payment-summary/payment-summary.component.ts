import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../../../core/payment.service';
import { NotificationService } from '../../../core/notification.service';
import { environment } from '../../../environments/environments';
import { PaymentNavigationState, PaymentOrderType, PaymentSummaryDetails } from '../../../shared/models/payment.models';

const PENDING_ORDER_KEY = 'pendingOrderData';
const VALID_ORDER_TYPES: PaymentOrderType[] = ['TRANSPORT', 'SERVICE_ORDER'];

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-summary.component.html',
  styleUrls: ['./payment-summary.component.css']
})
export class PaymentSummaryComponent implements OnInit {
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);

  orderType: PaymentOrderType = 'TRANSPORT';
  orderData: Record<string, unknown> = {};
  totalPrice: number = 0;
  details: PaymentSummaryDetails | null = null;
  isRedirecting = false;
  hasData = false;

  /** Zamówienie w pełni pokryte kuponem — nie przechodzi przez PayU */
  get isFree(): boolean {
    return this.totalPrice <= 0;
  }

  get bikeCount(): number {
    const bicycles = this.orderData['bicycles'];
    return Array.isArray(bicycles) ? bicycles.length : 1;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const state = window.history.state as PaymentNavigationState | undefined;

    if (state?.orderData && Object.keys(state.orderData).length > 0) {
      this.orderType = this.sanitizeOrderType(state.orderType);
      this.orderData = state.orderData;
      this.totalPrice = state.totalPrice ?? 0;
      this.details = state.details ?? null;
      this.hasData = true;
      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
        orderType: this.orderType,
        orderData: this.orderData,
        totalPrice: this.totalPrice,
        details: this.details
      }));
    } else {
      const stored = sessionStorage.getItem(PENDING_ORDER_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PaymentNavigationState;
          this.orderType = this.sanitizeOrderType(parsed.orderType);
          this.orderData = parsed.orderData ?? {};
          this.totalPrice = parsed.totalPrice ?? 0;
          this.details = parsed.details ?? null;
          this.hasData = true;
        } catch {
          // uszkodzony wpis — wyczyść
        }
      }
    }

    if (!this.hasData) {
      this.router.navigate([environment.links.homepage]);
    }
  }

  private sanitizeOrderType(type: PaymentOrderType | undefined): PaymentOrderType {
    return type && VALID_ORDER_TYPES.includes(type) ? type : 'TRANSPORT';
  }

  pay(): void {
    if (this.isRedirecting) return;
    this.isRedirecting = true;

    this.paymentService.initiatePayment({ orderType: this.orderType, orderData: this.orderData }).subscribe({
      next: (response) => {
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.removeItem(PENDING_ORDER_KEY);
          sessionStorage.setItem('pendingPaymentOrderType', this.orderType);
          // Płatny transport z formularza rezerwacji (ma plannedDate) → po płatności ekran /sukces.
          if (this.orderType === 'TRANSPORT' && this.orderData['plannedDate']) {
            sessionStorage.setItem('pendingReservationSuccess', '1');
          } else {
            sessionStorage.removeItem('pendingReservationSuccess');
          }
          if (response.payuOrderId) {
            sessionStorage.setItem('pendingPayuOrderId', response.payuOrderId);
            window.location.href = response.redirectUrl;
          } else {
            // Zamówienie za 0 zł zostało już sfinalizowane przez backend — bez PayU, od razu ekran sukcesu
            sessionStorage.removeItem('pendingPayuOrderId');
            this.router.navigate(['/platnosc/powrot'], { queryParams: { status: 'SUCCESS' }, replaceUrl: true });
          }
        }
      },
      error: (err) => {
        this.isRedirecting = false;
        const reason: string | undefined = err?.error?.message;
        this.notificationService.error(
          reason && err.status === 400
            ? reason
            : (this.isFree
              ? 'Nie udało się sfinalizować rezerwacji. Spróbuj ponownie lub skontaktuj się z nami.'
              : 'Nie udało się uruchomić płatności. Spróbuj ponownie lub skontaktuj się z nami.'));
      }
    });
  }

}
