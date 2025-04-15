// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ServicemanLoginComponent } from './auth/login/serviceman-login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { BikeServiceRegistrationComponent } from './auth/registration/bike-service-registration.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ServicePanelComponent } from './service-panel/service-panel.component';
import { authGuard, clientGuard, serviceGuard, adminGuard } from './auth/auth.guard';
import { BicyclesListComponent } from './bicycles/bicycles-list/bicycles-list.component';
import { BicycleFormComponent } from './bicycles/bicycle-form/bicycle-form.component';
import { BicycleDetailsComponent } from './bicycles/bicycle-details/bicycle-details.component';
import { ServiceOrderFormComponent } from './service-orders/service-order-form/service-order-form.component';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AccountComponent } from './account/account.component';
import { ServiceAppointmentsComponent } from './service-orders/service-appointments/service-appointments.component';

// Create the AdminServiceOrdersComponent if it doesn't exist yet
// You'll need to create the directory structure: src/app/admin/service-orders/

export const routes: Routes = [
    // Auth routes
    {path: 'login', component: LoginComponent},
    {path: 'login-serviceman', component: ServicemanLoginComponent},
    {path: 'register', component: RegistrationComponent, data: { userType: 'client' }},
    {path: 'register-serviceman', component: BikeServiceRegistrationComponent},
    
    // Client routes
    {path: 'welcome', component: WelcomeComponent, canActivate: [clientGuard]},
    {path: 'bicycles', component: BicyclesListComponent, canActivate: [clientGuard]},
    {path: 'bicycles/add', component: BicycleFormComponent, canActivate: [clientGuard]},
    {path: 'bicycles/:id', component: BicycleDetailsComponent, canActivate: [clientGuard]},
    {path: 'bicycles/:id/order-service', component: ServiceOrderFormComponent, canActivate: [clientGuard]},
    {path: 'service-appointments', component: ServiceAppointmentsComponent, canActivate: [clientGuard]},
    
    // Service routes
    {path: 'service-panel', component: ServicePanelComponent, canActivate: [serviceGuard]},
    
    // Admin routes
    {path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard]},
    {path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [adminGuard]},
    // Temporarily comment this out until we create the component
    // {path: 'service-orders', component: AdminServiceOrdersComponent, canActivate: [adminGuard]},
    
    // Shared routes (available to all authenticated users)
    {path: 'account', component: AccountComponent, canActivate: [authGuard]},
    
    // Default route
    {path: '', redirectTo: 'login', pathMatch: 'full'}
];