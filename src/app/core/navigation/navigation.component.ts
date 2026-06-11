import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../notification.service';
import { MapStateService } from '../map-state.service';
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
  private mapStateService = inject(MapStateService);
  readonly servicesListUrl$ = this.mapStateService.servicesListUrl$;
  
  mobileMenuOpen = false;
  currentUrl: string = '';
  serviceSuffix: string = '';

  private readonly KNOWN_ROUTES = new Set([
    'mapa-serwisow', 'mapa', 'services-map', 'serwisy', 'jak-dzialamy',
    'terms-of-service', 'terms-of-service-workshops', 'privacy-policy', 'cookie-policy',
    'cennik-rowerzysci', 'cennik-serwisy', 'cooperation', 'ordersummary',
    'login', 'register', 'verify-account', 'password-reset-request', 'password-reset',
    'complete-registration', 'register-service', 'register-serviceman', 'about',
    'dla-serwisow', 'service-pending-verification', 'client-dashboard', 'admin-dashboard',
    'bicycles', 'admin-orders', 'account', 'admin-users', 'admin-services-verification',
    'admin-service-edit', 'admin-enumerations', 'admin-service-slots', 'admin-bike-services',
    'admin-office-addresses', 'mistrzauta', 'order-transport', 'reserve-service',
    'ulotka', 'sukces'
  ]);

  getViewedSuffix(): string | null {
    const match = this.currentUrl.match(/^\/([^/?#]+)/);
    if (!match) return null;
    const segment = decodeURIComponent(match[1]);
    return this.KNOWN_ROUTES.has(segment) ? null : segment;
  }

  isServiceProfilePage(): boolean {
    return /^\/[^/?#]+(\/?)$/.test(this.currentUrl) && this.getViewedSuffix() !== null;
  }
  
  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
      this.closeMobileMenu();
    });

    this.currentUrl = this.router.url;
    
    console.log('NavigationComponent ngOnInit');
    console.log('isService:', this.authService.isService());
    
    if (this.authService.isService()) {
      this.loadServiceSuffix();
      console.log('Service suffix loaded in ngOnInit:', this.serviceSuffix);
    }
  }
  
  private loadServiceSuffix(): void {
    this.serviceSuffix = this.authService.getServiceSuffix() || '';
    console.log('loadServiceSuffix - suffix loaded:', this.serviceSuffix);
    if (!this.serviceSuffix) {
      console.warn('Service suffix not found for logged in service user');
      if (typeof localStorage !== 'undefined') {
        const directSuffix = localStorage.getItem('service_suffix');
        console.log('Direct localStorage check:', directSuffix);
      }
    }
  }
  
  // POPRAWIONA METODA - używa navigateByUrl zamiast navigate
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
      // KLUCZOWA ZMIANA: używamy pełnego URL jako string
      // encodeURIComponent zapewnia poprawne kodowanie znaków specjalnych
      const encodedSuffix = encodeURIComponent(this.serviceSuffix);
      const path = `/${encodedSuffix}/panel-administratora`;
      console.log('Attempting navigation to:', path);
      
      // navigateByUrl traktuje URL jako całość, bez parsowania segmentów
      this.router.navigateByUrl(path).then(
        success => {
          console.log('Navigation success:', success);
          if (success) {
            this.closeMobileMenu();
          } else {
            console.error('Navigation returned false');
            this.notification.error('Nie można przejść do panelu administratora');
          }
        },
        error => {
          console.error('Navigation error:', error);
          this.notification.error('Błąd nawigacji');
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

  navigateToKanban(event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!this.serviceSuffix) this.loadServiceSuffix();
    if (this.serviceSuffix) {
      const encodedSuffix = encodeURIComponent(this.serviceSuffix);
      this.router.navigateByUrl(`/${encodedSuffix}/panel-administratora/kanban`).then(
        success => { if (success) this.closeMobileMenu(); }
      );
    } else {
      this.notification.error('Nie można załadować danych serwisu. Spróbuj się wylogować i zalogować ponownie.');
    }
  }

  navigateToServiceHistory(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.serviceSuffix) {
      this.loadServiceSuffix();
    }

    if (this.serviceSuffix) {
      const encodedSuffix = encodeURIComponent(this.serviceSuffix);
      this.router.navigateByUrl(`/${encodedSuffix}/historia-zlecen`).then(
        success => { if (success) this.closeMobileMenu(); }
      );
    } else {
      this.notification.error('Nie można załadować danych serwisu. Spróbuj się wylogować i zalogować ponownie.');
    }
  }

  navigateToProfileSettings(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.serviceSuffix) {
      this.loadServiceSuffix();
    }

    if (this.serviceSuffix) {
      const encodedSuffix = encodeURIComponent(this.serviceSuffix);
      const path = `/${encodedSuffix}/panel-administratora/profil`;
      this.router.navigateByUrl(path).then(
        success => {
          if (success) {
            this.closeMobileMenu();
          }
        }
      );
    } else {
      this.notification.error('Nie można załadować danych serwisu. Spróbuj się wylogować i zalogować ponownie.');
    }
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (window.innerWidth > 768) {
      this.mobileMenuOpen = false;
    }
  }
  
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
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

  isMapPage(): boolean {
    return this.currentUrl.startsWith('/mapa-serwisow');
  }

  isAuthPage(): boolean {
    return this.currentUrl.includes('/login') || 
           this.currentUrl.includes('/register') ||
           this.currentUrl.includes('/register-service') ||
           this.currentUrl.includes('/register-serviceman');
  }

  isLoginPage(): boolean {
    return this.currentUrl === '/login';
  }

  isRegisterPage(): boolean {
    return this.currentUrl === '/register';
  }

  isServiceRegisterPage(): boolean {
    return this.currentUrl === '/register-service' || this.currentUrl === '/register-serviceman';
  }
}