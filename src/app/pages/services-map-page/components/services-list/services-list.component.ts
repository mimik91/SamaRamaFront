import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService } from '../../services/map.service';
import { Router } from '@angular/router';
import { MapPin } from '../../services/map.models';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.css']
})
export class ServicesListComponent {
  // Inputs
  @Input() services: MapPin[] = [];
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
  @Output() scrollEnd = new EventEmitter<void>();
  @Output() retryRequested = new EventEmitter<void>();

  // Wstrzyknięcie MapService i Router
  constructor(
    private mapService: MapService, 
    private router: Router
  ) {}

  // Logika przewijania (bez zmian)
  onScroll(event: any): void {
    const element = event.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5;
    
    console.log('Scroll event:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      atBottom,
      hasMore: this.hasMoreServices,
      loadingMore: this.loadingMore
    });
    
    if (atBottom && this.hasMoreServices && !this.loadingMore) {
      console.log('Triggering scrollEnd event - loading more services');
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
    
    // Zabezpieczenie na wypadek, gdyby przycisk został jakimś cudem kliknięty, 
    // choć serwis nie jest zweryfikowany.
    if (!this.isVerified(service)) {
      console.warn('Attempt to view details on unverified service.', service.id);
      return;
    }

    console.log(`List: View Details button clicked for service ID ${service.id}. Requesting suffix...`);
    
    // Pobieranie sufiksu z serwisu mapy
    this.mapService.getServiceSuffix(service.id).subscribe({
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
}