import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import {
  PackageLevel,
  ServicePackageDto,
  ServicePackagesConfigDto,
  PackagesConfigSettingsDto,
  CreatePackageDto,
  UpdatePackageDto,
  PackagesByBikeType,
  filterPackagesByBikeType,
  groupPackagesByBikeType,
  getPackageLevelDisplayName,
  ALL_PACKAGE_LEVELS
} from '../../../shared/models/service-packages.models';

@Injectable({
  providedIn: 'root'
})
export class ServicePackagesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bikeServicesRegistered.base}`;

  /**
   * Pobiera konfigurację pakietów wraz z listą pakietów
   */
  getMyPackagesConfig(serviceId: number): Observable<ServicePackagesConfigDto> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<ServicePackagesConfigDto>(
      `${this.apiUrl}/my-service/packages-config`,
      { params }
    );
  }

  /**
   * Aktualizuje ustawienia konfiguracji pakietów (generalDescription, active)
   */
  updatePackagesConfigSettings(
    serviceId: number,
    settings: PackagesConfigSettingsDto
  ): Observable<any> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.put(
      `${this.apiUrl}/my-service/packages-config`,
      settings,
      { params }
    );
  }

  /**
   * Pobiera listę pakietów serwisu
   */
  getMyPackages(serviceId: number): Observable<ServicePackageDto[]> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<ServicePackageDto[]>(
      `${this.apiUrl}/my-service/packages`,
      { params }
    );
  }

  /**
   * Tworzy nowy pakiet
   */
  createPackage(
    serviceId: number,
    createDto: CreatePackageDto
  ): Observable<ServicePackageDto> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.post<ServicePackageDto>(
      `${this.apiUrl}/my-service/packages`,
      createDto,
      { params }
    );
  }

  /**
   * Aktualizuje istniejący pakiet
   */
  updatePackage(
    packageId: number,
    updateDto: UpdatePackageDto
  ): Observable<ServicePackageDto> {
    return this.http.put<ServicePackageDto>(
      `${this.apiUrl}/my-service/packages/${packageId}`,
      updateDto
    );
  }

  /**
   * Usuwa pakiet
   */
  deletePackage(packageId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/my-service/packages/${packageId}`
    );
  }

  /**
   * Pobiera wszystkie typy rowerów obsługiwane przez serwis
   */
  getBikeTypes(serviceId: number): Observable<string[]> {
    return this.http.get<string[]>(
      `${environment.apiUrl}/bike-services/coverages/bikeTypes/${serviceId}`
    );
  }

  /**
   * Pomocnicza metoda - grupuje pakiety według typu roweru
   */
  groupPackagesByBikeType(packages: ServicePackageDto[]): PackagesByBikeType[] {
    return groupPackagesByBikeType(packages);
  }

  /**
   * Pomocnicza metoda - filtruje pakiety według wybranego typu roweru
   */
  filterPackagesByBikeType(
    packages: ServicePackageDto[],
    selectedBikeType: string | null
  ): ServicePackageDto[] {
    return filterPackagesByBikeType(packages, selectedBikeType);
  }

  /**
   * Pomocnicza metoda - zwraca nazwę wyświetlaną dla poziomu pakietu
   */
  getPackageLevelDisplayName(level: PackageLevel): string {
    return getPackageLevelDisplayName(level);
  }

  /**
   * Pomocnicza metoda - zwraca wszystkie poziomy pakietów
   */
  getAllPackageLevels(): PackageLevel[] {
    return ALL_PACKAGE_LEVELS;
  }
}