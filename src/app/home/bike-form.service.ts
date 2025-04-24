import { Injectable } from '@angular/core';
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
    
    constructor() {
      // Sprawdź, czy jesteśmy w środowisku przeglądarki
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedData = localStorage.getItem('bikesData');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            this.bikesDataSubject.next(parsedData);
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
      this.bikesDataSubject.next(data);
      
      // Zapisuj do localStorage tylko w środowisku przeglądarki
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('bikesData', JSON.stringify(data));
      }
    }
  
    clearData(): void {
      this.bikesDataSubject.next([]);
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('bikesData');
      }
    }
  }