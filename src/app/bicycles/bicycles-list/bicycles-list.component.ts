import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BicycleService } from '../bicycle.service';
import { Bicycle } from '../bicycle.model';
import { NotificationService } from '../../core/notification.service';
import { BicycleSelectionService } from '../bicycle-selection.service';

@Component({
  selector: 'app-bicycles-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bicycles-list.component.html',
  styleUrls: ['./bicycles-list.component.css']
})
export class BicyclesListComponent implements OnInit {
  private bicycleService = inject(BicycleService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private bicycleSelectionService = inject(BicycleSelectionService);
  
  bicycles: Bicycle[] = [];
  loading = true;
  error: string | null = null;
  timestamp = Date.now();
  
  // New state for multi-select
  isMultiSelectMode = false;
  selectedBicycles: Set<number> = new Set();
  
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
  
  getBicyclePhotoUrl(bicycleId: number): string {
    return `${this.bicycleService.getBicyclePhotoUrl(bicycleId)}?t=${this.timestamp}`;
  }
  
  handleImageError(event: Event, bicycle: Bicycle): void {
    bicycle.hasPhoto = false;
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
  
  // Order service for selected bicycles
  orderServiceForSelected(): void {
    if (this.selectedBicycles.size === 0) {
      this.notificationService.warning('Wybierz przynajmniej jeden rower, aby zamówić serwis');
      return;
    }
    
    // Get selected bicycles as objects
    const selectedBicycleObjects = this.bicycles.filter(b => this.selectedBicycles.has(b.id));
    
    // Store selected bicycles in the service
    this.bicycleSelectionService.selectBicycles(selectedBicycleObjects);
    
    // Navigate to order service page without bicycle ID in URL
    this.router.navigate(['/order-service']);
    
    // Exit multi-select mode
    this.isMultiSelectMode = false;
    this.selectedBicycles.clear();
  }
}