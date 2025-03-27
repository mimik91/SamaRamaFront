import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegistrationComponent, data: { userType: 'client' }},
    {path: 'register-serviceman', component: RegistrationComponent, data: { userType: 'serviceman' }},
    {path: '', redirectTo: 'login', pathMatch: 'full'} // Optional: redirect to login by default
];