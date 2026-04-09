import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../environments/environments';

export interface SessionSyncRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class SessionSyncService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}${environment.endpoints.guestOrders.sessionSync}`;

  send(data: SessionSyncRequest): void {
    const hasAnyData = data.firstName || data.lastName || data.email || data.phone;
    if (!hasAnyData) return;

    this.http.post(this.url, data).pipe(catchError(() => of(null))).subscribe();
  }
}
