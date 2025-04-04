import { HttpClient } from '@angular/common/http';
import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

// Interface for the bike service from API
export interface BikeService {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  // Other properties from your backend model
  street?: string;
  building?: string;
  city?: string;
  description?: string;
}

// Interface for map coordinates
export interface Coordinate {
  serviceId?: number;
  latitude: number;
  longitude: number;
  name?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiUrl = 'http://localhost:8080/api/bike-services';
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  
  private leafletLoadedSubject = new BehaviorSubject<boolean>(false);
  leafletLoaded$ = this.leafletLoadedSubject.asObservable();
  
  constructor() {
    this.initLeaflet();
  }

  private initLeaflet(): void {
    // Check if Leaflet is already loaded
    if (typeof window !== 'undefined' && window.L) {
      this.leafletLoadedSubject.next(true);
      return;
    }

    // If not loaded and in browser environment
    if (typeof document !== 'undefined') {
      // Load Leaflet CSS if not already loaded
      if (!document.getElementById('leaflet-css')) {
        const leafletCss = document.createElement('link');
        leafletCss.id = 'leaflet-css';
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        leafletCss.crossOrigin = '';
        document.head.appendChild(leafletCss);
      }

      // Load Leaflet JS if not already loaded
      if (!document.getElementById('leaflet-script')) {
        const leafletScript = document.createElement('script');
        leafletScript.id = 'leaflet-script';
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        leafletScript.crossOrigin = '';
        
        leafletScript.onload = () => {
          // Use NgZone to ensure Angular detects the change
          this.zone.run(() => {
            this.leafletLoadedSubject.next(true);
          });
        };
        
        document.body.appendChild(leafletScript);
      }
    }
  }

  getServicePins(): Observable<BikeService[]> {
    // Fetches all bike services from the API
    return this.http.get<BikeService[]>(`${this.apiUrl}`);
  }
  
  createMap(elementId: string, center: [number, number] = [50.0647, 19.9450], zoom: number = 12): any {
    if (typeof window === 'undefined' || !window.L) {
      return null;
    }
    
    const map = window.L.map(elementId).setView(center, zoom);
    
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    return map;
  }
  
  addMarker(map: any, position: [number, number], popupText?: string, draggable: boolean = false): any {
    if (!map || typeof window === 'undefined' || !window.L) {
      return null;
    }
    
    const marker = window.L.marker(position, { draggable }).addTo(map);
    
    if (popupText) {
      marker.bindPopup(popupText);
    }
    
    return marker;
  }
  
  addServicePinsToMap(map: any, coordinates: Coordinate[]): void {
    if (!map || !coordinates || !coordinates.length) {
      return;
    }
    
    coordinates.forEach(coord => {
      const popupText = coord.name ? `Serwis: ${coord.name}` : 'Serwis rowerowy';
      this.addMarker(map, [coord.latitude, coord.longitude], popupText);
    });
  }
}