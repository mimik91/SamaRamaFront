import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiUrl = 'http://localhost:8080/api/bike-services';
  private http = inject(HttpClient);

  getServicePins(): Observable<Coordinate[]> {
    return this.http.get<Coordinate[]>(`${this.apiUrl}/pins`);
  }
}