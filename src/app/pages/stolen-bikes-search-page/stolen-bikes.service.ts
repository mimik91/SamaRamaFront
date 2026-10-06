import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { StolenBikeContactRequest, StolenLookupResponse } from '../../shared/models/stolen-bike.models';

@Injectable({
  providedIn: 'root'
})
export class StolenBikesService {
  private http = inject(HttpClient);
  private lookupUrl = `${environment.apiUrl}${environment.endpoints.bicycleStatus.stolenLookup}`;
  private contactBaseUrl = `${environment.apiUrl}${environment.endpoints.bicycleStatus.stolenContactBase}`;

  search(frameNumber: string, brand: string, model: string): Observable<StolenLookupResponse> {
    let params = new HttpParams();
    if (frameNumber.trim()) params = params.set('frameNumber', frameNumber.trim());
    if (brand.trim()) params = params.set('brand', brand.trim());
    if (model.trim()) params = params.set('model', model.trim());
    return this.http.get<StolenLookupResponse>(this.lookupUrl, { params });
  }

  contactOwner(bicycleId: number, request: StolenBikeContactRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.contactBaseUrl}/${bicycleId}/contact`, request);
  }
}
