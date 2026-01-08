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
    const baseName = suffix.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    if (section === 'pricelist') {
      return `${baseName} - Cennik | CycloPick`;
    } else if (section === 'hours') {
      return `${baseName} - Godziny otwarcia | CycloPick`;
    } else {
      return `${baseName} - Serwis Rowerowy | CycloPick`;
    }
  }
}