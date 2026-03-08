import { Component, OnInit, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BicycleService, GroupedImagesResponse, BicycleImage, ActiveTransportResponse, ActiveServiceOrderCard, ServiceOrderMessage, ServiceOrderDetail } from '../bicycle.service';
import { Bicycle } from '../../../shared/models/bicycle.model';
import { NotificationService } from '../../../core/notification.service';
import { ServiceRecord } from '../../../service-records/service-record.model';
import { ServiceRecordService } from '../../../service-records/service-record.service';
import { EnumerationService } from '../../../core/enumeration.service';
import { BicycleSelectionService } from '../bicycle-selection.service';
import { ImageUtilsService } from '../../../core/image-utils.service';

@Component({
  selector: 'app-client-panel-bicycle-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './client-panel-bicycle-details.component.html',
  styleUrls: ['./client-panel-bicycle-details.component.css']
})
export class ClientPanelDetailsComponent implements OnInit {
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
  expandedRecordIds = new Set<number>();
  loading = true;
  isEditing = false;
  isSubmitting = false;
  isPhotoDeleting = false;
  errorMessage = '';
  timestamp = Date.now();

  // Images
  bicycleImages: GroupedImagesResponse | null = null;
  activeGalleryTab: 'GALLERY' | 'RECEIPT' = 'GALLERY';
  isGalleryUploading = false;

  // Lightbox
  lightboxOpen = false;
  lightboxIndex = 0;
  isLightboxDeleting = false;

  // Gallery upload progress
  galleryUploadCurrent = 0;
  galleryUploadTotal = 0;

  // Active status
  activeTransport: ActiveTransportResponse | null = null;
  activeServiceOrder: ActiveServiceOrderCard | null = null;

  // Service order details (expanded)
  isServiceOrderExpanded = false;
  serviceOrderDetail: ServiceOrderDetail | null = null;
  serviceOrderMessages: ServiceOrderMessage[] = [];
  serviceOrderImages: { url: string; imageId?: number }[] = [];
  serviceOrderUnreadCount = 0;
  isLoadingServiceOrderDetail = false;
  newMessageContent = '';
  isSendingMessage = false;

