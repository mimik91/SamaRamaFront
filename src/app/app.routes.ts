import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { VerificationComponent } from './auth/verification/verification.component';
import { ReviewFormComponent } from './review/review-form.component';
import { GuestOrderAccessComponent } from './guest-order-access/guest-order-access.component';
import { authGuard, clientGuard, adminGuard, serviceGuard, moderatorGuard } from './auth/auth.guard';
import { TransportOrderFormComponent } from './transport-orders/transport-order-form.component';
import { GuestReservationFormComponent } from './service-reservation/guest-reservation-form.component';
import { ExpressReservationFormComponent } from './service-reservation/express-reservation-form/express-reservation-form.component';
import { OrderSummaryComponent } from './transport-orders/order-summary/order-summary.component';
import { ServiceRegistrationComponent } from './service-registration/service-registration.component';
import { PasswordResetRequestComponent } from './auth/password-reset-request/password-reset-request.component';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { CompleteRegistrationComponent } from './auth/complete-registration/complete-registration.component';
import { ForServicesComponent } from './for-services/for-services.component';
import { TermsOfServiceComponent } from './core/terms-of-service.component'
import { TermsOfServiceWorkshopsComponent } from './core/terms-of-service-workshops.component'
import { PrivacyPolicyComponent } from './core/privacy-policy.component';
import { CookiePolicyComponent } from './core/cookie-policy.component';
import { PricingCyclistsComponent } from './core/pricing-cyclists.component';
import { PricingServicesComponent } from './core/pricing-services.component';
import { suffixValidationGuard } from './auth/suffix-validation.guard';
import { ServiceProfileTitleResolver} from './environments/service-profile-title.resolver';
import { ServiceProfileResolver } from './pages/service-profile/service-profile.resolver';
import { CityServicesResolver } from './pages/city-services-page/city-services-page.resolver';
import { ServicesMapResolver } from './pages/services-map-page/services-map-page.resolver';

// REFACTORED COMPONENTS - NEW STRUCTURE
import { ServicesMapPageComponent } from './pages/services-map-page/services-map-page.component';
import { HowItWorksPageComponent } from './pages/how-it-works-page/how-it-works-page.component';
import { CooperationComponent } from './cooperation/cooperation.component';
import { ServiceProfilePageComponent } from './pages/service-profile/service-profile.component';
import { CityServicesPageComponent } from './pages/city-services-page/city-services-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { TransportRowerowKrakowComponent } from './pages/transport-rowerow-krakow/transport-rowerow-krakow.component';
import { PoradnikListPageComponent } from './pages/poradnik/poradnik-list-page/poradnik-list-page.component';
import { PoradnikArticlePageComponent } from './pages/poradnik/poradnik-article-page/poradnik-article-page.component';
import { FlyerRedirectComponent } from './pages/flyer-redirect/flyer-redirect.component';
import { OrderSuccessComponent } from './pages/order-success/order-success.component';
import { PaymentReturnComponent } from './pages/payments/payment-return/payment-return.component';
import { PaymentSummaryComponent } from './pages/payments/payment-summary/payment-summary.component';
import { TransportPaymentSuccessComponent } from './pages/payments/transport-payment-success/transport-payment-success.component';
import { ExpressServiceSuccessComponent } from './pages/payments/express-service-success/express-service-success.component';

