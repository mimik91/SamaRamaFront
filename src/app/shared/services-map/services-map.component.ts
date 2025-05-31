// src/app/shared/services-map/services-map.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MapService, MapPin } from '../services/map.service';
import { NotificationService } from '../../core/notification.service';
import { AuthService } from '../../auth/auth.service';

declare var L: any;

@Component({
  selector: 'app-services-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-map.component.html',
  styleUrls: ['./services-map.component.css']
})
export class ServicesMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  private map: any;
  private markers: Map<number, any> = new Map();
  private isMapInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  isBrowser: boolean;
  pins: MapPin[] = [];
  loading = true;
  mapError = false;
  mapVisible = false;
  
  // Współrzędne Krakowa
  private readonly KRAKOW_CENTER = {
    lat: 50.0647,
    lng: 19.9450
  };
  
  constructor(
    private mapService: MapService,
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.loadPinsAsync();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.mapContainer) {
      setTimeout(() => {
        this.initializeMapAsync();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private destroyMap(): void {
    if (this.map) {
      try {
        this.map.remove();
        this.map = null;
        this.isMapInitialized = false;
      } catch (error) {
        console.error('Error destroying map:', error);
      }
    }
  }

  private async loadPinsAsync(): Promise<void> {
    try {
      this.pins = await this.mapService.getPins().toPromise() || [];
      console.log('Pins loaded:', this.pins.length);
      
      if (this.isMapInitialized && this.map && this.pins.length > 0) {
        this.addPinsToMap();
      }
    } catch (error) {
      console.error('Error loading pins:', error);
      this.pins = [];
    }
  }

  private async initializeMapAsync(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performMapInitialization();
    return this.initializationPromise;
  }

  private async performMapInitialization(): Promise<void> {
    try {
      if (!this.mapContainer?.nativeElement) {
        console.log('Map container not ready, skipping initialization');
        this.loading = false;
        return;
      }

      await this.loadLeafletIfNeeded();
      await this.initializeMap();
      
      this.loading = false;
      this.mapVisible = true;
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
      this.mapError = true;
      this.loading = false;
    }
  }

  private async loadLeafletIfNeeded(): Promise<void> {
    if (typeof L !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="leaflet.js"]')) {
        const checkInterval = setInterval(() => {
          if (typeof L !== 'undefined') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Leaflet loading timeout'));
        }, 10000);
        return;
      }

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.async = true;
      
      script.onload = () => {
        setTimeout(() => {
          if (typeof L !== 'undefined') {
            resolve();
          } else {
            reject(new Error('Leaflet loaded but not available'));
          }
        }, 100);
      };
      
      script.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.head.appendChild(script);
    });
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapContainer?.nativeElement || this.isMapInitialized) {
      return;
    }

    const containerElement = this.mapContainer.nativeElement;
    
    if (containerElement.offsetWidth === 0 || containerElement.offsetHeight === 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (containerElement.offsetWidth === 0 || containerElement.offsetHeight === 0) {
        throw new Error('Map container has no dimensions');
      }
    }

    this.map = L.map(containerElement, {
      center: [this.KRAKOW_CENTER.lat, this.KRAKOW_CENTER.lng],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      preferCanvas: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.isMapInitialized = true;

    if (this.pins.length > 0) {
      setTimeout(() => {
        this.addPinsToMap();
      }, 100);
    }

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    console.log('Map initialized successfully');
  }

  private addPinsToMap(): void {
    if (!this.map || !this.pins.length || !this.isMapInitialized) {
      return;
    }

    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers.clear();

    const validPins = this.pins.filter(pin => 
      pin.latitude && pin.longitude && 
      !isNaN(pin.latitude) && !isNaN(pin.longitude) &&
      pin.latitude >= -90 && pin.latitude <= 90 &&
      pin.longitude >= -180 && pin.longitude <= 180
    );

    if (validPins.length === 0) {
      console.log('No valid pins to display');
      return;
    }

    const serviceIcon = L.divIcon({
      className: 'custom-service-marker',
      html: '<div style="background-color: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });

    validPins.forEach(pin => {
      try {
        const marker = L.marker([pin.latitude, pin.longitude], { icon: serviceIcon })
          .addTo(this.map);

        this.markers.set(pin.id, marker);

        marker.on('click', () => {
          console.log('🔴 MARKER CLICKED! Pin object:', pin);
          this.loadServiceDetailsFromAPI(pin.id, marker);
        });

      } catch (error) {
        console.error(`Error adding marker for pin ${pin.id}:`, error);
      }
    });

    if (validPins.length > 1) {
      try {
        const group = new L.featureGroup(Array.from(this.markers.values()));
        this.map.fitBounds(group.getBounds().pad(0.1));
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }

    console.log(`Added ${this.markers.size} markers to map`);
  }

  private loadServiceDetailsFromAPI(serviceId: number, marker: any): void {
    console.log('🟡 loadServiceDetailsFromAPI called with ID:', serviceId);
    
    const loadingContent = `
      <div style="text-align: center; padding: 20px;">
        <div style="border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid #3498db; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
        <p>Ładowanie szczegółów serwisu...</p>
      </div>
    `;
    
    marker.bindPopup(loadingContent, {
      maxWidth: 350,
      className: 'loading-popup-container'
    }).openPopup();

    console.log('🚀 Making HTTP request to API...');
    this.mapService.getServiceDetails(serviceId).subscribe({
      next: (serviceDetails) => {
        console.log('✅ HTTP Response received:', serviceDetails);
        if (serviceDetails) {
          this.showDetailedPopup(serviceDetails, marker);
        } else {
          this.showErrorPopup(marker, 'Nie znaleziono szczegółów serwisu');
        }
      },
      error: (error) => {
        console.error('❌ HTTP Request failed:', error);
        this.showErrorPopup(marker, 'Nie udało się załadować szczegółów serwisu');
      }
    });
  }

  private showDetailedPopup(serviceDetails: any, marker: any): void {
    const addressParts = [];
    if (serviceDetails.street) addressParts.push(serviceDetails.street);
    if (serviceDetails.building) addressParts.push(serviceDetails.building);
    if (serviceDetails.flat) addressParts.push(`m. ${serviceDetails.flat}`);
    const fullAddress = addressParts.join(' ');
    
    let popupContent = `
      <div style="font-family: Arial, sans-serif; min-width: 250px;">
        <h4 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">${serviceDetails.name}</h4>
    `;
    
    if (fullAddress) {
      popupContent += `<p style="margin: 8px 0;"><strong>📍 Adres:</strong> ${fullAddress}</p>`;
    }
    
    if (serviceDetails.city) {
      popupContent += `<p style="margin: 8px 0;"><strong>🏙️ Miasto:</strong> ${serviceDetails.city}</p>`;
    }
    
    if (serviceDetails.postalCode) {
      popupContent += `<p style="margin: 8px 0;"><strong>📮 Kod:</strong> ${serviceDetails.postalCode}</p>`;
    }
    
    if (serviceDetails.phoneNumber) {
      popupContent += `<p style="margin: 8px 0;"><strong>📞 Telefon:</strong> <a href="tel:${serviceDetails.phoneNumber}" style="color: #27ae60; text-decoration: none;">${serviceDetails.phoneNumber}</a></p>`;
    }
    
    if (serviceDetails.businessPhone) {
      popupContent += `<p style="margin: 8px 0;"><strong>📱 Tel. służbowy:</strong> <a href="tel:${serviceDetails.businessPhone}" style="color: #27ae60; text-decoration: none;">${serviceDetails.businessPhone}</a></p>`;
    }
    
    if (serviceDetails.email) {
      popupContent += `<p style="margin: 8px 0;"><strong>✉️ Email:</strong> <a href="mailto:${serviceDetails.email}" style="color: #e67e22; text-decoration: none;">${serviceDetails.email}</a></p>`;
    }
    
    if (serviceDetails.description && serviceDetails.description.trim()) {
      popupContent += `<div style="margin: 15px 0 0 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 3px solid #007bff;">
        <p style="margin: 0; color: #666; font-size: 0.9em; line-height: 1.4;">${serviceDetails.description}</p>
      </div>`;
    }
    
    if (serviceDetails.verified) {
      popupContent += `<p style="color: #28a745; margin: 12px 0 0 0; font-weight: 500;"><strong>✅ Zweryfikowany serwis</strong></p>`;
    }

    // Dodaj przyciski akcji
    popupContent += `
      <div style="margin: 20px 0 0 0; padding: 15px 0 0 0; border-top: 1px solid #eee; display: flex; gap: 8px; flex-wrap: wrap;">
        <button 
          id="order-transport-btn-${serviceDetails.id}" 
          style="flex: 1; min-width: 120px; padding: 10px 16px; background-color: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px;"
          onmouseover="this.style.backgroundColor='#0056b3'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,123,255,0.3)'" 
          onmouseout="this.style.backgroundColor='#007bff'; this.style.transform='translateY(0)'; this.style.boxShadow='none'"
        >
          🚚 Zamów transport
        </button>
      </div>
    `;
    
    popupContent += `</div>`;

    marker.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'detailed-service-popup'
    }).openPopup();

    // Dodaj event listener dla przycisku transportu po otwarciu popup-a
    setTimeout(() => {
      const transportBtn = document.getElementById(`order-transport-btn-${serviceDetails.id}`);
      if (transportBtn) {
        transportBtn.addEventListener('click', () => {
          this.orderTransport(serviceDetails);
        });
      }
    }, 100);
  }

  private showErrorPopup(marker: any, errorMessage: string): void {
    const errorContent = `
      <div style="text-align: center; padding: 15px; color: #e74c3c;">
        <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
        <p>${errorMessage}</p>
      </div>
    `;
    
    marker.bindPopup(errorContent, {
      maxWidth: 250,
      className: 'error-popup-container'
    }).openPopup();
  }

  private orderTransport(serviceDetails: any): void {
    console.log('🚚 Order transport clicked for service:', serviceDetails);
    
    // Transport jest dostępny dla wszystkich - nie sprawdzamy logowania
    // Przejdź do formularza zamówienia transportu z parametrami serwisu
    this.router.navigate(['/order-transport'], {
      queryParams: {
        serviceId: serviceDetails.id,
        serviceName: serviceDetails.name,
        serviceAddress: `${serviceDetails.street} ${serviceDetails.building}${serviceDetails.flat ? '/' + serviceDetails.flat : ''}, ${serviceDetails.city}`
      }
    });
  }

  retryMapLoad(): void {
    this.mapError = false;
    this.loading = true;
    this.mapVisible = false;
    this.destroyMap();
    this.initializationPromise = null;
    
    setTimeout(() => {
      this.initializeMapAsync();
    }, 100);
  }

  showMap(): void {
    if (!this.mapVisible && !this.loading && !this.mapError) {
      this.loading = true;
      this.initializeMapAsync();
    }
  }
}