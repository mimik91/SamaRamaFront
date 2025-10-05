import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { VerificationComponent } from './auth/verification/verification.component';
import { authGuard, clientGuard, adminGuard } from './auth/auth.guard';
import { BicyclesListComponent } from './bicycles/bicycles-list/bicycles-list.component';
import { BicycleFormComponent } from './bicycles/bicycle-form/bicycle-form.component';
import { BicycleDetailsComponent } from './bicycles/bicycle-details/bicycle-details.component';
import { ServiceOrderFormComponent } from './service-orders/service-order-form/service-order-form.component';
import { GuestServiceOrderComponent } from './service-orders/guest-service-order/guest-service-order.component';
import { TransportOrderFormComponent } from './transport-orders/transport-order-form.component';
import { OrderSummaryComponent } from './transport-orders/order-summary/order-summary.component';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminEnumerationsManagerComponent } from './admin/admin-enumerations/admin-enumerations-manager.component';
import { AdminServicePackagesComponent } from './admin/admin-service-packages/admin-service-package.component';
import { AdminBikeServicesComponent } from './admin/admin-bike-services/admin-bike-services.component';
import { AdminServiceSlotsComponent } from './admin/service-slots/admin-service-slots.component';
import { AdminOrdersComponent } from './admin/admin-orders/admin-orders.component';
import { AdminOrderDetailsComponent } from './admin/admin-orders/admin-order-details/admin-order-details.component';
import { AdminUsersComponent } from './admin/admin-users/admin-users.component';
import { AccountComponent } from './account/account.component';
import { ServiceAppointmentsComponent } from './service-orders/service-appointments/service-appointments.component';
import { ServiceOrderDetailsComponent } from './service-orders/service-order-details/service-order-details.component';
import { ServiceRegistrationComponent } from './service-registration/service-registration.component';
import { PasswordResetRequestComponent } from './auth/password-reset-request/password-reset-request.component';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { PricingComponent } from './pricing/pricing.component';
import { CourierPanelComponent } from './courier-panel/courier-panel.component';
import { TermsOfServiceComponent } from './core/terms-of-service.component'
import { PrivacyPolicyComponent } from './core/privacy-policy.component';

// REFACTORED COMPONENTS - NEW STRUCTURE
import { ServicesMapPageComponent } from './pages/services-map-page/services-map-page.component';
import { HowItWorksPageComponent } from './pages/how-it-works-page/how-it-works-page.component';

