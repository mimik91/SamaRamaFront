import { Component, OnInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicesMapComponent } from '../../shared/services-map/services-map.component';

@Component({
  selector: 'app-services-map-page',
  standalone: true,
  imports: [CommonModule, ServicesMapComponent],
  template: `
    <div class="map-page-container" [class.with-cta]="showCTA">
      <!-- Hidden header for Napravelo style - info is now in sidebar -->
      <div class="page-header" *ngIf="false">
        <h1 class="page-title">Mapa serwisów rowerowych</h1>
        <p class="page-subtitle">Znajdź najbliższy serwis rowerowy w Krakowie i okolicach</p>
      </div>

      <!-- Hidden service area info - now integrated in sidebar -->
      <div class="service-area-info" *ngIf="false">
        <div class="service-area-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="service-area-text">
          <strong>Obszar działania:</strong> Kraków, Węgrzce, Zielonki, Bosutów, Bibice, Batowice, Michałowice, Dziekanowice, Raciborowice, Boleń
        </div>
      </div>

      <!-- Full-screen map section -->
      <div class="map-section">
        <app-services-map></app-services-map>
      </div>

      <!-- CTA section - hidden by default in Napravelo style, can be enabled -->
      <div class="cta-section" *ngIf="showCTA">
        <div class="cta-content">
          <h2>Potrzebujesz transportu do serwisu?</h2>
          <p>Skorzystaj z naszej usługi transportu rowerów - odbieramy, serwisujemy, odwozimy.</p>
          <div class="cta-buttons">
            <button type="button" class="cta-btn primary" (click)="goToHowItWorks()">
              Dowiedz się jak działamy
            </button>
            <button type="button" class="cta-btn secondary" (click)="goToOrderTransport()">
              Zamów transport
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./services-map-page.component.css']
})
export class ServicesMapPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private isBrowser: boolean;

  // Control whether to show CTA section (false for Napravelo-style full-screen map)
  showCTA = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Check query parameters to determine if CTA should be shown
    this.route.queryParams.subscribe(params => {
      this.showCTA = params['showCTA'] === 'true';
    });
  }

  goToHowItWorks(): void {
    this.router.navigate(['/jak-dzialamy']);
  }

  goToOrderTransport(): void {
    this.router.navigate(['/order-transport']);
  }
}