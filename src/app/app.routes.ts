import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { VerificationComponent } from './auth/verification/verification.component';
import { ServicePendingVerificationComponent } from './pages/service-admin-panel/service-pending-verification/service-pending-verification.component';
import { ServiceAdminPanelComponent } from './pages/service-admin-panel/service-admin-panel.component';
import { authGuard, clientGuard, adminGuard, serviceGuard} from './auth/auth.guard';
import { BicyclesListComponent } from './bicycles/bicycles-list/bicycles-list.component';
import { BicycleFormComponent } from './bicycles/bicycle-form/bicycle-form.component';
import { BicycleDetailsComponent } from './bicycles/bicycle-details/bicycle-details.component';
import { ServiceOrderFormComponent } from './service-orders/service-order-form/service-order-form.component';
import { GuestServiceOrderComponent } from './service-orders/guest-service-order/guest-service-order.component';
import { TransportOrderFormComponent } from './transport-orders/transport-order-form.component';
import { OrderSummaryComponent } from './transport-orders/order-summary/order-summary.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminEnumerationsManagerComponent } from './admin/admin-enumerations/admin-enumerations-manager.component';
import { AdminBikeServicesComponent } from './admin/admin-bike-services/admin-bike-services.component';
import { AdminServiceSlotsComponent } from './admin/service-slots/admin-service-slots.component';
import { AdminOrdersComponent } from './admin/admin-orders/admin-orders.component';
import { AdminOrderDetailsComponent } from './admin/admin-orders/admin-order-details/admin-order-details.component';
import { AdminUsersComponent } from './admin/admin-users/admin-users.component';
import { AdminServicesVerificationComponent } from './admin/admin-services-verification/admin-services-verification.component';
import { AdminRegisteredServiceEditionComponent } from './admin/admin-registered-service-edition/admin-registered-service-edition.component';
import { AccountComponent } from './account/account.component';
import { ServiceAppointmentsComponent } from './service-orders/service-appointments/service-appointments.component';
import { ServiceOrderDetailsComponent } from './service-orders/service-order-details/service-order-details.component';
import { ServiceRegistrationComponent } from './service-registration/service-registration.component';
import { PasswordResetRequestComponent } from './auth/password-reset-request/password-reset-request.component';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { ForServicesComponent } from './for-services/for-services.component';
import { CourierPanelComponent } from './courier-panel/courier-panel.component';
import { TermsOfServiceComponent } from './core/terms-of-service.component'
import { TermsOfServiceWorkshopsComponent } from './core/terms-of-service-workshops.component'
import { PrivacyPolicyComponent } from './core/privacy-policy.component';
import { suffixValidationGuard } from './auth/suffix-validation.guard';
import { ServiceProfileTitleResolver} from './environments/service-profile-title.resolver';

// REFACTORED COMPONENTS - NEW STRUCTURE
import { ServicesMapPageComponent } from './pages/services-map-page/services-map-page.component';
import { HowItWorksPageComponent } from './pages/how-it-works-page/how-it-works-page.component';
import { CooperationComponent } from './cooperation/cooperation.component';
import { ServiceProfilePageComponent } from './pages/service-profile/service-profile.component';
import { CityServicesPageComponent } from './pages/city-services-page/city-services-page.component';

