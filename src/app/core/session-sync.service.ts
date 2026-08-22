import { Injectable } from '@angular/core';
import { environment } from '../environments/environments';

export interface SessionSyncPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class SessionSyncService {
  private readonly url = `${environment.apiUrl}${environment.endpoints.guestOrders.sessionSync}`;

  send(payload: SessionSyncPayload): void {
    if (!payload.firstName && !payload.lastName && !payload.email && !payload.phone) return;

    const body = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(this.url, blob);
      return;
    }

    if (typeof fetch !== 'undefined') {
      fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    }
  }
}
