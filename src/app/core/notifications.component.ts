import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './notification.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div 
        *ngFor="let notification of activeNotifications" 
        class="notification" 
        [ngClass]="notification.type"
        [@notificationAnimation]
      >
        <div class="notification-content">
          <div class="notification-icon" [ngClass]="notification.type">
            <svg *ngIf="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg *ngIf="notification.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <svg *ngIf="notification.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <svg *ngIf="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="notification-message">{{ notification.message }}</div>
          <button class="close-btn" (click)="removeNotification(notification.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="progress-bar" [ngStyle]="{'animation-duration': (notification.duration || 3000) + 'ms'}"></div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 350px;
      width: calc(100% - 40px);
    }
    
    .notification {
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      position: relative;
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      padding: 16px;
      background-color: white;
      position: relative;
    }
    
    .notification-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .notification-icon.success {
      color: #4caf50;
    }
    
    .notification-icon.info {
      color: #2196f3;
    }
    
    .notification-icon.warning {
      color: #ff9800;
    }
    
    .notification-icon.error {
      color: #f44336;
    }
    
    .notification-message {
      flex-grow: 1;
      padding-right: 10px;
      font-size: 14px;
      color: #333;
      line-height: 1.4;
    }
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #888;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    
    .close-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: #555;
    }
    
    .progress-bar {
      height: 4px;
      width: 100%;
      animation: shrink linear forwards;
    }
    
    .success .progress-bar {
      background-color: #4caf50;
    }
    
    .info .progress-bar {
      background-color: #2196f3;
    }
    
    .warning .progress-bar {
      background-color: #ff9800;
    }
    
    .error .progress-bar {
      background-color: #f44336;
    }
    
    .success {
      border-left: 4px solid #4caf50;
    }
    
    .info {
      border-left: 4px solid #2196f3;
    }
    
    .warning {
      border-left: 4px solid #ff9800;
    }
    
    .error {
      border-left: 4px solid #f44336;
    }
    
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
    
    @media (max-width: 480px) {
      .notifications-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        width: auto;
      }
    }
  `],
  animations: [
    trigger('notificationAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  activeNotifications: Array<Notification & { id: number }> = [];
  private nextId = 0;
  private subscription: Subscription | null = null;
  
  constructor(private notificationService: NotificationService) {}
  
  ngOnInit(): void {
    this.subscription = this.notificationService.notification$.subscribe(notification => {
      this.addNotification(notification);
    });
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  private addNotification(notification: Notification): void {
    const id = this.nextId++;
    const newNotification = { ...notification, id };
    
    this.activeNotifications.push(newNotification);
    
    // Automatically remove notification after specified duration
    setTimeout(() => {
      this.removeNotification(id);
    }, notification.duration || 3000);
  }
  
  removeNotification(id: number): void {
    this.activeNotifications = this.activeNotifications.filter(
      notification => notification.id !== id
    );
  }
}