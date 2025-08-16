// src/app/transport-orders/order-summary.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TransportOrderService } from '../transport-order.service';

export interface TransportOrderSummary {
  bicycleIds?: number[];
  bicycles?: Array<{
    brand: string;
    model: string;
  }>;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress?: string;
  transportPrice: number;
}

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transportOrderService = inject(TransportOrderService);

  orderIds: number[] = [];
  orderSummary: TransportOrderSummary[] = [];
  loading = true;
  error: string | null = null;
  countdown: number = 30;
  private countdownTimer: any;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const ids = params['orderIds'];
      if (ids) {
        // Updated logic to handle comma-separated string
        if (typeof ids === 'string') {
          this.orderIds = ids.split(',').map(Number);
        } else if (Array.isArray(ids)) {
          this.orderIds = ids.map(Number);
        } else {
          this.orderIds = [Number(ids)];
        }
        this.fetchOrderSummary();
      } else {
        this.error = 'Brak identyfikatorów zamówień.';
        this.loading = false;
      }
    });
  }

  fetchOrderSummary(): void {
    if (this.orderIds.length > 0) {
      this.transportOrderService.getOrdersSummary(this.orderIds).subscribe({
        next: (summary) => {
          this.orderSummary = summary;
          this.loading = false;
          this.startCountdown();
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Wystąpił błąd podczas pobierania podsumowania zamówienia.';
          console.error(err);
        }
      });
    } else {
      this.loading = false;
    }
  }

  startCountdown(): void {
    this.countdownTimer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownTimer);
        this.goToHomepage();
      }
    }, 1000);
  }

  goToHomepage(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }
}