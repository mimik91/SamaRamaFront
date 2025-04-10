
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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
  
  addBicycle(bicycleData: Omit<Bicycle, 'id' | 'hasPhoto'>): Observable<any> {
    // Upewniamy się, że frameNumber jest null, a nie pustym stringiem
    const payload = {
      ...bicycleData, 
      frameNumber: bicycleData.frameNumber || null
    };
    
    console.log('Sending bicycle data to API:', payload);
    
    return this.http.post(this.apiUrl, payload)
      .pipe(
        map((response: any) => {
          console.log('Response from API:', response);
          // Sprawdź, które pole zawiera ID roweru
          if (response.bicycleId) {
            return { bicycleId: response.bicycleId };
          } else if (response.bikeId) {
            return { bikeId: response.bikeId };
          } else {
            console.warn('Unexpected response format:', response);
            // Spróbuj odgadnąć ID
            const id = response.id || response.bicycleId || response.bikeId;
            return { bikeId: id };
          }
        }),
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
    
    console.log(`Uploading photo for bicycle ID: ${bicycleId}`);
    
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
  
  deleteBicyclePhoto(bicycleId: number, isComplete: boolean = true): Observable<any> {
    // Add query parameter for isComplete
    const params = new HttpParams().set('isComplete', isComplete.toString());
    
    return this.http.delete(`${this.apiUrl}/${bicycleId}/photo`, { params })
      .pipe(
        catchError(error => {
          console.error('Error deleting bicycle photo:', error);
          return throwError(() => error);
        })
      );
  }
  
  deleteBicycle(id: number, isComplete: boolean = true): Observable<any> {
    // Add query parameter for isComplete
    const params = new HttpParams().set('isComplete', isComplete.toString());
    
    return this.http.delete(`${this.apiUrl}/${id}`, { params })
      .pipe(
        catchError(error => {
          console.error('Error deleting bicycle:', error);
          return throwError(() => error);
        })
      );
  }
  
  updateBicycle(id: number, bicycleData: Omit<Bicycle, 'id' | 'hasPhoto'>, isComplete: boolean = true): Observable<any> {
    console.log(`Updating bicycle ID ${id} with data:`, bicycleData);
    console.log(`isComplete parameter: ${isComplete}`);
    
    // Dodaj parametr isComplete do zapytania
    const params = new HttpParams().set('isComplete', isComplete.toString());
    
    return this.http.put(`${this.apiUrl}/${id}`, bicycleData, { params })
      .pipe(
        map(response => {
          console.log('Bicycle update response:', response);
          return response;
        }),
        catchError(error => {
          console.error(`Error updating bicycle with id ${id}:`, error);
          console.error('Request data was:', bicycleData);
          console.error('Request params were:', { isComplete });
          
          if (error.error && error.error.message) {
            console.error('Error message from server:', error.error.message);
          }
          
          return throwError(() => error);
        })
      );
  }
}