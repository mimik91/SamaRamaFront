// src/app/core/image-utils.service.ts

import { Injectable } from '@angular/core';

export type OutputFormat = 'webp' | 'jpeg' | 'png';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: OutputFormat;
  onProgress?: (progress: number) => void;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUtilsService {
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_MAX_DIMENSION = 1920;
  private readonly DEFAULT_QUALITY = 0.85;

  /**
   * Validates if the file is a valid image
   */
  validateImage(file: File): ImageValidationResult {
    if (!file) {
      return {
        valid: false,
        error: 'Nie wybrano pliku'
      };
    }

    if (!this.ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `Nieprawidłowy format pliku. Dozwolone: JPEG, PNG, WEBP. Otrzymano: ${file.type}`
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Plik jest za duży (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksymalny rozmiar: 10MB`
      };
    }

    return { valid: true };
  }

  /**
   * Gets image dimensions without loading entire file into memory
   */
  async getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Nie udało się załadować obrazu'));
      };

      img.src = objectUrl;
    });
  }

  /**
   * Compresses image with configurable options
   * Supports JPEG, PNG (with transparency), and WEBP
   */
  async compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
    const {
      maxWidth = this.DEFAULT_MAX_DIMENSION,
      maxHeight = this.DEFAULT_MAX_DIMENSION,
      quality = this.DEFAULT_QUALITY,
      outputFormat = 'webp',
      onProgress
    } = options;

    const needsAlpha = outputFormat === 'png';

    onProgress?.(0);

    try {
      console.log('[ImageUtils] Original file:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });

      // Load image
      const img = await this.loadImage(file);
      onProgress?.(20);

      // Calculate new dimensions
      const dimensions = this.calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        maxWidth,
        maxHeight
      );
      onProgress?.(30);

      console.log('[ImageUtils] Dimensions:', {
        original: `${img.naturalWidth}x${img.naturalHeight}`,
        resized: `${dimensions.width}x${dimensions.height}`
      });

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const ctx = canvas.getContext('2d', { alpha: needsAlpha });
      if (!ctx) {
        throw new Error('Nie można utworzyć canvas context');
      }

      // Add white background for non-transparent formats
      if (!needsAlpha) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      // Draw image with high quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      onProgress?.(60);

      // Convert to blob
      const blob = await this.canvasToBlob(canvas, outputFormat, quality);
      onProgress?.(90);

      if (!blob) {
        throw new Error('Nie udało się skompresować obrazu');
      }

      console.log('[ImageUtils] Compressed file:', {
        format: outputFormat,
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
        reduction: `${(((file.size - blob.size) / file.size) * 100).toFixed(1)}%`
      });

      // Determine output format
      const mimeTypes: Record<OutputFormat, string> = {
        'webp': 'image/webp',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
      };
      const extensions: Record<OutputFormat, string> = {
        'webp': '.webp',
        'jpeg': '.jpg',
        'png': '.png'
      };

      const outputType = mimeTypes[outputFormat];
      const extension = extensions[outputFormat];
      const newFileName = file.name.replace(/\.[^.]+$/, extension);

      const compressedFile = new File([blob], newFileName, {
        type: outputType,
        lastModified: Date.now()
      });

      onProgress?.(100);
      return compressedFile;

    } catch (error) {
      console.error('[ImageUtils] Compression failed:', error);
      throw error instanceof Error ? error : new Error('Nie udało się skompresować obrazu');
    }
  }

  /**
   * Loads an image from a File object
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Nie udało się załadować obrazu'));
      };

      img.src = objectUrl;
    });
  }

  /**
   * Calculates new dimensions while maintaining aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): ImageDimensions {
    let width = originalWidth;
    let height = originalHeight;

    // Check if resizing is needed
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    // Calculate scaling ratio
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    // Apply scaling
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    return { width, height };
  }

  /**
   * Converts canvas to Blob with proper format
   */
  private canvasToBlob(
    canvas: HTMLCanvasElement,
    format: OutputFormat,
    quality: number
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mimeTypes: Record<OutputFormat, string> = {
        'webp': 'image/webp',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
      };
      const mimeType = mimeTypes[format];

      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        quality
      );
    });
  }

  /**
   * Creates a preview URL for a file (useful for showing preview before upload)
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Nie udało się utworzyć podglądu'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Nie udało się odczytać pliku'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Formats file size to human-readable string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Checks if compression is needed based on file size
   */
  needsCompression(file: File, maxSizeBytes: number = 1024 * 1024): boolean {
    return file.size > maxSizeBytes;
  }
}
