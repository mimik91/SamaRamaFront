import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../notification.service';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { CycloPickLogoComponent } from '../../shared/cyclopick-logo/cyclopick-logo.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive, 
    UserSettingsComponent,
    CycloPickLogoComponent
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  notification = inject(NotificationService);
  
  mobileMenuOpen = false;
  currentUrl: string = '';
  
  ngOnInit(): void {
    // Monitorowanie zmian adresu URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
      this.closeMobileMenu();
    });

    // Pobierz aktualny URL
    this.currentUrl = this.router.url;
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
  
  navigateToHome(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }

  // Sprawdza, czy jesteśmy na stronie logowania lub rejestracji
  isAuthPage(): boolean {
    return this.currentUrl.includes('/login') || 
           this.currentUrl.includes('/register') ||
           this.currentUrl.includes('/register-serviceman');
  }

  // Sprawdza, czy jesteśmy na stronie logowania klienta
  isLoginPage(): boolean {
    return this.currentUrl === '/login';
  }

  // Sprawdza, czy jesteśmy na stronie rejestracji klienta
  isRegisterPage(): boolean {
    return this.currentUrl === '/register';
  }

  // Sprawdza, czy jesteśmy na stronie rejestracji serwisu
  isServiceRegisterPage(): boolean {
    return this.currentUrl === '/register-serviceman';
  }
}