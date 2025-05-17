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
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    console.log('BikeFormService constructor called, isBrowser:', isPlatformBrowser(this.platformId));
    // Sprawdź, czy jesteśmy w środowisku przeglądarki
    if (isPlatformBrowser(this.platformId)) {
      if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
        try {
          const savedData = window.localStorage.getItem('bikesData');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            this.bikesDataSubject.next(parsedData);
          }
        } catch (e) {
          console.error('Error parsing saved bikes data:', e);
        }
      }
    }
  }

  getBikesDataValue(): BikeFormData[] {
    return this.bikesDataSubject.getValue();
  }

  setBikesData(data: BikeFormData[]): void {
    console.log('setBikesData called, isBrowser:', isPlatformBrowser(this.platformId));

    this.bikesDataSubject.next(data);
    
    // Zapisuj do localStorage tylko w środowisku przeglądarki
    if (isPlatformBrowser(this.platformId)) {
      if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('bikesData', JSON.stringify(data));
        } catch (e) {
          console.error('Error saving bikes data to localStorage:', e);
        }
      }
    }
  }

  clearData(): void {
    console.log('clearData called, isBrowser:', isPlatformBrowser(this.platformId));

    this.bikesDataSubject.next([]);
    
    // Czyść localStorage tylko w środowisku przeglądarki
    if (isPlatformBrowser(this.platformId)) {
      if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('bikesData');
        } catch (e) {
          console.error('Error removing bikes data from localStorage:', e);
        }
      }
    }
  }
}