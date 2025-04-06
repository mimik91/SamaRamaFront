import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  constructor() {}

  success(message: string, duration: number = 3000): void {
    this.notify({ message, type: 'success', duration });
    console.log('SUCCESS:', message);
  }

  info(message: string, duration: number = 3000): void {
    this.notify({ message, type: 'info', duration });
    console.log('INFO:', message);
  }

  warning(message: string, duration: number = 5000): void {
    this.notify({ message, type: 'warning', duration });
    console.warn('WARNING:', message);
  }

  error(message: string, duration: number = 5000): void {
    this.notify({ message, type: 'error', duration });
    console.error('ERROR:', message);
  }

  private notify(notification: Notification): void {
    this.notificationSubject.next(notification);
  }
}