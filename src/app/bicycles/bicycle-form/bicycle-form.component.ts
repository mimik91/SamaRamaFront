// src/app/bicycles/bicycle-form/bicycle-form.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BicycleService } from '../bicycle.service';
import { NotificationService } from '../../core/notification.service';
import { Bicycle } from '../bicycle.model';

@Component({
  selector: 'app-bicycle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bicycle-form.component.html',
  styleUrls: ['./bicycle-form.component.css']
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
  
  goBack(): void {
    this.router.navigate(['/bicycles']);
  }
  
  onSubmit(): void {
    if (this.bicycleForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    const bicycleData = {
      frameNumber: null, // Teraz pole jest nullem
      brand: this.bicycleForm.get('brand')?.value,
      model: this.bicycleForm.get('model')?.value || null,
      type: this.bicycleForm.get('type')?.value || null,
      frameMaterial: this.bicycleForm.get('frameMaterial')?.value || null,
      productionDate: this.bicycleForm.get('productionDate')?.value || null
    };
    
    this.bicycleService.addBicycle(bicycleData).subscribe({
      next: (response: any) => {
        const bicycleId = response.bikeId; // Zmiana z bicycleId na bikeId!
        const successMessage = 'Rower został dodany pomyślnie.';
        
        if (this.selectedFile && bicycleId) {
          // Dodaj timeout, aby dać czas backendowi na zapisanie roweru
          const fileToUpload = this.selectedFile; // Utwórz referencję, którą TypeScript rozpozna jako non-null
          setTimeout(() => {
            this.bicycleService.uploadBicyclePhoto(bicycleId, fileToUpload).subscribe({
              next: () => {
                this.notificationService.success(successMessage);
                this.router.navigate(['/bicycles']);
              },
              error: (error) => {
                console.error('Error uploading photo:', error);
                this.notificationService.success(successMessage + ' (nie udało się dodać zdjęcia)');
                this.router.navigate(['/bicycles']);
              }
            });
          }, 500); // dodanie 500ms opóźnienia
        } else {
          // Dodano rower bez zdjęcia
          this.notificationService.success(successMessage);
          this.router.navigate(['/bicycles']);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error('Wystąpił błąd podczas dodawania roweru');
        console.error('Error adding bicycle:', error);
      }
    });
  }
}