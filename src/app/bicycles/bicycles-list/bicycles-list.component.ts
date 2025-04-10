import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BicycleService } from '../bicycle.service';
import { Bicycle } from '../bicycle.model';
import { NotificationService } from '../../core/notification.service';

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
  
  bicycles: Bicycle[] = [];
  loading = true;
  error: string | null = null;
  timestamp = Date.now();
  
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
}