import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BicycleService } from '../bicycle.service';
import { NotificationService } from '../../../core/notification.service';
import { Bicycle } from '../../../shared/models/bicycle.model';
import { EnumerationService } from '../../../core/enumeration.service';
import { ImageUtilsService } from '../../../core/image-utils.service';

@Component({
  selector: 'app-client-panel-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-panel-form.component.html',
  styleUrls: ['./client-panel-form.component.css']
})

export class ClientPanelFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bicycleService = inject(BicycleService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private enumerationService = inject(EnumerationService);
  private imageUtils = inject(ImageUtilsService);

  bicycleForm: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  photoError: string | null = null;
  uploadProgress = 0;
  isCompressing = false;

  // Listy dostępnych opcji
  brands: string[] = [];
  bikeTypes: string[] = [];
  frameMaterials: string[] = [];

  // Flagi ładowania
  loadingBrands = true;
  loadingTypes = true;
  loadingMaterials = true;

  // Autocomplete marki
  filteredBrands: string[] = [];
  showBrandDropdown = false;

  constructor() {
    this.bicycleForm = this.fb.group({
      brand: ['', Validators.required],
      model: [''],
      type: [''],
      frameMaterial: [''],
      frameNumber: [''],
      productionDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadEnumerations();
  }

  private loadEnumerations(): void {
    // Pobierz marki rowerów
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => {
        this.brands = brands;
        this.loadingBrands = false;
      },
      error: () => {
        this.loadingBrands = false;
        this.notificationService.error('Nie udało się pobrać listy marek rowerów');
      }
    });

    // Pobierz typy rowerów
    this.enumerationService.getEnumeration('BIKE_TYPE').subscribe({
      next: (types) => {
        this.bikeTypes = types;
        this.loadingTypes = false;
      },
      error: () => {
        this.loadingTypes = false;
        this.notificationService.error('Nie udało się pobrać listy typów rowerów');
      }
    });

    // Pobierz materiały ram
    this.enumerationService.getEnumeration('FRAME_MATERIAL').subscribe({
      next: (materials) => {
        this.frameMaterials = materials;
        this.loadingMaterials = false;
      },
      error: () => {
        this.loadingMaterials = false;
        this.notificationService.error('Nie udało się pobrać listy materiałów ram');
      }
    });
  }

  onBrandInput(): void {
    const value = this.bicycleForm.get('brand')?.value || '';
    if (value.length >= 3) {
      this.filteredBrands = this.brands.filter(b =>
        b.toLowerCase().includes(value.toLowerCase())
      );
      this.showBrandDropdown = true;
    } else {
      this.filteredBrands = [];
      this.showBrandDropdown = false;
    }
  }

  onBrandFocus(): void {
    const value = this.bicycleForm.get('brand')?.value || '';
    if (value.length >= 3) {
      this.onBrandInput();
    }
  }

  onBrandBlur(): void {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showBrandDropdown = false;
    }, 200);
  }

  toggleBrandDropdown(event: Event): void {
    event.preventDefault();
    if (this.showBrandDropdown) {
      this.showBrandDropdown = false;
    } else {
      this.filteredBrands = [...this.brands];
      this.showBrandDropdown = true;
    }
  }

  selectBrand(brand: string): void {
    this.bicycleForm.get('brand')?.setValue(brand);
    this.showBrandDropdown = false;
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

      const validation = this.imageUtils.validateImage(file);
      if (!validation.valid) {
        this.photoError = validation.error || 'Nieprawidłowy plik';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }

      this.selectedFile = file;

      // Create preview
      this.imageUtils.createPreviewUrl(file).then(url => {
        this.previewUrl = url;
      });
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
      frameNumber: this.bicycleForm.get('frameNumber')?.value || null,
      brand: this.bicycleForm.get('brand')?.value,
      model: this.bicycleForm.get('model')?.value || null,
      type: this.bicycleForm.get('type')?.value || null,
      frameMaterial: this.bicycleForm.get('frameMaterial')?.value || null,
      productionDate: this.bicycleForm.get('productionDate')?.value || null
    };

    this.bicycleService.addBicycle(bicycleData).subscribe({
      next: async (response: any) => {
        const bicycleId = response.bikeId || response.bicycleId;
        const successMessage = 'Rower został dodany pomyślnie.';

        if (this.selectedFile && bicycleId) {
          try {
            await this.uploadPhotoToR2(bicycleId, this.selectedFile);
            this.notificationService.success(successMessage);
          } catch (error) {
            console.error('Error uploading photo:', error);
            this.notificationService.success(successMessage + ' (nie udało się dodać zdjęcia)');
          }
          this.router.navigate(['/bicycles']);
        } else {
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

  private async uploadPhotoToR2(bicycleId: number, file: File): Promise<void> {
    // Step 1: Compress to webp
    this.isCompressing = true;
    this.uploadProgress = 5;

    const compressedFile = await this.imageUtils.compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      outputFormat: 'webp',
      onProgress: (progress) => {
        this.uploadProgress = 5 + (progress * 0.2);
      }
    });

    this.isCompressing = false;
    this.uploadProgress = 25;

    // Step 2: Get dimensions
    const dimensions = await this.imageUtils.getImageDimensions(compressedFile);
    this.uploadProgress = 30;

    console.log('[BicycleForm] Uploading photo:', {
      originalSize: this.imageUtils.formatFileSize(file.size),
      compressedSize: this.imageUtils.formatFileSize(compressedFile.size),
      dimensions: `${dimensions.width}x${dimensions.height}`
    });

    // Step 3: Get presigned URL from backend
    const uploadResponse = await firstValueFrom(
      this.bicycleService.generateImageUploadUrl(bicycleId, {
        type: 'MAIN_PHOTO',
        fileName: `bicycle_${bicycleId}_main`,
        mimeType: compressedFile.type,
        width: dimensions.width,
        height: dimensions.height,
        weight: Math.round(compressedFile.size / 1024),
        displayOrder: 0
      })
    );

    if (!uploadResponse || !uploadResponse.uploadUrl) {
      throw new Error('Nie udało się wygenerować URL do uploadu');
    }

    this.uploadProgress = 50;

    // Step 4: Upload to R2
    await this.bicycleService.uploadToR2(uploadResponse.uploadUrl, compressedFile);
    this.uploadProgress = 100;
  }
}