export const routes: Routes = [
    // === PUBLICZNE TRASY (BEZ GUARD) ===

    // Landing page - katalog serwisów rowerowych z wyszukiwarką (SEO-optimized home page)
    {
      path: '',
      component: LandingPageComponent,
      title: 'Znajdź i zarezerwuj serwis rowerowy w Polsce | CycloPick'
    },

    // Map page - interaktywna mapa serwisów
    {
      path: 'mapa-serwisow',
      component: ServicesMapPageComponent,
      title: 'Mapa serwisów rowerowych | CycloPick',
      resolve: { mapData: ServicesMapResolver },
      runGuardsAndResolvers: 'paramsOrQueryParamsChange'
    },

    // Aliasy dla mapy - przekierowanie na nowy URL (z zachowaniem query params)
    { path: 'mapa', redirectTo: (info: any) => { const qs = new URLSearchParams(info.queryParams).toString(); return qs ? `mapa-serwisow?${qs}` : 'mapa-serwisow'; }, pathMatch: 'full' },
    { path: 'services-map', redirectTo: (info: any) => { const qs = new URLSearchParams(info.queryParams).toString(); return qs ? `mapa-serwisow?${qs}` : 'mapa-serwisow'; }, pathMatch: 'full' },

    // SEO - pełna lista serwisów (wszystkie w Polsce) — ten sam komponent co /serwisy/:city,
    // tylko bez segmentu :city (CityServicesResolver rozpoznaje ten przypadek jako tryb nationwide)
    {
      path: 'serwisy',
      component: CityServicesPageComponent,
      resolve: { cityData: CityServicesResolver },
      title: 'Serwisy rowerowe w Polsce | CycloPick'
    },

    // SEO - lista serwisów dla konkretnego miasta
    {
      path: 'serwisy/:city',
      component: CityServicesPageComponent,
      resolve: { cityData: CityServicesResolver }
    },

    // Jak działamy
    {
      path: 'jak-dzialamy',
      component: HowItWorksPageComponent,
      title: 'Jak działa rezerwacja online w serwisie rowerowym? | CycloPick'
    },

    // Transport rowerów w Krakowie (dawna treść landing page — dodatek, nie rdzeń platformy)
    {
      path: 'transport-rowerow-krakow',
      component: TransportRowerowKrakowComponent,
      title: 'Serwis Rowerowy Kraków Door-to-Door | CycloPick'
    },

    // Poradnik rowerowy — sekcja treściowa (SEO)
    {
      path: 'poradnik',
      component: PoradnikListPageComponent,
      title: 'Poradnik rowerowy — porady i wskazówki dla rowerzystów | CycloPick'
    },
    {
      path: 'poradnik/:slug',
      component: PoradnikArticlePageComponent
    },

    // Legal pages
    {
      path: 'terms-of-service',
      component: TermsOfServiceComponent,
      title: 'Regulamin | CycloPick'
    },
    {
      path: 'terms-of-service-workshops',
      component: TermsOfServiceWorkshopsComponent,
      title: 'Regulamin dla serwisów | CycloPick'
    },
    {
      path: 'privacy-policy',
      component: PrivacyPolicyComponent,
      title: 'Polityka prywatności | CycloPick'
    },
    {
      path: 'cookie-policy',
      component: CookiePolicyComponent,
      title: 'CycloPick | Polityka Cookies'
    },
    {
      path: 'cennik-rowerzysci',
      component: PricingCyclistsComponent,
      title: 'CycloPick | Cennik dla rowerzystów'
    },
    {
      path: 'cennik-serwisy',
      component: PricingServicesComponent,
      title: 'CycloPick | Oferta dla serwisów rowerowych'
    },

    // Pricing route - dostępna dla wszystkich
    {
      path: 'cooperation',
      component: CooperationComponent,
      title: 'Współpraca z CycloPick | Dołącz do zespołu rowerowego startupu'
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
      path: 'opinia',
      component: ReviewFormComponent,
      title: 'Twoja opinia | CycloPick'
    },
    {
      path: 'moje-zlecenie',
      component: GuestOrderAccessComponent,
      title: 'Twoje zlecenie | CycloPick'
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
    {
      path: 'complete-registration',
      component: CompleteRegistrationComponent,
      title: 'Aktywacja Konta'
    },

    // Service registration - teraz dostępna w menu
    {
      path: 'register-service',
      component: ServiceRegistrationComponent,
      title: 'Zarejestruj Serwis'
    },

    // Przekierowanie z /about na stronę główną (z zachowaniem query params)
    { path: 'about', redirectTo: (info: any) => { const qs = new URLSearchParams(info.queryParams).toString(); return qs ? `?${qs}` : ''; }, pathMatch: 'full' },

    // Legacy redirect: /for-services → /dla-serwisow (301 SEO)
    { path: 'for-services', redirectTo: 'dla-serwisow', pathMatch: 'full' },

    // About page - usługi dla serwisów rowerowych
    {
      path: 'dla-serwisow',
      component: ForServicesComponent,
      title: 'Dla serwisów rowerowych – rezerwacje online i system zarządzania | CycloPick'
    },

     // === CHRONIONE TRASY UŻYTKOWNIKÓW SERVICE ===
    // Trasy poniżej są w pełni zagrodzone guardem (serviceGuard/clientGuard/adminGuard/moderatorGuard/authGuard)
    // i nigdy nie renderują się dla anonimowego/SEO ruchu — lazy loaded (loadComponent), żeby ich kod
    // (kalendarz + Angular Material, kanban, panele admina) nie trafiał do głównego bundla ładowanego
    // przez każdego odwiedzającego stronę publiczną.

    // Strona oczekiwania na weryfikację
    {
      path: 'service-pending-verification',
      loadComponent: () => import('./pages/service-admin-panel/service-pending-verification/service-pending-verification.component').then(m => m.ServicePendingVerificationComponent),
      canActivate: [serviceGuard],
      title: 'Oczekiwanie na Weryfikację'
    },

    // Kanban serwisu
    {
      path: ':suffix/panel-administratora/kanban',
      loadComponent: () => import('./pages/service-kanban/service-kanban.component').then(m => m.ServiceKanbanComponent),
      canActivate: [serviceGuard, suffixValidationGuard],
      title: 'Kanban Serwisu'
    },

    // Kalendarz serwisu (domyślny widok panelu)
    // WAŻNE: Ta trasa jest bardziej specyficzna niż :suffix, więc ma priorytet
    {
      path: ':suffix/panel-administratora',
      loadComponent: () => import('./pages/service-calendar/service-calendar.component').then(m => m.ServiceCalendarComponent),
      canActivate: [serviceGuard, suffixValidationGuard],
      title: 'Kalendarz Serwisu'
    },

    // Ustawienia profilu serwisu (dotychczasowy panel admina)
    {
      path: ':suffix/panel-administratora/profil',
      loadComponent: () => import('./pages/service-admin-panel/service-admin-panel.component').then(m => m.ServiceAdminPanelComponent),
      canActivate: [serviceGuard, suffixValidationGuard],
      title: 'Ustawienia Profilu Serwisu'
    },

    // Historia zleceń serwisu
    {
      path: ':suffix/historia-zlecen',
      loadComponent: () => import('./pages/service-history-page/service-history-page.component').then(m => m.ServiceHistoryPageComponent),
      canActivate: [serviceGuard, suffixValidationGuard],
      title: 'Historia Zleceń'
    },

    // === DASHBOARD ROUTES (dla przekierowań po logowaniu) ===

    // Dashboard dla klientów
    {
      path: 'client-dashboard',
      loadComponent: () => import('./pages/client-panel/client-panel-list/client-panel-list.component').then(m => m.ClientPanelListComponent),
      canActivate: [clientGuard],
      data: { roles: ['CLIENT'] },
      title: 'Panel Klienta'
    },

    // Dashboard dla adminów (tylko ADMIN)
    {
      path: 'admin-dashboard',
      loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      canActivate: [adminGuard],
      data: { roles: ['ADMIN'] },
      title: 'Panel Administracyjny'
    },

    // === CHRONIONE TRASY KLIENTÓW ===

    {
      path: 'bicycles',
      loadComponent: () => import('./pages/client-panel/client-panel-list/client-panel-list.component').then(m => m.ClientPanelListComponent),
      canActivate: [clientGuard],
      title: 'Moje Rowery'
    },
    {
      path: 'bicycles/add',
      loadComponent: () => import('./pages/client-panel/client-panel-form/client-panel-form.component').then(m => m.ClientPanelFormComponent),
      canActivate: [clientGuard],
      title: 'Dodaj Rower'
    },
    {
      path: 'bicycles/:id',
      loadComponent: () => import('./pages/client-panel/client-panel-bicycle-details/client-panel-bicycle-details.component').then(m => m.ClientPanelDetailsComponent),
      canActivate: [clientGuard],
      data: { RenderMode: 'client' },
      title: 'Szczegóły Roweru'
    },

    // Service order routes for clients

    {
      path: 'admin-orders/:id',
      loadComponent: () => import('./admin/admin-orders/admin-order-details/admin-order-details.component').then(m => m.AdminOrderDetailsComponent),
      canActivate: [moderatorGuard],
      title: 'Szczegóły Zamówienia - Admin'
    },
    {
      path: 'admin-orders',
      loadComponent: () => import('./admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent),
      canActivate: [moderatorGuard],
      title: 'Zamówienia - Admin'
    },
    // Account route - dostępna dla zalogowanych użytkowników
    {
      path: 'account',
      loadComponent: () => import('./account/account.component').then(m => m.AccountComponent),
      canActivate: [authGuard],
      title: 'Moje Konto'
    },

    // === CHRONIONE TRASY ADMINÓW ===

    // Admin Orders Routes
    {
      path: 'admin-orders',
      loadComponent: () => import('./admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent),
      canActivate: [moderatorGuard],
      title: 'Zamówienia - Admin'
    },
    {
      path: 'admin-users',
      loadComponent: () => import('./admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
      canActivate: [adminGuard],
      title: 'Użytkownicy - Admin'
    },

    // Admin Services Verification - NOWY MODUŁ
    {
      path: 'admin-services-verification',
      loadComponent: () => import('./admin/admin-services-verification/admin-services-verification.component').then(m => m.AdminServicesVerificationComponent),
      canActivate: [adminGuard],
      title: 'Weryfikacja Serwisów - Admin'
    },

    {
      path: 'admin-service-edit/:id',
      loadComponent: () => import('./admin/admin-registered-service-edition/admin-registered-service-edition.component').then(m => m.AdminRegisteredServiceEditionComponent),
      canActivate: [adminGuard],
      title: 'Edycja Serwisu - Admin'
    },

    // Pozostałe admin routes
    {
      path: 'admin-enumerations',
      loadComponent: () => import('./admin/admin-enumerations/admin-enumerations-manager.component').then(m => m.AdminEnumerationsManagerComponent),
      canActivate: [adminGuard],
      title: 'Słowniki - Admin'
    },
    {
      path: 'admin-service-slots',
      loadComponent: () => import('./admin/service-slots/admin-service-slots.component').then(m => m.AdminServiceSlotsComponent),
      canActivate: [adminGuard],
      title: 'Sloty Czasowe - Admin'
    },
    {
      path: 'admin-bike-services',
      loadComponent: () => import('./admin/admin-bike-services/admin-bike-services.component').then(m => m.AdminBikeServicesComponent),
      canActivate: [adminGuard],
      title: 'Serwisy - Admin'
    },
    {
      path: 'admin-office-addresses',
      loadComponent: () => import('./admin/admin-office-addresses/admin-office-addresses.component').then(m => m.AdminOfficeAddressesComponent),
      canActivate: [adminGuard],
      title: 'Kompleksy biurowe - Admin'
    },
    {
      path: 'admin-coupons',
      loadComponent: () => import('./admin/admin-coupons/admin-coupons.component').then(m => m.AdminCouponsComponent),
      canActivate: [adminGuard],
      title: 'Kupony - Admin'
    },
    {
      path: 'admin-express-service',
      loadComponent: () => import('./admin/admin-express-service/admin-express-service.component').then(m => m.AdminExpressServiceComponent),
      canActivate: [adminGuard],
      title: 'Serwis Ekspresowy - Admin'
    },

    {
      path: 'mistrzauta',
      loadComponent: () => import('./courier-panel/courier-panel.component').then(m => m.CourierPanelComponent),
      canActivate: [moderatorGuard],
      title: 'Panel Kuriera'
    },

    // === PROFIL PUBLICZNY SERWISU ===
    // WAŻNE: Trasy :suffix MUSZĄ być przed wildcard, ale PO wszystkich innych trasach
    // Angular dopasowuje trasy w kolejności, więc bardziej szczegółowe (:suffix/panel-administratora)
    // zostaną dopasowane przed mniej szczegółowymi (:suffix)

    // Legacy redirect: /order-transport?serviceId=X → /:suffix/zamow-transport
    {
      path: 'order-transport',
      component: TransportOrderFormComponent,
      title: 'Zamów Transport'
    },

    // Legacy redirect: /reserve-service/:suffix → /:suffix/zarezerwuj
    {
      path: 'reserve-service/:suffix',
      component: GuestReservationFormComponent,
      title: 'Zarezerwuj Serwis'
    },

    // Legacy redirect: /reserve-service?serviceId=X → /:suffix/zarezerwuj
    {
      path: 'reserve-service',
      component: GuestReservationFormComponent,
      title: 'Zarezerwuj Serwis'
    },

    // Zamów transport (must be before base :suffix route)
    {
      path: ':suffix/zamow-transport',
      component: TransportOrderFormComponent,
      title: 'Zamów Transport'
    },

    // Serwis ekspresowy CycloPick — PRZED :suffix/zarezerwuj (bardziej specyficzne)
    {
      path: 'krakow/zarezerwuj',
      component: ExpressReservationFormComponent,
      title: 'Serwis Ekspresowy Kraków | CycloPick'
    },

    // Zarezerwuj serwis (must be before base :suffix route)
    {
      path: ':suffix/zarezerwuj',
      component: GuestReservationFormComponent,
      title: 'Zarezerwuj Serwis'
    },

    // Przekierowania legacy URL → one-pager
    { path: ':suffix/cennik', redirectTo: ({ params }) => `/${params['suffix']}` },
    { path: ':suffix/godziny-otwarcia', redirectTo: ({ params }) => `/${params['suffix']}` },

    // Strona przekierowania z ulotek (QR kod) — zlicza odwiedziny w GA4
    {
      path: 'ulotka',
      component: FlyerRedirectComponent,
      title: 'CycloPick'
    },

    // Strona sukcesu po złożeniu rezerwacji lub zamówienia transportu
    {
      path: 'sukces',
      component: OrderSuccessComponent,
      title: 'Dziękujemy! | CycloPick'
    },

    // Podsumowanie zamówienia przed płatnością — wybór "opłać" lub "opłacę później"
    {
      path: 'platnosc/podsumowanie',
      component: PaymentSummaryComponent,
      title: 'Podsumowanie zamówienia | CycloPick'
    },

    // Strona powrotu z PayU (po dokonaniu lub anulowaniu płatności)
    {
      path: 'platnosc/powrot',
      component: PaymentReturnComponent,
      title: 'Status płatności | CycloPick'
    },

    // Strony sukcesu po opłaceniu zamówienia przez PayU
    {
      path: 'platnosc/sukces/transport',
      component: TransportPaymentSuccessComponent,
      title: 'Transport opłacony! | CycloPick'
    },
    {
      path: 'platnosc/sukces/serwis-ekspresowy',
      component: ExpressServiceSuccessComponent,
      title: 'Wizyta opłacona! | CycloPick'
    },

    // Service profile - base route (default - "O nas" section)
    {
      path: ':suffix',
      component: ServiceProfilePageComponent,
      title: ServiceProfileTitleResolver,
      resolve: { profileData: ServiceProfileResolver },
      data: { section: 'info' }
    },

    // === FALLBACK ===

    // Wildcard route - ZAWSZE na końcu (z zachowaniem query params)
    { path: '**', redirectTo: (info: any) => { const qs = new URLSearchParams(info.queryParams).toString(); return qs ? `?${qs}` : ''; } }
];
