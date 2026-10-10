import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { ServiceAdminStatsComponent } from '../service-admin-panel/service-admin-stats/service-admin-stats.component';

@Component({
  selector: 'app-service-stats-page',
  standalone: true,
  imports: [CommonModule, ServiceAdminStatsComponent],
  template: `
    <div class="page-container">
      <div *ngIf="loading" class="page-loading">
        <div class="spinner"></div>
      </div>
      <div *ngIf="!loading && serviceId">
        <app-service-admin-stats [serviceId]="serviceId!"></app-service-admin-stats>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: var(--spacing-6) var(--spacing-4) var(--spacing-12);
      box-sizing: border-box;
      background: var(--color-slate-50);
      min-height: calc(100vh - 60px);
    }
    .page-loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--border-color);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ServiceStatsPageComponent implements OnInit {
  private verificationService = inject(BikeServiceVerificationService);

  serviceId: number | null = null;
  loading = true;

  ngOnInit(): void {
    this.verificationService.getMyServices().subscribe({
      next: (services) => {
        if (services.length > 0) {
          this.serviceId = services[0].id;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
