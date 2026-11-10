import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceProfileTitleResolver implements Resolve<string> {
  resolve(route: ActivatedRouteSnapshot): string | Observable<string> {
    const suffix = route.paramMap.get('suffix');
    const section = route.data['section'] as string | undefined;

    if (!suffix) {
      return 'Serwis Rowerowy';
    }

    // Return fallback title directly - could be enhanced to fetch actual service name
    return this.getFallbackTitle(suffix, section);
  }

  private getFallbackTitle(suffix: string, section?: string): string {
    // Tytuł tymczasowy (zanim komponent ustawi właściwy po załadowaniu danych).
    // Nie budujemy go ze sluga – wyglądało to jak "Nartyrowerykrakow - Serwis Rowerowy".
    if (section === 'pricelist') {
      return 'Cennik serwisu rowerowego | CycloPick';
    } else if (section === 'hours') {
      return 'Godziny otwarcia serwisu rowerowego | CycloPick';
    } else {
      return 'Serwis rowerowy | CycloPick';
    }
  }
}