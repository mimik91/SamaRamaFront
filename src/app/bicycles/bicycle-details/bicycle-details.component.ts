import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BicycleService, GroupedImagesResponse, BicycleImage } from '../bicycle.service';
import { Bicycle } from '../bicycle.model';
import { NotificationService } from '../../core/notification.service';
import { ServiceRecord } from '../../service-records/service-record.model';
import { ServiceRecordService } from '../../service-records/service-record.service';
import { EnumerationService } from '../../core/enumeration.service';
import { BicycleSelectionService } from '../bicycle-selection.service';
import { ImageUtilsService } from '../../core/image-utils.service';

@Component({
  selector: 'app-bicycle-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bicycle-details.component.html',
  styleUrls: ['./bicycle-details.component.css']
})
export class BicycleDetailsComponent implements OnInit {
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editForm') editFormElement!: ElementRef;

  private bicycleService = inject(BicycleService);
  private serviceRecordService = inject(ServiceRecordService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private enumerationService = inject(EnumerationService);
  private bicycleSelectionService = inject(BicycleSelectionService);
  private imageUtils = inject(ImageUtilsService);

  bicycle: Bicycle | null = null;
  bicycleForm: FormGroup;
  serviceRecords: ServiceRecord[] = [];
  loading = true;
  isEditing = false;
  isSubmitting = false;
  isPhotoDeleting = false;
  errorMessage = '';
  timestamp = Date.now();

  // Images
  bicycleImages: GroupedImagesResponse | null = null;
  activeGalleryTab: 'GALLERY' | 'RECEIPT' = 'GALLERY';

  // Listy dostępnych opcji
  brands: string[] = [];
  bikeTypes: string[] = [];
  frameMaterials: string[] = [];

  // Flagi ładowania
  loadingBrands = true;
  loadingTypes = true;
  loadingMaterials = true;

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

  // ── Getters ──────────────────────────────────────────────────────────────

  get mainPhotoUrl(): string | null {
    const photos = this.bicycleImages?.images?.MAIN_PHOTO;
    return (photos && photos.length > 0) ? photos[0].url : null;
  }

  get galleryImages(): BicycleImage[] {
    if (!this.bicycleImages?.images) return [];
    return this.activeGalleryTab === 'GALLERY'
      ? (this.bicycleImages.images.GALLERY ?? [])
      : (this.bicycleImages.images.RECEIPT ?? []);
  }

  get hasGallery(): boolean {
    return !!(
      (this.bicycleImages?.images?.GALLERY?.length) ||
      (this.bicycleImages?.images?.RECEIPT?.length)
    );
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBicycle(+id);
      this.loadEnumerations();
    } else {
      this.router.navigate(['/bicycles']);
    }
  }

