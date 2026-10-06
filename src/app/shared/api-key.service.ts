import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { ApiKeyGeneratedResponse, ApiKeyRegistrantRequest, ApiKeyStatus } from './models/api-key.models';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  registerExternal(request: ApiKeyRegistrantRequest): Observable<ApiKeyGeneratedResponse> {
    return this.http.post<ApiKeyGeneratedResponse>(`${this.apiUrl}/api-keys/register`, request);
  }

  getClientKeyStatus(): Observable<ApiKeyStatus> {
    return this.http.get<ApiKeyStatus>(`${this.apiUrl}/account/api-key`);
  }

  generateClientKey(): Observable<ApiKeyGeneratedResponse> {
    return this.http.post<ApiKeyGeneratedResponse>(`${this.apiUrl}/account/api-key`, {});
  }
}
