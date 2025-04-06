import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './notification.service';
import { Subscription } from 'rxjs';

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
      >
        {{ notification.message }}
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 300px;
    }
    
    .notification {
      margin-bottom: 10px;
      padding: 15px;
      border-radius: 4px;
      color: white;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
      animation: fadeIn 0.3s ease-out;
    }
    
    .success {
      background-color: #4caf50;
    }
    
    .info {
      background-color: #2196f3;
    }
    
    .warning {
      background-color: #ff9800;
    }
    
    .error {
      background-color: #f44336;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
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
    
    // Automatycznie usuń powiadomienie po określonym czasie
    setTimeout(() => {
      this.removeNotification(id);
    }, notification.duration || 3000);
  }
  
  private removeNotification(id: number): void {
    this.activeNotifications = this.activeNotifications.filter(
      notification => notification.id !== id
    );
  }
}