  private loadEnumerations(): void {
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => { this.brands = brands; this.loadingBrands = false; },
      error: () => { this.loadingBrands = false; this.notificationService.error('Nie udało się pobrać listy marek rowerów'); }
    });

    this.enumerationService.getEnumeration('BIKE_TYPE').subscribe({
      next: (types) => { this.bikeTypes = types; this.loadingTypes = false; },
      error: () => { this.loadingTypes = false; this.notificationService.error('Nie udało się pobrać listy typów rowerów'); }
    });

    this.enumerationService.getEnumeration('FRAME_MATERIAL').subscribe({
      next: (materials) => { this.frameMaterials = materials; this.loadingMaterials = false; },
      error: () => { this.loadingMaterials = false; this.notificationService.error('Nie udało się pobrać listy materiałów ram'); }
    });
  }

  loadBicycle(id: number): void {
    this.loading = true;
    this.bicycleService.getBicycle(id).subscribe({
      next: (bicycle) => {
        this.bicycle = bicycle;
        this.initForm();
        this.loadServiceRecords(id);
        this.loadBicycleImages(id);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bicycle:', error);
        this.notificationService.error('Nie udało się załadować danych roweru');
        this.loading = false;
      }
    });
  }

  loadBicycleImages(bicycleId: number): void {
    this.bicycleService.getAllBicycleImages(bicycleId).subscribe({
      next: (images) => {
        this.bicycleImages = images;
      },
      error: (error) => {
        if (error.status !== 401) {
          console.error('Error loading bicycle images:', error);
        }
        this.bicycleImages = null;
      }
    });
  }

  loadServiceRecords(bicycleId: number): void {
    this.serviceRecordService.getBicycleServiceRecords(bicycleId).subscribe({
      next: (records) => {
        this.serviceRecords = records;
      },
      error: (error) => {
        if (error.status === 401) {
          this.serviceRecords = [];
        } else {
          console.error('Error loading service records:', error);
          this.errorMessage = 'Nie udało się załadować historii serwisowej';
        }
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
        productionDate: this.formatDateForForm(this.bicycle.productionDate)
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

    setTimeout(() => {
      if (this.editFormElement) {
        this.editFormElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

      const validation = this.imageUtils.validateImage(file);
      if (!validation.valid) {
        this.photoError = validation.error || 'Nieprawidłowy plik';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }

      this.selectedFile = file;
      this.imageUtils.createPreviewUrl(file).then(url => { this.previewUrl = url; });
    }
  }

  openPhotoUpload(): void {
    this.photoInput.nativeElement.click();
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const validation = this.imageUtils.validateImage(file);
      if (!validation.valid) {
        this.notificationService.error(validation.error || 'Nieprawidłowy plik');
        return;
      }

      if (this.bicycle) {
        try {
          await this.uploadPhotoToR2(this.bicycle.id, file);
          this.notificationService.success('Zdjęcie zostało dodane');
          this.loadBicycleImages(this.bicycle.id);
        } catch (error) {
          console.error('Error uploading photo:', error);
          this.notificationService.error('Nie udało się dodać zdjęcia');
        }
      }
    }
  }

  deletePhoto(): void {
    if (!this.bicycle || !this.mainPhotoUrl || this.isPhotoDeleting) {
      return;
    }

    this.isPhotoDeleting = true;
    const isComplete = !!this.bicycle.frameNumber;

    this.bicycleService.deleteBicyclePhoto(this.bicycle.id, isComplete).subscribe({
      next: () => {
        this.notificationService.success('Zdjęcie zostało usunięte');
        if (this.bicycleImages?.images) {
          this.bicycleImages.images.MAIN_PHOTO = [];
        }
        this.isPhotoDeleting = false;
      },
      error: (error: any) => {
        console.error('Error deleting photo:', error);
        this.notificationService.error('Nie udało się usunąć zdjęcia');
        this.isPhotoDeleting = false;
      }
    });
  }

  onSubmit(): void {
    if (this.bicycleForm.invalid || !this.bicycle) {
      return;
    }

    this.isSubmitting = true;

    let productionDate = this.bicycleForm.value.productionDate;

    if (productionDate && typeof productionDate === 'string' && productionDate.trim() !== '') {
      try {
        productionDate = new Date(productionDate).toISOString().split('T')[0];
      } catch (e) {
        console.error('Error formatting production date:', e);
        productionDate = null;
      }
    } else {
      productionDate = null;
    }

    const bicycleData = {
      brand: this.bicycleForm.value.brand,
      model: this.bicycleForm.value.model || null,
      type: this.bicycleForm.value.type || null,
      frameMaterial: this.bicycleForm.value.frameMaterial || null,
      productionDate: productionDate,
      frameNumber: this.bicycle.frameNumber
    };

    const isComplete = !!this.bicycle.frameNumber;

    this.bicycleService.updateBicycle(this.bicycle.id, bicycleData, isComplete).subscribe({
      next: async () => {
        if (this.selectedFile) {
          try {
            await this.uploadPhotoToR2(this.bicycle!.id, this.selectedFile);
            this.notificationService.success('Dane roweru zostały zaktualizowane, wraz ze zdjęciem');
          } catch (error) {
            console.error('Error uploading photo:', error);
            this.notificationService.warning('Dane roweru zostały zaktualizowane, ale nie udało się dodać zdjęcia');
          }
          this.finishUpdate();
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

  private async uploadPhotoToR2(bicycleId: number, file: File): Promise<void> {
    const compressedFile = await this.imageUtils.compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      outputFormat: 'webp'
    });

    const dimensions = await this.imageUtils.getImageDimensions(compressedFile);

    console.log('[BicycleDetails] Uploading photo:', {
      originalSize: this.imageUtils.formatFileSize(file.size),
      compressedSize: this.imageUtils.formatFileSize(compressedFile.size),
      dimensions: `${dimensions.width}x${dimensions.height}`
    });

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

    await this.bicycleService.uploadToR2(uploadResponse.uploadUrl, compressedFile);
  }

  finishUpdate(): void {
    if (this.bicycle) {
      this.loadBicycle(this.bicycle.id);
      this.loadBicycleImages(this.bicycle.id);
    }
    this.isEditing = false;
    this.isSubmitting = false;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  orderService(): void {
    if (this.bicycle) {
      this.bicycleSelectionService.selectBicycles([this.bicycle]);
      this.router.navigate(['/order-service']);
    }
  }

  handleImageError(): void {
    if (this.bicycleImages?.images) {
      this.bicycleImages.images.MAIN_PHOTO = [];
    }
  }

  goBack(): void {
    this.router.navigate(['/bicycles']);
  }

  confirmDelete(): void {
    if (confirm('Czy na pewno chcesz usunąć ten rower? Tej operacji nie można cofnąć.')) {
      this.deleteBicycle();
    }
  }

  deleteBicycle(): void {
    if (!this.bicycle) return;

    const isComplete = !!this.bicycle.frameNumber;

    this.bicycleService.deleteBicycle(this.bicycle.id, isComplete).subscribe({
      next: () => {
        this.notificationService.success('Rower został pomyślnie usunięty');
        this.router.navigate(['/bicycles']);
      },
      error: (error) => {
        console.error('Błąd podczas usuwania roweru:', error);
        this.notificationService.error('Wystąpił błąd podczas usuwania roweru');
      }
    });
  }

  formatDateForForm(dateString: string | null | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  }
}
