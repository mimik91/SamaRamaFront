import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../core/api-config';
import imageCompression from 'browser-image-compression';

interface UploadUrlResponse {
  imageId: string;
  uploadUrl: string;
  path: string;
}

interface ImageUrlResponse {
  url: string;
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

  logoUrl: string | null = null;
  isLoadingLogo = false;
  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isCompressing = false;

  ngOnInit(): void {
    this.loadLogo();
  }

  loadLogo(): void {
    this.isLoadingLogo = true;
    this.errorMessage = '';

    this.http.get<ImageUrlResponse>(`${this.apiUrl}/services/${this.serviceId}/images/LOGO`)
      .subscribe({
        next: (response) => {
          this.logoUrl = response.url;
          this.isLoadingLogo = false;
        },
        error: (err) => {
          if (err.status === 404) {
            // Brak loga - to normalna sytuacja
            this.logoUrl = null;
          } else {
            this.errorMessage = 'Nie udało się załadować loga';
            console.error('Error loading logo:', err);
          }
          this.isLoadingLogo = false;
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    // Walidacja typu pliku
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Wybrany plik nie jest obrazem';
      this.clearFileInput();
      return;
    }

    // Informacja jeśli plik jest duży (zostanie skompresowany)
    if (file.size > this.MAX_FILE_SIZE) {
      console.log(`Plik ma ${(file.size / 1024 / 1024).toFixed(2)}MB i zostanie skompresowany`);
    }

    this.selectedFile = file;
    this.createPreview(file);
  }

  createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 0.9, // Maksymalnie 0.9MB (z marginesem bezpieczeństwa)
      maxWidthOrHeight: 1920, // Maksymalna szerokość/wysokość
      useWebWorker: true,
      fileType: file.type as any,
      initialQuality: 0.8,
    };

    try {
      console.log('Oryginalna wielkość:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = await imageCompression(file, options);
      console.log('Skompresowana wielkość:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Zachowaj oryginalne rozszerzenie pliku
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

  async uploadLogo(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage = 'Nie wybrano pliku';
      return;
    }

    this.isUploading = true;
    this.isCompressing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;

    try {
      // 1. Kompresja obrazu
      this.uploadProgress = 10;
      const compressedFile = await this.compressImage(this.selectedFile);
      this.uploadProgress = 20;
      this.isCompressing = false;

      // 2. Pobierz wymiary skompresowanego obrazu
      const dimensions = await this.getImageDimensions(compressedFile);
      this.uploadProgress = 30;
      
      // 3. Wygeneruj presigned URL
      const uploadResponse = await this.http.post<UploadUrlResponse>(
        `${this.apiUrl}/services/${this.serviceId}/images`,
        {
          type: 'LOGO',
          fileName: this.serviceId + 'LOGO',
          mimeType: compressedFile.type,
          width: dimensions.width,
          height: dimensions.height,
          weight: Math.round(compressedFile.size / 1024) // Rozmiar w KB
        }
      ).toPromise();

      if (!uploadResponse) {
        throw new Error('Nie udało się wygenerować URL do uploadu');
      }

      this.uploadProgress = 50;

      // 4. Upload skompresowanego pliku do R2
      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': compressedFile.type,
        },
        body: compressedFile,
      });

      if (!uploadResult.ok) {
        throw new Error('Nie udało się przesłać pliku do serwera');
      }

      this.uploadProgress = 100;
      this.successMessage = 'Logo zostało przesłane pomyślnie!';
      
      // Odśwież logo
      setTimeout(() => {
        this.loadLogo();
        this.clearSelection();
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas przesyłania pliku';
    } finally {
      this.isUploading = false;
      this.isCompressing = false;
    }
  }

  async deleteLogo(): Promise<void> {
    if (!confirm('Czy na pewno chcesz usunąć logo?')) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete(`${this.apiUrl}/services/${this.serviceId}/images/LOGO`)
      .subscribe({
        next: () => {
          this.successMessage = 'Logo zostało usunięte';
          this.logoUrl = null;
          this.isUploading = false;
        },
        error: (err) => {
          this.errorMessage = 'Nie udało się usunąć loga';
          console.error('Error deleting logo:', err);
          this.isUploading = false;
        }
      });
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.clearFileInput();
  }

  private clearFileInput(): void {
    const input = document.getElementById('logo-upload') as HTMLInputElement;
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
}