import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of, timer } from 'rxjs';
import { catchError, switchMap, takeWhile } from 'rxjs/operators';
import { PaymentService } from '../../../core/payment.service';
import { environment } from '../../../environments/environments';
import { PaymentStatus } from '../../../shared/models/payment.models';

const POLL_INTERVAL_MS = 15_000;

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

  private pollSub: Subscription | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const payuOrderId =
      this.route.snapshot.queryParamMap.get('orderId') ??
      sessionStorage.getItem('pendingPayuOrderId');

    if (payuOrderId) {
      sessionStorage.removeItem('pendingPayuOrderId');
      this.startPolling(payuOrderId);
    } else {
      const statusParam = this.route.snapshot.queryParamMap.get('status')?.toUpperCase() as PaymentStatus | null;
      this.status = statusParam ?? 'PENDING';
    }
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
              return of({ status: 'ERROR' as const });
            }
            return of({ status: 'PENDING' as const });
          })
        );
      }),
      takeWhile(response => response.status === 'PENDING', true)
    ).subscribe({
      next: (response) => {
        if (response.status !== 'PENDING') consecutiveErrors = 0;
        this.status = response.status;
        this.isChecking = false;
        this.isRechecking = false;
        this.lastCheckedAt = new Date();
        isFirst = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  goHome(): void {
    this.router.navigate([this.homepageLink]);
  }
}
