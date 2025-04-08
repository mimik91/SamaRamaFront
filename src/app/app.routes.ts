// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ServicemanLoginComponent } from './auth/login/serviceman-login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { BikeServiceRegistrationComponent } from './auth/registration/bike-service-registration.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ServicePanelComponent } from './service-panel/service-panel.component';
import { authGuard, clientGuard, serviceGuard } from './auth/auth.guard';
import { BicyclesListComponent } from './bicycles/bicycles-list/bicycles-list.component';
import { BicycleFormComponent } from './bicycles/bicycle-form/bicycle-form.component';
import { BicycleDetailsComponent } from './bicycles/bicycle-details/bicycle-details.component';

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
    
    // Service routes
    {path: 'service-panel', component: ServicePanelComponent, canActivate: [serviceGuard]},
    
    // Default route
    {path: '', redirectTo: 'login', pathMatch: 'full'}
];