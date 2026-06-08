import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapStateService {
  private readonly _servicesListUrl = new BehaviorSubject<string>('/serwisy');
  readonly servicesListUrl$ = this._servicesListUrl.asObservable();

  setServicesListUrl(url: string): void {
    this._servicesListUrl.next(url);
  }

  reset(): void {
    this._servicesListUrl.next('/serwisy');
  }
}
