// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch, withJsonpSupport } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { errorInterceptor } from './core/error.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    
    // HttpClient z WSZYSTKIMI twoimi interceptorami
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withFetch(),
      withJsonpSupport() // Dodaj wsparcie dla JSONP, pomocne przy problemach z CORS
    ),
    
    provideAnimations(),

    // SSR Hydration - pozwala na transfer danych HTTP między serwerem a klientem
    provideClientHydration(
      withHttpTransferCacheOptions({
        includePostRequests: true  // MapService używa POST dla /map/services
      })
    ),

  ]
};