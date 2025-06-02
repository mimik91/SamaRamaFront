// Updated app.routes.ts z nową trasą dla zamówienia transportu

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
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminEnumerationsManagerComponent } from './admin/admin-enumerations/admin-enumerations-manager.component';
import { AdminServicePackagesComponent } from './admin/admin-service-packages/admin-service-package.component';
import { AdminBikeServicesComponent } from './admin/admin-bike-services/admin-bike-services.component';
import { AdminServiceSlotsComponent } from './admin/service-slots/admin-service-slots.component';
import { AdminOrdersComponent } from './admin/admin-orders/admin-orders.component';
import { AdminOrderDetailsComponent } from './admin/admin-orders/admin-order-details/admin-order-details.component';
import { AccountComponent } from './account/account.component';
import { ServiceAppointmentsComponent } from './service-orders/service-appointments/service-appointments.component';
import { ServiceOrderDetailsComponent } from './service-orders/service-order-details/service-order-details.component';
import { HomeComponent } from './home/home.component';
import { ServiceRegistrationComponent } from './service-registration/service-registration.component';
import { PasswordResetRequestComponent } from './auth/password-reset-request/password-reset-request.component';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { AboutUsComponent } from './about-us/about-us.component';

export const routes: Routes = [
    // Home route
    { path: '', component: HomeComponent },
    
    // Guest order route - dostępna dla niezalogowanych
    { path: 'guest-order', component: GuestServiceOrderComponent },
    
    // Auth routes
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegistrationComponent, data: { userType: 'client' } },
    { path: 'verify-account', component: VerificationComponent },
    { path: 'password-reset-request', component: PasswordResetRequestComponent },
    { path: 'password-reset', component: PasswordResetComponent },
    
    // Nowa trasa dla rejestracji serwisu
    { path: 'register-service', component: ServiceRegistrationComponent },
    
    // Client routes
    { path: 'bicycles', component: BicyclesListComponent, canActivate: [clientGuard] },
    { path: 'bicycles/add', component: BicycleFormComponent, canActivate: [clientGuard] },
    { path: 'bicycles/:id', component: BicycleDetailsComponent, canActivate: [clientGuard], data: { RenderMode: 'client' } },
    
    // Service order routes for clients
    { path: 'order-service', component: ServiceOrderFormComponent, canActivate: [clientGuard] },
    
    // 🆕 TRASA DLA ZAMÓWIENIA TRANSPORTU - DOSTĘPNA DLA WSZYSTKICH (BEZ GUARDA)
    { path: 'order-transport', component: TransportOrderFormComponent },
    
    { path: 'service-appointments/:id', component: ServiceOrderDetailsComponent, canActivate: [clientGuard], data: { RenderMode: 'client' } },
    // Keep the old route for backward compatibility
    { path: 'bicycles/:id/order-service', component: ServiceOrderFormComponent, canActivate: [clientGuard] },
    { path: 'service-appointments', component: ServiceAppointmentsComponent, canActivate: [clientGuard] },
    
    // Admin routes
    { path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard] },
    { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
    
    // Admin Orders Routes
    { path: 'admin-orders', component: AdminOrdersComponent, canActivate: [adminGuard] },
    { path: 'admin-orders/:id', component: AdminOrderDetailsComponent, canActivate: [adminGuard] },

    // Pozostałe admin routes
    { path: 'admin-enumerations', component: AdminEnumerationsManagerComponent, canActivate: [adminGuard] },
    { path: 'admin-service-packages', component: AdminServicePackagesComponent, canActivate: [adminGuard] },
    { path: 'admin-service-slots', component: AdminServiceSlotsComponent, canActivate: [adminGuard] },
    { path: 'admin-bike-services', component: AdminBikeServicesComponent, canActivate: [adminGuard] },
    
    // Account route - dostępna dla zalogowanych użytkowników
    { path: 'account', component: AccountComponent, canActivate: [authGuard] },
    { path: 'about', component: AboutUsComponent },
    
    // Wildcard route - musi być na końcu
    { path: '**', redirectTo: '' }
];