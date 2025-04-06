// src/app/bicycles/bicycle-form/bicycle-form.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BicycleService } from '../bicycle.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-bicycle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bicycle-form-container">
      <h1>Dodaj nowy rower</h1>
      
      <form [formGroup]="bicycleForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="frameNumber">Numer ramy*</label>
          <input 
            type="text" 
            id="frameNumber" 
            formControlName="frameNumber" 
            [class.is-invalid]="isFieldInvalid('frameNumber')"
          >
          <div *ngIf="isFieldInvalid('frameNumber')" class="error-message">
            Numer ramy jest wymagany
          </div>
        </div>
        
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
          <label for="photo">Zdjęcie roweru (maks. 1MB)</label>
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
          <button type="button" class="cancel-btn" (click)="goBack()">Anuluj</button>
          <button 
            type="submit" 
            class="submit-btn" 
            [disabled]="bicycleForm.invalid || isSubmitting"
          >
            {{ isSubmitting ? 'Dodawanie...' : 'Dodaj rower' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .bicycle-form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    
    h1 {
      margin-bottom: 30px;
      color: #2c3e50;
      text-align: center;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #34495e;
    }
    
    input, select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    
    select {
      background-color: white;
    }
    
    input:focus, select:focus {
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
      justify-content: space-between;
      margin-top: 30px;
    }
    
    .cancel-btn, .submit-btn {
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .cancel-btn {
      background-color: #ecf0f1;
      border: 1px solid #bdc3c7;
      color: #7f8c8d;
    }
    
    .submit-btn {
      background-color: #3498db;
      border: none;
      color: white;
    }
    
    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .photo-preview {
      margin-top: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      text-align: center;
    }
    
    .photo-preview img {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
    }
  `]
})
export class BicycleFormComponent {
  private fb = inject(FormBuilder);
  private bicycleService = inject(BicycleService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  
  bicycleForm: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  photoError: string | null = null;
  
  constructor() {
    this.bicycleForm = this.fb.group({
      frameNumber: ['', Validators.required],
      brand: ['', Validators.required],
      model: [''],
      type: [''],
      frameMaterial: [''],
      productionDate: ['']
    });
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.bicycleForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
  
  onFileSelected(event: Event): void {
    this.photoError = null;
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Sprawdź rozmiar pliku (max 1MB)
      if (file.size > 1024 * 1024) {
        this.photoError = 'Zdjęcie nie może przekraczać 1MB';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
      
      // Sprawdź typ pliku
      if (!file.type.match('image.*')) {
        this.photoError = 'Wybierz plik graficzny';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
      
      this.selectedFile = file;
      
      // Utwórz podgląd
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  goBack(): void {
    this.router.navigate(['/bicycles']);
  }
  
  onSubmit(): void {
    if (this.bicycleForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    const bicycleData = {
      frameNumber: this.bicycleForm.get('frameNumber')?.value,
      brand: this.bicycleForm.get('brand')?.value,
      model: this.bicycleForm.get('model')?.value || null,
      type: this.bicycleForm.get('type')?.value || null,
      frameMaterial: this.bicycleForm.get('frameMaterial')?.value || null,
      productionDate: this.bicycleForm.get('productionDate')?.value || null
    };
    
    this.bicycleService.addBicycle(bicycleData).subscribe({
      next: (response: any) => {
        const bicycleId = response.bicycleId;
        
        if (this.selectedFile && bicycleId) {
          // Dodano rower, teraz dodaj zdjęcie
          this.bicycleService.uploadBicyclePhoto(bicycleId, this.selectedFile).subscribe({
            next: () => {
              this.notificationService.success('Rower został dodany pomyślnie');
              this.router.navigate(['/bicycles']);
            },
            error: (error) => {
              console.error('Error uploading photo:', error);
              this.notificationService.success('Rower został dodany, ale wystąpił błąd przy dodawaniu zdjęcia');
              this.router.navigate(['/bicycles']);
            }
          });
        } else {
          // Dodano rower bez zdjęcia
          this.notificationService.success('Rower został dodany pomyślnie');
          this.router.navigate(['/bicycles']);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error('Wystąpił błąd podczas dodawania roweru');
        console.error('Error adding bicycle:', error);
        
        if (error.error && error.error.message) {
          if (error.error.message.includes('frame number already exists')) {
            this.notificationService.error('Rower o podanym numerze ramy już istnieje');
          }
        }
      }
    });
  }
}