export const routes: Routes = [
    // === PUBLICZNE TRASY (BEZ GUARD) ===
    
    // Home route - REFACTORED: Nowy komponent z architekturą Smart/Dumb
    { 
      path: '', 
      component: ServicesMapPageComponent,
      title: 'Mapa Serwisów Rowerowych - Napravelo'
    },
    
    // Aliasy dla mapy
    { path: 'mapa', redirectTo: '', pathMatch: 'full' },
    { path: 'mapa-serwisow', redirectTo: '', pathMatch: 'full' },
    { path: 'services-map', redirectTo: '', pathMatch: 'full' },
    
    // Jak działamy
    { 
      path: 'jak-dzialamy', 
      component: HowItWorksPageComponent,
      title: 'Jak Działamy - Napravelo'
    },
    
    // Legal pages
    { 
      path: 'terms-of-service', 
      component: TermsOfServiceComponent, 
      title: 'Regulamin Serwisu - Napravelo'
    },
    { 
      path: 'privacy-policy', 
      component: PrivacyPolicyComponent, 
      title: 'Polityka Prywatności - Napravelo' 
    },
    
    // Pricing route - dostępna dla wszystkich
    { 
      path: 'cennik', 
      component: PricingComponent,
      title: 'Cennik - Napravelo'
    },
    
    // Guest order route - dostępna dla niezalogowanych
    { 
      path: 'guest-order', 
      component: GuestServiceOrderComponent,
      title: 'Zamów Serwis jako Gość - Napravelo'
    },
    
    // Transport order - dostępna dla wszystkich (bez guarda)
    { 
      path: 'order-transport', 
      component: TransportOrderFormComponent,
      title: 'Zamów Transport - Napravelo'
    },
    { 
      path: 'ordersummary', 
      component: OrderSummaryComponent,
      title: 'Podsumowanie Zamówienia - Napravelo'
    },
    
    // Auth routes - NIGDY nie dodawaj guard do tras logowania!
    { 
      path: 'login', 
      component: LoginComponent,
      title: 'Logowanie - Napravelo'
    },
    { 
      path: 'register', 
      component: RegistrationComponent, 
      data: { userType: 'client' },
      title: 'Rejestracja - Napravelo'
    },
    { 
      path: 'verify-account', 
      component: VerificationComponent,
      title: 'Weryfikacja Konta - Napravelo'
    },
    { 
      path: 'password-reset-request', 
      component: PasswordResetRequestComponent,
      title: 'Reset Hasła - Napravelo'
    },
    { 
      path: 'password-reset', 
      component: PasswordResetComponent,
      title: 'Nowe Hasło - Napravelo'
    },
    
    // Service registration - teraz dostępna w menu
    { 
      path: 'register-service', 
      component: ServiceRegistrationComponent,
      title: 'Zarejestruj Serwis - Napravelo'
    },
    
    // About page
    { 
      path: 'about', 
      component: AboutUsComponent,
      title: 'O Nas - Napravelo'
    },
    
    // === DASHBOARD ROUTES (dla przekierowań po logowaniu) ===
    
    // Dashboard dla klientów
    { 
      path: 'client-dashboard', 
      component: BicyclesListComponent,
      canActivate: [clientGuard],
      data: { roles: ['CLIENT'] },
      title: 'Panel Klienta - Napravelo'
    },
    
    // Dashboard dla adminów
    { 
      path: 'admin-dashboard', 
      component: AdminDashboardComponent, 
      canActivate: [adminGuard],
      data: { roles: ['ADMIN', 'MODERATOR'] },
      title: 'Panel Administracyjny - Napravelo'
    },
    
    // === CHRONIONE TRASY KLIENTÓW ===
    
    { 
      path: 'bicycles', 
      component: BicyclesListComponent, 
      canActivate: [clientGuard],
      title: 'Moje Rowery - Napravelo'
    },
    { 
      path: 'bicycles/add', 
      component: BicycleFormComponent, 
      canActivate: [clientGuard],
      title: 'Dodaj Rower - Napravelo'
    },
    { 
      path: 'bicycles/:id', 
      component: BicycleDetailsComponent, 
      canActivate: [clientGuard], 
      data: { RenderMode: 'client' },
      title: 'Szczegóły Roweru - Napravelo'
    },
    
    // Service order routes for clients
    { 
      path: 'order-service', 
      component: ServiceOrderFormComponent, 
      canActivate: [clientGuard],
      title: 'Zamów Serwis - Napravelo'
    },
    { 
      path: 'bicycles/:id/order-service', 
      component: ServiceOrderFormComponent, 
      canActivate: [clientGuard],
      title: 'Zamów Serwis - Napravelo'
    },
    { 
      path: 'service-appointments', 
      component: ServiceAppointmentsComponent, 
      canActivate: [clientGuard],
      title: 'Moje Wizyty - Napravelo'
    },
    { 
      path: 'service-appointments/:id', 
      component: ServiceOrderDetailsComponent, 
      canActivate: [clientGuard], 
      data: { RenderMode: 'client' },
      title: 'Szczegóły Wizyty - Napravelo'
    },
    
    // Account route - dostępna dla zalogowanych użytkowników
    { 
      path: 'account', 
      component: AccountComponent, 
      canActivate: [authGuard],
      title: 'Moje Konto - Napravelo'
    },
    
    // === CHRONIONE TRASY ADMINÓW ===
    
    { 
      path: 'admin', 
      component: AdminPanelComponent, 
      canActivate: [adminGuard],
      title: 'Panel Admina - Napravelo'
    },
    
    // Admin Orders Routes
    { 
      path: 'admin-orders', 
      component: AdminOrdersComponent, 
      canActivate: [adminGuard],
      title: 'Zamówienia - Admin - Napravelo'
    },
    { 
      path: 'admin-orders/:id', 
      component: AdminOrderDetailsComponent, 
      canActivate: [adminGuard],
      title: 'Szczegóły Zamówienia - Admin - Napravelo'
    },
    { 
      path: 'admin-users', 
      component: AdminUsersComponent, 
      canActivate: [adminGuard],
      title: 'Użytkownicy - Admin - Napravelo'
    },

    // Pozostałe admin routes
    { 
      path: 'admin-enumerations', 
      component: AdminEnumerationsManagerComponent, 
      canActivate: [adminGuard],
      title: 'Słowniki - Admin - Napravelo'
    },
    { 
      path: 'admin-service-packages', 
      component: AdminServicePackagesComponent, 
      canActivate: [adminGuard],
      title: 'Pakiety Serwisowe - Admin - Napravelo'
    },
    { 
      path: 'admin-service-slots', 
      component: AdminServiceSlotsComponent, 
      canActivate: [adminGuard],
      title: 'Sloty Czasowe - Admin - Napravelo'
    },
    { 
      path: 'admin-bike-services', 
      component: AdminBikeServicesComponent, 
      canActivate: [adminGuard],
      title: 'Serwisy - Admin - Napravelo'
    },
    
    { 
      path: 'mistrzauta', 
      component: CourierPanelComponent, 
      canActivate: [adminGuard],
      data: { roles: ['ADMIN', 'MODERATOR'] },
      title: 'Panel Kuriera - Napravelo'
    },
    
    // === FALLBACK ===
    
    // Wildcard route - ZAWSZE na końcu
    { path: '**', redirectTo: '' }
];