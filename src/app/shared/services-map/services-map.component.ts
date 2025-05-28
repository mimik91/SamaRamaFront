// src/app/shared/services-map/services-map.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MapService, MapPin } from '../services/map.service';
import { NotificationService } from '../../core/notification.service';

declare var L: any;

@Component({
  selector: 'app-services-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div class="map-header">
        <h3>Serwisy rowerowe w Krakowie</h3>
        <p class="map-description">Znajdź najbliższy serwis rowerowy</p>
      </div>
      
      <div #mapContainer class="map-wrapper" id="services-map">
        <div *ngIf="!isBrowser || loading" class="map-placeholder">
          <div class="loading-spinner" *ngIf="loading"></div>
          <p *ngIf="loading">Ładowanie mapy...</p>
          <p *ngIf="!isBrowser">Mapa będzie dostępna po załadowaniu strony</p>
        </div>
      </div>
      
      <div class="map-info" *ngIf="pins.length > 0">
        <p class="services-count">
          <strong>{{ pins.length }}</strong> {{ pins.length === 1 ? 'serwis' : 'serwisów' }} w okolicy
        </p>
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .map-header {
      padding: 20px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }
    
    .map-header h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 1.4rem;
      font-weight: 600;
    }
    
    .map-description {
      margin: 0;
      color: #64748b;
      font-size: 1rem;
    }
    
    .map-wrapper {
      position: relative;
      height: 450px;
      width: 100%;
    }
    
    .map-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background-color: #f1f5f9;
      color: #64748b;
    }
    
    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-radius: 50%;
      border-top: 4px solid #3498db;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .map-info {
      padding: 15px 20px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    
    .services-count {
      margin: 0;
      color: #475569;
      font-size: 0.95rem;
    }
    
    /* Responsive design */
    @media screen and (max-width: 768px) {
      .map-container {
        border-radius: 0;
        margin: 0 -20px;
      }
      
      .map-wrapper {
        height: 350px;
      }
      
      .map-header {
        padding: 15px;
      }
      
      .map-header h3 {
        font-size: 1.2rem;
      }
    }
    
    @media screen and (max-width: 480px) {
      .map-wrapper {
        height: 300px;
      }
    }
  `]
})
export class ServicesMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  private map: any;
  isBrowser: boolean; // Zmienione z private na public
  pins: MapPin[] = [];
  loading = true;
  
  // Współrzędne Krakowa
  private readonly KRAKOW_CENTER = {
    lat: 50.0647,
    lng: 19.9450
  };
  
  constructor(
    private mapService: MapService,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadPins();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loadLeafletScript().then(() => {
        this.initializeMap();
      }).catch(error => {
        console.error('Failed to load Leaflet:', error);
        this.loading = false;
        this.notificationService.error('Nie udało się załadować mapy');
      });
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private loadLeafletScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Sprawdź czy Leaflet jest już załadowany
      if (typeof L !== 'undefined') {
        resolve();
        return;
      }

      // Załaduj CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      // Załaduj JavaScript
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Leaflet script'));
      document.head.appendChild(script);
    });
  }

  private initializeMap(): void {
    if (!this.mapContainer) {
      console.error('Map container not found');
      return;
    }

    try {
      // Inicjalizacja mapy z centrum na Krakowie
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [this.KRAKOW_CENTER.lat, this.KRAKOW_CENTER.lng],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      });

      // Dodanie warstwy OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Dodanie pinów jeśli są już załadowane
      if (this.pins.length > 0) {
        this.addPinsToMap();
      }

      this.loading = false;
    } catch (error) {
      console.error('Error initializing map:', error);
      this.loading = false;
      this.notificationService.error('Nie udało się załadować mapy');
    }
  }

  private loadPins(): void {
    this.mapService.getPins().subscribe({
      next: (pins) => {
        this.pins = pins;
        console.log('Loaded pins:', pins);
        
        // Jeśli mapa jest już inicjalizowana, dodaj piny
        if (this.map && pins.length > 0) {
          this.addPinsToMap();
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pins:', error);
        this.loading = false;
        this.notificationService.error('Nie udało się załadować lokalizacji serwisów');
      }
    });
  }

  private addPinsToMap(): void {
    if (!this.map || !this.pins.length) return;

    // Niestandardowa ikona dla serwisów
    const serviceIcon = L.divIcon({
      className: 'custom-service-marker',
      html: `
        <div style="
          background-color: #3498db;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">
          🔧
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    // Dodanie markera dla każdego serwisu
    this.pins.forEach(pin => {
      const marker = L.marker([pin.latitude, pin.longitude], { icon: serviceIcon })
        .addTo(this.map);

      // Popup z informacjami o serwisie
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${pin.name}</h4>
          ${pin.address ? `<p style="margin: 4px 0; color: #64748b; font-size: 0.9rem;"><strong>Adres:</strong> ${pin.address}</p>` : ''}
          ${pin.description ? `<p style="margin: 4px 0; color: #64748b; font-size: 0.9rem;">${pin.description}</p>` : ''}
          <div style="margin-top: 10px; text-align: center;">
            <button onclick="window.showServiceDetails(${pin.id})" style="
              background-color: #3498db;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.9rem;
            ">Zobacz szczegóły</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Dopasowanie widoku do wszystkich markerów jeśli jest ich kilka
    if (this.pins.length > 1) {
      const group = new L.featureGroup(this.pins.map(pin => 
        L.marker([pin.latitude, pin.longitude])
      ));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }

    // Globalna funkcja do pokazywania szczegółów serwisu
    (window as any).showServiceDetails = (serviceId: number) => {
      this.showServiceDetails(serviceId);
    };
  }

  private showServiceDetails(serviceId: number): void {
    this.mapService.getServiceDetails(serviceId).subscribe({
      next: (details) => {
        if (details) {
          // Tutaj możesz dodać logikę pokazywania szczegółów
          // np. modal, przekierowanie, itp.
          console.log('Service details:', details);
          this.notificationService.info(`Szczegóły serwisu: ${details.name}`);
        }
      },
      error: (error) => {
        console.error('Error loading service details:', error);
        this.notificationService.error('Nie udało się załadować szczegółów serwisu');
      }
    });
  }
}