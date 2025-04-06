import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a [routerLink]="['/']">SamaRama</a>
      </div>
      
      <div class="navbar-menu">
        <!-- Menu for logged in clients -->
        <ng-container *ngIf="authService.isLoggedIn() && authService.isClient()">
          <a routerLink="/welcome" routerLinkActive="active">Mapa serwisów</a>
          <a routerLink="/bicycles" routerLinkActive="active">Moje rowery</a>
          <a routerLink="/services" routerLinkActive="active">Usługi</a>
          <a href="#" (click)="logout($event)">Wyloguj się</a>
        </ng-container>
        
        <!-- Menu for logged in bike services -->
        <ng-container *ngIf="authService.isLoggedIn() && authService.isService()">
          <a routerLink="/service-panel" routerLinkActive="active">Panel serwisu</a>
          <a routerLink="/customers" routerLinkActive="active">Klienci</a>
          <a routerLink="/orders" routerLinkActive="active">Zlecenia</a>
          <a href="#" (click)="logout($event)">Wyloguj się</a>
        </ng-container>
        
        <!-- Menu for not logged in users -->
        <ng-container *ngIf="!authService.isLoggedIn()">
          <a routerLink="/login" routerLinkActive="active">Logowanie klienta</a>
          <a routerLink="/login-serviceman" routerLinkActive="active">Logowanie serwisu</a>
          <a routerLink="/register" routerLinkActive="active">Rejestracja</a>
        </ng-container>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      height: 60px;
      background-color: #2c3e50;
      color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    
    .navbar-brand a {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      text-decoration: none;
    }
    
    .navbar-menu {
      display: flex;
      gap: 20px;
    }
    
    .navbar-menu a {
      color: #ecf0f1;
      text-decoration: none;
      padding: 5px 10px;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    
    .navbar-menu a:hover, .navbar-menu a.active {
      background-color: #34495e;
      color: white;
    }
  `]
})
export class NavigationComponent {
  authService = inject(AuthService);
  router = inject(Router);
  notification = inject(NotificationService);
  
  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.notification.success('Zostałeś wylogowany');
    this.router.navigate(['/login']);
  }
}