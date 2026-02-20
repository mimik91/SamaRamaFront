
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Bicycle, BicycleForm } from './bicycle.model';
import { environment } from '../environments/environments';

export interface BicycleImageUploadRequest {
  type: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  weight: number;
  caption?: string;
  displayOrder?: number;
}

export interface BicycleImageUploadResponse {
  imageId: string;
  uploadUrl: string | null;
  path: string;
}

export interface BicycleImage {
  imageId: number;
  url: string;
  width?: number;
  height?: number;
}

export interface GroupedImagesResponse {
  images: {
    MAIN_PHOTO?: BicycleImage[];
    GALLERY?: BicycleImage[];
    RECEIPT?: BicycleImage[];
  };
  limits?: {
    MAIN_PHOTO?: number;
    GALLERY?: number;
    RECEIPT?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BicycleService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bicycles}`;
  private imagesUrl = `${environment.apiUrl}/bicycles-images`;
  private http = inject(HttpClient);

  private readonly MAX_RETRIES = 3;
  private readonly UPLOAD_TIMEOUT = 60000;

  
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
  
  addBicycle(bicycleData: Omit<Bicycle, 'id' | 'mainPhotoUrl'>): Observable<any> {
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
  
  /**
   * Step 1: Request presigned upload URL from backend
   */
  generateImageUploadUrl(bicycleId: number, request: BicycleImageUploadRequest): Observable<BicycleImageUploadResponse> {
    return this.http.post<BicycleImageUploadResponse>(
      `${this.imagesUrl}/${bicycleId}`,
      request
    ).pipe(
      catchError(error => {
        console.error('Error generating upload URL:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Step 2: Upload file directly to R2 via presigned URL with retry
   */
  async uploadToR2(uploadUrl: string, file: File, retryCount = 0): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.UPLOAD_TIMEOUT);

      const result = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Cache-Control': 'public, max-age=31536000, immutable'
        },
        body: file,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!result.ok) {
        const errorText = await result.text().catch(() => 'Unknown error');
        throw new Error(`Upload failed with status ${result.status}: ${errorText}`);
      }

      console.log('[BicycleService] R2 upload successful');
    } catch (error) {
      console.error(`[BicycleService] Upload attempt ${retryCount + 1} failed:`, error);

      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.uploadToR2(uploadUrl, file, retryCount + 1);
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload przekroczył limit czasu (60s).');
      }
      throw error;
    }
  }
  
  getAllBicycleImages(bicycleId: number): Observable<GroupedImagesResponse> {
    return this.http.get<GroupedImagesResponse>(`${this.imagesUrl}/${bicycleId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching bicycle images:', error);
          return throwError(() => error);
        })
      );
  }

  getBicyclePhotoUrl(bicycleId: number): string {
    return `${this.imagesUrl}/${bicycleId}`;
  }
  
  deleteBicyclePhoto(bicycleId: number, isComplete: boolean = true): Observable<any> {
    // Add query parameter for isComplete
    const params = new HttpParams().set('isComplete', isComplete.toString());
    
    return this.http.delete(`${this.imagesUrl}/${bicycleId}`, { params })
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
  
  updateBicycle(id: number, bicycleData: Omit<Bicycle, 'id' | 'mainPhotoUrl'>, isComplete: boolean = true): Observable<any> {
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