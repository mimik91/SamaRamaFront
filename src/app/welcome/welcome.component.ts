import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  private coordinates: Coordinate[] = [];
  private map: any;
  private subscriptions: Subscription[] = [];
  
  constructor(
    private mapService: MapService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  
  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Subscribe to Leaflet loaded status
    this.subscriptions.push(
      this.mapService.leafletLoaded$.subscribe(loaded => {
        if (loaded) {
          this.initializeMap();
        }
      })
    );

    // Get service pins
    this.fetchServiceLocations();
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private initializeMap(): void {
    try {
      // Create the map using our service
      this.map = this.mapService.createMap('map');
      
      if (this.coordinates.length > 0) {
        this.mapService.addServicePinsToMap(this.map, this.coordinates);
      }
      
      this.loading = false;
    } catch (err) {
      console.error('Error initializing map:', err);
      this.error = 'Wystąpił błąd podczas inicjalizacji mapy.';
      this.loading = false;
    }
  }
  
  private fetchServiceLocations(): void {
    this.subscriptions.push(
      this.mapService.getServicePins().subscribe({
        next: (services) => {
          // Transform BikeService data to Coordinate format for map display
          this.coordinates = services.map(service => ({
            serviceId: service.id,
            latitude: service.latitude,
            longitude: service.longitude,
            name: service.name
          }));
          
          if (this.map) {
            this.mapService.addServicePinsToMap(this.map, this.coordinates);
          }
        },
        error: (err) => {
          console.error('Error fetching service locations:', err);
          this.error = 'Nie udało się pobrać lokalizacji serwisów.';
          this.loading = false;
        }
      })
    );
  }
}