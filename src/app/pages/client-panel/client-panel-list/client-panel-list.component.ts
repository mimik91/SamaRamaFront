import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActiveServiceOrderCard, ActiveTransportResponse, BicycleService } from '../bicycle.service';
import { Bicycle } from '../../../shared/models/bicycle.model';
import { NotificationService } from '../../../core/notification.service';
import { BicycleSelectionService } from '../bicycle-selection.service';
import { CalendarOrderStatus, getStatusColor } from '../../../shared/models/service-calendar.models';
import { getTransportStatusColor } from '../../../core/models/transport-order-status.util';

export interface BikeStatusBadge {
  label: string;
  color: string;
}

@Component({
  selector: 'app-client-panel-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-panel-list.component.html',
  styleUrls: ['./client-panel-list.component.css']
})
export class ClientPanelListComponent implements OnInit {
  private bicycleService = inject(BicycleService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private bicycleSelectionService = inject(BicycleSelectionService);

  bicycles: Bicycle[] = [];
  loading = true;
  error: string | null = null;
  timestamp = Date.now();

  get activeBicycles(): Bicycle[] {
    return this.bicycles.filter(b => !b.stolen);
  }

  get stolenBicycles(): Bicycle[] {
    return this.bicycles.filter(b => b.stolen);
  }

  // New state for multi-select
  isMultiSelectMode = false;
  selectedBicycles: Set<number> = new Set();

  private activeServiceOrdersByBikeId = new Map<number, ActiveServiceOrderCard>();
  private activeTransportsByBikeId = new Map<number, ActiveTransportResponse>();

  ngOnInit(): void {
    this.loadBicycles();
  }

  loadBicycles(): void {
    this.loading = true;
    this.error = null;
    this.timestamp = Date.now();

    this.bicycleService.getUserBicycles().subscribe({
      next: (bicycles) => {
        this.bicycles = bicycles;
        this.loading = false;
        this.loadStatusBadges(bicycles);
      },
      error: (err) => {
        this.error = 'Nie udało się załadować rowerów. Spróbuj ponownie później.';
        if (err.status === 403) {
          this.error = 'Brak uprawnień do wyświetlenia rowerów.';
        }
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }

  /** Odznaki statusu (zlecenie/transport) — dociągane osobno, nie blokują renderu listy. */
  private loadStatusBadges(bicycles: Bicycle[]): void {
    const activeBicycles = bicycles.filter(b => !b.stolen);
    if (activeBicycles.length === 0) return;

    forkJoin({
      orders: this.bicycleService.getActiveServiceOrders().pipe(catchError(() => of([] as ActiveServiceOrderCard[]))),
      transports: forkJoin(
        activeBicycles.map(b => this.bicycleService.getActiveBicycleTransport(b.id).pipe(
          map(resp => ({ bikeId: b.id, resp })),
          catchError(() => of({ bikeId: b.id, resp: null as ActiveTransportResponse | null }))
        ))
      )
    }).subscribe(({ orders, transports }) => {
      this.activeServiceOrdersByBikeId = new Map(
        orders.filter((o): o is ActiveServiceOrderCard & { bicycleId: number } => o.bicycleId != null)
          .map(o => [o.bicycleId, o])
      );
      this.activeTransportsByBikeId = new Map(
        transports
          .filter(t => t.resp?.hasActiveTransport && t.resp.transport?.status !== 'DELIVERED')
          .map(t => [t.bikeId, t.resp!])
      );
    });
  }

  /** Priorytet: status zlecenia serwisowego > status transportu, gdy oba są aktywne. */
  getBikeStatusBadge(bicycleId: number): BikeStatusBadge | null {
    const order = this.activeServiceOrdersByBikeId.get(bicycleId);
    if (order) {
      return { label: order.statusDisplayName, color: getStatusColor(order.status as CalendarOrderStatus) };
    }

    const transport = this.activeTransportsByBikeId.get(bicycleId)?.transport;
    if (transport) {
      return {
        label: transport.statusDisplayName || transport.status || '',
        color: getTransportStatusColor(transport.status)
      };
    }

    return null;
  }

  getBicyclePhotoUrl(bicycleId: number): string {
    return `${this.bicycleService.getBicyclePhotoUrl(bicycleId)}?t=${this.timestamp}`;
  }

  handleImageError(event: Event, bicycle: Bicycle): void {
    bicycle.mainPhotoUrl = null;
  }

  viewBicycleDetails(bicycleId: number): void {
    // If in multi-select mode, toggle selection instead of navigating
    if (this.isMultiSelectMode) {
      this.toggleBicycleSelection(bicycleId);
      return;
    }

    this.router.navigate(['/bicycles', bicycleId]);
  }

  goToAddBicycle(): void {
    this.router.navigate(['/bicycles/add']);
  }

  deleteBicycle(bicycleId: number): void {
    if (!bicycleId) {
      this.notificationService.error('Nie można usunąć roweru: nieprawidłowe ID');
      return;
    }

    // Znajdź rower w tablicy, aby sprawdzić, czy jest kompletny
    const bicycle = this.bicycles.find(b => b.id === bicycleId);

    if (!bicycle) {
      this.notificationService.error('Nie znaleziono roweru do usunięcia');
      return;
    }

    const isComplete = !!bicycle.frameNumber;

    if (window.confirm('Czy na pewno chcesz usunąć ten rower? Tej operacji nie można cofnąć.')) {
      this.bicycleService.deleteBicycle(bicycleId, isComplete).subscribe({
        next: () => {
          this.notificationService.success('Rower został usunięty');
          this.loadBicycles();
        },
        error: (error) => {
          console.error('Błąd podczas usuwania roweru:', error);
          this.notificationService.error('Nie udało się usunąć roweru. Spróbuj ponownie później.');
        }
      });
    }
  }

  toggleStolen(bicycle: Bicycle, event: Event): void {
    event.stopPropagation();
    const newValue = !bicycle.stolen;
    const msg = newValue ? 'Czy na pewno chcesz zgłosić ten rower jako skradziony?' : 'Czy chcesz cofnąć zgłoszenie kradzieży?';
    if (!window.confirm(msg)) return;

    this.bicycleService.updateStolenStatus(bicycle.id, newValue).subscribe({
      next: (res) => {
        bicycle.stolen = newValue;
        const backendMsg = res?.message;
        const defaultMsg = newValue ? 'Rower zgłoszony jako skradziony' : 'Zgłoszenie kradzieży cofnięte';
        this.notificationService.success(backendMsg || defaultMsg);
      },
      error: (err) => {
        const backendMsg = err?.error?.message;
        this.notificationService.error(backendMsg || 'Nie udało się zaktualizować statusu roweru');
      }
    });
  }

  // Toggle multi-select mode
  toggleMultiSelectMode(): void {
    this.isMultiSelectMode = !this.isMultiSelectMode;

    // Clear selections when exiting multi-select mode
    if (!this.isMultiSelectMode) {
      this.selectedBicycles.clear();
    }
  }

  // Toggle selection of a bicycle
  toggleBicycleSelection(bicycleId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedBicycles.has(bicycleId)) {
      this.selectedBicycles.delete(bicycleId);
    } else {
      this.selectedBicycles.add(bicycleId);
    }
  }

  // Check if a bicycle is selected
  isBicycleSelected(bicycleId: number): boolean {
    return this.selectedBicycles.has(bicycleId);
  }

}
