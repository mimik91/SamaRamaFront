import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { ServiceAdminHistoryComponent } from '../service-admin-panel/service-admin-history/service-admin-history.component';

@Component({
  selector: 'app-service-history-page',
  standalone: true,
  imports: [CommonModule, ServiceAdminHistoryComponent],
  template: `
    <div class="page-container">
      <div *ngIf="loading" class="page-loading">
        <div class="spinner"></div>
      </div>
      <div *ngIf="!loading && serviceId">
        <app-service-admin-history [serviceId]="serviceId!"></app-service-admin-history>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .page-loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ServiceHistoryPageComponent implements OnInit {
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
