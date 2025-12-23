// src/app/transport-orders/order-summary.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TransportOrderService } from '../transport-order.service';
import { TransportOrderSummaryDto } from '../../shared/models/transport-order.model';
import { I18nService } from '../../core/i18n.service';
import { environment } from '../../environments/environments';

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
  private i18n = inject(I18nService);

  orderIds: number[] = [];
  orderSummary: TransportOrderSummaryDto[] = [];
  loading = true;
  error: string | null = null;
  countdown: number = environment.settings.redirects.orderSummaryCountdown;
  private countdownTimer: any;

  // Expose links for template
  readonly links = environment.links;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const ids = params['orderIds'];
      if (ids) {
        if (typeof ids === 'string') {
          this.orderIds = ids.split(',').map(Number);
        } else if (Array.isArray(ids)) {
          this.orderIds = ids.map(Number);
        } else {
          this.orderIds = [Number(ids)];
        }
        this.fetchOrderSummary();
      } else {
        this.error = this.t('order_summary.no_order_ids');
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
          this.error = this.t('order_summary.error');
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
    this.router.navigate([environment.links.homepage]);
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  // Helper method to get total number of bicycles
  getTotalBicycles(order: TransportOrderSummaryDto): number {
    if (order.bicycles && order.bicycles.length > 0) {
      return order.bicycles.length;
    }
    if (order.bicycleIds && order.bicycleIds.length > 0) {
      return order.bicycleIds.length;
    }
    return 0;
  }

  // Helper method to format bicycle list
  getBicyclesList(order: TransportOrderSummaryDto): string {
    if (order.bicycles && order.bicycles.length > 0) {
      return order.bicycles
        .map(bike => `${bike.brand}${bike.model ? ' ' + bike.model : ''}`)
        .join(', ');
    }
    return this.t('order_summary.no_summary');
  }

  // Translation helper for template
  t(key: string, params?: any): string {
    return this.i18n.instant(key, params);
  }
}