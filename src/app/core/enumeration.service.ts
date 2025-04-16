import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, catchError, map, of, shareReplay, switchMap } from 'rxjs';
import { OrderStatus, ServicePackageInfo } from '../service-orders/service-order.model';
import { ServicePackage } from '../service-package/service-package.model';

@Injectable({
  providedIn: 'root'
})
export class EnumerationService {
  private apiUrl = 'http://localhost:8080/api/enumerations';
  private http = inject(HttpClient);
  
  // Cache dla wszystkich wartości
  private enumerationsCache$: Observable<Record<string, string[]>> | null = null;
  
  // Cache dla poszczególnych typów
  private typeCache: Record<string, Observable<string[]>> = {};

  // Cache dla pakietów serwisowych - poprawienie typu
  private servicePackagesCache$: Observable<Record<string, ServicePackageInfo>> | null = null;
  
  // Cache dla statusów zamówień
  private orderStatusCache$: Observable<OrderStatus[]> | null = null;
  
  // Cache dla typów pakietów
  private servicePackageTypesCache$: Observable<string[]> | null = null;

  constructor() {}
  
  /**
   * Pobiera wszystkie wartości dla wszystkich typów
   */
  getAllEnumerations(): Observable<Record<string, string[]>> {
    if (!this.enumerationsCache$) {
      this.enumerationsCache$ = this.http.get<Record<string, string[]>>(this.apiUrl)
        .pipe(
          map(data => {
            // Sortowanie wszystkich list
            const sortedData: Record<string, string[]> = {};
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                sortedData[key] = [...data[key]].sort((a, b) => 
                  a.localeCompare(b, undefined, {sensitivity: 'base'})
                );
              }
            }
            return sortedData;
          }),
          shareReplay(1),
          catchError(error => {
            console.error('Error fetching enumerations:', error);
            return of({});
          })
        );
    }
    
    return this.enumerationsCache$;
  }
  
  /**
   * Pobiera wartości dla konkretnego typu
   * @param type Typ (BRAND, BIKE_TYPE, FRAME_MATERIAL)
   */
  getEnumeration(type: string): Observable<string[]> {
    if (!this.typeCache[type]) {
      this.typeCache[type] = this.http.get<string[]>(`${this.apiUrl}/${type}`)
        .pipe(
          map(values => {
            // Sortowanie alfabetyczne z uwzględnieniem diakrytyków
            return [...values].sort((a, b) => 
              a.localeCompare(b, undefined, {sensitivity: 'base'})
            );
          }),
          shareReplay(1),
          catchError(error => {
            console.error(`Error fetching enumeration ${type}:`, error);
            return of([]);
          })
        );
    }
    
    return this.typeCache[type];
  }
  
  /**
   * Pobiera metadane dla danego typu enumeracji
   * @param type Typ enumeracji
   */
  getEnumerationMetadata(type: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${type}/metadata`)
      .pipe(
        shareReplay(1),
        catchError(error => {
          console.error(`Error fetching metadata for ${type}:`, error);
          return of({});
        })
      );
  }
  
  /**
   * Pobiera dostępne typy pakietów serwisowych
   */
  getServicePackageTypes(): Observable<string[]> {
    if (!this.servicePackageTypesCache$) {
      this.servicePackageTypesCache$ = this.getEnumeration('SERVICE_PACKAGE');
    }
    
    return this.servicePackageTypesCache$;
  }
  
  /**
   * Pobiera dozwolone statusy zamówień
   */
  getOrderStatusValues(): Observable<OrderStatus[]> {
    if (!this.orderStatusCache$) {
      this.orderStatusCache$ = this.getEnumeration('ORDER_STATUS') as Observable<OrderStatus[]>;
    }
    
    return this.orderStatusCache$;
  }
  
  /**
   * Pobiera informacje o pakietach serwisowych
   */
  getServicePackages(): Observable<Record<string, ServicePackageInfo>> {
    if (!this.servicePackagesCache$) {
      // Pobierz typy pakietów 
      const packagesTypes$ = this.getServicePackageTypes();
      
      // Pobierz cennik pakietów
      const packagePrices$ = this.getEnumerationMetadata('SERVICE_PACKAGE_PRICES');
      
      // Tworzymy funkcję pomocniczą do pobierania szczegółów pakietu
      const getPackageDetails = (packageType: string): Observable<[string, string[], any]> => {
        const packageKey = `SERVICE_PACKAGE_${packageType}`;
        // Pobierz listę funkcji
        const features$ = this.getEnumeration(packageKey);
        // Pobierz metadane pakietu (nazwę, opis)
        const metadata$ = this.getEnumerationMetadata(packageKey);
        
        return forkJoin([features$, metadata$]).pipe(
          map(([features, metadata]) => [packageType, features, metadata])
        );
      };
      
      // Pobieramy szczegóły wszystkich pakietów
      this.servicePackagesCache$ = forkJoin([
        packagesTypes$,
        packagePrices$
      ]).pipe(
        // Dla każdego typu pakietu, pobierz jego szczegóły
        switchMap(([packageTypes, prices]) => {
          const requests = packageTypes.map(type => getPackageDetails(type));
          
          return forkJoin(requests).pipe(
            map(packagesWithFeatures => {
              const packages: Record<string, ServicePackageInfo> = {};
              
              // Tworzenie obiektów ServicePackageInfo
              packagesWithFeatures.forEach(([type, features, metadata]) => {
                packages[type] = {
                  type: type,
                  name: metadata?.name || type,
                  price: prices[type] || 0,
                  description: metadata?.description || '',
                  features: features
                };
              });
              
              return packages;
            })
          );
        }),
        // Obsługa błędów
        catchError(error => {
          console.error('Error fetching service packages:', error);
          return of({} as Record<string, ServicePackageInfo>);
        }),
        // Cache'ujemy wynik
        shareReplay(1)
      );
    }
    
    return this.servicePackagesCache$;
  }
  
  clearCache(): void {
    this.enumerationsCache$ = null;
    this.typeCache = {};
    this.servicePackagesCache$ = null;
    this.orderStatusCache$ = null;
    this.servicePackageTypesCache$ = null;
  }
}