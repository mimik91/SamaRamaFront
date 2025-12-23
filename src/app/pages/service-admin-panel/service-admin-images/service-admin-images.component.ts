import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../core/api-config';

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
  customImageUrl: string | null; // URL załadowanego przez użytkownika obrazu
}

@Component({
  selector: 'app-service-admin-images',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-admin-images.component.html',
  styleUrls: ['./service-admin-images.component.css']
})
export class ServiceAdminImagesComponent implements OnInit {
  @Input() serviceId!: number;

  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

  readonly imageTypes: ImageType[] = ['LOGO', 'ABOUT_US', 'OPENING_HOURS'];

  // Dostępne obrazy z assets
  readonly availableAssets = [
    'vertical1.jpg',
    'vertical2.jpg',
    'vertical3.jpg',
    'vertical4.jpg',
    'vertical5.jpg',
    'vertical6.jpg'
  ];

  // Domyślne obrazy dla każdego typu
  readonly defaultImages: Record<ImageType, string> = {
    LOGO: '',
    ABOUT_US: 'vertical-1.jpg',
    OPENING_HOURS: 'vertical-2.jpg'
  };

  images: Record<ImageType, ImageState> = {
    LOGO: this.createInitialState(),
    ABOUT_US: this.createInitialState(),
    OPENING_HOURS: this.createInitialState()
  };

  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';
  isCompressing = false;

  ngOnInit(): void {
    this.loadAllImages();
  }

  private createInitialState(): ImageState {
    return {
      url: null,
      isLoading: false,
      selectedFile: null,
      previewUrl: null,
      currentIndex: 0,
      customImageUrl: null
    };
  }

  loadAllImages(): void {
    this.imageTypes.forEach(type => {
      this.loadImage(type);
    });
  }

  loadImage(type: ImageType): void {
    this.images[type].isLoading = true;
    this.errorMessage = '';

    this.http.get<ImageUrlResponse>(`${this.apiUrl}/services/${this.serviceId}/images/${type}`)
      .subscribe({
        next: (response) => {
          this.images[type].url = response.url;
          this.images[type].customImageUrl = response.url;
          
          // Ustaw currentIndex na podstawie załadowanego obrazu
          if (type !== 'LOGO') {
            const fileName = this.getFileNameFromUrl(response.url);
            const index = this.getAvailableImages(type).findIndex(img => 
              img.includes(fileName) || fileName.includes(img)
            );
            if (index !== -1) {
              this.images[type].currentIndex = index;
            } else {
              // Jeśli to custom image, ustaw na ostatni indeks
              this.images[type].currentIndex = this.getAvailableImages(type).length - 1;
            }
          }
          
          this.images[type].isLoading = false;
        },
        error: (err) => {
          if (err.status === 404) {
            this.images[type].url = null;
            this.images[type].customImageUrl = null;
            // Ustaw domyślny obraz dla ABOUT_US i OPENING_HOURS
            if (type !== 'LOGO' && this.defaultImages[type]) {
              const defaultIndex = this.availableAssets.indexOf(this.defaultImages[type]);
              this.images[type].currentIndex = defaultIndex !== -1 ? defaultIndex : 0;
            }
          } else {
            this.errorMessage = `Nie udało się załadować obrazu ${type}`;
            console.error(`Error loading ${type}:`, err);
          }
          this.images[type].isLoading = false;
        }
      });
  }

  private getFileNameFromUrl(url: string): string {
    return url.split('/').pop()?.split('?')[0] || '';
  }

  getAvailableImages(type: ImageType): string[] {
    if (type === 'LOGO') {
      return [];
    }
    
    const images = [...this.availableAssets];
    
    // Dodaj custom image na koniec jeśli istnieje
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

  onFileSelected(event: Event, type: ImageType): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Wybrany plik nie jest obrazem';
      this.clearFileInput(type);
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      console.log(`Plik ma ${(file.size / 1024 / 1024).toFixed(2)}MB i zostanie skompresowany`);
    }

