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
  
  constructor() {}

  // Pobierz aktualne dane formularza
  getBikesData(): Observable<BikeFormData[]> {
    return this.bikesDataSubject.asObservable();
  }

  // Pobierz aktualne dane formularza jako wartość
  getBikesDataValue(): BikeFormData[] {
    return this.bikesDataSubject.getValue();
  }

  // Ustaw nowe dane formularza
  setBikesData(data: BikeFormData[]): void {
    this.bikesDataSubject.next(data);
  }

  // Dodaj dane o jednym rowerze
  addBike(bikeData: BikeFormData): void {
    const currentData = this.bikesDataSubject.getValue();
    this.bikesDataSubject.next([...currentData, bikeData]);
  }

  // Usuń dane o rowerze
  removeBike(index: number): void {
    const currentData = this.bikesDataSubject.getValue();
    if (index >= 0 && index < currentData.length) {
      const updatedData = [...currentData];
      updatedData.splice(index, 1);
      this.bikesDataSubject.next(updatedData);
    }
  }

  // Wyczyść wszystkie dane
  clearData(): void {
    this.bikesDataSubject.next([]);
  }
}