export const routes: Routes = [
    // === PUBLICZNE TRASY (BEZ GUARD) ===
    
    // Home route - REFACTORED: Nowy komponent z architekturą Smart/Dumb
    { 
      path: '', 
      component: ServicesMapPageComponent,
      title: 'CycloPick | mapa serwisów rowerowych'
    },
    
    // Aliasy dla mapy
    { path: 'mapa', redirectTo: '', pathMatch: 'full' },
    { path: 'mapa-serwisow', redirectTo: '', pathMatch: 'full' },
    { path: 'services-map', redirectTo: '', pathMatch: 'full' },

    // SEO - lista serwisów dla miast
    {
      path: 'serwisy/:city',
      component: CityServicesPageComponent
    },

    // Jak działamy
    { 
      path: 'jak-dzialamy', 
      component: HowItWorksPageComponent,
      title: 'CycloPick | mapa serwisów rowerowych'
    },
    
    // Legal pages
    { 
      path: 'terms-of-service', 
      component: TermsOfServiceComponent, 
      title: 'CycloPick | mapa serwisów rowerowych'
    },
    { 
      path: 'terms-of-service-workshops', 
      component: TermsOfServiceWorkshopsComponent, 
      title: 'CycloPick | mapa serwisów rowerowych'
    },
    { 
      path: 'privacy-policy', 
      component: PrivacyPolicyComponent, 
      title: 'CycloPick | mapa serwisów rowerowych'
    },
    
    // Pricing route - dostępna dla wszystkich
    { 
      path: 'cooperation', 
      component: CooperationComponent,
      title: 'CycloPick | mapa serwisów rowerowych'
    },
    
    // Guest order route - dostępna dla niezalogowanych
    { 
      path: 'guest-order', 
      component: GuestServiceOrderComponent,
      title: 'Zamów Serwis jako Gość'
    },
    
    // Transport order - dostępna dla wszystkich (bez guarda)
    { 
      path: 'order-transport', 
      component: TransportOrderFormComponent,
      title: 'Zamów Transport'
    },
    { 
      path: 'ordersummary', 
      component: OrderSummaryComponent,
      title: 'Podsumowanie Zamówienia'
    },
    
    // Auth routes - NIGDY nie dodawaj guard do tras logowania!
    { 
      path: 'login', 
      component: LoginComponent,
      title: 'Logowanie'
    },
    { 
      path: 'register', 
      component: RegistrationComponent, 
      data: { userType: 'client' },
      title: 'Rejestracja'
    },
    { 
      path: 'verify-account', 
      component: VerificationComponent,
      title: 'Weryfikacja Konta'
    },
    { 
      path: 'password-reset-request', 
      component: PasswordResetRequestComponent,
      title: 'Reset Hasła'
    },
    { 
      path: 'password-reset', 
      component: PasswordResetComponent,
      title: 'Nowe Hasło'
    },
    
    // Service registration - teraz dostępna w menu
    { 
      path: 'register-service', 
      component: ServiceRegistrationComponent,
      title: 'Zarejestruj Serwis'
    },
    
    // Przekierowanie z /about na stronę główną
    { path: 'about', redirectTo: '', pathMatch: 'full' },

    // About page
    { 
      path: 'for-services', 
      component: ForServicesComponent,
      title: 'Dla Serwisów'
    },

     // === CHRONIONE TRASY UŻYTKOWNIKÓW SERVICE ===
    
    // Strona oczekiwania na weryfikację
    { 
      path: 'service-pending-verification', 
      component: ServicePendingVerificationComponent,
      canActivate: [serviceGuard],
      title: 'Oczekiwanie na Weryfikację'
    },
    
    // Panel administracyjny serwisu (z suffixem)
    // WAŻNE: Ta trasa jest bardziej specyficzna niż :suffix, więc ma priorytet
    { 
      path: ':suffix/panel-administratora', 
      component: ServiceAdminPanelComponent,
      canActivate: [serviceGuard, suffixValidationGuard], 
      title: 'Panel Administratora Serwisu'
    },
    
    // === DASHBOARD ROUTES (dla przekierowań po logowaniu) ===
    
    // Dashboard dla klientów
    { 
      path: 'client-dashboard', 
      component: BicyclesListComponent,
      canActivate: [clientGuard],
      data: { roles: ['CLIENT'] },
      title: 'Panel Klienta'
    },
    
    // Dashboard dla adminów
    { 
      path: 'admin-dashboard', 
      component: AdminDashboardComponent, 
      canActivate: [adminGuard],
      data: { roles: ['ADMIN', 'MODERATOR'] },
      title: 'Panel Administracyjny'
    },
    
    // === CHRONIONE TRASY KLIENTÓW ===
    
    { 
      path: 'bicycles', 
      component: BicyclesListComponent, 
      canActivate: [clientGuard],
      title: 'Moje Rowery'
    },
    { 
      path: 'bicycles/add', 
      component: BicycleFormComponent, 
      canActivate: [clientGuard],
      title: 'Dodaj Rower'
    },
    { 
      path: 'bicycles/:id', 
      component: BicycleDetailsComponent, 
      canActivate: [clientGuard], 
      data: { RenderMode: 'client' },
      title: 'Szczegóły Roweru'
    },
    
    // Service order routes for clients

    {
      path: 'admin-orders/:id',
      component: AdminOrderDetailsComponent,
      canActivate: [adminGuard],
      title: 'Szczegóły Zamówienia - Admin'
    },
    {
      path: 'admin-orders',
      component: AdminOrdersComponent,
      canActivate: [adminGuard],
      title: 'Zamówienia - Admin'
    },
    { 
      path: 'order-service', 
      component: ServiceOrderFormComponent, 
      canActivate: [clientGuard],
      title: 'Zamów Serwis'
    },
    { 
      path: 'bicycles/:id/order-service', 
      component: ServiceOrderFormComponent, 
      canActivate: [clientGuard],
      title: 'Zamów Serwis'
    },
    { 
      path: 'service-appointments', 
      component: ServiceAppointmentsComponent, 
      canActivate: [clientGuard],
      title: 'Moje Wizyty'
    },
    { 
      path: 'service-appointments/:id', 
      component: ServiceOrderDetailsComponent, 
      canActivate: [clientGuard], 
      data: { RenderMode: 'client' },
      title: 'Szczegóły Wizyty'
    },
    
    // Account route - dostępna dla zalogowanych użytkowników
    { 
      path: 'account', 
      component: AccountComponent, 
      canActivate: [authGuard],
      title: 'Moje Konto'
    },
    
    // === CHRONIONE TRASY ADMINÓW ===
    
    // Admin Orders Routes
    { 
      path: 'admin-orders', 
      component: AdminOrdersComponent, 
      canActivate: [adminGuard],
      title: 'Zamówienia - Admin'
    },
    { 
      path: 'admin-users', 
      component: AdminUsersComponent, 
      canActivate: [adminGuard],
      title: 'Użytkownicy - Admin'
    },
    
    // Admin Services Verification - NOWY MODUŁ
    { 
      path: 'admin-services-verification', 
      component: AdminServicesVerificationComponent, 
      canActivate: [adminGuard],
      title: 'Weryfikacja Serwisów - Admin'
    },

    { 
      path: 'admin-service-edit/:id', 
      component: AdminRegisteredServiceEditionComponent, 
      canActivate: [adminGuard],
      title: 'Edycja Serwisu - Admin'
    },

    // Pozostałe admin routes
    { 
      path: 'admin-enumerations', 
      component: AdminEnumerationsManagerComponent, 
      canActivate: [adminGuard],
      title: 'Słowniki - Admin'
    },
    { 
      path: 'admin-service-slots', 
      component: AdminServiceSlotsComponent, 
      canActivate: [adminGuard],
      title: 'Sloty Czasowe - Admin'
    },
    { 
      path: 'admin-bike-services', 
      component: AdminBikeServicesComponent, 
      canActivate: [adminGuard],
      title: 'Serwisy - Admin'
    },
    
    { 
      path: 'mistrzauta', 
      component: CourierPanelComponent, 
      canActivate: [adminGuard],
      data: { roles: ['ADMIN', 'MODERATOR'] },
      title: 'Panel Kuriera'
    },
    
    // === PROFIL PUBLICZNY SERWISU ===
    // WAŻNE: Trasy :suffix MUSZĄ być przed wildcard, ale PO wszystkich innych trasach
    // Angular dopasowuje trasy w kolejności, więc bardziej szczegółowe (:suffix/panel-administratora)
    // zostaną dopasowane przed mniej szczegółowymi (:suffix)

    // Service profile - cennik section (must be before base :suffix route)
    {
      path: ':suffix/cennik',
      component: ServiceProfilePageComponent,
      title: ServiceProfileTitleResolver,
      data: { section: 'pricelist' }
    },

    // Service profile - godziny otwarcia section (must be before base :suffix route)
    {
      path: ':suffix/godziny-otwarcia',
      component: ServiceProfilePageComponent,
      title: ServiceProfileTitleResolver,
      data: { section: 'hours' }
    },

    // Service profile - base route (default - "O nas" section)
    {
      path: ':suffix',
      component: ServiceProfilePageComponent,
      title: ServiceProfileTitleResolver,
      data: { section: 'info' }
    },
    
    // === FALLBACK ===
    
    // Wildcard route - ZAWSZE na końcu
    { path: '**', redirectTo: '' }
];