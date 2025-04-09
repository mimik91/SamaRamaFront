import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  notification = inject(NotificationService);
  
  mobileMenuOpen = false;
  
  ngOnInit(): void {
    // Inicjalizacja komponentu
  }
  
  // Zamknij menu mobilne gdy rozmiar ekranu przekracza 768px
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (window.innerWidth > 768) {
      this.mobileMenuOpen = false;
    }
  }
  
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    // Zablokuj przewijanie strony gdy menu mobilne jest otwarte
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  closeMobileMenu(): void {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      document.body.style.overflow = '';
    }
  }
  
  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.notification.success('Zostałeś wylogowany');
    this.router.navigate(['/login']);
    this.closeMobileMenu();
  }
}