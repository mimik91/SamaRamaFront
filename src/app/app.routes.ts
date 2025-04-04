// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ServicemanLoginComponent } from './auth/login/serviceman-login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ServicePanelComponent } from './service-panel/service-panel.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'login-serviceman', component: ServicemanLoginComponent},
    {path: 'register', component: RegistrationComponent, data: { userType: 'client' }},
    {path: 'register-serviceman', component: RegistrationComponent, data: { userType: 'serviceman' }},
    {path: 'welcome', component: WelcomeComponent, canActivate: [authGuard]},
    {path: 'service-panel', component: ServicePanelComponent, canActivate: [authGuard]},
    {path: '', redirectTo: 'login', pathMatch: 'full'}
];