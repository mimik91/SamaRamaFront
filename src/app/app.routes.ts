import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { authGuard, clientGuard, adminGuard } from './auth/auth.guard';
import { BicyclesListComponent } from './bicycles/bicycles-list/bicycles-list.component';
import { BicycleFormComponent } from './bicycles/bicycle-form/bicycle-form.component';
import { BicycleDetailsComponent } from './bicycles/bicycle-details/bicycle-details.component';
import { ServiceOrderFormComponent } from './service-orders/service-order-form/service-order-form.component';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminServiceOrdersComponent } from './admin/admin-orders/admin-service-orders.component';
import { AdminEnumerationsManagerComponent } from './admin/admin-enumerations/admin-enumerations-manager.component';
import { AdminServicePackagesComponent } from './admin/admin-service-packages/admin-service-package.component';
import { AccountComponent } from './account/account.component';
import { ServiceAppointmentsComponent } from './service-orders/service-appointments/service-appointments.component';

export const routes: Routes = [
    // Auth routes
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegistrationComponent, data: { userType: 'client' }},
    
    // Client routes
    {path: 'bicycles', component: BicyclesListComponent, canActivate: [clientGuard]},
    {path: 'bicycles/add', component: BicycleFormComponent, canActivate: [clientGuard]},
    {path: 'bicycles/:id', component: BicycleDetailsComponent, canActivate: [clientGuard]},
    
    // New route for service order without bicycle ID in URL
    {path: 'order-service', component: ServiceOrderFormComponent, canActivate: [clientGuard]},
    
    // Keep the old route for backward compatibility
    {path: 'bicycles/:id/order-service', component: ServiceOrderFormComponent, canActivate: [clientGuard]},
    
    {path: 'service-appointments', component: ServiceAppointmentsComponent, canActivate: [clientGuard]},
    
    // Admin routes
    {path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard]},
    {path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [adminGuard]},
    {path: 'service-orders', component: AdminServiceOrdersComponent, canActivate: [adminGuard]},
    {path: 'admin-enumerations', component: AdminEnumerationsManagerComponent, canActivate: [adminGuard]},
    {path: 'admin-service-packages', component: AdminServicePackagesComponent, canActivate: [adminGuard]},
    
    // Shared routes (available to all authenticated users)
    {path: 'account', component: AccountComponent, canActivate: [authGuard]},
    
    // Default route
    {path: '', redirectTo: 'login', pathMatch: 'full'}
];