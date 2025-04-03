import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ServicemanLoginComponent } from './auth/login/serviceman-login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { WelcomePage } from './welcome/welcome-page';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login-serviceman', component: ServicemanLoginComponent },
  {
    path: 'register',
    component: RegistrationComponent,
    data: { userType: 'client' },
  },
  {
    path: 'register-serviceman',
    component: RegistrationComponent,
    data: { userType: 'serviceman' },
  },
  { path: 'welcome', component: WelcomePage, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
