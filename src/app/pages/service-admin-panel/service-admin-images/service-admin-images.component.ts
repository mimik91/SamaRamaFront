// src/app/pages/service-admin-panel/service-admin-images/service-admin-images.component.ts
// REFACTORED VERSION with ImageUtilsService + Per-Image State + Memory Leak Fixes

import { Component, Input, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, inject, DestroyRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, timeout, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';
import { ImageUtilsService } from '../../../core/image-utils.service';

interface UploadUrlResponse {
  imageId: string;
  uploadUrl: string | null;
  path: string;
}

interface ImageUrlResponse {
  url: string;
}

type ImageType = 'LOGO' | 'ABOUT_US' | 'OPENING_HOURS';

interface ImageState {
  url: string | null;
  isLoading: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  currentIndex: number;
  customImageUrl: string | null;
  // Per-image state (not global) - Fix #1
  isUploading: boolean;
  uploadProgress: number;
  errorMessage: string;
  successMessage: string;
  isCompressing: boolean;
}

@Component({
  selector: 'app-service-admin-images',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-admin-images.component.html',
  styleUrls: ['./service-admin-images.component.css']
})
export class ServiceAdminImagesComponent implements OnInit, OnDestroy {
  @Input() serviceId!: number;

  // ViewChildren reference for all file inputs
  @ViewChildren('fileInputRef') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Injected services
  private http = inject(HttpClient);
  private imageUtils = inject(ImageUtilsService);
  private destroyRef = inject(DestroyRef);

  // Configuration constants
  private readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes
  private readonly HTTP_TIMEOUT = 30000; // 30 seconds
  private readonly UPLOAD_TIMEOUT = 60000; // 60 seconds for large files
  private readonly MAX_RETRIES = 3;

  readonly imageTypes: ImageType[] = ['LOGO', 'ABOUT_US', 'OPENING_HOURS'];

  // Available asset images
  readonly availableAssets = [
    'vertical1.jpg',
    'vertical2.jpg',
    'vertical3.jpg',
    'vertical4.jpg',
    'vertical5.jpg',
    'vertical6.jpg'
  ];

  // Default images for each type
  readonly defaultImages: Record<ImageType, string> = {
    LOGO: '',
    ABOUT_US: 'vertical-1.jpg',
    OPENING_HOURS: 'vertical-2.jpg'
  };

  // Image states (all state is now per-image, not global)
  images: Record<ImageType, ImageState> = {
    LOGO: this.createInitialState(),
    ABOUT_US: this.createInitialState(),
    OPENING_HOURS: this.createInitialState()
  };

  ngOnInit(): void {
    this.loadAllImages();
  }

  ngOnDestroy(): void {
    // Fix #2: Cleanup all preview URLs to prevent memory leaks
    this.imageTypes.forEach(type => {
      if (this.images[type].previewUrl) {
        URL.revokeObjectURL(this.images[type].previewUrl!);
      }
    });
  }

  // Warn user if they try to leave while uploading (check ANY image uploading)
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    const anyUploading = this.imageTypes.some(type => this.images[type].isUploading);
    if (anyUploading) {
      $event.preventDefault();
      $event.returnValue = 'Upload w trakcie - czy na pewno chcesz opuścić stronę?';
    }
  }

  private createInitialState(): ImageState {
    return {
      url: null,
      isLoading: false,
      selectedFile: null,
      previewUrl: null,
      currentIndex: 0,
      customImageUrl: null,
      isUploading: false,
      uploadProgress: 0,
      errorMessage: '',
      successMessage: '',
      isCompressing: false
    };
  }

  // ============ IMAGE LOADING ============

  loadAllImages(): void {
    this.imageTypes.forEach(type => {
      this.loadImage(type);
    });
  }

  loadImage(type: ImageType): void {
    this.images[type].isLoading = true;
    this.images[type].errorMessage = '';

    const url = `${environment.apiUrl}${environment.endpoints.services.images
      .replace(':id', this.serviceId.toString())
      .replace(':type', type)}`;

    this.http.get<ImageUrlResponse>(url)
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          if (err.status === 404) {
            this.images[type].url = null;
            this.images[type].customImageUrl = null;
            // Set default image for ABOUT_US and OPENING_HOURS
            if (type !== 'LOGO' && this.defaultImages[type]) {
              const defaultIndex = this.availableAssets.indexOf(this.defaultImages[type]);
              this.images[type].currentIndex = defaultIndex !== -1 ? defaultIndex : 0;
            }
          } else {
            this.images[type].errorMessage = `Nie udało się załadować obrazu ${type}`;
            console.error(`[ImageComponent] Error loading ${type}:`, err);
          }
          this.images[type].isLoading = false;
          return EMPTY;
        })
      )
      .subscribe({
        next: (response) => {
          this.images[type].url = response.url;
          this.images[type].customImageUrl = response.url;

          // Set currentIndex based on loaded image
          if (type !== 'LOGO') {
            const fileName = this.getFileNameFromUrl(response.url);
            const index = this.getAvailableImages(type).findIndex(img =>
              img.includes(fileName) || fileName.includes(img)
            );
            if (index !== -1) {
              this.images[type].currentIndex = index;
            } else {
              // If custom image, set to last index
              this.images[type].currentIndex = this.getAvailableImages(type).length - 1;
            }
          }

          this.images[type].isLoading = false;
        }
      });
  }

  private getFileNameFromUrl(url: string): string {
    return url.split('/').pop()?.split('?')[0] || '';
  }

  // ============ FILE SELECTION ============

  async onFileSelected(event: Event, type: ImageType): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.images[type].errorMessage = '';
    this.images[type].successMessage = '';

    // Validate image
    const validation = this.imageUtils.validateImage(file);
    if (!validation.valid) {
      this.images[type].errorMessage = validation.error || 'Nieprawidłowy plik';
      this.clearFileInput(type);
      return;
    }

    // Log file info
    console.log(`[ImageComponent] Selected file for ${type}:`, {
      name: file.name,
      type: file.type,
      size: this.imageUtils.formatFileSize(file.size)
    });

    // Check if compression needed
    if (this.imageUtils.needsCompression(file, this.MAX_FILE_SIZE)) {
      console.log(`[ImageComponent] File needs compression (${this.imageUtils.formatFileSize(file.size)})`);
    }

    // Fix #2: Revoke old preview URL before creating new one
    if (this.images[type].previewUrl) {
      URL.revokeObjectURL(this.images[type].previewUrl!);
    }

    this.images[type].selectedFile = file;

    // Create preview
    try {
      const previewUrl = await this.imageUtils.createPreviewUrl(file);
      this.images[type].previewUrl = previewUrl;
    } catch (error) {
      console.error('[ImageComponent] Failed to create preview:', error);
      this.images[type].errorMessage = 'Nie udało się utworzyć podglądu obrazu';
    }
  }

  // ============ IMAGE UPLOAD ============

  async uploadCustomImage(type: ImageType): Promise<void> {
    const state = this.images[type];

    if (!state.selectedFile) {
      state.errorMessage = 'Nie wybrano pliku';
      return;
    }

    state.isUploading = true;
    state.isCompressing = true;
    state.errorMessage = '';
    state.successMessage = '';
    state.uploadProgress = 0;

    try {
      // Step 1: Compress image with progress feedback
      state.uploadProgress = 5;
      const compressedFile = await this.imageUtils.compressImage(
        state.selectedFile,
        {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          preserveAlpha: type === 'LOGO', // Preserve transparency for logos
          onProgress: (progress) => {
            // Map 0-100 from compression to 5-25 in overall progress
            state.uploadProgress = 5 + (progress * 0.2);
          }
        }
      );
      state.uploadProgress = 25;
      state.isCompressing = false;

      // Step 2: Get dimensions
      const dimensions = await this.imageUtils.getImageDimensions(compressedFile);
      state.uploadProgress = 30;

      console.log(`[ImageComponent] Uploading ${type}:`, {
        originalSize: this.imageUtils.formatFileSize(state.selectedFile.size),
        compressedSize: this.imageUtils.formatFileSize(compressedFile.size),
        dimensions: `${dimensions.width}x${dimensions.height}`
      });

      // Step 3: Generate presigned URL
      const url = `${environment.apiUrl}${environment.endpoints.services.imagesBase
        .replace(':id', this.serviceId.toString())}`;

      const uploadResponse = await firstValueFrom(
        this.http.post<UploadUrlResponse>(
          url,
          {
            type: type,
            fileName: `${this.serviceId}_${type}`,
            mimeType: compressedFile.type,
            width: dimensions.width,
            height: dimensions.height,
            weight: Math.round(compressedFile.size / 1024),
            provider: 'R2'
          }
        ).pipe(
          timeout(this.HTTP_TIMEOUT),
          catchError(err => {
            console.error('[ImageComponent] Failed to generate upload URL:', err);
            throw new Error('Nie udało się wygenerować URL do uploadu');
          })
        )
      );

      if (!uploadResponse || !uploadResponse.uploadUrl) {
        throw new Error('Nie udało się wygenerować URL do uploadu');
      }

      state.uploadProgress = 50;

      // Step 4: Upload to R2 with retry logic
      await this.uploadToR2WithRetry(uploadResponse.uploadUrl, compressedFile, type);

      state.uploadProgress = 100;
      state.successMessage = `Obraz ${type} został przesłany pomyślnie!`;

      setTimeout(() => {
        this.loadImage(type);
        this.clearSelection(type);
      }, 1500);

    } catch (error) {
      console.error('[ImageComponent] Upload error:', error);

      // User-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          state.errorMessage = 'Przekroczono czas oczekiwania. Sprawdź połączenie internetowe i spróbuj ponownie.';
        } else if (error.message.includes('CORS')) {
          state.errorMessage = 'Błąd CORS. Skontaktuj się z administratorem.';
        } else if (error.message.includes('Failed to fetch')) {
          state.errorMessage = 'Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe.';
        } else {
          state.errorMessage = error.message;
        }
      } else {
        state.errorMessage = 'Wystąpił nieznany błąd podczas przesyłania pliku';
      }
    } finally {
      state.isUploading = false;
      state.isCompressing = false;
    }
  }

  private async uploadToR2WithRetry(uploadUrl: string, file: File, type: ImageType, retryCount = 0): Promise<void> {
    const state = this.images[type];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.UPLOAD_TIMEOUT);

      console.log(`[ImageComponent] Upload attempt ${retryCount + 1} to R2...`);

      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Cache-Control': 'public, max-age=31536000, immutable'
        },
        body: file,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('[ImageComponent] Upload status:', uploadResult.status);
      // Note: Headers may not have entries() in all environments
      try {
        const headers: Record<string, string> = {};
        uploadResult.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log('[ImageComponent] Upload headers:', headers);
      } catch (e) {
        console.log('[ImageComponent] Upload headers:', uploadResult.headers);
      }

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text().catch(() => 'Unknown error');
        throw new Error(`Upload failed with status ${uploadResult.status}: ${errorText}`);
      }

      state.uploadProgress = 75 + (retryCount * 5); // Progress feedback
      console.log('[ImageComponent] Upload successful!');

    } catch (error) {
      console.error(`[ImageComponent] Upload attempt ${retryCount + 1} failed:`, error);

      // Retry logic with exponential backoff
      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`[ImageComponent] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.uploadToR2WithRetry(uploadUrl, file, type, retryCount + 1);
      }

      // Max retries exceeded
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload przekroczył limit czasu (60s). Plik może być za duży.');
      }
      throw error;
    }
  }

  async uploadAssetImage(type: ImageType, assetName: string): Promise<void> {
    const state = this.images[type];

    state.isUploading = true;
    state.errorMessage = '';
    state.successMessage = '';
    state.uploadProgress = 0;

    try {
      state.uploadProgress = 30;

      const url = `${environment.apiUrl}${environment.endpoints.services.imagesBase
        .replace(':id', this.serviceId.toString())}`;

      const uploadResponse = await firstValueFrom(
        this.http.post<UploadUrlResponse>(
          url,
          {
            type: type,
            fileName: assetName,
            mimeType: 'image/jpeg',
            provider: 'LOCAL_ASSET'
          }
        ).pipe(
          timeout(this.HTTP_TIMEOUT),
          catchError(err => {
            console.error('[ImageComponent] Failed to save asset:', err);
            throw new Error('Nie udało się zapisać informacji o zasobie');
          })
        )
      );

      if (!uploadResponse) {
        throw new Error('Nie udało się zapisać informacji o zasobie');
      }

      state.uploadProgress = 100;
      state.successMessage = `Obraz ${type} został zapisany pomyślnie!`;

      setTimeout(() => {
        this.loadImage(type);
      }, 1500);

    } catch (error) {
      console.error('[ImageComponent] Upload error:', error);

      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          state.errorMessage = 'Przekroczono czas oczekiwania. Spróbuj ponownie.';
        } else {
          state.errorMessage = error.message;
        }
      } else {
        state.errorMessage = 'Wystąpił błąd podczas zapisywania';
      }
    } finally {
      state.isUploading = false;
    }
  }

  // ============ IMAGE DELETION ============

  async deleteImage(type: ImageType): Promise<void> {
    if (!confirm(`Czy na pewno chcesz usunąć obraz ${type}?`)) {
      return;
    }

    const state = this.images[type];
    state.isUploading = true;
    state.errorMessage = '';
    state.successMessage = '';

    const url = `${environment.apiUrl}${environment.endpoints.services.images
      .replace(':id', this.serviceId.toString())
      .replace(':type', type)}`;

    this.http.delete(url)
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          state.errorMessage = `Nie udało się usunąć obrazu ${type}`;
          console.error(`[ImageComponent] Error deleting ${type}:`, err);
          state.isUploading = false;
          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          state.successMessage = `Obraz ${type} został usunięty`;
          state.url = null;
          state.customImageUrl = null;

          // Restore default index
          if (type !== 'LOGO' && this.defaultImages[type]) {
            const defaultIndex = this.availableAssets.indexOf(this.defaultImages[type]);
            state.currentIndex = defaultIndex !== -1 ? defaultIndex : 0;
          }

          state.isUploading = false;
        }
      });
  }

  // ============ CAROUSEL NAVIGATION ============

  getAvailableImages(type: ImageType): string[] {
    if (type === 'LOGO') {
      return [];
    }

    const images = [...this.availableAssets];

    // Add custom image at the end if exists
    if (this.images[type].customImageUrl && !this.isAssetImage(this.images[type].customImageUrl!)) {
      images.push('custom');
    }

    return images;
  }

  private isAssetImage(url: string): boolean {
    return this.availableAssets.some(asset => url.includes(asset));
  }

  getImageUrl(type: ImageType, index: number): string {
    const images = this.getAvailableImages(type);
    const imageName = images[index];

    if (imageName === 'custom') {
      return this.images[type].customImageUrl || '';
    }

    return `assets/images/pictures/vertical/${imageName}`;
  }

  getCurrentImageUrl(type: ImageType): string {
    return this.getImageUrl(type, this.images[type].currentIndex);
  }

  getPrevImageUrl(type: ImageType): string {
    const images = this.getAvailableImages(type);
    const prevIndex = (this.images[type].currentIndex - 1 + images.length) % images.length;
    return this.getImageUrl(type, prevIndex);
  }

  getNextImageUrl(type: ImageType): string {
    const images = this.getAvailableImages(type);
    const nextIndex = (this.images[type].currentIndex + 1) % images.length;
    return this.getImageUrl(type, nextIndex);
  }

  navigateCarousel(type: ImageType, direction: 'prev' | 'next'): void {
    const images = this.getAvailableImages(type);

    if (direction === 'prev') {
      this.images[type].currentIndex = (this.images[type].currentIndex - 1 + images.length) % images.length;
    } else {
      this.images[type].currentIndex = (this.images[type].currentIndex + 1) % images.length;
    }
  }

  async selectCurrentImage(type: ImageType): Promise<void> {
    const images = this.getAvailableImages(type);
    const currentImage = images[this.images[type].currentIndex];
    const state = this.images[type];

    if (currentImage === 'custom') {
      // Already selected custom image
      state.successMessage = 'To zdjęcie jest już wybrane';
      setTimeout(() => state.successMessage = '', 2000);
      return;
    }

    // Selected asset from gallery
    await this.uploadAssetImage(type, currentImage);
  }

  // ============ UI HELPERS ============

  clearSelection(type: ImageType): void {
    const state = this.images[type];

    // Fix #2: Revoke object URL before clearing
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }

    state.selectedFile = null;
    state.previewUrl = null;
    this.clearFileInput(type);
  }

  private clearFileInput(type: ImageType): void {
    // Find the input element for this specific image type
    if (this.fileInputs) {
      const input = this.fileInputs.find(
        (el) => el.nativeElement.getAttribute('data-image-type') === type
      );

      if (input?.nativeElement) {
        input.nativeElement.value = '';
      }
    }
  }

  getImageTitle(type: ImageType): string {
    const titles: Record<ImageType, string> = {
      LOGO: 'Logo serwisu',
      ABOUT_US: 'Obraz "O nas"',
      OPENING_HOURS: 'Obraz "Godziny otwarcia"'
    };
    return titles[type];
  }

  getImageDescription(type: ImageType): string {
    const descriptions: Record<ImageType, string> = {
      LOGO: 'Logo widoczne w wynikach wyszukiwania i na stronie profilu',
      ABOUT_US: 'Obraz wyświetlany w sekcji "O nas"',
      OPENING_HOURS: 'Obraz wyświetlany w sekcji "Godziny otwarcia"'
    };
    return descriptions[type];
  }

  canShowCarousel(type: ImageType): boolean {
    return type === 'ABOUT_US' || type === 'OPENING_HOURS';
  }

  formatFileSize(bytes: number): string {
    return this.imageUtils.formatFileSize(bytes);
  }
}
