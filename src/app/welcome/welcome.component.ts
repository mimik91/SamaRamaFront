import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MapService, Coordinate } from '../map.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>SamaRama - Serwisy rowerowe</h1>
      
      <div *ngIf="isBrowser; else serverFallback">
        <div id="map" class="map-container"></div>
        
        <div class="loading-message" *ngIf="loading">
          Ładowanie mapy...
        </div>
        
        <div class="error-message" *ngIf="error">
          {{ error }}
        </div>

        <div class="info-message" *ngIf="coordinates.length && !loading">
          Znaleziono {{ coordinates.length }} serwisów
        </div>
        <div class="info-message" *ngIf="coordinates.length === 0 && !loading && !error">
          Nie znaleziono żadnych serwisów
        </div>
      </div>
      
      <ng-template #serverFallback>
        <div class="server-message">
          Mapa zostanie załadowana po pełnym załadowaniu strony...
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    
    .map-container {
      height: 500px;
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .loading-message {
      text-align: center;
      margin-top: 20px;
      font-style: italic;
      color: #666;
    }
    
    .error-message {
      text-align: center;
      margin-top: 20px;
      color: #d9534f;
      padding: 10px;
      background-color: #f9f2f2;
      border-radius: 4px;
    }
    
    .info-message {
      text-align: center;
      margin-top: 20px;
      color: #5bc0de;
      padding: 10px;
      border-radius: 4px;
    }
    
    .server-message {
      text-align: center;
      margin-top: 20px;
      color: #333;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed #ccc;
    }
  `]
})
export class WelcomeComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  isBrowser: boolean;
  coordinates: Coordinate[] = [];
  private map: any;
  private subscriptions: Subscription[] = [];
  
  constructor(
    private mapService: MapService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    console.log('WelcomeComponent konstruktor');
    this.isBrowser = isPlatformBrowser(platformId);
  }
  
  ngOnInit(): void {
    console.log('WelcomeComponent ngOnInit, isBrowser:', this.isBrowser);
    if (!this.isBrowser) return;

    // Subskrybuj status załadowania Leaflet
    this.subscriptions.push(
      this.mapService.leafletLoaded$.subscribe(loaded => {
        console.log('Leaflet załadowany:', loaded);
        if (loaded) {
          this.initializeMap();
        }
      })
    );

    // Pobierz pinezki serwisów
    this.fetchServiceLocations();
  }
  
  ngOnDestroy(): void {
    // Wyczyść subskrypcje, aby zapobiec wyciekom pamięci
    this.subscriptions.forEach(sub => sub.unsubscribe());
    console.log('WelcomeComponent zniszczony, subskrypcje wyczyszczone');
  }
  
  private initializeMap(): void {
    try {
      console.log('Inicjalizacja mapy');
      // Utwórz mapę używając serwisu
      this.map = this.mapService.createMap('map');
      
      if (this.coordinates.length > 0) {
        console.log('Dodawanie istniejących współrzędnych do mapy:', this.coordinates);
        this.mapService.addServicePinsToMap(this.map, this.coordinates);
      } else {
        console.log('Brak współrzędnych do dodania na mapę');
      }
      
      this.loading = false;
    } catch (err) {
      console.error('Błąd podczas inicjalizacji mapy:', err);
      this.error = 'Wystąpił błąd podczas inicjalizacji mapy.';
      this.loading = false;
    }
  }
  
  private fetchServiceLocations(): void {
    console.log('Pobieranie lokalizacji serwisów');
    
    this.subscriptions.push(
      this.mapService.getServicePins().subscribe({
        next: (coordinates) => {
          console.log('Pobrane koordynaty:', coordinates);
          
          if (coordinates.length === 0) {
            console.warn('Nie znaleziono żadnych koordynatów serwisów');
          }
          
          // Zapisujemy koordynaty bezpośrednio, bez przekształcania
          this.coordinates = coordinates;
          
          if (this.map) {
            console.log('Mapa istnieje, dodawanie koordynatów');
            this.mapService.addServicePinsToMap(this.map, this.coordinates);
          } else {
            console.log('Mapa jeszcze nie istnieje, koordynaty zostaną dodane po inicjalizacji');
          }
          
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Błąd podczas pobierania lokalizacji serwisów:', err);
          
          if (err.status === 0) {
            this.error = 'Błąd połączenia z serwerem. Sprawdź czy backend jest uruchomiony.';
          } else if (err.status === 403) {
            this.error = 'Brak uprawnień do pobrania danych serwisów.';
          } else {
            this.error = `Nie udało się pobrać lokalizacji serwisów: ${err.message}`;
          }
          
          this.loading = false;
        }
      })
    );
  }
}