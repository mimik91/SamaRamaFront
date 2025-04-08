// src/app/bicycles/bicycle-details/bicycle-details.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BicycleService } from '../bicycle.service';
import { Bicycle } from '../bicycle.model';
import { NotificationService } from '../../core/notification.service';
import { ServiceRecord } from '../../service-records/service-record.model';
import { ServiceRecordService } from '../../service-records/service-record.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-bicycle-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bicycle-details-container">
      <div class="header-section">
        <h1>Szczegóły roweru</h1>
        <button class="back-btn" (click)="goBack()">
          Powrót do listy
        </button>
      </div>
      
      <div class="content-container" *ngIf="bicycle">
        <div class="bicycle-info-container">
          <div class="bicycle-image-container">
            <img 
              *ngIf="hasPhoto" 
              [src]="getBicyclePhotoUrl(bicycle.id)" 
              (error)="handleImageError($event)"
              alt="Zdjęcie roweru"
              class="bicycle-image"
            >
            <div *ngIf="!hasPhoto" class="no-image">
              <div class="placeholder-content">
                <span>Brak zdjęcia</span>
              </div>
            </div>
          </div>
          
          <div class="bicycle-info">
            <h2>{{ bicycle.brand }} {{ bicycle.model || '' }}</h2>
            <p *ngIf="bicycle.frameNumber" class="frame-number">
              <strong>Numer ramy:</strong> {{ bicycle.frameNumber }}
            </p>
            <p *ngIf="bicycle.type">
              <strong>Typ roweru:</strong> {{ getTranslatedType(bicycle.type) }}
            </p>
            <p *ngIf="bicycle.frameMaterial">
              <strong>Materiał ramy:</strong> {{ getTranslatedMaterial(bicycle.frameMaterial) }}
            </p>
            <p *ngIf="bicycle.productionDate">
              <strong>Rok produkcji:</strong> {{ bicycle.productionDate | date:'yyyy' }}
            </p>
          </div>
        </div>
        
        <div class="edit-section" *ngIf="!isEditing">
          <button class="edit-btn" (click)="startEditing()">Edytuj dane roweru</button>
        </div>

        <form *ngIf="isEditing" [formGroup]="bicycleForm" (ngSubmit)="onSubmit()" class="edit-form">
          <h3>Edycja danych roweru</h3>
          
          <div class="form-group">
            <label for="brand">Marka*</label>
            <input 
              type="text" 
              id="brand" 
              formControlName="brand" 
              [class.is-invalid]="isFieldInvalid('brand')"
            >
            <div *ngIf="isFieldInvalid('brand')" class="error-message">
              Marka jest wymagana
            </div>
          </div>
          
          <div class="form-group">
            <label for="model">Model</label>
            <input 
              type="text" 
              id="model" 
              formControlName="model"
            >
          </div>
          
          <div class="form-group">
            <label for="type">Typ roweru</label>
            <select id="type" formControlName="type">
              <option value="">-- Wybierz typ --</option>
              <option value="MOUNTAIN">Górski</option>
              <option value="ROAD">Szosowy</option>
              <option value="CITY">Miejski</option>
              <option value="TREKKING">Trekkingowy</option>
              <option value="BMX">BMX</option>
              <option value="KIDS">Dziecięcy</option>
              <option value="ELECTRIC">Elektryczny</option>
              <option value="OTHER">Inny</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="frameMaterial">Materiał ramy</label>
            <select id="frameMaterial" formControlName="frameMaterial">
              <option value="">-- Wybierz materiał --</option>
              <option value="ALUMINUM">Aluminium</option>
              <option value="CARBON">Karbon</option>
              <option value="STEEL">Stal</option>
              <option value="TITANIUM">Tytan</option>
              <option value="OTHER">Inny</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="productionDate">Rok produkcji</label>
            <input 
              type="date" 
              id="productionDate" 
              formControlName="productionDate"
            >
          </div>
          
          <div class="form-group">
            <label for="photo">Zmień zdjęcie roweru (maks. 1MB)</label>
            <input 
              type="file" 
              id="photo" 
              accept="image/*"
              (change)="onFileSelected($event)"
            >
            <div *ngIf="photoError" class="error-message">
              {{ photoError }}
            </div>
            
            <div *ngIf="selectedFile" class="photo-preview">
              <img [src]="previewUrl" alt="Podgląd zdjęcia roweru">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" (click)="cancelEditing()">
              Anuluj
            </button>
            <button 
              type="submit" 
              class="submit-btn" 
              [disabled]="bicycleForm.invalid || isSubmitting"
            >
              {{ isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany' }}
            </button>
          </div>
        </form>
        
        <div class="service-records-section">
          <h3>Historia serwisowa</h3>
          
          <div *ngIf="loading" class="loading-message">
            Ładowanie historii serwisowej...
          </div>
          
          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div *ngIf="!loading && !errorMessage">
            <div *ngIf="serviceRecords.length > 0; else noRecords" class="service-records-list">
              <div *ngFor="let record of serviceRecords" class="service-record-card">
                <div class="service-record-header">
                  <h4>{{ record.name }}</h4>
                  <span class="service-date">{{ record.serviceDate | date:'dd.MM.yyyy' }}</span>
                </div>
                <p class="service-description">{{ record.description }}</p>
                <div class="service-footer">
                  <span *ngIf="record.price" class="service-price">
                    Koszt: {{ record.price | currency:'PLN':'symbol':'1.2-2' }}
                  </span>
                  <span class="service-name">
                    Wykonane przez: {{ record.service?.name || 'Nieznany serwis' }}
                  </span>
                </div>
              </div>
            </div>
            
            <ng-template #noRecords>
              <div class="no-records-message">
                Brak historii serwisowej dla tego roweru.
              </div>
            </ng-template>
          </div>
        </div>
      </div>
      
      <div *ngIf="!bicycle && !loading" class="not-found-message">
        Nie znaleziono roweru o podanym ID.
      </div>
      
      <div *ngIf="loading && !bicycle" class="loading-container">
        Ładowanie danych roweru...
      </div>
    </div>
  `,
  styles: [`
    .bicycle-details-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    
    h1 {
      margin: 0;
      color: #2c3e50;
    }
    
    .back-btn {
      padding: 8px 16px;
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #333;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .back-btn:hover {
      background-color: #e0e0e0;
    }
    
    .content-container {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .bicycle-info-container {
      display: flex;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    
    .bicycle-image-container {
      width: 250px;
      height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-right: 30px;
    }
    
    .bicycle-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8f9fa;
      color: #adb5bd;
    }
    
    .placeholder-content {
      padding: 15px;
      text-align: center;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    
    .bicycle-info {
      flex-grow: 1;
    }
    
    .bicycle-info h2 {
      margin-top: 0;
      color: #2c3e50;
      font-size: 1.8rem;
    }
    
    .frame-number {
      font-weight: 500;
      color: #7f8c8d;
    }
    
    .edit-section {
      margin-bottom: 30px;
      display: flex;
      justify-content: flex-end;
    }
    
    .edit-btn {
      padding: 10px 20px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .edit-btn:hover {
      background-color: #2980b9;
    }
    
    .edit-form {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .edit-form h3 {
      margin-top: 0;
      color: #2c3e50;
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #34495e;
    }
    
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    
    .is-invalid {
      border-color: #e74c3c !important;
    }
    
    .error-message {
      color: #e74c3c;
      font-size: 0.9rem;
      margin-top: 5px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .cancel-btn {
      padding: 10px 20px;
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #333;
      cursor: pointer;
    }
    
    .submit-btn {
      padding: 10px 20px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .submit-btn:disabled {
      background-color: #80bdff;
      cursor: not-allowed;
    }
    
    .photo-preview {
      margin-top: 10px;
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    
    .photo-preview img {
      max-width: 100%;
      max-height: 200px;
    }
    
    .service-records-section {
      margin-top: 40px;
    }
    
    .service-records-section h3 {
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    
    .service-records-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .service-record-card {
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }
    
    .service-record-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .service-record-header h4 {
      margin: 0;
      color: #2c3e50;
    }
    
    .service-date {
      color: #7f8c8d;
      font-size: 0.9rem;
    }
    
    .service-description {
      margin-bottom: 15px;
      color: #34495e;
      white-space: pre-line;
    }
    
    .service-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: #7f8c8d;
    }
    
    .no-records-message {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      color: #7f8c8d;
    }
    
    .loading-message,
    .loading-container {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      color: #7f8c8d;
    }
    
    .not-found-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
    }
  `]
})
export class BicycleDetailsComponent implements OnInit {
  private bicycleService = inject(BicycleService);
  private serviceRecordService = inject(ServiceRecordService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);

  bicycle: Bicycle | null = null;
  bicycleForm: FormGroup;
  serviceRecords: ServiceRecord[] = [];
  loading = true;
  isEditing = false;
  isSubmitting = false;
  errorMessage = '';
  hasPhoto = false;
  timestamp = Date.now();
  
  // Zmienne dla uploadu zdjęcia
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  photoError: string | null = null;

  constructor() {
    this.bicycleForm = this.fb.group({
      brand: ['', Validators.required],
      model: [''],
      type: [''],
      frameMaterial: [''],
      productionDate: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBicycle(+id);
    } else {
      this.router.navigate(['/bicycles']);
    }
  }

  loadBicycle(id: number): void {
    this.loading = true;
    this.bicycleService.getBicycle(id).subscribe({
      next: (bicycle) => {
        this.bicycle = bicycle;
        this.hasPhoto = true; // Będziemy próbować załadować zdjęcie, jeśli istnieje
        this.initForm();
        this.loadServiceRecords(id);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bicycle:', error);
        this.notificationService.error('Nie udało się załadować danych roweru');
        this.loading = false;
      }
    });
  }

  loadServiceRecords(bicycleId: number): void {
    this.serviceRecordService.getBicycleServiceRecords(bicycleId).subscribe({
      next: (records) => {
        this.serviceRecords = records;
      },
      error: (error) => {
        console.error('Error loading service records:', error);
        this.errorMessage = 'Nie udało się załadować historii serwisowej';
      }
    });
  }

  initForm(): void {
    if (this.bicycle) {
      this.bicycleForm.patchValue({
        brand: this.bicycle.brand,
        model: this.bicycle.model,
        type: this.bicycle.type,
        frameMaterial: this.bicycle.frameMaterial,
        productionDate: this.bicycle.productionDate
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bicycleForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  startEditing(): void {
    this.isEditing = true;
    this.initForm();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.photoError = null;
  }

  onFileSelected(event: Event): void {
    this.photoError = null;
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        this.photoError = 'Zdjęcie nie może przekraczać 1MB';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        this.photoError = 'Wybierz plik graficzny';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.bicycleForm.invalid || !this.bicycle) {
      return;
    }
    
    this.isSubmitting = true;
    
    // Tworzymy nowy obiekt zawierający TYLKO te pola, które są w BicycleDto
    const bicycleData = {
      brand: this.bicycleForm.value.brand,
      model: this.bicycleForm.value.model,
      type: this.bicycleForm.value.type,
      frameMaterial: this.bicycleForm.value.frameMaterial,
      productionDate: this.bicycleForm.value.productionDate,
      frameNumber: this.bicycle.frameNumber // Zachowujemy oryginalny numer ramy
    };
    
    console.log('Wysyłanie danych:', bicycleData); // Dodajemy log dla celów diagnostycznych
    
    // Użyj HttpClient do wywołania PUT
    this.http.put<any>(`${this.bicycleService['apiUrl']}/${this.bicycle!.id}`, bicycleData).subscribe({
      next: () => {
        // Jeśli mamy nowe zdjęcie, załaduj je
        if (this.selectedFile) {
          this.bicycleService.uploadBicyclePhoto(this.bicycle!.id, this.selectedFile).subscribe({
            next: () => {
              this.timestamp = Date.now(); // Odśwież timestamp dla zdjęcia
              this.notificationService.success('Dane roweru zostały zaktualizowane, wraz ze zdjęciem');
              this.finishUpdate();
            },
            error: (errorMsg: any) => {
              console.error('Error uploading photo:', errorMsg);
              this.notificationService.warning('Dane roweru zostały zaktualizowane, ale nie udało się dodać zdjęcia');
              this.finishUpdate();
            }
          });
        } else {
          this.notificationService.success('Dane roweru zostały zaktualizowane');
          this.finishUpdate();
        }
      },
      error: (errorMsg: any) => {
        console.error('Error updating bicycle:', errorMsg);
        this.notificationService.error('Nie udało się zaktualizować danych roweru');
        this.isSubmitting = false;
      }
    });
  }

  finishUpdate(): void {
    // Odśwież dane roweru
    if (this.bicycle) {
      this.loadBicycle(this.bicycle.id);
    }
    this.isEditing = false;
    this.isSubmitting = false;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  getBicyclePhotoUrl(bicycleId: number): string {
    return `${this.bicycleService.getBicyclePhotoUrl(bicycleId)}?t=${this.timestamp}`;
  }
  
  handleImageError(event: Event): void {
    this.hasPhoto = false;
  }

  goBack(): void {
    this.router.navigate(['/bicycles']);
  }

  getTranslatedType(type: string): string {
    const types: Record<string, string> = {
      'MOUNTAIN': 'Górski',
      'ROAD': 'Szosowy',
      'CITY': 'Miejski',
      'TREKKING': 'Trekkingowy',
      'BMX': 'BMX',
      'KIDS': 'Dziecięcy',
      'ELECTRIC': 'Elektryczny',
      'OTHER': 'Inny'
    };
    return types[type] || type;
  }

  getTranslatedMaterial(material: string): string {
    const materials: Record<string, string> = {
      'ALUMINUM': 'Aluminium',
      'CARBON': 'Karbon',
      'STEEL': 'Stal',
      'TITANIUM': 'Tytan',
      'OTHER': 'Inny'
    };
    return materials[material] || material;
  }
}