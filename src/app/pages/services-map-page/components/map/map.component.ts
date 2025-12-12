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
import { MapService } from '../../services/map.service';
import { Router } from '@angular/router';

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
  @Output() popupReopenRequested = new EventEmitter<number>(); 
  @Output() viewServiceDetails = new EventEmitter<ServiceDetails>();
  @Output() registerService = new EventEmitter<ServiceDetails>();
  @Output() orderTransport = new EventEmitter<ServiceDetails>();

  // Internal state
  private map: any;
  private markers: Map<number, any> = new Map();
  private isMapInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Color cache from CSS variables
  private cssColors: { [key: string]: string } = {};
  
  isBrowser: boolean;
  loading = false;
  error = false;
  errorMessage = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    private mapService: MapService, 
    private router: Router
  ) {
     this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCSSColors();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.mapContainer && this.visible) {
      setTimeout(() => {
        this.initializeMapAsync();
      }, 500);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const pinsChange = changes['pins'];
    const selectedPinIdChange = changes['selectedPinId'];
    
    if (pinsChange && this.isMapInitialized) {
      // ZAWSZE aktualizuj piny gdy się zmienią
      if (!pinsChange.firstChange) {
        this.updateMapPins(this.pins);
      }
    }
    
    if (selectedPinIdChange && this.isMapInitialized) {
      setTimeout(() => {
        this.highlightSelectedPin(this.selectedPinId);
      }, 50); 
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

  // ============ CSS COLOR LOADING ============

  private loadCSSColors(): void {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Load all map-related colors from CSS variables
    this.cssColors = {
      'cluster-small': computedStyle.getPropertyValue('--map-cluster-small').trim(),
      'cluster-medium': computedStyle.getPropertyValue('--map-cluster-medium').trim(),
      'cluster-large': computedStyle.getPropertyValue('--map-cluster-large').trim(),
      'cluster-hover-small': computedStyle.getPropertyValue('--map-cluster-hover-small').trim(),
      'cluster-hover-medium': computedStyle.getPropertyValue('--map-cluster-hover-medium').trim(),
      'cluster-hover-large': computedStyle.getPropertyValue('--map-cluster-hover-large').trim(),
      'pin-verified': computedStyle.getPropertyValue('--map-pin-verified').trim(),
      'pin-unverified': computedStyle.getPropertyValue('--map-pin-unverified').trim(),
      'pin-hover-verified': computedStyle.getPropertyValue('--map-pin-hover-verified').trim(),
      'pin-hover-unverified': computedStyle.getPropertyValue('--map-pin-hover-unverified').trim()
    };
  }

  private getColor(key: string, fallback: string = '#2e7d32'): string {
    return this.cssColors[key] || fallback;
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
       this.updateMapPins(this.pins); 
      
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
      // ============ USUŃ WSZYSTKIE EVENT LISTENERY ============
      this.markers.forEach((marker) => {
        const markerElement = marker.getElement();
        if (markerElement && (marker as any)._hoverListeners) {
          const listeners = (marker as any)._hoverListeners;
          markerElement.removeEventListener('mouseenter', listeners.mouseenter);
          markerElement.removeEventListener('mouseleave', listeners.mouseleave);
          delete (marker as any)._hoverListeners;
        }
      });
      
      this.markers.clear();
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

    const currentlySelectedPinId = this.selectedPinId;
    if (this.map.closePopup) {
        this.map.closePopup(); 
    }

    // KLUCZOWE: Wyczyść WSZYSTKIE markery przed dodaniem nowych
    this.markers.forEach((marker, id) => {
      if (marker && this.map) {
        try {
          this.map.removeLayer(marker);
        } catch (e) {
          console.warn('Error removing marker:', id, e);
        }
      }
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
    
    if (currentlySelectedPinId !== null) {
      const pinToReopen = pins.find(p => p.id === currentlySelectedPinId);
      
      if (pinToReopen) {
        setTimeout(() => {
          this.popupReopenRequested.emit(currentlySelectedPinId);
        }, 50);
      }
    }
  }

// W addPinToMap() ZAMIEŃ sekcję event listenerów na:

private addPinToMap(pin: MapPin): void {
  const isCluster = pin.category === 'cluster';
  
  let markerIcon;
  let zIndexOffset = 0;
  
  if (isCluster) {
    const count = parseInt(pin.name.split(' ')[0]);
    markerIcon = this.createClusterIcon(count);
    zIndexOffset = count >= 50 ? 3000 : (count >= 10 ? 2000 : 1000);
  } else {
    markerIcon = this.createPinIcon(pin.verified);
    zIndexOffset = 500;
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

  // ============ NAPRAWIONY KOD - UŻYWAMY NAMED FUNCTIONS ============
  const markerElement = marker.getElement();
  if (markerElement) {
    if (isCluster) {
      markerElement.classList.add('cluster-marker');
    } else {
      markerElement.classList.add('pin-marker');
      if (!pin.verified) {
        markerElement.classList.add('unverified');
      }
    }
    
    // KLUCZOWE: Używamy named functions żeby móc je później usunąć
    const handleMouseEnter = () => {
      const svgElement = markerElement.querySelector('svg');
      if (svgElement) {
        if (isCluster) {
          const circle = svgElement.querySelector('circle');
          if (circle) {
            const currentFill = circle.getAttribute('fill') || '';
            circle.setAttribute('data-original-fill', currentFill);
            
            const count = parseInt(pin.name.split(' ')[0]);
            let hoverColorKey;
            if (count >= 50) {
              hoverColorKey = 'cluster-hover-large';
            } else if (count >= 10) {
              hoverColorKey = 'cluster-hover-medium';
            } else {
              hoverColorKey = 'cluster-hover-small';
            }
            
            circle.setAttribute('fill', this.getColor(hoverColorKey, '#4CAF50'));
          }
        } else {
          const path = svgElement.querySelector('path');
          if (path) {
            const currentFill = path.getAttribute('fill') || '';
            path.setAttribute('data-original-fill', currentFill);
            
            const hoverColorKey = pin.verified ? 'pin-hover-verified' : 'pin-hover-unverified';
            path.setAttribute('fill', this.getColor(hoverColorKey, '#4CAF50'));
          }
        }
      }
    };
    
    const handleMouseLeave = () => {
      if (this.selectedPinId !== pin.id) {
        const svgElement = markerElement.querySelector('svg');
        if (svgElement) {
          if (isCluster) {
            const circle = svgElement.querySelector('circle');
            if (circle) {
              const originalFill = circle.getAttribute('data-original-fill');
              if (originalFill) {
                circle.setAttribute('fill', originalFill);
              }
            }
          } else {
            const path = svgElement.querySelector('path');
            if (path) {
              const originalFill = path.getAttribute('data-original-fill');
              if (originalFill) {
                path.setAttribute('fill', originalFill);
              }
            }
          }
        }
      }
    };
    
    // Dodaj listenery
    markerElement.addEventListener('mouseenter', handleMouseEnter);
    markerElement.addEventListener('mouseleave', handleMouseLeave);
    
    // KLUCZOWE: Zapisz referencje do listenerów w markerze
    (marker as any)._hoverListeners = {
      mouseenter: handleMouseEnter,
      mouseleave: handleMouseLeave
    };
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
      this.serviceDetailsRequested.emit(pinId);
      
      if (markerElement) {
        this.highlightMarker(markerElement, pinId);
      }
    }
  });
}

  // ============ POPUP MANAGEMENT ============

  public showServicePopup(serviceDetails: ServiceDetails, marker?: any): void {
  // 1. Znajdź marker po ID serwisu
  if (!marker) {
    marker = this.markers.get(serviceDetails.id);
  }

  if (!marker) {
    console.error('Marker not found for service:', serviceDetails.id);
    return;
  }
  
  const popupContent = this.buildPopupContent(serviceDetails);
  
  if (!marker.getPopup()) {
      marker.bindPopup(popupContent, {
          maxWidth: 400,
          className: 'detailed-service-popup',
          closeButton: true
      });
  } else {
      marker.getPopup().setContent(popupContent);
  }
  
  marker.openPopup(); 

  
  setTimeout(() => {
    this.attachPopupEventListeners(serviceDetails);
  }, 100);

  this.highlightSelectedPin(serviceDetails.id);
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

    const logoUrl = serviceDetails.logoUrl || 'assets/images/cyclopick-logo.svg';
    
    let popupContent = `
      <div style="font-family: inherit; min-width: 300px; max-width: 380px;">
        <div style="background: linear-gradient(135deg, #1B5E20 0%, #2e7d32 100%); color: white; padding: 18px; margin: -12px -18px 18px -18px; border-radius: 12px 12px 0 0; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <h4 style="margin: 0; font-size: 1.2rem; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1); flex: 1;">${serviceDetails.name}</h4>
          <div style="background: white; padding: 6px 8px; border-radius: 6px; display: flex; align-items: center; justify-content: center; min-width: 50px; max-width: 80px; height: 50px;">
            <img 
              src="${logoUrl}" 
              alt="${serviceDetails.name} logo"
              id="popup-logo-${serviceDetails.id}"
              style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;"
              onerror="this.src='assets/images/cyclopick-logo.svg'; this.onerror=null;"
            />
          </div>
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

    if (serviceDetails.transportAvailable && serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
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
        <div style="margin: 18px 0; padding: 14px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #1B5E20;">
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

    const isVerified = Boolean(serviceDetails.registered);
  

    if (isVerified) {
      popupContent += `
        <button 
          id="view-details-btn-${serviceDetails.id}" 
          class="popup-action-btn primary"
          style="flex: 1; min-width: 120px; padding: 12px 18px; background: linear-gradient(135deg, #1B5E20 0%, #2e7d32 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(43, 130, 173, 0.3);"
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

    if (serviceDetails.transportAvailable && serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
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
  if (serviceDetails.registered) {
    const viewDetailsBtn = document.getElementById(`view-details-btn-${serviceDetails.id}`);
    if (viewDetailsBtn) {
      viewDetailsBtn.addEventListener('click', () => {
        console.log('View Details button clicked. Requesting suffix...');
        
        this.mapService.getServiceSuffix(serviceDetails.id).subscribe({
          next: (response) => {
            if (response && response.suffix) {
              const suffix = response.suffix;
              this.router.navigate([suffix]); 
            } else {
              console.error('Could not retrieve suffix for service:', serviceDetails.id);
              alert('Nie udało się pobrać linku do serwisu. Spróbuj ponownie.');
            }
          },
          error: (err) => {
            console.error('Error during suffix fetch:', err);
            alert('Wystąpił błąd podczas pobierania szczegółów serwisu.');
          }
        });
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

  if (serviceDetails.transportAvailable && serviceDetails.transportCost !== undefined && serviceDetails.transportCost !== null) {
    const transportBtn = document.getElementById(`order-transport-btn-${serviceDetails.id}`);
    if (transportBtn) {
      transportBtn.addEventListener('click', () => {
        this.orderTransport.emit(serviceDetails);
      });
    }
  }
}

  private createClusterIcon(count: number): any {
    let colorKey, size, fontSize;
    
    // Wszystkie klastry używają tego samego schematu kolorów (zielone odcienie)
    if (count >= 50) {
      colorKey = 'cluster-large';
      size = 60;
      fontSize = 18;
    } else if (count >= 10) {
      colorKey = 'cluster-medium';
      size = 55;
      fontSize = 17;
    } else {
      colorKey = 'cluster-small';
      size = 50;
      fontSize = 16;
    }
    
    const color = this.getColor(colorKey, '#2e7d32');
    
    const iconHtml = `
      <div style="width: ${size}px; height: ${size}px; position: relative; cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="display: block; transition: all 0.3s ease;">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="${color}" stroke="white" stroke-width="4" style="transition: fill 0.3s ease;"/>
          <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${fontSize}" font-weight="700" font-family="Arial">${count}</text>
        </svg>
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      className: 'custom-cluster-icon'
    });
  }

  private createPinIcon(verified: boolean = true): any {
    const pinSize = 40;
    // Kolor zależny od statusu weryfikacji - z CSS variables
    const colorKey = verified ? 'pin-verified' : 'pin-unverified';
    const pinColor = this.getColor(colorKey, '#2e7d32');
    
    const iconHtml = `
      <div style="width: ${pinSize}px; height: ${pinSize * 1.2}px; position: relative; cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="${pinSize}" height="${pinSize * 1.2}" viewBox="0 0 40 48" style="display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); transition: all 0.3s ease;">
          <defs>
            <filter id="glow-${verified ? 'verified' : 'unverified'}">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M20 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 33.134 15 33.134s15-24.923 15-33.134C35 6.656 28.284 0 20 0zm0 20c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" fill="${pinColor}" stroke="white" stroke-width="2" filter="url(#glow-${verified ? 'verified' : 'unverified'})" style="transition: fill 0.3s ease;"/>
          <circle cx="20" cy="14" r="4" fill="white"/>
        </svg>
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
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