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
  serviceSuffix: string = '';
  
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
    
    // Pobierz suffix serwisu jeśli użytkownik jest serwisem
    console.log('NavigationComponent ngOnInit');
    console.log('isService:', this.authService.isService());
    
    if (this.authService.isService()) {
      this.loadServiceSuffix();
      console.log('Service suffix loaded in ngOnInit:', this.serviceSuffix);
    }
  }
  
  // Pobierz suffix serwisu z AuthService
  private loadServiceSuffix(): void {
    this.serviceSuffix = this.authService.getServiceSuffix() || '';
    console.log('loadServiceSuffix - suffix loaded:', this.serviceSuffix);
    if (!this.serviceSuffix) {
      console.warn('Service suffix not found for logged in service user');
      // Sprawdź localStorage bezpośrednio
      if (typeof localStorage !== 'undefined') {
        const directSuffix = localStorage.getItem('service_suffix');
        console.log('Direct localStorage check:', directSuffix);
      }
    }
  }
  
  // Metoda do nawigacji do panelu administratora serwisu
  navigateToServicePanel(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('=== navigateToServicePanel START ===');
    console.log('Current suffix:', this.serviceSuffix);
    
    if (!this.serviceSuffix) {
      console.log('Suffix empty, reloading...');
      this.loadServiceSuffix();
      console.log('After reload, suffix:', this.serviceSuffix);
    }
    
    if (this.serviceSuffix) {
      const path = `/${this.serviceSuffix}/panel-administratora`;
      console.log('Attempting navigation to:', path);
      
      this.router.navigate([this.serviceSuffix, 'panel-administratora']).then(
        success => {
          console.log('Navigation success:', success);
          if (success) {
            this.closeMobileMenu();
          }
        },
        error => {
          console.error('Navigation error:', error);
        }
      );
    } else {
      console.error('Service suffix is still empty after reload!');
      console.log('AuthService.isService():', this.authService.isService());
      console.log('AuthService.getActiveServiceSuffix():', this.authService.getActiveServiceSuffix());
      this.notification.error('Nie można załadować danych serwisu. Spróbuj się wylogować i zalogować ponownie.');
    }
    console.log('=== navigateToServicePanel END ===');
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
           this.currentUrl.includes('/register-service') ||
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
    return this.currentUrl === '/register-service' || this.currentUrl === '/register-serviceman';
  }
}