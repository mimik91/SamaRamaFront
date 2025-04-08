import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Bicycle, BicycleForm } from './bicycle.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BicycleService {
  private apiUrl = 'http://localhost:8080/api/bicycles';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  
  constructor() {}
  
  getUserBicycles(): Observable<Bicycle[]> {
    console.log('Fetching bicycles with auth token:', this.authService.getToken()); // Add this for debugging
    return this.http.get<Bicycle[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error fetching bicycles:', error);
          return throwError(() => error);
        })
      );
  }
  
  getBicycle(id: number): Observable<Bicycle> {
    return this.http.get<Bicycle>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching bicycle with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  addBicycle(bicycleData: Omit<Bicycle, 'id'>): Observable<any> {
    // Upewniamy się, że frameNumber jest null, a nie pustym stringiem
    const payload = {
      ...bicycleData, 
      frameNumber: bicycleData.frameNumber || null
    };
    
    console.log('Sending bicycle data to API:', payload);
    
    return this.http.post(this.apiUrl, payload)
      .pipe(
        catchError(error => {
          console.error('Error adding bicycle:', error);
          return throwError(() => error);
        })
      );
  }
  
  uploadBicyclePhoto(bicycleId: number, photoFile: File): Observable<any> {
    if (!photoFile) {
      return throwError(() => new Error('No file selected'));
    }
    
    // Sprawdź typ pliku
    if (!photoFile.type.match('image.*')) {
      return throwError(() => new Error('Only image files are allowed'));
    }
    
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    // Używamy odpowiednich opcji, nie ustawiamy ręcznie Content-Type,
    // ponieważ FormData automatycznie ustawia poprawny multipart/form-data
    return this.http.post(`${this.apiUrl}/${bicycleId}/photo`, formData)
      .pipe(
        map(response => {
          console.log('Photo upload success:', response);
          return response;
        }),
        catchError(error => {
          console.error('Error uploading bicycle photo:', error);
          return throwError(() => error);
        })
      );
  }
  
  getBicyclePhotoUrl(bicycleId: number): string {
    return `${this.apiUrl}/${bicycleId}/photo`;
  }
  
  deleteBicycle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting bicycle:', error);
          return throwError(() => error);
        })
      );
  }
  
  updateBicycle(id: number, bicycleData: Omit<Bicycle, 'id'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, bicycleData)
      .pipe(
        catchError(error => {
          console.error(`Error updating bicycle with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
}