import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceProfileTitleResolver implements Resolve<string> {
  resolve(route: ActivatedRouteSnapshot): string | Observable<string> {
    const suffix = route.paramMap.get('suffix');
    
    // Tutaj mógłbyś wstrzyknąć serwis API i pobrać nazwę:
    // return this.bikeService.getPublicInfo(suffix).pipe(map(s => s.name));
    
    return `${suffix} - Serwis Rowerowy`; 
  }
}