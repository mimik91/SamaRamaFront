import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ServiceProfileService } from './service-profile.service';
import {
  BikeServicePublicInfo,
  ServiceActiveStatus
} from '../../shared/models/bike-service-common.models';
import { OpeningHoursWithInfoDto } from '../../shared/models/opening-hours.models';
import { ServicePricelistDto, CategoryWithItemsDto } from '../../shared/models/service-pricelist.models';
import { ServicePackagesConfigDto } from '../../shared/models/service-packages.models';

/**
 * Dane rozwiązane przez resolver - dostępne w komponencie przez route.data
 */
export interface ServiceProfileResolvedData {
  serviceId: number;
  publicInfo: BikeServicePublicInfo;
  activeStatus: ServiceActiveStatus;
  openingHours: OpeningHoursWithInfoDto | null;
  pricelist: ServicePricelistDto | null;
  availableItems: CategoryWithItemsDto[];
  packagesConfig: ServicePackagesConfigDto | null;
  bikeTypes: string[];
}

/**
 * Resolver dla profilu serwisu
 *
 * Angular Universal czeka na zakończenie resolvera przed wysłaniem HTML,
 * dzięki czemu AI crawlery (ChatGPT, Gemini, Claude) widzą pełne dane w HTML.
 */
@Injectable({ providedIn: 'root' })
export class ServiceProfileResolver implements Resolve<ServiceProfileResolvedData | null> {
  private profileService = inject(ServiceProfileService);
  private router = inject(Router);

  resolve(route: ActivatedRouteSnapshot): Observable<ServiceProfileResolvedData | null> {
    const suffix = route.paramMap.get('suffix');

    if (!suffix) {
      console.error('[ServiceProfileResolver] Brak suffixu w URL');
      return of(null);
    }

    // Krok 1: Pobierz ID serwisu na podstawie suffixu
    return this.profileService.getServiceIdBySuffix(suffix).pipe(
      switchMap(response => {
        const serviceId = response.id;

        // Krok 2: Pobierz podstawowe dane (publicInfo i activeStatus) równolegle
        return forkJoin({
          publicInfo: this.profileService.getPublicInfo(serviceId),
          activeStatus: this.profileService.getActiveStatus(serviceId)
        }).pipe(
          switchMap(({ publicInfo, activeStatus }) => {
            // Krok 3: Warunkowo pobierz dodatkowe dane
            const additionalData$: {
              openingHours: Observable<OpeningHoursWithInfoDto | null>;
              pricelist: Observable<ServicePricelistDto | null>;
              availableItems: Observable<CategoryWithItemsDto[]>;
              packagesConfig: Observable<ServicePackagesConfigDto | null>;
              bikeTypes: Observable<string[]>;
            } = {
              openingHours: of(null),
              pricelist: of(null),
              availableItems: of([]),
              packagesConfig: of(null),
              bikeTypes: of([])
            };

            // Godziny otwarcia
            if (activeStatus?.openingHoursActive) {
              additionalData$.openingHours = this.profileService.getOpeningHours(serviceId).pipe(
                catchError(() => of(null))
              );
            }

            // Cennik i pakiety
            if (activeStatus?.pricelistActive) {
              additionalData$.pricelist = this.profileService.getPricelist(serviceId).pipe(
                catchError(() => of(null))
              );

              additionalData$.availableItems = this.profileService.getAllAvailableItems().pipe(
                catchError(() => of([]))
              );

              additionalData$.packagesConfig = this.profileService.getPackagesConfig(serviceId).pipe(
                catchError(() => of(null))
              );

              additionalData$.bikeTypes = this.profileService.getBikeTypes(serviceId).pipe(
                catchError(() => of([]))
              );
            }

            // Pobierz wszystkie dodatkowe dane równolegle
            return forkJoin(additionalData$).pipe(
              map(additionalData => ({
                serviceId,
                publicInfo,
                activeStatus,
                openingHours: additionalData.openingHours,
                pricelist: additionalData.pricelist,
                availableItems: additionalData.availableItems,
                packagesConfig: additionalData.packagesConfig,
                bikeTypes: additionalData.bikeTypes
              }))
            );
          })
        );
      }),
      catchError(err => {
        console.error('[ServiceProfileResolver] Błąd pobierania danych:', err);
        // Przekieruj na stronę główną przy błędzie
        this.router.navigate(['/']);
        return of(null);
      })
    );
  }
}
