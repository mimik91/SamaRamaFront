// src/app/core/i18n.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private translations: any = {};
  private currentLang = 'pl';
  private loaded = false;

  constructor(private http: HttpClient) {
    console.log('🔧 I18nService initialized');
  }

  /**
   * Ładowanie tłumaczeń – wywoływane z APP_INITIALIZER
   */
  loadTranslations(lang: string = 'pl'): Observable<any> {
    console.log(`📥 Loading translations for: ${lang}`);
    
    this.currentLang = lang;

    return this.http.get(`/assets/i18n/${lang}.json`).pipe(
      tap((data: any) => {
        console.log('✅ Translations loaded:', Object.keys(data));
        this.translations = data;
        this.loaded = true;
      }),
      catchError(err => {
        console.error('❌ Failed to load translations:', err);
        console.error('   Attempted path: /assets/i18n/' + lang + '.json');
        this.translations = {};
        this.loaded = false;
        return of({});
      })
    );
  }

  /**
   * Tłumaczenie klucza (z obsługą zagnieżdżeń)
   */
  translate(key: string, params?: Record<string, any>): any {
    if (!this.loaded) {
      console.warn(`⚠️ Translations not loaded yet, returning key: ${key}`);
      return key;
    }

    const keys = key.split('.');
    let value: any = this.translations;

    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        console.warn(`⚠️ Translation key not found: ${key}`);
        return key;
      }
    }

    // Tablice (np. listy typów rowerów)
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      console.warn(`⚠️ Translation value is not a string: ${key}`, value);
      return key;
    }

    let result = value;

    // Parametry {param}
    if (params) {
      Object.keys(params).forEach(param => {
        result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
      });
    }

    return result;
  }

  /**
   * Alias – zgodny z ngx-translate
   */
  instant(key: string, params?: Record<string, any>): any {
    return this.translate(key, params);
  }

  /**
   * Zmiana języka (na przyszłość)
   */
  changeLanguage(lang: string): Observable<any> {
    this.loaded = false;
    return this.loadTranslations(lang);
  }

  /**
   * Informacja czy tłumaczenia są gotowe
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Debugowanie - pokaż wszystkie załadowane klucze
   */
  debugTranslations(): void {
    console.log('🔍 Current translations:', this.translations);
    console.log('📊 Loaded:', this.loaded);
    console.log('🌍 Current lang:', this.currentLang);
  }
}