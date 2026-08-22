import {
  Component, EventEmitter, Input, Output, OnDestroy,
  inject, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MapService } from '../../../pages/services-map-page/services/map.service';
import { MapPin, formatCompletedOrdersLabel } from '../../models/map.models';
import { formatServiceDurationBucket } from '../../../service-records/service-duration.util';

/**
 * Lista wyników wyszukiwania serwisów (karty + load more) — współdzielona między stroną główną (/)
 * i stronami miast (/serwisy/:city). Sama obsługuje nawigację z karty (profil/rezerwacja/
 * rejestracja/pokaż na mapie); rodzic odpowiada tylko za dostarczenie danych i paginację.
 */
@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesListComponent implements OnDestroy {
  private router = inject(Router);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @Input() services: MapPin[] = [];
  @Input() loading = false;
  @Input() error = false;
  @Input() totalServices = 0;
  @Input() hasMore = false;
  @Input() loadingMore = false;
  /** Dopisek do nagłówka "Znaleziono N serwisów rowerowych ___", np. "w Krakowie" (puste = brak dopisku) */
  @Input() resultsSuffix = '';

  @Output() loadMoreRequested = new EventEmitter<void>();

  loadingAction: { serviceId: number; type: string } | null = null;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isServiceLoading(serviceId: number): boolean {
    return this.loadingAction?.serviceId === serviceId;
  }

  isLoadingAction(serviceId: number, type: string): boolean {
    return this.loadingAction?.serviceId === serviceId && this.loadingAction?.type === type;
  }

  onLoadMore(): void {
    if (!this.loadingMore && this.hasMore) {
      this.loadMoreRequested.emit();
    }
  }

  navigateToServiceOnMap(service: MapPin): void {
    this.router.navigate(['/mapa-serwisow'], {
      queryParams: { lat: service.latitude, lng: service.longitude, zoom: '16' }
    });
  }

  navigateToServicePage(service: MapPin): void {
    if (this.isServiceLoading(service.id)) return;
    this.loadingAction = { serviceId: service.id, type: 'profile' };
    this.cdr.markForCheck();
    this.mapService.getServiceSuffix(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingAction = null;
          this.cdr.markForCheck();
          if (response?.suffix) {
            this.router.navigate([response.suffix]);
          }
        },
        error: () => {
          this.loadingAction = null;
          this.cdr.markForCheck();
        }
      });
  }

  navigateToReservation(service: MapPin): void {
    if (this.isServiceLoading(service.id)) return;
    this.loadingAction = { serviceId: service.id, type: 'reserve' };
    this.cdr.markForCheck();
    this.mapService.getServiceSuffix(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingAction = null;
          this.cdr.markForCheck();
          if (response?.suffix) {
            this.router.navigate(['/', response.suffix, 'zarezerwuj'], {
              state: { serviceId: service.id }
            });
          }
        },
        error: () => {
          this.loadingAction = null;
          this.cdr.markForCheck();
        }
      });
  }

  registerService(service: MapPin): void {
    this.router.navigate(['/register-service'], {
      queryParams: {
        serviceId: service.id,
        serviceName: service.name,
        phoneNumber: service.phoneNumber || '',
        email: service.email || ''
      }
    });
  }

  trackByServiceId(index: number, service: MapPin): number {
    return service.id;
  }

  formatDuration(hours: number | null | undefined): string {
    return formatServiceDurationBucket(hours);
  }

  formatCompletedOrders(count: number): string {
    return formatCompletedOrdersLabel(count);
  }
}
