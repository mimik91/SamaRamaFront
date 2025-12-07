import { HttpClient } from '@angular/common/http';
import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, catchError, throwError, tap } from 'rxjs';
import { environment } from './app/core/api-config';

// Interface dla koordynatów serwisu
export interface Coordinate {
  serviceId: number;
  name: string;
  latitude: number;
  longitude: number;
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
  private apiUrl = `${environment.apiUrl}`;
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  
  private leafletLoadedSubject = new BehaviorSubject<boolean>(false);
  leafletLoaded$ = this.leafletLoadedSubject.asObservable();
  
  constructor() {
    this.initLeaflet();
  }

  private initLeaflet(): void {
    // Sprawdź, czy Leaflet jest już załadowany
    if (typeof window !== 'undefined' && window.L) {
      this.leafletLoadedSubject.next(true);
      return;
    }

    // Jeśli nie załadowany i w środowisku przeglądarki
    if (typeof document !== 'undefined') {
      // Załaduj CSS Leaflet jeśli jeszcze nie załadowano
      if (!document.getElementById('leaflet-css')) {
        const leafletCss = document.createElement('link');
        leafletCss.id = 'leaflet-css';
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        leafletCss.crossOrigin = '';
        document.head.appendChild(leafletCss);
      }

      // Załaduj JS Leaflet jeśli jeszcze nie załadowano
      if (!document.getElementById('leaflet-script')) {
        const leafletScript = document.createElement('script');
        leafletScript.id = 'leaflet-script';
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        leafletScript.crossOrigin = '';
        
        leafletScript.onload = () => {
          // Użyj NgZone aby Angular wykrył zmianę
          this.zone.run(() => {
            this.leafletLoadedSubject.next(true);
            console.log('Leaflet załadowany pomyślnie');
          });
        };
        
        document.body.appendChild(leafletScript);
      }
    }
  }

  // Nowa metoda korzystająca z dedykowanego endpointu
  getServicePins(): Observable<Coordinate[]> {
    console.log('Pobieranie koordynatów serwisów z:', `${this.apiUrl}/map/service-pins`);
    return this.http.get<Coordinate[]>(`${this.apiUrl}/map/service-pins`)
      .pipe(
        tap(coordinates => {
          console.log('Pobrane koordynaty serwisów:', coordinates);
        }),
        catchError(error => {
          console.error('Błąd podczas pobierania koordynatów serwisów:', error);
          return throwError(() => error);
        })
      );
  }
  
  createMap(elementId: string, center: [number, number] = [50.0647, 19.9450], zoom: number = 12): any {
    if (typeof window === 'undefined' || !window.L) {
      console.error('Leaflet nie jest załadowany');
      return null;
    }
    
    console.log(`Tworzenie mapy w elemencie: ${elementId} z centrum: [${center}], zoom: ${zoom}`);
    const map = window.L.map(elementId).setView(center, zoom);
    
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    return map;
  }
  
  addMarker(map: any, position: [number, number], popupText?: string, draggable: boolean = false): any {
    if (!map || typeof window === 'undefined' || !window.L) {
      console.error('Nie można dodać znacznika: mapa lub Leaflet nie są dostępne');
      return null;
    }
    
    console.log(`Dodawanie znacznika na pozycji: [${position}], popupText: ${popupText}`);
    const marker = window.L.marker(position, { draggable }).addTo(map);
    
    if (popupText) {
      marker.bindPopup(popupText);
    }
    
    return marker;
  }
  
  addServicePinsToMap(map: any, coordinates: Coordinate[]): void {
    if (!map || !coordinates || !coordinates.length) {
      console.error('Nie można dodać znaczników: mapa lub współrzędne nie są dostępne', { map, coordinates });
      return;
    }
    
    console.log(`Dodawanie ${coordinates.length} znaczników serwisów na mapę`);
    coordinates.forEach(coord => {
      if (coord.latitude && coord.longitude) {
        const popupText = coord.name ? `Serwis: ${coord.name}` : 'Serwis rowerowy';
        this.addMarker(map, [coord.latitude, coord.longitude], popupText);
        console.log(`Dodano znacznik dla serwisu ID=${coord.serviceId}: [${coord.latitude}, ${coord.longitude}]`);
      } else {
        console.warn(`Brak poprawnych współrzędnych dla serwisu:`, coord);
      }
    });
  }
}