// src/app/shared/services-map/services-map.component.ts - FINAL VERSION
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MapService, MapPin, CitySuggestion, MapServicesRequestDto } from '../services/map.service';
import { NotificationService } from '../../core/notification.service';
import { AuthService } from '../../auth/auth.service';
import { debounceTime, Subject } from 'rxjs';

declare var L: any;

@Component({
  selector: 'app-services-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services-map.component.html',
  styleUrls: ['./services-map.component.css']
})
export class ServicesMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  private map: any;
  private markers: Map<number, any> = new Map();
  private isMapInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Subjects dla debounce
  private citySearchSubject = new Subject<string>();
  private serviceSearchSubject = new Subject<string>();
  private mapMoveSubject = new Subject<void>();
  
  isBrowser: boolean;
  pins: MapPin[] = [];
  allPins: MapPin[] = [];
  loading = false;
  loadingSidebar = false;
  mapError = false;
  mapVisible = false;
  sidebarOpen = false;
  selectedPinId: number | null = null;
  
  // Pagination dla sidebara
  totalServices = 0;
  currentPage = 0;
  totalPages = 0;
  hasMoreServices = false;
  
  // Wyszukiwarka miast
  citySearchQuery = '';
  citySuggestions: CitySuggestion[] = [];
  citySearchFocused = false;
  citySearchLoading = false;
  
  // Wyszukiwarka serwisów
  serviceSearchQuery = '';
  serviceSuggestions: MapPin[] = [];
  serviceSearchFocused = false;
  serviceSearchLoading = false;
  
  showVerifiedOnly = false;
  
  private readonly DEFAULT_CENTER = {
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
    
    this.citySearchSubject.pipe(debounceTime(300)).subscribe(query => {
      this.performCitySearch(query);
    });
    
    this.serviceSearchSubject.pipe(debounceTime(300)).subscribe(query => {
      this.performServiceSearch(query);
    });

    this.mapMoveSubject.pipe(debounceTime(500)).subscribe(() => {
      this.performMapMove();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-box')) {
      this.citySearchFocused = false;
      this.serviceSearchFocused = false;
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.mapVisible = true;
      setTimeout(() => {
        // Załaduj klastrowane piny NA MAPĘ
        this.loadClusteredPins(12, undefined);
        
        // Załaduj listę serwisów DO SIDEBARA
        this.loadServicesForSidebar(0);
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
    this.citySearchSubject.complete();
    this.serviceSearchSubject.complete();
    this.mapMoveSubject.complete();
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

  // ============ ŁADOWANIE SERWISÓW DO SIDEBARA ============

  private loadServicesForSidebar(page: number = 0): void {
    this.loadingSidebar = true;
    
    const request: MapServicesRequestDto = {
      type: 'event',
      bounds: this.getCurrentBounds(),
      page: page,
      perPage: 25
    };
    
    this.mapService.getServices(request).subscribe({
      next: (response) => {
        if (response && response.data) {
          if (page === 0) {
            this.pins = response.data.map(pin => ({
              ...pin,
              address: pin.address || this.buildAddressFromPin(pin)
            }));
          } else {
            // Infinite scroll - dodaj kolejne
            this.pins = [
              ...this.pins,
              ...response.data.map(pin => ({
                ...pin,
                address: pin.address || this.buildAddressFromPin(pin)
              }))
            ];
          }
          
          this.totalServices = response.total;
          this.currentPage = response.page ?? 0;
          this.totalPages = response.totalPages ?? 0;
          this.hasMoreServices = (response.next ?? 0) > (response.page ?? 0);
          this.allPins = [...this.pins];
        }
        this.loadingSidebar = false;
      },
      error: (error) => {
        console.error('Error loading services for sidebar:', error);
        this.loadingSidebar = false;
      }
    });
  }

  private getCurrentBounds(): string | undefined {
    if (!this.map || !this.isMapInitialized) {
      return undefined;
    }
    
    const bounds = this.map.getBounds();
    return `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
  }

  onSidebarScroll(event: any): void {
    const element = event.target;
    const atBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 5;
    
    if (atBottom && this.hasMoreServices && !this.loadingSidebar) {
      this.loadServicesForSidebar(this.currentPage + 1);
    }
  }

  // ============ MAPA - MOVEMENT ============

  private onMapMove(): void {
    this.mapMoveSubject.next();
  }

  private performMapMove(): void {
    if (!this.map || !this.isMapInitialized) {
      return;
    }

    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();
    const boundsStr = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

    console.log('Map moved - zoom:', zoom, 'bounds:', boundsStr);
    this.loadClusteredPins(zoom, boundsStr);
    
    // Odśwież sidebar z nowymi bounds
    this.loadServicesForSidebar(0);
  }

  // ============ WYSZUKIWARKA MIAST ============
  
  onCitySearchChange(): void {
    if (this.citySearchQuery.length >= 3) {
      this.citySearchFocused = true;
      this.citySearchSubject.next(this.citySearchQuery);
    } else {
      this.citySuggestions = [];
      this.citySearchFocused = false;
    }
  }

  private performCitySearch(query: string): void {
    if (query.trim().length < 3) {
      this.citySuggestions = [];
      return;
    }

    this.citySearchLoading = true;
    this.mapService.searchCities(query).subscribe({
      next: (cities) => {
        this.citySuggestions = cities;
        this.citySearchLoading = false;
      },
      error: (error) => {
        console.error('City search error:', error);
        this.citySuggestions = [];
        this.citySearchLoading = false;
      }
    });
  }

  selectCity(city: CitySuggestion): void {
    console.log('Selected city:', city);
    this.citySearchQuery = city.name;
    this.citySearchFocused = false;
    
    this.mapService.getCityBounds(city.name).subscribe({
      next: (bounds) => {
        if (bounds && this.isMapInitialized && this.map) {
          const southWest = L.latLng(bounds.sw.latitude, bounds.sw.longitude);
          const northEast = L.latLng(bounds.ne.latitude, bounds.ne.longitude);
          const mapBounds = L.latLngBounds(southWest, northEast);
          
          this.map.fitBounds(mapBounds, { padding: [50, 50] });
          
          const zoom = this.map.getZoom();
          const boundsStr = `${bounds.sw.latitude},${bounds.sw.longitude},${bounds.ne.latitude},${bounds.ne.longitude}`;
          
          // Załaduj piny na mapę
          this.loadClusteredPins(zoom, boundsStr);
          
          // Załaduj serwisy do sidebara
          this.loadServicesForSidebar(0);
        }
      },
      error: (error) => {
        console.error('Error fetching city bounds:', error);
        if (this.isMapInitialized && this.map) {
          this.map.setView([city.latitude, city.longitude], 12);
          this.onMapMove();
        }
      }
    });
  }

  clearCitySearch(): void {
    this.citySearchQuery = '';
    this.citySuggestions = [];
    this.citySearchFocused = false;
    
    if (this.isMapInitialized && this.map) {
      this.map.setView([this.DEFAULT_CENTER.lat, this.DEFAULT_CENTER.lng], 12);
      this.onMapMove();
    }
  }

  // ============ WYSZUKIWARKA SERWISÓW ============
  
  onServiceSearchChange(): void {
    if (this.serviceSearchQuery.length >= 3) {
      this.serviceSearchFocused = true;
      this.serviceSearchSubject.next(this.serviceSearchQuery);
    } else {
      this.serviceSuggestions = [];
      this.serviceSearchFocused = false;
      
      if (this.serviceSearchQuery.length === 0) {
        this.pins = [...this.allPins];
        this.onFilterChange();
      }
    }
  }

  private performServiceSearch(query: string): void {
    if (query.trim().length < 3) {
      this.serviceSuggestions = [];
      return;
    }

    this.serviceSearchLoading = true;
    this.mapService.searchServicesAutocomplete(query, 10, true).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.serviceSuggestions = response.data.map(pin => ({
            ...pin,
            address: pin.address || this.buildAddressFromPin(pin)
          }));
          
          this.filterPinsBySearchResults(response.data);
        }
        this.serviceSearchLoading = false;
      },
      error: (error) => {
        console.error('Service search error:', error);
        this.serviceSuggestions = [];
        this.serviceSearchLoading = false;
      }
    });
  }

  private filterPinsBySearchResults(searchResults: MapPin[]): void {
    this.pins = searchResults.map(pin => ({
      ...pin,
      address: pin.address || this.buildAddressFromPin(pin)
    }));
    
    if (this.showVerifiedOnly) {
      this.pins = this.pins.filter(pin => pin.verified);
    }
  }

  clearServiceSearch(): void {
    this.serviceSearchQuery = '';
    this.serviceSuggestions = [];
    this.serviceSearchFocused = false;
    this.pins = [...this.allPins];
    this.onFilterChange();
  }

  // ============ FILTRY ============

  onFilterChange(): void {
    if (this.showVerifiedOnly) {
      this.pins = this.allPins.filter(pin => pin.verified);
    } else {
      this.pins = [...this.allPins];
    }
  }

  // ============ METODY POMOCNICZE ============

  private buildAddressFromPin(pin: MapPin): string {
    if (pin.address && pin.address.trim()) {
      return pin.address;
    }
    return pin.name || 'Serwis rowerowy';
  }

  showServiceTags(pin: MapPin): boolean {
    return pin.verified !== undefined;
  }

  isVerified(pin: MapPin): boolean {
    return pin.verified === true;
  }

  trackByPinId(index: number, pin: MapPin): number {
    return pin.id;
  }

  selectService(pin: MapPin): void {
    this.selectedPinId = pin.id;
    
    this.serviceSearchFocused = false;
    this.citySearchFocused = false;
    
    if (this.isMapInitialized && this.map) {
      this.map.setView([pin.latitude, pin.longitude], 15);
      this.loadServiceDetailsFromAPI(pin.id, this.markers.get(pin.id));
    }
    
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    }
  }

  viewServiceDetails(pin: MapPin): void {
    this.selectService(pin);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // ============ INICJALIZACJA MAPY ============

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
        return;
      }

      await this.loadLeafletIfNeeded();
      await this.initializeMap();
      
      this.mapVisible = true;
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
      this.mapError = true;
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
      center: [this.DEFAULT_CENTER.lat, this.DEFAULT_CENTER.lng],
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

    this.map.on('moveend', () => {
      this.onMapMove();
    });

    setTimeout(() => {
      this.onMapMove();
    }, 100);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    console.log('Map initialized successfully');
  }

  // ============ ŁADOWANIE PINÓW NA MAPĘ ============

  private loadClusteredPins(zoom: number, bounds?: string): void {
    this.loading = true;
    
    this.mapService.getClusteredPins(zoom, bounds, this.citySearchQuery || undefined).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.updateMapPins(response.data);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clustered pins:', error);
        this.loading = false;
        this.mapError = true;
      }
    });
  }

  private updateMapPins(pins: any[]): void {
    if (!this.map || !this.isMapInitialized) {
      return;
    }

    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers.clear();

    const validPins = pins.filter(pin => 
      pin.latitude && pin.longitude && 
      !isNaN(pin.latitude) && !isNaN(pin.longitude) &&
      pin.latitude >= -90 && pin.latitude <= 90 &&
      pin.longitude >= -180 && pin.longitude <= 180
    );

    if (validPins.length === 0) {
      console.log('No valid pins to display');
      return;
    }

    validPins.forEach((pin) => {
      try {
        const isCluster = pin.category === 'cluster';
        
        let markerIcon;
        let zIndexOffset = 0;
        
        if (isCluster) {
          const count = parseInt(pin.name.split(' ')[0]);
          
          let color, size, fontSize;
          if (count >= 50) {
            color = '%23dc2626';
            size = 60;
            fontSize = 18;
            zIndexOffset = 3000;
          } else if (count >= 10) {
            color = '%23f59e0b';
            size = 55;
            fontSize = 17;
            zIndexOffset = 2000;
          } else {
            color = '%232B82AD';
            size = 50;
            fontSize = 16;
            zIndexOffset = 1000;
          }
          
          const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/2 - 4}' fill='${color}' stroke='white' stroke-width='4'/%3E%3Ctext x='${size/2}' y='${size/2}' text-anchor='middle' dominant-baseline='central' fill='white' font-size='${fontSize}' font-weight='700' font-family='Arial'%3E${count}%3C/text%3E%3C/svg%3E`;
          
          markerIcon = L.icon({
            iconUrl: svg,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          });
        } else {
          const pinSize = 40;
          const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${pinSize}' height='${pinSize * 1.2}' viewBox='0 0 40 48'%3E%3Cpath d='M20 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 33.134 15 33.134s15-24.923 15-33.134C35 6.656 28.284 0 20 0zm0 20c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z' fill='%232B82AD' stroke='white' stroke-width='2'/%3E%3Ccircle cx='20' cy='14' r='4' fill='white'/%3E%3C/svg%3E`;
          
          markerIcon = L.icon({
            iconUrl: svg,
            iconSize: [pinSize, pinSize * 1.2],
            iconAnchor: [pinSize/2, pinSize * 1.2],
            popupAnchor: [0, -pinSize * 1.2]
          });
          
          zIndexOffset = 500;
        }

        const marker = L.marker([pin.latitude, pin.longitude], { 
          icon: markerIcon,
          zIndexOffset: zIndexOffset
        }).addTo(this.map);

        const pinId = isCluster ? pin.id : parseInt(pin.id);
        this.markers.set(pinId, marker);

        marker.on('click', () => {
          if (isCluster) {
            this.map.setView([pin.latitude, pin.longitude], this.map.getZoom() + 2);
          } else {
            this.selectedPinId = pinId;
            this.loadServiceDetailsFromAPI(pinId, marker);
          }
        });

      } catch (error) {
        console.error(`Error adding marker for pin ${pin.id}:`, error);
      }
    });

    console.log(`Added ${this.markers.size} markers to map`);
  }

  // ============ POPUP SERWISU ============

  private loadServiceDetailsFromAPI(serviceId: number, marker: any): void {
    console.log('Loading service details for ID:', serviceId);
    
    const loadingContent = `
      <div style="text-align: center; padding: 24px;">
        <div style="border: 3px solid #f1f5f9; border-radius: 50%; border-top: 3px solid #2B82AD; width: 32px; height: 32px; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
        <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Ładowanie szczegółów serwisu...</p>
      </div>
    `;
    
    marker.bindPopup(loadingContent, {
      maxWidth: 380,
      className: 'loading-popup-container'
    }).openPopup();

    this.mapService.getServiceDetails(serviceId).subscribe({
      next: (serviceDetails) => {
        console.log('Received service details:', serviceDetails);
        if (serviceDetails) {
          this.showDetailedPopup(serviceDetails, marker);
        } else {
          this.showErrorPopup(marker, 'Nie znaleziono szczegółów serwisu');
        }
      },
      error: (error) => {
        console.error('HTTP Request failed:', error);
        this.showErrorPopup(marker, 'Nie udało się załadować szczegółów serwisu');
      }
    });
  }

  private showDetailedPopup(serviceDetails: any, marker: any): void {
    const addressParts = [];
    if (serviceDetails.street) addressParts.push(serviceDetails.street);
    if (serviceDetails.building) addressParts.push(serviceDetails.building);
    if (serviceDetails.flat) addressParts.push(`/${serviceDetails.flat}`);
    
    let fullAddress = addressParts.join(' ');
    if (serviceDetails.city) {
      fullAddress += fullAddress ? `, ${serviceDetails.city}` : serviceDetails.city;
    }
    
    let popupContent = `
      <div style="font-family: inherit; min-width: 300px; max-width: 380px;">
        <div style="background: linear-gradient(135deg, #2B82AD 0%, #3498db 100%); color: white; padding: 18px; margin: -12px -18px 18px -18px; border-radius: 12px 12px 0 0;">
          <h4 style="margin: 0; font-size: 1.2rem; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${serviceDetails.name}</h4>
        </div>
    `;
    
    if (fullAddress) {
      popupContent += `
        <div style="display: flex; align-items: flex-start; gap: 10px; margin: 0 0 14px 0; padding: 12px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #e2e8f0;">
          <span style="color: #64748b; font-size: 1.1rem; flex-shrink: 0;">📍</span>
          <span style="color: #1e293b; line-height: 1.4; flex: 1; font-weight: 500;">${fullAddress}</span>
        </div>
      `;
    }
    
    if (serviceDetails.phoneNumber) {
      popupContent += `
        <div style="display: flex; align-items: center; gap: 10px; margin: 0 0 14px 0; padding: 12px; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 8px; border-left: 3px solid #22c55e;">
          <span style="color: #15803d; font-size: 1.1rem;">📞</span>
          <a href="tel:${serviceDetails.phoneNumber}" style="color: #15803d; text-decoration: none; font-weight: 600; flex: 1; font-size: 1rem;">${serviceDetails.phoneNumber}</a>
        </div>
      `;
    }

    if (serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
      popupContent += `
        <div style="margin: 14px 0; padding: 14px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; border-left: 3px solid #3b82f6;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span style="font-size: 1.2rem;">🚚</span>
            <strong style="color: #1e40af; font-size: 1rem;">Transport dostępny</strong>
          </div>
          <p style="margin: 0; color: #1e40af; font-size: 1.2rem; font-weight: 700;">${serviceDetails.transportCost} PLN</p>
          <p style="margin: 6px 0 0 0; font-size: 0.85rem; color: #64748b;">Cena za transport w obie strony</p>
        </div>
      `;
    }
    
    if (serviceDetails.description && serviceDetails.description.trim()) {
      popupContent += `
        <div style="margin: 18px 0; padding: 14px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #2B82AD;">
          <p style="margin: 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">${serviceDetails.description}</p>
        </div>
      `;
    }
    
    if (serviceDetails.verified) {
      popupContent += `
        <div style="display: flex; align-items: center; gap: 8px; margin: 14px 0; color: #059669; font-weight: 600; font-size: 0.9rem;">
          <span>✅</span>
          <span>Zweryfikowany serwis</span>
        </div>
      `;
    }

    popupContent += `
      <div style="margin: 20px 0 0 0; padding: 16px 0 0 0; border-top: 2px solid #f1f5f9; display: flex; gap: 10px; flex-wrap: wrap;">
    `;

    if (serviceDetails.verified) {
      popupContent += `
        <button 
          id="view-details-btn-${serviceDetails.id}" 
          style="flex: 1; min-width: 120px; padding: 12px 18px; background: linear-gradient(135deg, #2B82AD 0%, #3498db 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(43, 130, 173, 0.3);"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(43, 130, 173, 0.4)'" 
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(43, 130, 173, 0.3)'"
        >
          Zobacz szczegóły
        </button>
      `;
    } else {
      popupContent += `
        <button 
          id="register-service-btn-${serviceDetails.id}" 
          style="flex: 1; min-width: 120px; padding: 12px 18px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(245, 158, 11, 0.4)'" 
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(245, 158, 11, 0.3)'"
        >
          Zarejestruj ten serwis
        </button>
      `;
    }

    if (serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
      popupContent += `
        <button 
          id="order-transport-btn-${serviceDetails.id}" 
          style="flex: 1; min-width: 120px; padding: 12px 18px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(5, 150, 105, 0.4)'" 
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(5, 150, 105, 0.3)'"
        >
          Zamów transport
        </button>
      `;
    }

    popupContent += `</div></div>`;

    marker.bindPopup(popupContent, {
      maxWidth: 400,
      className: 'detailed-service-popup',
      closeButton: true
    }).openPopup();

    setTimeout(() => {
      if (serviceDetails.verified) {
        const viewDetailsBtn = document.getElementById(`view-details-btn-${serviceDetails.id}`);
        if (viewDetailsBtn) {
          viewDetailsBtn.addEventListener('click', () => {
            this.viewServiceDetailsPage(serviceDetails);
          });
        }
      } else {
        const registerBtn = document.getElementById(`register-service-btn-${serviceDetails.id}`);
        if (registerBtn) {
          registerBtn.addEventListener('click', () => {
            this.registerService(serviceDetails);
          });
        }
      }

      if (serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
        const transportBtn = document.getElementById(`order-transport-btn-${serviceDetails.id}`);
        if (transportBtn) {
          transportBtn.addEventListener('click', () => {
            this.orderTransport(serviceDetails);
          });
        }
      }
    }, 100);
  }

  private showErrorPopup(marker: any, errorMessage: string): void {
    const errorContent = `
      <div style="text-align: center; padding: 24px; color: #dc2626; min-width: 240px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.8;">⚠️</div>
        <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">${errorMessage}</p>
      </div>
    `;
    
    marker.bindPopup(errorContent, {
      maxWidth: 280,
      className: 'error-popup-container'
    }).openPopup();
  }

  // ============ AKCJE ============

  private viewServiceDetailsPage(serviceDetails: any): void {
    console.log('View details clicked for service:', serviceDetails);
    this.router.navigate(['/service', serviceDetails.id]);
  }

  private registerService(serviceDetails: any): void {
    console.log('Register service clicked with FULL details:', serviceDetails);
    
    this.router.navigate(['/register-service'], {
      queryParams: {
        serviceId: serviceDetails.id,
        serviceName: serviceDetails.name,
        street: serviceDetails.street || '',
        building: serviceDetails.building || '',
        flat: serviceDetails.flat || '',
        city: serviceDetails.city || '',
        phoneNumber: serviceDetails.phoneNumber || '',
        email: serviceDetails.email || ''
      }
    });
  }

  private orderTransport(serviceDetails: any): void {
    console.log('Order transport clicked for service:', serviceDetails);
    this.router.navigate(['/order-transport'], {
      queryParams: {
        serviceId: serviceDetails.id,
        serviceName: serviceDetails.name,
        serviceAddress: `${serviceDetails.street} ${serviceDetails.building}${serviceDetails.flat ? '/' + serviceDetails.flat : ''}, ${serviceDetails.city}`,
        transportCost: serviceDetails.transportCost
      }
    });
  }

  retryMapLoad(): void {
    this.mapError = false;
    this.loading = true;
    this.destroyMap();
    this.initializationPromise = null;
    
    setTimeout(() => {
      this.loadClusteredPins(12, undefined);
      this.loadServicesForSidebar(0);
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