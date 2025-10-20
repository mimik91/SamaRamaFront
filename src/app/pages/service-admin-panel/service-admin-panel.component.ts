import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';

@Component({
  selector: 'app-service-admin-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-panel-container">
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Ładowanie danych serwisu...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <h2>Błąd ładowania</h2>
        <p>{{ error }}</p>
        <button (click)="loadServiceDetails()" class="retry-btn">Spróbuj ponownie</button>
      </div>

      <div *ngIf="!isLoading && !error && serviceDetails" class="panel-content">
        <header class="panel-header">
          <h1>Panel Administracyjny Serwisu</h1>
          <p class="service-name">{{ serviceDetails.name }}</p>
        </header>

        <div class="details-grid">
          <!-- Informacje podstawowe -->
          <div class="detail-card">
            <h2>Informacje podstawowe</h2>
            <div class="detail-item">
              <span class="label">Nazwa:</span>
              <span class="value">{{ serviceDetails.name }}</span>
            </div>
            <div class="detail-item" *ngIf="serviceDetails.suffix">
              <span class="label">Suffix:</span>
              <span class="value">{{ serviceDetails.suffix }}</span>
            </div>
            <div class="detail-item" *ngIf="serviceDetails.email">
              <span class="label">Email:</span>
              <span class="value">{{ serviceDetails.email }}</span>
            </div>
            <div class="detail-item" *ngIf="serviceDetails.phoneNumber">
              <span class="label">Telefon:</span>
              <span class="value">{{ serviceDetails.phoneNumber }}</span>
            </div>
            <div class="detail-item" *ngIf="serviceDetails.website">
              <span class="label">Strona WWW:</span>
              <span class="value">
                <a [href]="serviceDetails.website" target="_blank">{{ serviceDetails.website }}</a>
              </span>
            </div>
          </div>

          <!-- Adres -->
          <div class="detail-card" *ngIf="hasAddress()">
            <h2>Adres</h2>
            <div class="detail-item" *ngIf="serviceDetails.street">
              <span class="label">Ulica:</span>
              <span class="value">{{ serviceDetails.street }} {{ serviceDetails.building }}{{ serviceDetails.flat ? '/' + serviceDetails.flat : '' }}</span>
            </div>
            <div class="detail-item" *ngIf="serviceDetails.city">
              <span class="label">Miasto:</span>
              <span class="value">{{ serviceDetails.postalCode }} {{ serviceDetails.city }}</span>
            </div>
          </div>

          <!-- Transport -->
          <div class="detail-card">
            <h2>Transport</h2>
            <div class="detail-item">
              <span class="label">Dostępność transportu:</span>
              <span class="value">
                <span [class.badge-success]="serviceDetails.transportAvailable" 
                      [class.badge-inactive]="!serviceDetails.transportAvailable"
                      class="badge">
                  {{ serviceDetails.transportAvailable ? 'Tak' : 'Nie' }}
                </span>
              </span>
            </div>
            <div class="detail-item" *ngIf="serviceDetails.transportAvailable && serviceDetails.transportCost">
              <span class="label">Koszt transportu:</span>
              <span class="value">{{ serviceDetails.transportCost }} zł</span>
            </div>
          </div>

          <!-- Opis -->
          <div class="detail-card full-width" *ngIf="serviceDetails.description">
            <h2>Opis</h2>
            <p class="description-text">{{ serviceDetails.description }}</p>
          </div>

          <!-- Godziny otwarcia -->
          <div class="detail-card full-width" *ngIf="serviceDetails.openingHours">
            <h2>Godziny otwarcia</h2>
            <div class="opening-hours">
              <div class="hours-item" *ngFor="let day of getDaysOfWeek()">
                <span class="day-name">{{ day.name }}:</span>
                <span class="hours-value">{{ getHoursForDay(day.key) }}</span>
              </div>
            </div>
            <p *ngIf="serviceDetails.openingHoursInfo" class="info-text">
              <strong>Informacje:</strong> {{ serviceDetails.openingHoursInfo }}
            </p>
            <p *ngIf="serviceDetails.openingHoursNote" class="note-text">
              <strong>Uwagi:</strong> {{ serviceDetails.openingHoursNote }}
            </p>
          </div>

          <!-- Cennik -->
          <div class="detail-card full-width" *ngIf="serviceDetails.pricelistInfo || serviceDetails.pricelistNote">
            <h2>Informacje o cenniku</h2>
            <p *ngIf="serviceDetails.pricelistInfo" class="info-text">
              <strong>Informacje:</strong> {{ serviceDetails.pricelistInfo }}
            </p>
            <p *ngIf="serviceDetails.pricelistNote" class="note-text">
              <strong>Uwagi:</strong> {{ serviceDetails.pricelistNote }}
            </p>
          </div>
        </div>

        <div class="action-section">
          <button class="primary-btn">Edytuj dane serwisu</button>
          <button class="secondary-btn">Zarządzaj cennikiem</button>
          <button class="secondary-btn">Zobacz harmonogram</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-panel-container {
      min-height: calc(100vh - 60px);
      padding: 24px;
      background-color: #f5f7fa;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e0e0e0;
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state svg {
      color: #e74c3c;
    }

    .retry-btn {
      padding: 12px 24px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }

    .retry-btn:hover {
      background-color: #2980b9;
    }

    .panel-content {
      max-width: 1400px;
      margin: 0 auto;
    }

    .panel-header {
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .panel-header h1 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 2rem;
    }

    .service-name {
      margin: 0;
      color: #7f8c8d;
      font-size: 1.2rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .detail-card {
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .detail-card.full-width {
      grid-column: 1 / -1;
    }

    .detail-card h2 {
      margin: 0 0 20px 0;
      color: #2c3e50;
      font-size: 1.3rem;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 12px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 600;
      color: #34495e;
    }

    .value {
      color: #7f8c8d;
      text-align: right;
    }

    .value a {
      color: #3498db;
      text-decoration: none;
    }

    .value a:hover {
      text-decoration: underline;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .badge-success {
      background-color: #d4edda;
      color: #155724;
    }

    .badge-inactive {
      background-color: #f8d7da;
      color: #721c24;
    }

    .description-text {
      line-height: 1.6;
      color: #34495e;
      margin: 0;
    }

    .opening-hours {
      display: grid;
      gap: 12px;
      margin-bottom: 16px;
    }

    .hours-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .day-name {
      font-weight: 600;
      color: #34495e;
    }

    .hours-value {
      color: #7f8c8d;
    }

    .info-text, .note-text {
      margin: 8px 0;
      padding: 12px;
      border-radius: 8px;
      line-height: 1.5;
    }

    .info-text {
      background-color: #e8f4f8;
      color: #0c5460;
    }

    .note-text {
      background-color: #fff3cd;
      color: #856404;
    }

    .action-section {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .primary-btn, .secondary-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .primary-btn {
      background-color: #3498db;
      color: white;
    }

    .primary-btn:hover {
      background-color: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }

    .secondary-btn {
      background-color: #ecf0f1;
      color: #34495e;
    }

    .secondary-btn:hover {
      background-color: #d5dbdb;
    }

    @media (max-width: 768px) {
      .details-grid {
        grid-template-columns: 1fr;
      }

      .action-section {
        flex-direction: column;
      }

      .primary-btn, .secondary-btn {
        width: 100%;
      }
    }
  `]
})
export class ServiceAdminPanelComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(BikeServiceVerificationService);

  suffix: string = '';
  serviceDetails: any = null;
  isLoading: boolean = true;
  error: string = '';

  ngOnInit(): void {
    this.suffix = this.route.snapshot.paramMap.get('suffix') || '';
    this.loadServiceDetails();
  }

  loadServiceDetails(): void {
    this.isLoading = true;
    this.error = '';

    this.verificationService.getMyServiceDetails().subscribe({
      next: (response) => {
        this.serviceDetails = response;
        this.isLoading = false;
        console.log('Service details loaded:', this.serviceDetails);
      },
      error: (err) => {
        this.error = 'Nie udało się załadować danych serwisu. Spróbuj ponownie.';
        this.isLoading = false;
        console.error('Error loading service details:', err);
      }
    });
  }

  hasAddress(): boolean {
    return !!(this.serviceDetails?.street || this.serviceDetails?.city);
  }

  getDaysOfWeek(): Array<{key: string, name: string}> {
    return [
      { key: 'monday', name: 'Poniedziałek' },
      { key: 'tuesday', name: 'Wtorek' },
      { key: 'wednesday', name: 'Środa' },
      { key: 'thursday', name: 'Czwartek' },
      { key: 'friday', name: 'Piątek' },
      { key: 'saturday', name: 'Sobota' },
      { key: 'sunday', name: 'Niedziela' }
    ];
  }

  getHoursForDay(day: string): string {
    if (!this.serviceDetails?.openingHours) return 'Nieczynne';
    
    const hours = this.serviceDetails.openingHours[day];
    if (!hours || !hours.open || !hours.close) return 'Nieczynne';
    
    return `${hours.open} - ${hours.close}`;
  }
}