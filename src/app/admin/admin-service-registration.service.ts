import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { environment } from '../environments/environments';
import { ImageUtilsService } from '../core/image-utils.service';

export type AdminPackageLevel = 'BASIC' | 'ADVANCED' | 'FULL';

export interface AdminOpeningHoursInterval {
  openTime: string;
  closeTime: string;
}

export interface AdminOpeningHoursPayload {
  intervals: Record<string, AdminOpeningHoursInterval>;
  openingHoursInfo: string;
  openingHoursNote: string;
}

export interface AdminPackageItemPayload {
  packageLevel: AdminPackageLevel;
  customName: string | null;
  bikeTypes: string[];
  price: number;
  description: string | null;
  active: boolean;
}

export interface AdminPackagesPayload {
  generalDescription: string | null;
  comment: string | null;
  defaultBikeType: string | null;
  active: boolean;
  items: AdminPackageItemPayload[];
}

/** Body POST /admin/bike-services-registered/register */
export interface AdminServiceRegistrationRequest {
  name: string;
  suffix: string;
  email: string;
  phoneNumber: string | null;
  contactPerson: string | null;
  shortName: string | null;
  displayEmail: boolean;
  displayPhoneNumber: boolean;
  street: string;
  building: string;
  flat: string | null;
  postalCode: string;
  city: string;
  district: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  website: string | null;
  facebook: string | null;
  pricelistActive: boolean;
  openingHoursActive: boolean;
  reservationAvailable: boolean;
  openingHours: AdminOpeningHoursPayload | null;
  acceptedDays: string[];
  packages: AdminPackagesPayload | null;
}

export interface AdminServiceRegistrationResponse {
  id: number;
  name: string;
  suffix: string;
  /** ISO — kiedy wyjdzie mail powitalny (jutro 10:00). */
  welcomeEmailSendAt: string;
}

export interface AdminEmailExistsResponse {
  exists: boolean;
  reason: 'USER' | 'SERVICE_PIN' | null;
}

interface LogoUploadUrlResponse {
  imageId: string;
  uploadUrl: string | null;
  path: string;
}

/** HTTP dla kreatora „Zarejestruj serwis” w panelu admina. */
@Injectable({ providedIn: 'root' })
export class AdminServiceRegistrationService {
  private http = inject(HttpClient);
  private imageUtils = inject(ImageUtilsService);

  private readonly adminUrl = `${environment.apiUrl}${environment.endpoints.admin.base}`;
  private readonly publicUrl = `${environment.apiUrl}/bike-services`;

  private readonly HTTP_TIMEOUT = 30000;
  private readonly UPLOAD_TIMEOUT = 60000;
  private readonly UPLOAD_RETRIES = 3;

  getBikeTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.adminUrl}/bike-types`);
  }

  emailExists(email: string): Observable<AdminEmailExistsResponse> {
    return this.http.get<AdminEmailExistsResponse>(`${this.adminUrl}/users/email-exists`, {
      params: new HttpParams().set('email', email)
    });
  }

  /** true = suffix zajęty lub niepoprawny (jak w rejestracji przez serwis). */
  isSuffixTaken(suffix: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.publicUrl}/check-suffix`, { params: { suffix } });
  }

  isServiceNameTaken(serviceName: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.publicUrl}/check-service-name`, { params: { serviceName } });
  }

  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.publicUrl}/cities`);
  }

  getDistricts(city: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.publicUrl}/districts`, { params: { city } });
  }

  registerService(payload: AdminServiceRegistrationRequest): Observable<AdminServiceRegistrationResponse> {
    return this.http.post<AdminServiceRegistrationResponse>(
      `${this.adminUrl}/bike-services-registered/register`,
      payload
    );
  }

  /** Druga faza: kompresja → presigned URL (/admin/services/{id}/images) → PUT do R2. Rzuca Error z komunikatem. */
  async uploadLogo(serviceId: number, file: File): Promise<void> {
    const compressed = await this.imageUtils.compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      outputFormat: 'png'
    });
    const dimensions = await this.imageUtils.getImageDimensions(compressed);

    const response = await firstValueFrom(
      this.http
        .post<LogoUploadUrlResponse>(`${this.adminUrl}/services/${serviceId}/images`, {
          type: 'LOGO',
          fileName: `${serviceId}_LOGO`,
          mimeType: compressed.type,
          width: dimensions.width,
          height: dimensions.height,
          weight: Math.round(compressed.size / 1024),
          provider: 'R2'
        })
        .pipe(timeout(this.HTTP_TIMEOUT))
    ).catch(() => {
      throw new Error('Nie udało się wygenerować adresu do wysłania logo.');
    });

    if (!response?.uploadUrl) {
      throw new Error('Nie udało się wygenerować adresu do wysłania logo.');
    }

    await this.putToStorage(response.uploadUrl, compressed);
  }

  deleteLogo(serviceId: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/services/${serviceId}/images/LOGO`);
  }

  /**
   * PUT na presigned URL robimy przez fetch, nie HttpClient — interceptor dopisałby nagłówek
   * Authorization i unieważnił podpis (tak samo robi service-admin-images).
   */
  private async putToStorage(uploadUrl: string, file: File, attempt = 0): Promise<void> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.UPLOAD_TIMEOUT);
      const result = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Cache-Control': 'public, max-age=31536000, immutable'
        },
        body: file,
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!result.ok) {
        throw new Error(`Wysyłanie logo nie powiodło się (status ${result.status}).`);
      }
    } catch (error) {
      if (attempt < this.UPLOAD_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return this.putToStorage(uploadUrl, file, attempt + 1);
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Wysyłanie logo przekroczyło limit czasu.');
      }
      throw error instanceof Error ? error : new Error('Nie udało się wysłać logo.');
    }
  }
}
