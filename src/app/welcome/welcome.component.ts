import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MapService, Coordinate } from '../map.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>SamaRama - Serwisy rowerowe</h1>
      
      <div *ngIf="isBrowser; else serverFallback">
        <div id="map" class="map-container"></div>
        
        <div class="loading-message" *ngIf="loading">
          Ładowanie mapy...
        </div>
        
        <div class="error-message" *ngIf="error">
          {{ error }}
        </div>
      </div>
      
      <ng-template #serverFallback>
        <div class="server-message">
          Mapa zostanie załadowana po pełnym załadowaniu strony...
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    
    .map-container {
      height: 500px;
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .loading-message {
      text-align: center;
      margin-top: 20px;
      font-style: italic;
      color: #666;
    }
    
    .error-message {
      text-align: center;
      margin-top: 20px;
      color: #d9534f;
      padding: 10px;
      background-color: #f9f2f2;
      border-radius: 4px;
    }
    
    .server-message {
      text-align: center;
      margin-top: 20px;
      color: #333;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed #ccc;
    }
  `]
})
export class WelcomeComponent implements OnInit, AfterViewInit {
  loading = true;
  error: string | null = null;
  isBrowser: boolean; // Changed to public
  private coordinates: Coordinate[] = [];
  private map: any;
  
  constructor(
    private mapService: MapService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  
  ngOnInit(): void {
    this.fetchServicePins();
    
    if (this.isBrowser) {
      this.loadMapScript();
    }
  }
  
  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initializeMapWhenReady();
    }
  }
  
  private loadMapScript(): void {
    if (!this.isBrowser) return;
    
    if (!document.getElementById('leaflet-script')) {
      // Load Leaflet CSS
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      leafletCss.crossOrigin = '';
      document.head.appendChild(leafletCss);
      
      // Load Leaflet JS
      const leafletScript = document.createElement('script');
      leafletScript.id = 'leaflet-script';
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      leafletScript.crossOrigin = '';
      document.body.appendChild(leafletScript);
    }
  }
  
  private initializeMapWhenReady(): void {
    if (!this.isBrowser) return;
    
    const checkLeaflet = setInterval(() => {
      // @ts-ignore
      if (window.L) {
        clearInterval(checkLeaflet);
        this.initializeMap();
      }
    }, 100);
    
    // Safety timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkLeaflet);
      if (!this.map) {
        this.error = 'Nie udało się załadować mapy. Odśwież stronę.';
        this.loading = false;
      }
    }, 5000);
  }
  
  private initializeMap(): void {
    if (!this.isBrowser) return;
    
    try {
      // @ts-ignore
      this.map = L.map('map').setView([50.0647, 19.9450], 12); // Center on Kraków
      
      // @ts-ignore
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);
      
      this.addPinsToMap();
      this.loading = false;
    } catch (err) {
      console.error('Error initializing map:', err);
      this.error = 'Wystąpił błąd podczas inicjalizacji mapy.';
      this.loading = false;
    }
  }
  
  private fetchServicePins(): void {
    this.mapService.getServicePins().subscribe({
      next: (data) => {
        this.coordinates = data;
        if (this.map) {
          this.addPinsToMap();
        }
      },
      error: (err) => {
        console.error('Error fetching service pins:', err);
        this.error = 'Nie udało się pobrać lokalizacji serwisów.';
        this.loading = false;
      }
    });
  }
  
  private addPinsToMap(): void {
    if (!this.isBrowser || !this.map || this.coordinates.length === 0) return;
    
    this.coordinates.forEach(coord => {
      try {
        // @ts-ignore
        L.marker([coord.latitude, coord.longitude])
          .addTo(this.map)
          .bindPopup('Serwis rowerowy');
      } catch (err) {
        console.error('Error adding marker:', err);
      }
    });
  }
}