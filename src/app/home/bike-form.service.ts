import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BikeFormData {
  brand: string;
  model?: string;
  additionalInfo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BikeFormService {
  private bikesDataSubject = new BehaviorSubject<BikeFormData[]>([]);
  private isBrowser: boolean;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Sprawdź, czy jesteśmy w środowisku przeglądarki zanim użyjesz localStorage
    if (this.isBrowser) {
      try {
        const savedData = localStorage.getItem('bikesData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          this.bikesDataSubject.next(parsedData);
        }
      } catch (e) {
        console.error('Error parsing saved bikes data:', e);
      }
    }
  }

  getBikesDataValue(): BikeFormData[] {
    return this.bikesDataSubject.getValue();
  }

  setBikesData(data: BikeFormData[]): void {
    this.bikesDataSubject.next(data);
    
    // Zapisuj do localStorage tylko w środowisku przeglądarki
    if (this.isBrowser) {
      try {
        localStorage.setItem('bikesData', JSON.stringify(data));
      } catch (e) {
        console.error('Error saving bikes data to localStorage:', e);
      }
    }
  }

  clearData(): void {
    this.bikesDataSubject.next([]);
    
    // Czyść localStorage tylko w środowisku przeglądarki
    if (this.isBrowser) {
      try {
        localStorage.removeItem('bikesData');
      } catch (e) {
        console.error('Error removing bikes data from localStorage:', e);
      }
    }
  }
}