    this.images[type].selectedFile = file;
    this.createPreview(file, type);
  }

  createPreview(file: File, type: ImageType): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.images[type].previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async compressImage(file: File): Promise<File> {
    try {
      console.log('Oryginalna wielkość:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = file;
      console.log('Skompresowana wielkość:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      const compressedFileWithName = new File(
        [compressedFile], 
        file.name, 
        { type: compressedFile.type }
      );
      
      return compressedFileWithName;
    } catch (error) {
      console.error('Błąd kompresji:', error);
      throw new Error('Nie udało się skompresować obrazu');
    }
  }

  async selectCurrentImage(type: ImageType): Promise<void> {
    const images = this.getAvailableImages(type);
    const currentImage = images[this.images[type].currentIndex];

    if (currentImage === 'custom') {
      // Już wybrany custom image - nie rób nic
      this.successMessage = 'To zdjęcie jest już wybrane';
      setTimeout(() => this.successMessage = '', 2000);
      return;
    }

    // Wybrano asset z galerii
    await this.uploadAssetImage(type, currentImage);
  }

  async uploadCustomImage(type: ImageType): Promise<void> {
    const state = this.images[type];
    
    if (!state.selectedFile) {
      this.errorMessage = 'Nie wybrano pliku';
      return;
    }

    this.isUploading = true;
    this.isCompressing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;

    try {
      this.uploadProgress = 10;
      const compressedFile = await this.compressImage(state.selectedFile);
      this.uploadProgress = 20;
      this.isCompressing = false;

      const dimensions = await this.getImageDimensions(compressedFile);
      this.uploadProgress = 30;
      
      const uploadResponse = await this.http.post<UploadUrlResponse>(
        `${this.apiUrl}/services/${this.serviceId}/images`,
        {
          type: type,
          fileName: `${this.serviceId}_${type}`,
          mimeType: compressedFile.type,
          width: dimensions.width,
          height: dimensions.height,
          weight: Math.round(compressedFile.size / 1024),
          provider: 'R2'
        }
      ).toPromise();

      if (!uploadResponse || !uploadResponse.uploadUrl) {
        throw new Error('Nie udało się wygenerować URL do uploadu');
      }

      this.uploadProgress = 50;

      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': compressedFile.type,
        },
        body: compressedFile,
      });

      console.log('Upload status:', uploadResult.status);
      console.log('Upload headers:', uploadResult.headers);

      if (!uploadResult.ok) {
        throw new Error('Nie udało się przesłać pliku do serwera');
      }

      this.uploadProgress = 100;
      this.successMessage = `Obraz ${type} został przesłany pomyślnie!`;
      
      setTimeout(() => {
        this.loadImage(type);
        this.clearSelection(type);
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas przesyłania pliku';
    } finally {
      this.isUploading = false;
      this.isCompressing = false;
    }
  }

  async uploadAssetImage(type: ImageType, assetName: string): Promise<void> {
    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;

    try {
      this.uploadProgress = 30;
      
      const uploadResponse = await this.http.post<UploadUrlResponse>(
        `${this.apiUrl}/services/${this.serviceId}/images`,
        {
          type: type,
          fileName: assetName,
          mimeType: 'image/jpeg',
          provider: 'LOCAL_ASSET'
        }
      ).toPromise();

      if (!uploadResponse) {
        throw new Error('Nie udało się zapisać informacji o zasobie');
      }

      this.uploadProgress = 100;
      this.successMessage = `Obraz ${type} został zapisany pomyślnie!`;
      
      setTimeout(() => {
        this.loadImage(type);
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania';
    } finally {
      this.isUploading = false;
    }
  }

  async deleteImage(type: ImageType): Promise<void> {
    if (!confirm(`Czy na pewno chcesz usunąć obraz ${type}?`)) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete(`${this.apiUrl}/services/${this.serviceId}/images/${type}`)
      .subscribe({
        next: () => {
          this.successMessage = `Obraz ${type} został usunięty`;
          this.images[type].url = null;
          this.images[type].customImageUrl = null;
          
          // Przywróć domyślny indeks
          if (type !== 'LOGO' && this.defaultImages[type]) {
            const defaultIndex = this.availableAssets.indexOf(this.defaultImages[type]);
            this.images[type].currentIndex = defaultIndex !== -1 ? defaultIndex : 0;
          }
          
          this.isUploading = false;
        },
        error: (err) => {
          this.errorMessage = `Nie udało się usunąć obrazu ${type}`;
          console.error(`Error deleting ${type}:`, err);
          this.isUploading = false;
        }
      });
  }

  clearSelection(type: ImageType): void {
    this.images[type].selectedFile = null;
    this.images[type].previewUrl = null;
    this.clearFileInput(type);
  }

  private clearFileInput(type: ImageType): void {
    const input = document.getElementById(`${type.toLowerCase()}-upload`) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Nie udało się załadować obrazu'));
      };
      
      img.src = url;
    });
  }

  formatFileSize(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
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
}