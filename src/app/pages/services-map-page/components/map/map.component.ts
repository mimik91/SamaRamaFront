// src/app/pages/services-map-page/components/map/map.component.ts

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MapPin, ServiceDetails, MapViewState, MapBounds } from '../../services/map.models';

declare var L: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  // Inputs
  @Input() pins: MapPin[] = [];
  @Input() selectedPinId: number | null = null;
  @Input() initialView: MapViewState = {
    center: { lat: 50.0647, lng: 19.9450 },
    zoom: 12
  };
  @Input() visible = false;

  // Outputs
  @Output() mapReady = new EventEmitter<void>();
  @Output() mapMoved = new EventEmitter<MapViewState>();
  @Output() pinClicked = new EventEmitter<MapPin>();
  @Output() clusterClicked = new EventEmitter<{ lat: number; lng: number; zoom: number }>();
  @Output() mapError = new EventEmitter<string>();
  @Output() serviceDetailsRequested = new EventEmitter<number>();
  @Output() viewServiceDetails = new EventEmitter<ServiceDetails>();
  @Output() registerService = new EventEmitter<ServiceDetails>();
  @Output() orderTransport = new EventEmitter<ServiceDetails>();

  // Internal state
  private map: any;
  private markers: Map<number, any> = new Map();
  private isMapInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  isBrowser: boolean;
  loading = false;
  error = false;
  errorMessage = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.mapContainer && this.visible) {
      setTimeout(() => {
        this.initializeMapAsync();
      }, 500);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pins'] && !changes['pins'].firstChange && this.isMapInitialized) {
      this.updateMapPins(this.pins);
    }

    if (changes['selectedPinId'] && !changes['selectedPinId'].firstChange && this.isMapInitialized) {
      this.highlightSelectedPin(this.selectedPinId);
    }

    if (changes['visible'] && changes['visible'].currentValue && !this.isMapInitialized) {
      setTimeout(() => {
        this.initializeMapAsync();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  // ============ MAP INITIALIZATION ============

  private async initializeMapAsync(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performMapInitialization();
    return this.initializationPromise;
  }

  private async performMapInitialization(): Promise<void> {
    try {
      this.loading = true;
      
      if (!this.mapContainer?.nativeElement) {
        console.log('Map container not ready');
        return;
      }

      await this.loadLeafletIfNeeded();
      await this.createMap();
      
      this.isMapInitialized = true;
      this.loading = false;
      this.mapReady.emit();
      
    } catch (err) {
      console.error('Failed to initialize map:', err);
      this.error = true;
      this.errorMessage = 'Nie udało się załadować mapy';
      this.loading = false;
      this.mapError.emit(this.errorMessage);
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

  private async createMap(): Promise<void> {
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
      center: [this.initialView.center.lat, this.initialView.center.lng],
      zoom: this.initialView.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      preferCanvas: false,
      attributionControl: true,
      wheelPxPerZoomLevel: 120
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('moveend', () => {
      this.onMapMoveEnd();
    });

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
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

  // ============ MAP INTERACTION ============

  private onMapMoveEnd(): void {
    if (!this.map || !this.isMapInitialized) return;

    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    const viewState: MapViewState = {
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom,
      bounds: {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast()
      }
    };

    this.mapMoved.emit(viewState);
  }

  // ============ PINS MANAGEMENT ============

  private updateMapPins(pins: MapPin[]): void {
    if (!this.map || !this.isMapInitialized) return;

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

    validPins.forEach(pin => {
      try {
        this.addPinToMap(pin);
      } catch (error) {
        console.error(`Error adding marker for pin ${pin.id}:`, error);
      }
    });
  }

  private addPinToMap(pin: MapPin): void {
    const isCluster = pin.category === 'cluster';
    
    let markerIcon;
    let zIndexOffset = 0;
    let markerClassName = '';
    
    if (isCluster) {
      const count = parseInt(pin.name.split(' ')[0]);
      markerIcon = this.createClusterIcon(count);
      zIndexOffset = count >= 50 ? 3000 : (count >= 10 ? 2000 : 1000);
      markerClassName = 'cluster-marker';
    } else {
      markerIcon = this.createPinIcon();
      zIndexOffset = 500;
      markerClassName = 'pin-marker';
    }

    const marker = L.marker([pin.latitude, pin.longitude], { 
      icon: markerIcon,
      zIndexOffset: zIndexOffset
    }).addTo(this.map);

    // Add tooltip on hover (only for service pins, not clusters)
    if (!isCluster) {
      marker.bindTooltip(pin.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -35],
        opacity: 0.95,
        className: 'custom-tooltip'
      });
    }

    // Add custom CSS class to marker element
    const markerElement = marker.getElement();
    if (markerElement) {
      markerElement.classList.add(markerClassName);
      
      // Add hover brightness effect
      markerElement.addEventListener('mouseenter', () => {
        if (!isCluster) {
          markerElement.style.transition = 'all 0.25s ease';
        }
      });
      
      markerElement.addEventListener('mouseleave', () => {
        if (!isCluster && this.selectedPinId !== pin.id) {
          markerElement.classList.remove('selected-pin');
        }
      });
    }

    const pinId = isCluster ? pin.id : parseInt(pin.id.toString());
    this.markers.set(pinId, marker);

    marker.on('click', () => {
      if (isCluster) {
        this.clusterClicked.emit({
          lat: pin.latitude,
          lng: pin.longitude,
          zoom: this.map.getZoom() + 2
        });
      } else {
        this.pinClicked.emit(pin);
        // Request service details from parent
        this.serviceDetailsRequested.emit(pinId);
        
        // Highlight selected pin
        if (markerElement) {
          this.highlightMarker(markerElement, pinId);
        }
      }
    });
  }

  // ============ POPUP MANAGEMENT ============

  public showServicePopup(serviceDetails: ServiceDetails, marker?: any): void {
    // Find marker by service ID if not provided
    if (!marker) {
      marker = this.markers.get(serviceDetails.id);
    }

    if (!marker) {
      console.error('Marker not found for service:', serviceDetails.id);
      return;
    }

    const popupContent = this.buildPopupContent(serviceDetails);
    
    marker.bindPopup(popupContent, {
      maxWidth: 400,
      className: 'detailed-service-popup',
      closeButton: true
    }).openPopup();

    // Attach event listeners after popup is rendered
    setTimeout(() => {
      this.attachPopupEventListeners(serviceDetails);
    }, 100);
  }

  private buildPopupContent(serviceDetails: ServiceDetails): string {
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
          class="popup-action-btn primary"
          style="flex: 1; min-width: 120px; padding: 12px 18px; background: linear-gradient(135deg, #2B82AD 0%, #3498db 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(43, 130, 173, 0.3);"
        >
          Zobacz szczegóły
        </button>
      `;
    } else {
      popupContent += `
        <button 
          id="register-service-btn-${serviceDetails.id}" 
          class="popup-action-btn warning"
          style="flex: 1; min-width: 120px; padding: 12px 18px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);"
        >
          Zarejestruj ten serwis
        </button>
      `;
    }

    if (serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
      popupContent += `
        <button 
          id="order-transport-btn-${serviceDetails.id}" 
          class="popup-action-btn success"
          style="flex: 1; min-width: 120px; padding: 12px 18px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);"
        >
          Zamów transport
        </button>
      `;
    }

    popupContent += `</div></div>`;

    return popupContent;
  }

  private attachPopupEventListeners(serviceDetails: ServiceDetails): void {
    if (serviceDetails.verified) {
      const viewDetailsBtn = document.getElementById(`view-details-btn-${serviceDetails.id}`);
      if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
          this.viewServiceDetails.emit(serviceDetails);
        });
      }
    } else {
      const registerBtn = document.getElementById(`register-service-btn-${serviceDetails.id}`);
      if (registerBtn) {
        registerBtn.addEventListener('click', () => {
          this.registerService.emit(serviceDetails);
        });
      }
    }

    if (serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
      const transportBtn = document.getElementById(`order-transport-btn-${serviceDetails.id}`);
      if (transportBtn) {
        transportBtn.addEventListener('click', () => {
          this.orderTransport.emit(serviceDetails);
        });
      }
    }
  }

  private createClusterIcon(count: number): any {
    let color, size, fontSize;
    if (count >= 50) {
      color = '%23dc2626';
      size = 60;
      fontSize = 18;
    } else if (count >= 10) {
      color = '%23f59e0b';
      size = 55;
      fontSize = 17;
    } else {
      color = '%232B82AD';
      size = 50;
      fontSize = 16;
    }
    
    const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/2 - 4}' fill='${color}' stroke='white' stroke-width='4'/%3E%3Ctext x='${size/2}' y='${size/2}' text-anchor='middle' dominant-baseline='central' fill='white' font-size='${fontSize}' font-weight='700' font-family='Arial'%3E${count}%3C/text%3E%3C/svg%3E`;
    
    return L.icon({
      iconUrl: svg,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }

  private createPinIcon(): any {
    const pinSize = 40;
    // SVG with glow effect for better hover visibility
    const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${pinSize}' height='${pinSize * 1.2}' viewBox='0 0 40 48'%3E%3Cdefs%3E%3Cfilter id='glow'%3E%3CfeGaussianBlur stdDeviation='2' result='coloredBlur'/%3E%3CfeMerge%3E%3CfeMergeNode in='coloredBlur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M20 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 33.134 15 33.134s15-24.923 15-33.134C35 6.656 28.284 0 20 0zm0 20c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z' fill='%232B82AD' stroke='white' stroke-width='2' filter='url(%23glow)'/%3E%3Ccircle cx='20' cy='14' r='4' fill='white'/%3E%3C/svg%3E`;
    
    return L.icon({
      iconUrl: svg,
      iconSize: [pinSize, pinSize * 1.2],
      iconAnchor: [pinSize/2, pinSize * 1.2],
      popupAnchor: [0, -pinSize * 1.2],
      className: 'custom-pin-icon'
    });
  }

  private highlightSelectedPin(pinId: number | null): void {
    // Remove highlight from all markers
    this.markers.forEach((marker) => {
      const element = marker.getElement();
      if (element) {
        element.classList.remove('selected-pin');
      }
    });

    // Add highlight to selected marker
    if (pinId !== null) {
      const selectedMarker = this.markers.get(pinId);
      if (selectedMarker) {
        const element = selectedMarker.getElement();
        if (element) {
          element.classList.add('selected-pin');
        }
      }
    }
  }

  private highlightMarker(markerElement: HTMLElement, pinId: number): void {
    // Remove highlight from all other markers
    this.markers.forEach((marker, id) => {
      if (id !== pinId) {
        const element = marker.getElement();
        if (element) {
          element.classList.remove('selected-pin');
        }
      }
    });

    // Add highlight to clicked marker
    markerElement.classList.add('selected-pin');
  }

  // ============ PUBLIC METHODS ============

  public centerOn(lat: number, lng: number, zoom?: number): void {
    if (this.map && this.isMapInitialized) {
      if (zoom !== undefined) {
        this.map.setView([lat, lng], zoom);
      } else {
        this.map.panTo([lat, lng]);
      }
    }
  }

  public fitBounds(sw: { lat: number; lng: number }, ne: { lat: number; lng: number }): void {
    if (this.map && this.isMapInitialized) {
      const southWest = L.latLng(sw.lat, sw.lng);
      const northEast = L.latLng(ne.lat, ne.lng);
      const bounds = L.latLngBounds(southWest, northEast);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  public invalidateSize(): void {
    if (this.map && this.isMapInitialized) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    }
  }

  public retry(): void {
    this.error = false;
    this.errorMessage = '';
    this.destroyMap();
    this.initializationPromise = null;
    this.initializeMapAsync();
  }

  public displayMap(): void {
    if (!this.visible && !this.loading && !this.error) {
      this.loading = true;
      this.initializeMapAsync();
    }
  }
}