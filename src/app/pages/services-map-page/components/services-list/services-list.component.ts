import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MapService } from '../../services/map.service';
import { LogoCacheService } from '../../services/logo-cache.service';
import { Router } from '@angular/router';
import { MapPin } from '../../../../shared/models/map.models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesListComponent implements OnDestroy {
  private readonly DEFAULT_LOGO = 'assets/images/cyclopick-logo.svg';
  private destroy$ = new Subject<void>();

  // Virtual scrolling configuration
  readonly itemSize = 220; // Approximate height of each service item in pixels

  @Input() services: MapPin[] = [];
  @Input() set servicesInput(value: MapPin[]) {
      this.services = value;
    if (value && value.length > 0) {
      this.logoCacheService.preloadBatch(value);
    }
  }
  @Input() selectedServiceId: number | null = null;
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() hasMoreServices = false;
  @Input() error = false;
  @Input() totalServices = 0;
  @Input() currentPage = 0;
  @Input() totalPages = 0;

  // Outputs
  @Output() serviceSelected = new EventEmitter<MapPin>();
  @Output() serviceDetailsRequested = new EventEmitter<MapPin>();
  @Output() scrollEnd = new EventEmitter<void>();
  @Output() retryRequested = new EventEmitter<void>();

  // Wstrzyknięcie MapService i Router
  constructor(
    private mapService: MapService,
    private router: Router,
    private logoCacheService: LogoCacheService
  ) {}

  // Virtual scroll index changed - trigger load more when near end
  onScrollIndexChange(index: number): void {
    // Trigger load more when user is within 5 items from the end
    const nearEnd = index >= this.services.length - 5;

    if (nearEnd && this.hasMoreServices && !this.loadingMore) {
      this.scrollEnd.emit();
    }
  }

  onServiceClick(service: MapPin): void {
    this.serviceSelected.emit(service);
  }

  /**
   * Obsługa kliknięcia przycisku "Zobacz szczegóły".
   * Pobiera sufiks URL dla serwisu i nawiguje do strony szczegółów.
   */
  onViewDetails(service: MapPin, event: Event): void {
    event.stopPropagation();
    this.serviceDetailsRequested.emit(service);

    // Zabezpieczenie na wypadek, gdyby przycisk został jakimś cudem kliknięty,
    // choć serwis nie jest zweryfikowany.
    if (!this.isVerified(service)) {
      return;
    }

    // Pobieranie sufiksu z serwisu mapy
    this.mapService.getServiceSuffix(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.suffix) {
            const suffix = response.suffix;

            // Nawigacja do strony szczegółów
            this.router.navigate([suffix]);

          } else {
            console.error('List: Could not retrieve suffix for service:', service.id);
            // Używamy konsoli zamiast alertu zgodnie z zasadami Canvas
            // W prawdziwej aplikacji użylibyśmy toastu/modalu
            // alert('Nie udało się pobrać linku do serwisu. Spróbuj ponownie.');
          }
        },
        error: (err) => {
          console.error('List: Error during suffix fetch:', err);
          // alert('Wystąpił błąd podczas pobierania szczegółów serwisu.');
        }
      });
  }

  onRetry(): void {
    this.retryRequested.emit();
  }

  isVerified(service: MapPin): boolean {
    // Sprawdzamy, czy serwis jest zweryfikowany
    return service.verified === true;
  }

  showServiceTags(service: MapPin): boolean {
    // Sprawdzamy, czy ma jakąkolwiek informację o weryfikacji/statusie
    return service.verified !== undefined;
  }

  trackByServiceId(index: number, service: MapPin): number {
    return service.id;
  }

  buildAddress(service: MapPin): string {
    if (service.address && service.address.trim()) {
      return service.address;
    }
    return service.name || 'Serwis rowerowy';
  }

  getServiceLogo(service: MapPin): string {
    return this.logoCacheService.getLogoUrl(service.id, service.logoUrl);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (!target) return;

    const serviceIdAttr = target.getAttribute('data-service-id');
    const serviceId = serviceIdAttr ? parseInt(serviceIdAttr) : null;

    if (serviceId) {
      this.logoCacheService.markAsInvalid(serviceId);
      target.src = this.logoCacheService.getLogoUrl(serviceId);
    } else {
      // Fallback if serviceId couldn't be parsed
      target.src = this.DEFAULT_LOGO;
    }
    target.onerror = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
