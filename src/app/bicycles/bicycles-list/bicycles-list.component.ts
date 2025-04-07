import { Component, OnInit, inject, ViewContainerRef, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BicycleService } from '../bicycle.service';
import { Bicycle } from '../bicycle.model';
import { NotificationService } from '../../core/notification.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-bicycles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DeleteDialogComponent],
  template: `
    <div class="bicycles-container">
      <h1>Twoje rowery</h1>
      
      <div class="action-bar">
        <button class="add-btn" (click)="goToAddBicycle()">Dodaj rower</button>
      </div>
      
      <div *ngIf="loading" class="loading-message">
        Ładowanie rowerów...
      </div>
      
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>
      
      <ng-container *ngIf="!loading && !error">
        <ng-container *ngIf="bicycles.length > 0; else noBicycles">
          <div class="bicycles-list">
            <div *ngFor="let bicycle of bicycles" class="bicycle-card">
              <div class="bicycle-image" *ngIf="bicycle.id">
                <img 
                  [src]="getBicyclePhotoUrl(bicycle.id)" 
                  alt="Zdjęcie roweru"
                  (error)="handleImageError($event)"
                >
              </div>
              <div class="bicycle-details">
                <h3>{{ bicycle.brand }} {{ bicycle.model || '' }}</h3>
                <p class="frame-number">Numer ramy: {{ bicycle.frameNumber || 'Nie podano' }}</p>
                <p *ngIf="bicycle.type">Typ: {{ bicycle.type }}</p>
                <p *ngIf="bicycle.frameMaterial">Materiał ramy: {{ bicycle.frameMaterial }}</p>
                <p *ngIf="bicycle.productionDate">Data produkcji: {{ bicycle.productionDate | date:'yyyy' }}</p>
              </div>
              <div class="bicycle-actions">
                <button class="delete-btn" (click)="deleteBicycle(bicycle.id)">Usuń</button>
              </div>
            </div>
          </div>
        </ng-container>
        
        <ng-template #noBicycles>
          <div class="no-bicycles">
            <p>Nie masz jeszcze dodanego roweru</p>
            <button class="add-btn-large" (click)="goToAddBicycle()">Dodaj rower</button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .bicycles-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    
    h1 {
      margin-bottom: 30px;
      color: #2c3e50;
      text-align: center;
    }
    
    .action-bar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    
    .add-btn, .delete-btn {
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .add-btn {
      background-color: #3498db;
      color: white;
      border: none;
      cursor: pointer;
    }
    
    .add-btn:hover {
      background-color: #2980b9;
    }
    
    .delete-btn {
      background-color: #e74c3c;
      color: white;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .delete-btn:hover {
      background-color: #c0392b;
    }
    
    .loading-message, .error-message {
      text-align: center;
      padding: 20px;
      border-radius: 4px;
    }
    
    .loading-message {
      background-color: #f8f9fa;
      color: #6c757d;
    }
    
    .error-message {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .bicycles-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .bicycle-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .bicycle-image {
      width: 120px;
      height: 120px;
      overflow: hidden;
      border-radius: 4px;
      margin-right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8f9fa;
    }
    
    .bicycle-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .bicycle-details {
      flex-grow: 1;
    }
    
    .bicycle-details h3 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }
    
    .frame-number {
      font-weight: 500;
      color: #7f8c8d;
    }
    
    .bicycle-details p {
      margin: 5px 0;
      color: #34495e;
    }
    
    .no-bicycles {
      text-align: center;
      padding: 40px 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    
    .no-bicycles p {
      font-size: 1.2rem;
      color: #6c757d;
      margin-bottom: 20px;
    }
    
    .add-btn-large {
      padding: 12px 24px;
      font-size: 1.1rem;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .add-btn-large:hover {
      background-color: #2980b9;
    }
  `]
})
export class BicyclesListComponent implements OnInit {
  private bicycleService = inject(BicycleService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private viewContainerRef = inject(ViewContainerRef);
  
  bicycles: Bicycle[] = [];
  loading = true;
  error: string | null = null;
  timestamp = Date.now();
  
  private deleteDialogRef: ComponentRef<DeleteDialogComponent> | null = null;
  
  ngOnInit(): void {
    this.loadBicycles();
  }
  
  loadBicycles(): void {
    this.loading = true;
    this.error = null;
    this.timestamp = Date.now(); // Odśwież timestamp przy każdym ładowaniu
    
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
    // Dodaj timestamp jako parametr zapytania, aby uniknąć cache'owania
    return `${this.bicycleService.getBicyclePhotoUrl(bicycleId)}?t=${this.timestamp}`;
  }
  
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/no-image.png';
  }
  
  goToAddBicycle(): void {
    this.router.navigate(['/bicycles/add']);
  }
  
  deleteBicycle(bicycleId: number): void {
    if (!bicycleId) {
      this.notificationService.error('Nie można usunąć roweru: nieprawidłowe ID');
      return;
    }
    
    // Stwórz i pokaż dialog potwierdzający
    this.deleteDialogRef = this.viewContainerRef.createComponent(DeleteDialogComponent);
    
    this.deleteDialogRef.instance.show().then((confirmed: boolean) => {
      if (confirmed) {
        this.bicycleService.deleteBicycle(bicycleId).subscribe({
          next: () => {
            this.notificationService.success('Rower został usunięty');
            // Odśwież listę rowerów
            this.loadBicycles();
          },
          error: (error) => {
            console.error('Błąd podczas usuwania roweru:', error);
            this.notificationService.error('Nie udało się usunąć roweru. Spróbuj ponownie później.');
          }
        });
      }
      
      // Zawsze usuń dialog z widoku po zakończeniu
      if (this.deleteDialogRef) {
        this.deleteDialogRef.destroy();
        this.deleteDialogRef = null;
      }
    });
  }
}