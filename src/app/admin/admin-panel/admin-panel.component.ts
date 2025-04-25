import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../core/notification.service';
import { AdminService, DashboardStats } from '../admin-service';  // Fixed import path

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);
  
  userName: string = '';
  userRole: string = '';
  
  // Statistics
  totalUsers: number = 0;
  totalBicycles: number = 0;
  totalServices: number = 0;
  pendingOrders: number = 0;
  
  loading: boolean = true;
  
  constructor() { }

  ngOnInit(): void {
    // Get user info from auth service
    this.getUserInfo();
    
    // Load dashboard stats from backend
    this.loadDashboardStats();
    
    // Usunięto powiadomienie powitalne
  }
  
  private getUserInfo(): void {
    const email = this.authService.getCurrentUserEmail();
    if (email) {
      this.userName = email;
    }
    
    const role = this.authService.getUserRole();
    if (role) {
      this.userRole = role;
    }
  }
  
  private loadDashboardStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (stats: DashboardStats) => {
        this.totalUsers = stats.totalUsers;
        this.totalBicycles = stats.totalBicycles;
        this.totalServices = stats.totalServices;
        this.pendingOrders = stats.pendingOrders;
        
        // If user info is returned from backend, update it
        if (stats.user) {
          this.userName = stats.user.email;
          
          // Determine role from authorities
          if (stats.authorities) {
            if (stats.authorities.includes('ROLE_ADMIN')) {
              this.userRole = 'ADMIN';
            } else if (stats.authorities.includes('ROLE_MODERATOR')) {
              this.userRole = 'MODERATOR';
            }
          }
        }
        
        this.loading = false;
      },
      error: (error: any) => {  // Added explicit type to fix TS7006 error
        console.error('Error loading dashboard stats:', error);
        this.notificationService.error('Nie udało się załadować statystyk panelu administracyjnego');
        this.loading = false;
        
        // Set default values in case of error
        this.totalUsers = 0;
        this.totalBicycles = 0;
        this.totalServices = 0;
        this.pendingOrders = 0;
      }
    });
  }
  
  navigateToModule(module: string): void {
    // This will be implemented in future to navigate to admin submodules
    this.notificationService.info(`Moduł ${module} jest w przygotowaniu`);
  }
}