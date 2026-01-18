// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch, withJsonpSupport } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { routes } from './app.routes';
import { I18nService } from './core/i18n.service';
import { authInterceptor } from './auth/auth.interceptor';
import { errorInterceptor } from './core/error.interceptor';

/**
 * Funkcja inicjalizująca - ładuje tłumaczenia przed startem aplikacji
 */
export function initializeI18n(i18nService: I18nService) {
  return (): Promise<any> => {
    console.log('🌍 Initializing i18n...');
    return i18nService.loadTranslations('pl')
      .toPromise()
      .then(() => {
        console.log('✅ i18n initialized successfully');
      })
      .catch((err) => {
        console.error('❌ Failed to initialize i18n:', err);
      });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
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

    // DODANE: APP_INITIALIZER dla i18n
    {
      provide: APP_INITIALIZER,
      useFactory: initializeI18n,
      deps: [I18nService],
      multi: true
    }
  ]
};