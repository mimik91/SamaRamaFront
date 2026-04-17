// src/app/core/i18n.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import plTranslations from '../../assets/i18n/pl.json';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private translations: Record<string, any> = plTranslations;
  private currentLang = 'pl';
  private loaded = true;

  loadTranslations(lang: string = 'pl'): Observable<any> {
    this.currentLang = lang;
    return of(this.translations);
  }

  translate(key: string, params?: Record<string, any>): any {
    const keys = key.split('.');
    let value: any = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (Array.isArray(value)) return value;

    if (typeof value !== 'string') return key;

    if (params) {
      return Object.keys(params).reduce(
        (result: string, param: string) => result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param])),
        value
      );
    }

    return value;
  }

  instant(key: string, params?: Record<string, any>): any {
    return this.translate(key, params);
  }

  changeLanguage(lang: string): Observable<any> {
    this.currentLang = lang;
    return of(this.translations);
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
