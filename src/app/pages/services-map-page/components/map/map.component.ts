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
    
    if (isCluster) {
      const count = parseInt(pin.name.split(' ')[0]);
      markerIcon = this.createClusterIcon(count);
      zIndexOffset = count >= 50 ? 3000 : (count >= 10 ? 2000 : 1000);
    } else {
      markerIcon = this.createPinIcon();
      zIndexOffset = 500;
    }

    const marker = L.marker([pin.latitude, pin.longitude], { 
      icon: markerIcon,
      zIndexOffset: zIndexOffset
    }).addTo(this.map);

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
      }
    });
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
    const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${pinSize}' height='${pinSize * 1.2}' viewBox='0 0 40 48'%3E%3Cpath d='M20 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 33.134 15 33.134s15-24.923 15-33.134C35 6.656 28.284 0 20 0zm0 20c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z' fill='%232B82AD' stroke='white' stroke-width='2'/%3E%3Ccircle cx='20' cy='14' r='4' fill='white'/%3E%3C/svg%3E`;
    
    return L.icon({
      iconUrl: svg,
      iconSize: [pinSize, pinSize * 1.2],
      iconAnchor: [pinSize/2, pinSize * 1.2],
      popupAnchor: [0, -pinSize * 1.2]
    });
  }

  private highlightSelectedPin(pinId: number | null): void {
    // Update marker styles based on selection
    this.markers.forEach((marker, id) => {
      const icon = marker.getIcon();
      // Visual feedback could be added here
    });
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