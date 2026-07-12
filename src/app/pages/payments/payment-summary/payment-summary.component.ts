import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../../../core/payment.service';
import { NotificationService } from '../../../core/notification.service';
import { environment } from '../../../environments/environments';
import { PaymentNavigationState, PaymentOrderType } from '../../../shared/models/payment.models';

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
  isRedirecting = false;
  hasData = false;

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
      this.hasData = true;
      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
        orderType: this.orderType,
        orderData: this.orderData,
        totalPrice: this.totalPrice
      }));
    } else {
      const stored = sessionStorage.getItem(PENDING_ORDER_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PaymentNavigationState;
          this.orderType = this.sanitizeOrderType(parsed.orderType);
          this.orderData = parsed.orderData ?? {};
          this.totalPrice = parsed.totalPrice ?? 0;
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
          if (response.payuOrderId) {
            sessionStorage.setItem('pendingPayuOrderId', response.payuOrderId);
          }
          window.location.href = response.redirectUrl;
        }
      },
      error: () => {
        this.isRedirecting = false;
        this.notificationService.error('Nie udało się uruchomić płatności. Spróbuj ponownie lub skontaktuj się z nami.');
      }
    });
  }

}
