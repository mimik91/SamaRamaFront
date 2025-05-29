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
  templateUrl: './services-map.component.html',
  styleUrls: ['./services-map.component.css']
})
export class ServicesMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  private map: any;
  private markers: Map<number, any> = new Map(); // Przechowywanie markerów
  isBrowser: boolean;
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

    // Niestandardowa ikona pinezki - bardziej realistyczna i mniejsza
    const serviceIcon = L.divIcon({
      className: 'custom-service-marker',
      html: `
        <div style="
          position: relative;
          width: 24px;
          height: 32px;
        ">
          <div style="
            background-color: #e74c3c;
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: absolute;
            top: 0;
            left: 0;
          "></div>
          <div style="
            position: absolute;
            top: 3px;
            left: 3px;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(45deg);
            color: white;
            font-size: 10px;
          ">🔧</div>
        </div>
      `,
      iconSize: [24, 32],
      iconAnchor: [12, 32],
      popupAnchor: [0, -32]
    });

    // Dodanie markera dla każdego serwisu
    this.pins.forEach(pin => {
      const marker = L.marker([pin.latitude, pin.longitude], { icon: serviceIcon })
        .addTo(this.map);

      // Przechowuj marker w mapie dla łatwego dostępu
      this.markers.set(pin.id, marker);

      // Obsługa kliknięcia w marker - TUTAJ JEST UDERZENIE DO BACKENDU
      marker.on('click', () => {
        this.loadAndShowServiceDetails(pin.id, marker);
      });
    });

    // Dopasowanie widoku do wszystkich markerów jeśli jest ich kilka
    if (this.pins.length > 1) {
      const group = new L.featureGroup(this.pins.map(pin => 
        L.marker([pin.latitude, pin.longitude])
      ));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private loadAndShowServiceDetails(serviceId: number, marker: any): void {
    // Pokaż loading popup
    const loadingContent = `
      <div class="loading-popup">
        <div style="
          border: 3px solid #f3f3f3;
          border-radius: 50%;
          border-top: 3px solid #3498db;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        "></div>
        <p>Ładowanie szczegółów serwisu...</p>
      </div>
    `;
    
    marker.bindPopup(loadingContent, {
      maxWidth: 300,
      className: 'loading-popup-container'
    }).openPopup();

    // 🎯 TUTAJ JEST UDERZENIE DO BACKENDU: GET /api/bike-services/{id}
    this.mapService.getServiceDetails(serviceId).subscribe({
      next: (serviceDetails) => {
        if (serviceDetails) {
          this.showServiceDetailsPopup(serviceDetails, marker);
        } else {
          this.showErrorPopup(marker, 'Nie znaleziono szczegółów serwisu');
        }
      },
      error: (error) => {
        console.error('Error loading service details:', error);
        this.showErrorPopup(marker, 'Nie udało się załadować szczegółów serwisu');
      }
    });
  }

  private showServiceDetailsPopup(serviceDetails: any, marker: any): void {
    // Funkcja pomocnicza do formatowania adresu
    const formatAddress = (service: any): string => {
      const parts = [];
      if (service.street) parts.push(service.street);
      if (service.building) parts.push(service.building);
      if (service.flat) parts.push(`m. ${service.flat}`);
      if (service.postalCode && service.city) {
        parts.push(`${service.postalCode} ${service.city}`);
      } else if (service.city) {
        parts.push(service.city);
      }
      return parts.join(', ');
    };

    const fullAddress = formatAddress(serviceDetails);

    const popupContent = `
      <div style="min-width: 280px; font-family: 'Segoe UI', Arial, sans-serif; max-width: 350px;">
        <div style="
          background: linear-gradient(135deg, #3498db, #2c3e50);
          color: white;
          padding: 15px;
          margin: -10px -10px 15px -10px;
          border-radius: 6px 6px 0 0;
          text-align: center;
        ">
          <h3 style="margin: 0; font-size: 1.2rem; font-weight: 600;">${serviceDetails.name}</h3>
          ${serviceDetails.verified ? '<div style="margin-top: 5px; font-size: 0.8rem; opacity: 0.9;">✓ Zweryfikowany</div>' : ''}
        </div>
        
        <div style="padding: 0 5px;">
          ${fullAddress ? `
            <div style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;">
              <div style="color: #3498db; margin-top: 2px; font-size: 1.1rem;">📍</div>
              <div style="flex: 1;">
                <div style="color: #2c3e50; font-size: 0.9rem; line-height: 1.4;">
                  <strong>Adres:</strong><br>
                  <span style="color: #555;">${fullAddress}</span>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${serviceDetails.phoneNumber ? `
            <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
              <div style="color: #27ae60; font-size: 1.1rem;">📞</div>
              <div style="flex: 1;">
                <div style="color: #2c3e50; font-size: 0.9rem;">
                  <strong>Telefon:</strong><br>
                  <a href="tel:${serviceDetails.phoneNumber}" style="color: #27ae60; text-decoration: none; font-weight: 500;">${serviceDetails.phoneNumber}</a>
                </div>
              </div>
            </div>
          ` : ''}

          ${serviceDetails.businessPhone ? `
            <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
              <div style="color: #27ae60; font-size: 1.1rem;">☎️</div>
              <div style="flex: 1;">
                <div style="color: #2c3e50; font-size: 0.9rem;">
                  <strong>Tel. służbowy:</strong><br>
                  <a href="tel:${serviceDetails.businessPhone}" style="color: #27ae60; text-decoration: none; font-weight: 500;">${serviceDetails.businessPhone}</a>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${serviceDetails.email ? `
            <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
              <div style="color: #e67e22; font-size: 1.1rem;">✉️</div>
              <div style="flex: 1;">
                <div style="color: #2c3e50; font-size: 0.9rem;">
                  <strong>Email:</strong><br>
                  <a href="mailto:${serviceDetails.email}" style="color: #e67e22; text-decoration: none; font-weight: 500;">${serviceDetails.email}</a>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${serviceDetails.description ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ecf0f1;">
              <div style="color: #2c3e50; font-size: 0.9rem;">
                <strong>Opis:</strong>
              </div>
              <div style="color: #7f8c8d; font-size: 0.85rem; line-height: 1.4; margin-top: 5px; font-style: italic;">
                ${serviceDetails.description}
              </div>
            </div>
          ` : ''}

          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ecf0f1; text-align: center;">
            <div style="display: flex; gap: 8px; justify-content: center;">
              ${serviceDetails.phoneNumber ? `
                <a href="tel:${serviceDetails.phoneNumber}" style="
                  background: linear-gradient(135deg, #27ae60, #219a52);
                  color: white;
                  border: none;
                  padding: 8px 12px;
                  border-radius: 15px;
                  text-decoration: none;
                  font-size: 0.8rem;
                  font-weight: 500;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  display: inline-flex;
                  align-items: center;
                  gap: 5px;
                ">📞 Zadzwoń</a>
              ` : ''}
              
              ${serviceDetails.email ? `
                <a href="mailto:${serviceDetails.email}" style="
                  background: linear-gradient(135deg, #e67e22, #d35400);
                  color: white;
                  border: none;
                  padding: 8px 12px;
                  border-radius: 15px;
                  text-decoration: none;
                  font-size: 0.8rem;
                  font-weight: 500;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  display: inline-flex;
                  align-items: center;
                  gap: 5px;
                ">✉️ Email</a>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 400,
      className: 'service-details-popup'
    }).openPopup();
  }

  private showErrorPopup(marker: any, errorMessage: string): void {
    const errorContent = `
      <div class="error-popup">
        <div style="color: #e74c3c; font-size: 2rem; margin-bottom: 10px;">⚠️</div>
        <p>${errorMessage}</p>
        <button onclick="this.closest('.leaflet-popup').style.display='none'" style="
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 10px;
        ">Zamknij</button>
      </div>
    `;
    
    marker.bindPopup(errorContent, {
      maxWidth: 250,
      className: 'error-popup-container'
    }).openPopup();
  }
}