// src/app/service-records/service-record.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ServiceRecord } from './service-record.model';
import { environment } from '../core/api-config';


@Injectable({
  providedIn: 'root'
})
export class ServiceRecordService {
  private apiUrl = `${environment.apiUrl}/service-records`;
  private http = inject(HttpClient);
  
  constructor() {}
  
  getBicycleServiceRecords(bicycleId: number): Observable<ServiceRecord[]> {
    return this.http.get<ServiceRecord[]>(`${this.apiUrl}/bicycle/${bicycleId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching service records for bicycle ${bicycleId}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  addServiceRecord(serviceRecord: Omit<ServiceRecord, 'id'>): Observable<any> {
    return this.http.post(this.apiUrl, serviceRecord)
      .pipe(
        catchError(error => {
          console.error('Error adding service record:', error);
          return throwError(() => error);
        })
      );
  }
}