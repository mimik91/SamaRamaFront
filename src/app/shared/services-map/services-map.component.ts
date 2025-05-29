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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Nie ładuj nic w ngOnInit - to blokuje stronę
    if (this.isBrowser) {
      // Załaduj dane asynchronicznie z opóźnieniem
      setTimeout(() => {
        this.loadPinsAsync();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.mapContainer) {
      // Inicjalizuj mapę z większym opóźnieniem, aby nie blokować renderowania
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

  /**
   * Asynchroniczne ładowanie pinów
   */
  private async loadPinsAsync(): Promise<void> {
    try {
      this.pins = await this.mapService.getPins().toPromise() || [];
      console.log('Pins loaded:', this.pins.length);
      
      // Jeśli mapa jest już zainicjalizowana, dodaj piny
      if (this.isMapInitialized && this.map && this.pins.length > 0) {
        this.addPinsToMap();
      }
    } catch (error) {
      console.error('Error loading pins:', error);
      // Nie pokazuj błędu od razu - może być problem z API
      this.pins = [];
    }
  }

  /**
   * Asynchroniczne inicjalizowanie mapy
   */
  private async initializeMapAsync(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performMapInitialization();
    return this.initializationPromise;
  }

  private async performMapInitialization(): Promise<void> {
    try {
      // Sprawdź czy kontener istnieje
      if (!this.mapContainer?.nativeElement) {
        console.log('Map container not ready, skipping initialization');
        this.loading = false;
        return;
      }

      // Załaduj Leaflet tylko jeśli jeszcze nie jest załadowany
      await this.loadLeafletIfNeeded();
      
      // Inicjalizuj mapę
      await this.initializeMap();
      
      this.loading = false;
      this.mapVisible = true;
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
      this.mapError = true;
      this.loading = false;
      // Nie pokazuj notification od razu - może być normalny przypadek
    }
  }

  /**
   * Ładuje Leaflet tylko jeśli jest potrzebny
   */
  private async loadLeafletIfNeeded(): Promise<void> {
    // Jeśli Leaflet już istnieje, nie ładuj ponownie
    if (typeof L !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Sprawdź czy już ładujemy
      if (document.querySelector('script[src*="leaflet.js"]')) {
        // Czekaj na załadowanie
        const checkInterval = setInterval(() => {
          if (typeof L !== 'undefined') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout po 10 sekundach
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Leaflet loading timeout'));
        }, 10000);
        return;
      }

      // Załaduj CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);
      }

      // Załaduj JavaScript
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.async = true; // Ważne - asynchroniczne ładowanie
      
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

  /**
   * Inicjalizuje mapę
   */
  private async initializeMap(): Promise<void> {
    if (!this.mapContainer?.nativeElement || this.isMapInitialized) {
      return;
    }

    const containerElement = this.mapContainer.nativeElement;
    
    // Sprawdź wymiary kontenera
    if (containerElement.offsetWidth === 0 || containerElement.offsetHeight === 0) {
      // Spróbuj ponownie po krótkim czasie
      await new Promise(resolve => setTimeout(resolve, 200));
      if (containerElement.offsetWidth === 0 || containerElement.offsetHeight === 0) {
        throw new Error('Map container has no dimensions');
      }
    }

    // Inicjalizuj mapę
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

    // Dodaj warstwę map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.isMapInitialized = true;

    // Dodaj piny jeśli są dostępne
    if (this.pins.length > 0) {
      // Dodaj małe opóźnienie dla płynności
      setTimeout(() => {
        this.addPinsToMap();
      }, 100);
    }

    // Wymuś odświeżenie rozmiaru
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    console.log('Map initialized successfully');
  }

  /**
   * Dodaje piny do mapy
   */
  private addPinsToMap(): void {
    if (!this.map || !this.pins.length || !this.isMapInitialized) {
      return;
    }

    // Wyczyść istniejące markery
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers.clear();

    // Filtruj prawidłowe piny
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

    // Prosta ikona markera
    const serviceIcon = L.divIcon({
      className: 'custom-service-marker',
      html: '<div style="background-color: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });

    // Dodaj markery
    validPins.forEach(pin => {
      // DODAJ TEN LOG:
      console.log('🔍 Pin data structure:', pin);
      console.log('🔍 Pin properties:', Object.keys(pin));
      
      try {
        const marker = L.marker([pin.latitude, pin.longitude], { icon: serviceIcon })
          .addTo(this.map);

        this.markers.set(pin.id, marker);

        marker.on('click', () => {
          console.log('🔴 MARKER CLICKED! Pin object:', pin);
          
          // UŻYJ loadServiceDetailsFromAPI zamiast showSimplePopup:
          this.loadServiceDetailsFromAPI(pin.id, marker);
        });

      } catch (error) {
        console.error(`Error adding marker for pin ${pin.id}:`, error);
      }
    });

    // Dopasuj widok jeśli jest więcej niż jeden marker
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

  /**
   * Pokazuje prosty popup bez dodatkowych zapytań API
   */
  private showSimplePopup(pin: MapPin, marker: any): void {
    const popupContent = `
      <div style="font-family: Arial, sans-serif; min-width: 200px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">${pin.name || 'Serwis bez nazwy'}</h4>
        ${pin.address ? `<p style="margin: 5px 0; color: #666;"><strong>Adres:</strong> ${pin.address}</p>` : ''}
        ${pin.phoneNumber ? `<p style="margin: 5px 0;"><strong>Telefon:</strong> <a href="tel:${pin.phoneNumber}" style="color: #27ae60;">${pin.phoneNumber}</a></p>` : ''}
        ${pin.email ? `<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${pin.email}" style="color: #e67e22;">${pin.email}</a></p>` : ''}
        ${pin.description ? `<p style="margin: 10px 0 0 0; color: #666; font-size: 0.9em;">${pin.description}</p>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'simple-service-popup'
    }).openPopup();
  }

  /**
   * Ładuje szczegóły serwisu z API i pokazuje popup
   */
  private loadServiceDetailsFromAPI(serviceId: number, marker: any): void {
    console.log('🟡 loadServiceDetailsFromAPI called with ID:', serviceId);
    
    // Pokaż loading popup
    const loadingContent = `
      <div style="text-align: center; padding: 20px;">
        <div style="border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid #3498db; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
        <p>Ładowanie szczegółów serwisu...</p>
      </div>
    `;
    
    marker.bindPopup(loadingContent, {
      maxWidth: 300,
      className: 'loading-popup-container'
    }).openPopup();

    // TUTAJ JEST HTTP REQUEST:
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

  /**
   * Pokazuje szczegółowy popup z danymi z API
   */
  private showDetailedPopup(serviceDetails: any, marker: any): void {
    // Buduj adres tylko z dostępnych części
    const addressParts = [];
    if (serviceDetails.street) addressParts.push(serviceDetails.street);
    if (serviceDetails.building) addressParts.push(serviceDetails.building);
    if (serviceDetails.flat) addressParts.push(`m. ${serviceDetails.flat}`);
    const fullAddress = addressParts.join(' ');
    
    // Buduj zawartość popup-a tylko z dostępnymi danymi
    let popupContent = `
      <div style="font-family: Arial, sans-serif; min-width: 250px;">
        <h4 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">${serviceDetails.name}</h4>
    `;
    
    // Adres (jeśli dostępny)
    if (fullAddress) {
      popupContent += `<p style="margin: 8px 0;"><strong>📍 Adres:</strong> ${fullAddress}</p>`;
    }
    
    // Miasto (jeśli dostępne)
    if (serviceDetails.city) {
      popupContent += `<p style="margin: 8px 0;"><strong>🏙️ Miasto:</strong> ${serviceDetails.city}</p>`;
    }
    
    // Kod pocztowy (jeśli dostępny)
    if (serviceDetails.postalCode) {
      popupContent += `<p style="margin: 8px 0;"><strong>📮 Kod:</strong> ${serviceDetails.postalCode}</p>`;
    }
    
    // Telefon (jeśli dostępny)
    if (serviceDetails.phoneNumber) {
      popupContent += `<p style="margin: 8px 0;"><strong>📞 Telefon:</strong> <a href="tel:${serviceDetails.phoneNumber}" style="color: #27ae60; text-decoration: none;">${serviceDetails.phoneNumber}</a></p>`;
    }
    
    // Telefon służbowy (jeśli dostępny)
    if (serviceDetails.businessPhone) {
      popupContent += `<p style="margin: 8px 0;"><strong>📱 Tel. służbowy:</strong> <a href="tel:${serviceDetails.businessPhone}" style="color: #27ae60; text-decoration: none;">${serviceDetails.businessPhone}</a></p>`;
    }
    
    // Email (jeśli dostępny)
    if (serviceDetails.email) {
      popupContent += `<p style="margin: 8px 0;"><strong>✉️ Email:</strong> <a href="mailto:${serviceDetails.email}" style="color: #e67e22; text-decoration: none;">${serviceDetails.email}</a></p>`;
    }
    
    // Opis (jeśli dostępny)
    if (serviceDetails.description && serviceDetails.description.trim()) {
      popupContent += `<div style="margin: 15px 0 0 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 3px solid #007bff;">
        <p style="margin: 0; color: #666; font-size: 0.9em; line-height: 1.4;">${serviceDetails.description}</p>
      </div>`;
    }
    
    // Status weryfikacji (tylko jeśli zweryfikowany)
    if (serviceDetails.verified) {
      popupContent += `<p style="color: #28a745; margin: 12px 0 0 0; font-weight: 500;"><strong>✅ Zweryfikowany serwis</strong></p>`;
    }
    
    popupContent += `</div>`;

    marker.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'detailed-service-popup'
    }).openPopup();
  }

  /**
   * Pokazuje popup z błędem
   */
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

  /**
   * Metoda do ponownego ładowania mapy
   */
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

  /**
   * Pokazuje mapę na żądanie (lazy loading)
   */
  showMap(): void {
    if (!this.mapVisible && !this.loading && !this.mapError) {
      this.loading = true;
      this.initializeMapAsync();
    }
  }
}