  // Service order image lightbox
  soLightboxOpen = false;
  soLightboxIndex = 0;

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
      frameNumber: [''],
      productionDate: ['']
    });
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get mainPhotoUrl(): string | null {
    const photos = this.bicycleImages?.images?.MAIN_PHOTO;
    return (photos && photos.length > 0) ? photos[0].url : null;
  }

  get mainPhotoImageId(): number | null {
    const photos = this.bicycleImages?.images?.MAIN_PHOTO;
    return (photos && photos.length > 0) ? photos[0].imageId : null;
  }

  get galleryImages(): BicycleImage[] {
    if (!this.bicycleImages?.images) return [];
    return this.activeGalleryTab === 'GALLERY'
      ? (this.bicycleImages.images.GALLERY ?? [])
      : (this.bicycleImages.images.RECEIPT ?? []);
  }

  get galleryUploadLabel(): string {
    if (!this.isGalleryUploading) return '+ Dodaj zdjęcia';
    return this.galleryUploadTotal > 1
      ? `Dodawanie (${this.galleryUploadCurrent}/${this.galleryUploadTotal})…`
      : 'Dodawanie…';
  }

  get isTransportDelivered(): boolean {
    return this.activeTransport?.transport?.status === 'DELIVERED';
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
        this.loadBicycleStatus(id);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bicycle:', error);
        this.notificationService.error('Nie udało się załadować danych roweru');
        this.loading = false;
      }
    });
  }

  loadBicycleStatus(bicycleId: number): void {
    this.bicycleService.getActiveBicycleTransport(bicycleId).subscribe({
      next: (response) => { this.activeTransport = response; },
      error: () => { this.activeTransport = null; }
    });

    this.bicycleService.getActiveServiceOrders().subscribe({
      next: (orders) => {
        this.activeServiceOrder = orders.find(o =>
          o.bicycleBrand === this.bicycle?.brand &&
          o.bicycleModel === this.bicycle?.model
        ) ?? null;
      },
      error: () => { this.activeServiceOrder = null; }
    });
  }

  // ── Service order details ──────────────────────────────────────────────────

  toggleServiceOrderDetails(): void {
    this.isServiceOrderExpanded = !this.isServiceOrderExpanded;
    if (this.isServiceOrderExpanded && this.activeServiceOrder) {
      this.loadServiceOrderDetails(this.activeServiceOrder.id);
    } else {
      this.soLightboxOpen = false;
    }
  }

  private loadServiceOrderDetails(orderId: number): void {
    this.isLoadingServiceOrderDetail = true;
    this.serviceOrderImages = [];

    this.bicycleService.getServiceOrderDetail(orderId).subscribe({
      next: (detail) => { this.serviceOrderDetail = detail; },
      error: () => { this.serviceOrderDetail = null; }
    });

    this.bicycleService.getServiceOrderMessages(orderId).subscribe({
      next: (response) => {
        this.serviceOrderMessages = response.messages;
        this.serviceOrderUnreadCount = response.unreadCount;
        this.isLoadingServiceOrderDetail = false;
        if (response.unreadCount > 0) {
          this.bicycleService.markServiceOrderMessagesAsRead(orderId).subscribe();
        }
      },
      error: () => { this.isLoadingServiceOrderDetail = false; }
    });

    this.bicycleService.getServiceOrderImages(orderId).subscribe({
      next: (images) => { this.serviceOrderImages = images; },
      error: () => { this.serviceOrderImages = []; }
    });
  }

  sendServiceOrderMessage(): void {
    const content = this.newMessageContent.trim();
    if (!content || !this.activeServiceOrder || this.isSendingMessage) return;

    this.isSendingMessage = true;
    this.bicycleService.sendServiceOrderMessage(this.activeServiceOrder.id, content).subscribe({
      next: (msg) => {
        this.serviceOrderMessages = [...this.serviceOrderMessages, msg];
        this.newMessageContent = '';
        this.isSendingMessage = false;
      },
      error: () => {
        this.notificationService.error('Nie udało się wysłać wiadomości');
        this.isSendingMessage = false;
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

  toggleRecord(id: number): void {
    if (this.expandedRecordIds.has(id)) {
      this.expandedRecordIds.delete(id);
    } else {
      this.expandedRecordIds.add(id);
    }
  }

  initForm(): void {
    if (this.bicycle) {
      this.bicycleForm.patchValue({
        brand: this.bicycle.brand,
        model: this.bicycle.model,
        type: this.bicycle.type,
        frameMaterial: this.bicycle.frameMaterial,
        frameNumber: this.bicycle.frameNumber || '',
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

  async onGalleryPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.bicycle) return;

    const type = this.activeGalleryTab;
    const limit = this.bicycleImages?.limits?.[type];
    const currentCount = this.bicycleImages?.images?.[type]?.length ?? 0;

    // Validate all selected files
    const validFiles: File[] = [];
    for (const file of Array.from(input.files)) {
      const validation = this.imageUtils.validateImage(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        this.notificationService.error(`"${file.name}": ${validation.error || 'Nieprawidłowy plik'}`);
      }
    }

    if (validFiles.length === 0) { input.value = ''; return; }

    // Enforce limit
    let filesToUpload = validFiles;
    if (limit !== undefined) {
      const available = limit - currentCount;
      if (available <= 0) {
        this.notificationService.error(`Osiągnięto limit zdjęć (${limit}) dla tej kategorii`);
        input.value = '';
        return;
      }
      if (validFiles.length > available) {
        this.notificationService.warning(
          `Można dodać jeszcze ${available} z ${validFiles.length} wybranych zdjęć (limit: ${limit})`
        );
        filesToUpload = validFiles.slice(0, available);
      }
    }

    this.isGalleryUploading = true;
    this.galleryUploadCurrent = 0;
    this.galleryUploadTotal = filesToUpload.length;

    let uploaded = 0;
    let failed = 0;
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        await this.uploadGalleryPhotoToR2(this.bicycle.id, filesToUpload[i], type, currentCount + i);
        uploaded++;
      } catch (error) {
        console.error('Error uploading gallery photo:', error);
        failed++;
      }
      this.galleryUploadCurrent = uploaded + failed;
    }

    if (uploaded > 0 && failed === 0) {
      this.notificationService.success(uploaded === 1 ? 'Zdjęcie zostało dodane' : `Dodano ${uploaded} zdjęć`);
    } else if (uploaded > 0) {
      this.notificationService.warning(`Dodano ${uploaded} z ${filesToUpload.length} zdjęć`);
    } else {
      this.notificationService.error('Nie udało się dodać zdjęć');
    }

    this.loadBicycleImages(this.bicycle.id);
    this.isGalleryUploading = false;
    this.galleryUploadCurrent = 0;
    this.galleryUploadTotal = 0;
    input.value = '';
  }

  private async uploadGalleryPhotoToR2(bicycleId: number, file: File, type: 'GALLERY' | 'RECEIPT', displayOrder?: number): Promise<void> {
    const compressedFile = await this.imageUtils.compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      outputFormat: 'webp'
    });

    const dimensions = await this.imageUtils.getImageDimensions(compressedFile);
    const order = displayOrder ?? (this.bicycleImages?.images?.[type]?.length ?? 0);

    const uploadResponse = await firstValueFrom(
      this.bicycleService.generateImageUploadUrl(bicycleId, {
        type: type,
        fileName: `bicycle_${bicycleId}_${type.toLowerCase()}_${Date.now()}`,
        mimeType: compressedFile.type,
        width: dimensions.width,
        height: dimensions.height,
        weight: Math.round(compressedFile.size / 1024),
        displayOrder: order
      })
    );

    if (!uploadResponse || !uploadResponse.uploadUrl) {
      throw new Error('Nie udało się wygenerować URL do uploadu');
    }

    await this.bicycleService.uploadToR2(uploadResponse.uploadUrl, compressedFile);
  }

  confirmDeletePhoto(): void {
    if (confirm('Czy chcesz usunąć zdjęcie główne? Tej operacji nie można cofnąć.')) {
      this.deletePhoto();
    }
  }

  deletePhoto(): void {
    const imageId = this.mainPhotoImageId;
    if (!this.bicycle || !imageId || this.isPhotoDeleting) {
      return;
    }

    this.isPhotoDeleting = true;

    this.bicycleService.deleteBicycleImageById(this.bicycle.id, imageId).subscribe({
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
      frameNumber: this.bicycleForm.value.frameNumber || null
    };

    const isComplete = !!(this.bicycleForm.value.frameNumber || this.bicycle.frameNumber);

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

  // ── Lightbox ─────────────────────────────────────────────────────────────

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  lightboxPrev(event: Event): void {
    event.stopPropagation();
    this.lightboxIndex = (this.lightboxIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
  }

  lightboxNext(event: Event): void {
    event.stopPropagation();
    this.lightboxIndex = (this.lightboxIndex + 1) % this.galleryImages.length;
  }

  onLightboxKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closeLightbox();
    if (event.key === 'ArrowLeft') this.lightboxIndex = (this.lightboxIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    if (event.key === 'ArrowRight') this.lightboxIndex = (this.lightboxIndex + 1) % this.galleryImages.length;
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKey(event: KeyboardEvent): void {
    if (this.soLightboxOpen) { this.onSoLightboxKey(event); return; }
    if (this.lightboxOpen) { this.onLightboxKey(event); }
  }

  openSoLightbox(index: number): void {
    this.soLightboxIndex = index;
    this.soLightboxOpen = true;
  }

  closeSoLightbox(): void {
    this.soLightboxOpen = false;
  }

  soLightboxPrev(event: Event): void {
    event.stopPropagation();
    this.soLightboxIndex = (this.soLightboxIndex - 1 + this.serviceOrderImages.length) % this.serviceOrderImages.length;
  }

  soLightboxNext(event: Event): void {
    event.stopPropagation();
    this.soLightboxIndex = (this.soLightboxIndex + 1) % this.serviceOrderImages.length;
  }

  onSoLightboxKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closeSoLightbox();
    if (event.key === 'ArrowLeft') this.soLightboxIndex = (this.soLightboxIndex - 1 + this.serviceOrderImages.length) % this.serviceOrderImages.length;
    if (event.key === 'ArrowRight') this.soLightboxIndex = (this.soLightboxIndex + 1) % this.serviceOrderImages.length;
  }

  confirmDeleteLightboxImage(event: Event): void {
    event.stopPropagation();
    if (confirm('Czy chcesz usunąć to zdjęcie? Tej operacji nie można cofnąć.')) {
      this.deleteLightboxImage();
    }
  }

  deleteLightboxImage(): void {
    if (!this.bicycle || this.isLightboxDeleting) return;

    const image = this.galleryImages[this.lightboxIndex];
    if (!image) return;

    this.isLightboxDeleting = true;

    this.bicycleService.deleteBicycleImageById(this.bicycle.id, image.imageId).subscribe({
      next: () => {
        this.notificationService.success('Zdjęcie zostało usunięte');
        this.loadBicycleImages(this.bicycle!.id);
        const remaining = this.galleryImages.length - 1;
        if (remaining === 0) {
          this.closeLightbox();
        } else {
          this.lightboxIndex = Math.min(this.lightboxIndex, remaining - 1);
        }
        this.isLightboxDeleting = false;
      },
      error: (error: any) => {
        console.error('Error deleting image:', error);
        this.notificationService.error('Nie udało się usunąć zdjęcia');
        this.isLightboxDeleting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/bicycles']);
  }

  reportStolen(): void {
    if (!this.bicycle) return;
    const isCurrentlyStolen = !!this.bicycle.stolen;
    const msg = isCurrentlyStolen
      ? 'Czy rower się znalazł? Cofnąć zgłoszenie kradzieży?'
      : 'Czy na pewno chcesz zgłosić ten rower jako skradziony?';
    if (!confirm(msg)) return;

    const newValue = !isCurrentlyStolen;
    this.bicycleService.updateStolenStatus(this.bicycle.id, newValue).subscribe({
      next: (res) => {
        this.bicycle!.stolen = newValue;
        const backendMsg = res?.message;
        const defaultMsg = newValue ? 'Rower zgłoszony jako skradziony' : 'Zgłoszenie kradzieży cofnięte';
        this.notificationService.success(backendMsg || defaultMsg);
      },
      error: (err) => {
        const backendMsg = err?.error?.message;
        this.notificationService.error(backendMsg || 'Nie udało się zaktualizować statusu roweru');
      }
    });
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
