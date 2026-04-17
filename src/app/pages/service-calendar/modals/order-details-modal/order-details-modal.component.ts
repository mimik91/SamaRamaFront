import { Component, Input, Output, EventEmitter, inject, ViewChild, ViewChildren, QueryList, ElementRef, DestroyRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../../../core/i18n.service';
import { NotificationService } from '../../../../core/notification.service';
import { ImageUtilsService } from '../../../../core/image-utils.service';
import { EnumerationService } from '../../../../core/enumeration.service';
import { ServiceCalendarService, OrderMessage, ReturnTransportRequestDto, TransportAddressResponse, BicycleUpdateDto } from '../../services/service-calendar.service';
import {
  CalendarOrder,
  CalendarOrderStatus,
  CalendarMode,
  Technician,
  OrderStatusConfig,
  OrderImage,
  getStatusColor,
  getStatusI18nKey,
  getAvailableStatusTransitions
} from '../../../../shared/models/service-calendar.models';

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.css']
})
export class OrderDetailsModalComponent implements OnDestroy {
  private i18nService = inject(I18nService);
  private notificationService = inject(NotificationService);
  private calendarService = inject(ServiceCalendarService);
  private imageUtils = inject(ImageUtilsService);
  private enumerationService = inject(EnumerationService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('noteTextarea') noteTextareas!: QueryList<ElementRef<HTMLTextAreaElement>>;

  @Input() order!: CalendarOrder;
  @Input() serviceId!: number;
  @Input() technicians: Technician[] = [];
  @Input() calendarMode: CalendarMode = 'SIMPLE';
  @Input() reservationAvailable: boolean = false;
  @Input() transportAvailable: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<void>();
  @Output() acceptBike = new EventEmitter<CalendarOrder>();

  // State
  isLoading: boolean = true;
  isUpdating: boolean = false;

  // Image state
  images: OrderImage[] = [];
  isLoadingImages: boolean = false;
  isUploadingImage: boolean = false;
  isCompressingImage: boolean = false;
  uploadProgress: number = 0;
  uploadCurrentIndex: number = 0;
  uploadTotalCount: number = 0;
  selectedFiles: File[] = [];
  selectedPreviews: string[] = [];

  // Messages
  messages: OrderMessage[] = [];
  messagesUnreadCount = 0;
  isLoadingMessages = false;
  newMessageContent = '';
  isSendingMessage = false;

  // Tab
  activeTab: 'details' | 'messages' | 'return' = 'details';

  // Propose date
  showProposeDateForm = false;
  proposedDate: string = '';

  // Return transport tab
  returnPickupMethod: 'self' | 'delivery' = 'self';
  returnDeliveryStreet: string = '';
  returnDeliveryBuilding: string = '';
  returnDeliveryCity: string = 'Kraków';
  returnTransportNotes: string = '';
  isSavingReturnTransport: boolean = false;
  isLoadingReturnTransport: boolean = false;
  transportAddress: TransportAddressResponse | null = null;
  transportAddressLoaded: boolean = false;

  // Cities
  cities: string[] = [];

  // Statuses that allow image uploads (IN_PROGRESS and onwards)
  private readonly IMAGE_ALLOWED_STATUSES: CalendarOrderStatus[] = [
    'IN_PROGRESS',
    'WAITING_FOR_PARTS',
    'AWAITING_CLIENT_DECISION',
    'READY_FOR_PICKUP',
    'COMPLETED'
  ];

  // Image compression settings
  private readonly UPLOAD_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_RETRIES = 3;

  // Local copy of order (will be updated with full data from API)
  fullOrder!: CalendarOrder;

  readonly hours: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutes: string[] = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // Editable fields (local — saved only on close/save)
  selectedStatus: CalendarOrderStatus = 'CONFIRMED';
  selectedTechnicianId: number | null = null;
  selectedDate: string = '';
  selectedTime: string = '';

  get selectedHour(): string { return this.selectedTime ? this.selectedTime.split(':')[0] : '00'; }
  set selectedHour(h: string) { this.selectedTime = `${h}:${this.selectedMinute}`; }
  get selectedMinute(): string {
    if (!this.selectedTime) return '00';
    const m = this.selectedTime.split(':')[1] ?? '00';
    // Zaokrąglij do najbliższego wielokrotności 5
    const num = parseInt(m, 10);
    return String(Math.round(num / 5) * 5 % 60).padStart(2, '0');
  }
  set selectedMinute(m: string) { this.selectedTime = `${this.selectedHour}:${m}`; }
  notes: string = '';
  maintenanceAdvice: string = '';

  // Original values — used to detect dirty state and revert on cancel
  private originalTechnicianId: number | null = null;
  private originalDate: string = '';
  private originalTime: string = '';
  private originalNotes: string = '';
  private originalMaintenanceAdvice: string = '';
  private originalBikeBrand: string = '';
  private originalBikeModel: string = '';
  private originalBikeType: string = '';
  private originalBikeFrameMaterial: string = '';

  // Bike edit fields (always active)
  editBikeBrand: string = '';
  editBikeModel: string = '';
  editBikeType: string = '';
  editBikeFrameMaterial: string = '';
  bikeTypes: string[] = [];
  frameMaterials: string[] = [];

  get canEditTime(): boolean {
    const s = this.fullOrder?.status || this.order.status;
    return s === 'WAITING_FOR_BIKE' || s === 'CONFIRMED';
  }

  get isDirty(): boolean {
    return this.notes !== this.originalNotes
      || this.maintenanceAdvice !== this.originalMaintenanceAdvice
      || this.selectedDate !== this.originalDate
      || this.selectedTime !== this.originalTime
      || this.selectedTechnicianId !== this.originalTechnicianId
      || this.editBikeBrand.trim() !== this.originalBikeBrand
      || this.editBikeModel.trim() !== this.originalBikeModel
      || this.editBikeType !== this.originalBikeType
      || this.editBikeFrameMaterial !== this.originalBikeFrameMaterial;
  }

  // Min date for date picker (today)
  get minDate(): string {
    const today = new Date();
    return this.formatDate(today);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Available statuses (computed based on current status)
  get statuses(): OrderStatusConfig[] {
    return getAvailableStatusTransitions(this.fullOrder?.status || this.order.status);
  }

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  private initOriginals(): void {
    this.originalTechnicianId = this.selectedTechnicianId;
    this.originalDate = this.selectedDate;
    this.originalTime = this.selectedTime;
    this.originalNotes = this.notes;
    this.originalMaintenanceAdvice = this.maintenanceAdvice;
    this.originalBikeBrand = this.editBikeBrand;
    this.originalBikeModel = this.editBikeModel;
    this.originalBikeType = this.editBikeType;
    this.originalBikeFrameMaterial = this.editBikeFrameMaterial;
  }

  ngOnInit(): void {
    // Initialize with passed order data
    this.fullOrder = { ...this.order };
    this.selectedStatus = this.order.status;
    this.selectedTechnicianId = this.order.assignedTechnicianId || null;
    this.selectedDate = this.order.plannedDate || '';
    this.selectedTime = this.order.plannedTime || '';
    this.notes = this.order.serviceNotes || '';
    this.maintenanceAdvice = this.order.maintenanceAdvice || '';

    // Load cities for return transport
    this.enumerationService.getCities().subscribe({
      next: (cities) => { this.cities = cities; },
      error: (err) => { console.error('Error loading cities:', err); }
    });

    // Load bike enumerations
    this.enumerationService.getEnumeration('BIKE_TYPE').subscribe(types => (this.bikeTypes = types));
    this.enumerationService.getEnumeration('FRAME_MATERIAL').subscribe(mats => (this.frameMaterials = mats));

    // Fetch full order details from API to get all fields (including bicycleBrand, bicycleModel)
    this.loadFullOrderDetails();
  }

  /**
   * Pobiera pelne dane zlecenia z API
   */
  loadFullOrderDetails(): void {
    this.isLoading = true;
    this.calendarService.getOrder(this.serviceId, this.order.id).subscribe({
      next: (orderData: any) => {
        // Merge with existing data (keep passed data as fallback)
        this.fullOrder = { ...this.order, ...orderData };
        // Normalize nested bicycle/client data from API
        this.normalizeOrderData(orderData);
        this.selectedStatus = this.fullOrder.status;
        this.selectedTechnicianId = this.fullOrder.assignedTechnicianId || null;
        this.selectedDate = this.fullOrder.plannedDate || '';
        this.selectedTime = this.fullOrder.plannedTime || '';
        this.notes = this.fullOrder.serviceNotes || '';
        this.maintenanceAdvice = this.fullOrder.maintenanceAdvice || '';
        this.editBikeBrand = this.fullOrder.bicycleBrand || '';
        this.editBikeModel = this.fullOrder.bicycleModel || '';
        this.editBikeType = this.fullOrder.bicycleType || '';
        this.editBikeFrameMaterial = this.fullOrder.bicycleFrameMaterial || '';
        this.initOriginals();
        this.isLoading = false;
        this.resizeAllNoteTextareas();
        // Laduj zdjecia jesli status na to pozwala
        this.loadImages();
        this.loadMessages();
      },
      error: (err: any) => {
        // On error, use the passed order data
        console.error('Error loading full order details:', err);
        this.fullOrder = { ...this.order };
        this.isLoading = false;
        // Laduj zdjecia jesli status na to pozwala
        this.loadImages();
        this.loadMessages();
      }
    });
  }

  /**
   * Normalizuje dane z API - obsluguje zarowno zagniezdzona (bicycle.*, client.*) jak i plaska strukture
   */
  private normalizeOrderData(data: any): void {
    if (data.bicycle) {
      this.fullOrder.bicycleId = data.bicycle.id;
      this.fullOrder.bicycleBrand = this.fullOrder.bicycleBrand || data.bicycle.brand || '';
      this.fullOrder.bicycleModel = this.fullOrder.bicycleModel || data.bicycle.model || '';
      this.fullOrder.bicycleFrameNumber = this.fullOrder.bicycleFrameNumber || data.bicycle.frameNumber || '';
      this.fullOrder.bicycleType = data.bicycle.type || '';
      this.fullOrder.bicycleFrameMaterial = data.bicycle.frameMaterial || '';
    }
    if (data.client) {
      const firstName = data.client.firstName || '';
      const lastName = data.client.lastName || '';
      this.fullOrder.clientName = this.fullOrder.clientName || `${firstName} ${lastName}`.trim();
      this.fullOrder.clientEmail = this.fullOrder.clientEmail || data.client.email || '';
      this.fullOrder.clientPhone = this.fullOrder.clientPhone || data.client.phone || '';
    }
    if (data.orderNotes && !this.fullOrder.description) {
      this.fullOrder.description = data.orderNotes;
    }
  }

  /**
   * Zwraca email klienta filtrujac syntetyczne adresy backendowe
   */
  get displayEmail(): string {
    const email = this.fullOrder?.clientEmail || '';
    if (email.endsWith('@local.cyclopick.pl')) {
      return '';
    }
    return email;
  }

  /**
   * Czy pokazac przycisk "Przyjmij rower"
   */
  get isPendingConfirmation(): boolean {
    return (this.fullOrder?.status || this.order.status) === 'PENDING_CONFIRMATION';
  }

  onConfirmOrder(): void {
    this.isUpdating = true;
    this.calendarService.updateOrderStatus(this.serviceId, this.fullOrder.id, 'CONFIRMED').subscribe({
      next: () => {
        this.notificationService.success('Zlecenie zostało potwierdzone.');
        this.isUpdating = false;
        this.orderUpdated.emit();
        // Przeładuj szczegóły zlecenia, aby modal przełączył się na widok potwierdzonego zlecenia
        this.loadFullOrderDetails();
      },
      error: () => {
        this.notificationService.error(this.t('service_calendar.errors.update_status_failed'));
        this.isUpdating = false;
      }
    });
  }

  onRejectOrder(): void {
    this.isUpdating = true;
    this.calendarService.updateOrderStatus(this.serviceId, this.fullOrder.id, 'REJECTED').subscribe({
      next: () => {
        this.notificationService.success('Zlecenie zostało odrzucone.');
        this.isUpdating = false;
        this.orderUpdated.emit();
        this.onClose();
      },
      error: () => {
        this.notificationService.error(this.t('service_calendar.errors.update_status_failed'));
        this.isUpdating = false;
      }
    });
  }

  onSubmitProposeDate(): void {
    if (!this.proposedDate || this.isUpdating) return;
    this.isUpdating = true;
    this.calendarService.proposeDate(this.serviceId, this.fullOrder.id, this.proposedDate).subscribe({
      next: () => {
        // Równolegle zapisz proponowaną datę jako plannedDate zlecenia
        this.calendarService.updateOrder(this.serviceId, this.fullOrder.id, {
          plannedDate: this.proposedDate
        }).subscribe();
        this.notificationService.success('Propozycja daty została wysłana do klienta.');
        this.isUpdating = false;
        this.orderUpdated.emit();
        this.onClose();
      },
      error: () => {
        this.notificationService.error('Nie udało się wysłać propozycji daty.');
        this.isUpdating = false;
      }
    });
  }

  get canAcceptBike(): boolean {
    const status = this.fullOrder?.status || this.order.status;
    return status === 'CONFIRMED' || status === 'WAITING_FOR_BIKE';
  }

  get showReturnTab(): boolean {
    if (!this.reservationAvailable || !this.transportAvailable) return false;
    const status = this.fullOrder?.status || this.order.status;
    return status === 'IN_PROGRESS'
      || status === 'WAITING_FOR_PARTS'
      || status === 'AWAITING_CLIENT_DECISION'
      || status === 'READY_FOR_PICKUP'
      || status === 'COMPLETED';
  }

  onAcceptBikeClick(): void {
    this.acceptBike.emit(this.fullOrder || this.order);
  }

  get statusColor(): string {
    return getStatusColor(this.fullOrder?.status || this.order.status);
  }

  getStatusLabel(status: CalendarOrderStatus): string {
    const key = getStatusI18nKey(status);
    return this.t(key);
  }

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onSaveAndClose();
    }
  }

  async onSaveAndClose(): Promise<void> {
    if (!this.isDirty) {
      this.close.emit();
      return;
    }
    this.isUpdating = true;
    try {
      await this.savePendingChanges();
      this.notificationService.success('Zmiany zostały zapisane.');
      this.orderUpdated.emit();
    } catch {
      this.notificationService.error('Nie udało się zapisać zmian.');
    } finally {
      this.isUpdating = false;
      this.close.emit();
    }
  }

  onCancelAndClose(): void {
    this.notes = this.originalNotes;
    this.maintenanceAdvice = this.originalMaintenanceAdvice;
    this.selectedDate = this.originalDate;
    this.selectedTime = this.originalTime;
    this.selectedTechnicianId = this.originalTechnicianId;
    this.editBikeBrand = this.originalBikeBrand;
    this.editBikeModel = this.originalBikeModel;
    this.editBikeType = this.originalBikeType;
    this.editBikeFrameMaterial = this.originalBikeFrameMaterial;
    this.close.emit();
  }

  onClose(): void {
    this.onSaveAndClose();
  }

  private async savePendingChanges(): Promise<void> {
    const saves: Promise<unknown>[] = [];

    const orderPayload: Record<string, unknown> = {};
    if (this.notes !== this.originalNotes) orderPayload['serviceNotes'] = this.notes;
    if (this.maintenanceAdvice !== this.originalMaintenanceAdvice) orderPayload['maintenanceAdvice'] = this.maintenanceAdvice;
    if (this.selectedDate !== this.originalDate) orderPayload['plannedDate'] = this.selectedDate;
    if (this.selectedTime !== this.originalTime) {
      orderPayload['plannedTime'] = this.selectedTime && this.selectedTime !== '00:00' ? this.selectedTime : null;
    }
    if (this.selectedTechnicianId !== this.originalTechnicianId) orderPayload['assignedTechnicianId'] = this.selectedTechnicianId;

    if (Object.keys(orderPayload).length > 0) {
      saves.push(firstValueFrom(this.calendarService.updateOrder(this.serviceId, this.fullOrder.id, orderPayload)));
    }

    const bikeChanged = this.editBikeBrand.trim() !== this.originalBikeBrand
      || this.editBikeModel.trim() !== this.originalBikeModel
      || this.editBikeType !== this.originalBikeType
      || this.editBikeFrameMaterial !== this.originalBikeFrameMaterial;

    if (bikeChanged && this.fullOrder.bicycleId) {
      const dto: BicycleUpdateDto = {
        brand: this.editBikeBrand.trim(),
        model: this.editBikeModel.trim() || undefined,
        type: this.editBikeType || undefined,
        frameMaterial: this.editBikeFrameMaterial || undefined
      };
      saves.push(firstValueFrom(this.calendarService.updateBicycle(this.fullOrder.bicycleId, this.serviceId, dto)));
    }

    await Promise.all(saves);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  async onStatusChange(): Promise<void> {
    if (this.selectedStatus === this.fullOrder.status) return;

    // Walidacja — sprawdzamy lokalną wartość (editBikeType), nie tylko zapisaną
    if (this.selectedStatus === 'READY_FOR_PICKUP' && !this.editBikeType?.trim()) {
      this.notificationService.error('Nie można ustawić statusu "Gotowe do odbioru" — rower nie ma przypisanego typu roweru.');
      setTimeout(() => { this.selectedStatus = this.fullOrder.status; });
      return;
    }

    this.isUpdating = true;

    // Jeśli dane roweru są zmienione lokalnie, zapisz je przed zmianą statusu
    const bikeChanged = this.editBikeBrand.trim() !== this.originalBikeBrand
      || this.editBikeModel.trim() !== this.originalBikeModel
      || this.editBikeType !== this.originalBikeType
      || this.editBikeFrameMaterial !== this.originalBikeFrameMaterial;

    if (bikeChanged && this.fullOrder.bicycleId) {
      try {
        const dto: BicycleUpdateDto = {
          brand: this.editBikeBrand.trim(),
          model: this.editBikeModel.trim() || undefined,
          type: this.editBikeType || undefined,
          frameMaterial: this.editBikeFrameMaterial || undefined
        };
        await firstValueFrom(this.calendarService.updateBicycle(this.fullOrder.bicycleId, this.serviceId, dto));
        this.fullOrder.bicycleType = this.editBikeType;
        this.originalBikeBrand = this.editBikeBrand.trim();
        this.originalBikeModel = this.editBikeModel.trim();
        this.originalBikeType = this.editBikeType;
        this.originalBikeFrameMaterial = this.editBikeFrameMaterial;
      } catch {
        this.notificationService.error('Nie udało się zapisać danych roweru przed zmianą statusu.');
        this.isUpdating = false;
        this.selectedStatus = this.fullOrder.status;
        return;
      }
    }

    // Specjalna obsluga: PENDING_CONFIRMATION -> WAITING_FOR_BIKE
    if (this.fullOrder.status === 'PENDING_CONFIRMATION' && this.selectedStatus === 'WAITING_FOR_BIKE') {
      this.updateStatusWithIntermediate('CONFIRMED', 'WAITING_FOR_BIKE');
      return;
    }

    this.calendarService.updateOrderStatus(this.serviceId, this.fullOrder.id, this.selectedStatus).subscribe({
      next: () => {
        this.notificationService.success(this.t('service_calendar.messages.status_updated'));
        this.fullOrder.status = this.selectedStatus;
        this.isUpdating = false;
        this.orderUpdated.emit();
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? this.t('service_calendar.errors.update_status_failed');
        this.notificationService.error(msg);
        this.isUpdating = false;
        this.selectedStatus = this.fullOrder.status;
        console.error('Error updating status:', err);
      }
    });
  }

  /**
   * Aktualizuje status przez stan posredni (np. PENDING -> CONFIRMED -> WAITING_FOR_BIKE)
   */
  private updateStatusWithIntermediate(intermediate: CalendarOrderStatus, final: CalendarOrderStatus): void {
    this.calendarService.updateOrderStatus(this.serviceId, this.fullOrder.id, intermediate).subscribe({
      next: () => {
        // Teraz aktualizuj do docelowego statusu
        this.calendarService.updateOrderStatus(this.serviceId, this.fullOrder.id, final).subscribe({
          next: () => {
            this.notificationService.success(this.t('service_calendar.messages.status_updated'));
            this.isUpdating = false;
            this.orderUpdated.emit();
          },
          error: (err: any) => {
            // Pierwszy krok sie udal, ale drugi nie - odswiezamy dane
            this.notificationService.success(this.t('service_calendar.messages.status_updated'));
            this.isUpdating = false;
            this.orderUpdated.emit();
            console.error('Error updating to final status:', err);
          }
        });
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? this.t('service_calendar.errors.update_status_failed');
        this.notificationService.error(msg);
        this.isUpdating = false;
        this.selectedStatus = this.fullOrder.status; // Revert
        console.error('Error updating intermediate status:', err);
      }
    });
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  private resizeAllNoteTextareas(): void {
    setTimeout(() => {
      this.noteTextareas?.forEach(ref => {
        const el = ref.nativeElement;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      });
    }, 0);
  }


  // ============================================
  // IMAGE FUNCTIONALITY
  // ============================================

  /**
   * Sprawdza czy zdjecia sa dostepne dla aktualnego statusu
   */
  get canShowImages(): boolean {
    const currentStatus = this.fullOrder?.status || this.order.status;
    return this.IMAGE_ALLOWED_STATUSES.includes(currentStatus);
  }

  /**
   * Laduje zdjecia zlecenia
   */
  private loadImages(): void {
    if (!this.canShowImages) return;

    this.isLoadingImages = true;
    this.calendarService.getOrderImages(this.serviceId, this.fullOrder.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (images) => {
          this.images = images;
          this.isLoadingImages = false;
        },
        error: (err) => {
          console.error('Error loading images:', err);
          this.images = [];
          this.isLoadingImages = false;
        }
      });
  }

  /**
   * Obsluga wyboru wielu plikow
   */
  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = this.imageUtils.validateImage(file);
      if (!validation.valid) {
        this.notificationService.error(`${file.name}: ${validation.error || this.t('service_calendar.errors.invalid_image')}`);
        continue;
      }

      this.selectedFiles.push(file);

      try {
        const previewUrl = await this.imageUtils.createPreviewUrl(file);
        this.selectedPreviews.push(previewUrl);
      } catch (error) {
        console.error('Failed to create preview:', error);
        this.selectedPreviews.push('');
      }
    }

    this.clearImageInput();
  }

  /**
   * Usuwa wybrany plik z listy
   */
  removeSelectedFile(index: number): void {
    if (this.selectedPreviews[index]) {
      URL.revokeObjectURL(this.selectedPreviews[index]);
    }
    this.selectedFiles.splice(index, 1);
    this.selectedPreviews.splice(index, 1);
  }

  /**
   * Upload wszystkich wybranych zdjec z kompresja i konwersja do WebP
   */
  async uploadAllImages(): Promise<void> {
    if (this.selectedFiles.length === 0) return;

    this.isUploadingImage = true;
    this.uploadTotalCount = this.selectedFiles.length;
    this.uploadCurrentIndex = 0;
    this.uploadProgress = 0;

    const filesToUpload = [...this.selectedFiles];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        this.uploadCurrentIndex = i;
        await this.uploadSingleImage(filesToUpload[i], i, filesToUpload.length);
      }

      this.notificationService.success(this.t('service_calendar.messages.image_uploaded'));

      setTimeout(() => {
        this.loadImages();
        this.clearImageSelection();
      }, 500);

    } catch (error) {
      console.error('[OrderDetails] Upload error:', error);
      this.notificationService.error(
        error instanceof Error ? error.message : this.t('service_calendar.errors.upload_failed')
      );
    } finally {
      this.isUploadingImage = false;
      this.isCompressingImage = false;
    }
  }

  /**
   * Upload pojedynczego zdjecia (uzywane wewnetrznie przez uploadAllImages)
   */
  private async uploadSingleImage(file: File, index: number, total: number): Promise<void> {
    const baseProgress = (index / total) * 100;
    const segmentSize = 100 / total;

    // Krok 1: Kompresja
    this.isCompressingImage = true;
    this.uploadProgress = baseProgress + segmentSize * 0.05;

    const compressedFile = await this.imageUtils.compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      outputFormat: 'webp',
      onProgress: (progress) => {
        this.uploadProgress = baseProgress + segmentSize * (0.05 + progress * 0.2);
      }
    });

    this.isCompressingImage = false;
    this.uploadProgress = baseProgress + segmentSize * 0.25;

    // Krok 2: Wymiary
    const dimensions = await this.imageUtils.getImageDimensions(compressedFile);
    this.uploadProgress = baseProgress + segmentSize * 0.3;

    // Krok 3: Presigned URL
    const uploadResponse = await firstValueFrom(
      this.calendarService.initiateImageUpload(this.serviceId, this.fullOrder.id, {
        fileName: `order_${this.fullOrder.id}_${Date.now()}_${index}.webp`,
        mimeType: compressedFile.type,
        width: dimensions.width,
        height: dimensions.height
      })
    );

    if (!uploadResponse?.uploadUrl) {
      throw new Error(this.t('service_calendar.errors.upload_url_failed'));
    }

    this.uploadProgress = baseProgress + segmentSize * 0.5;

    // Krok 4: Upload do R2
    await this.uploadToR2WithRetry(uploadResponse.uploadUrl, compressedFile);
    this.uploadProgress = baseProgress + segmentSize * 0.9;

    // Krok 5: Potwierdz
    await firstValueFrom(
      this.calendarService.confirmImageUpload(this.serviceId, this.fullOrder.id, uploadResponse.imageId)
    );

    this.uploadProgress = baseProgress + segmentSize;
  }

  /**
   * Upload do R2 z logika ponawiania
   */
  private async uploadToR2WithRetry(uploadUrl: string, file: File, retryCount = 0): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.UPLOAD_TIMEOUT);

      const result = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Cache-Control': 'public, max-age=31536000, immutable'
        },
        body: file,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!result.ok) {
        const errorText = await result.text().catch(() => 'Unknown error');
        throw new Error(`Upload failed: ${result.status} - ${errorText}`);
      }

      this.uploadProgress = 75 + (retryCount * 5);

    } catch (error) {
      console.error(`[OrderDetails] Upload attempt ${retryCount + 1} failed:`, error);

      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.uploadToR2WithRetry(uploadUrl, file, retryCount + 1);
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(this.t('service_calendar.errors.upload_timeout'));
      }
      throw error;
    }
  }

  /**
   * Usun zdjecie
   */
  async deleteImage(image: OrderImage): Promise<void> {
    if (!confirm(this.t('service_calendar.confirm.delete_image'))) return;

    try {
      await firstValueFrom(
        this.calendarService.deleteOrderImage(this.serviceId, this.fullOrder.id, image.id)
      );
      this.notificationService.success(this.t('service_calendar.messages.image_deleted'));
      this.loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      this.notificationService.error(this.t('service_calendar.errors.delete_image_failed'));
    }
  }

  /**
   * Czysci wybor plikow
   */
  clearImageSelection(): void {
    this.selectedPreviews.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    this.selectedFiles = [];
    this.selectedPreviews = [];
    this.clearImageInput();
  }

  private clearImageInput(): void {
    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  // ============================================
  // WIADOMOŚCI
  // ============================================

  private loadMessages(): void {
    this.isLoadingMessages = true;
    this.calendarService.getOrderMessages(this.serviceId, this.fullOrder.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.messages = response.messages;
          this.messagesUnreadCount = response.unreadCount;
          this.isLoadingMessages = false;
          if (response.unreadCount > 0) {
            this.calendarService.markOrderMessagesAsRead(this.serviceId, this.fullOrder.id).subscribe();
          }
        },
        error: () => { this.isLoadingMessages = false; }
      });
  }

  sendMessage(): void {
    const content = this.newMessageContent.trim();
    if (!content || this.isSendingMessage) return;

    this.isSendingMessage = true;
    this.calendarService.sendOrderMessage(this.serviceId, this.fullOrder.id, content).subscribe({
      next: (msg) => {
        this.messages = [...this.messages, msg];
        this.newMessageContent = '';
        this.isSendingMessage = false;
      },
      error: () => {
        this.notificationService.error(this.t('service_calendar.errors.send_message_failed'));
        this.isSendingMessage = false;
      }
    });
  }

  // ============================================
  // LIGHTBOX / GALERIA
  // ============================================

  lightboxOpen: boolean = false;
  lightboxIndex: number = 0;

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  lightboxPrev(): void {
    this.lightboxIndex = (this.lightboxIndex - 1 + this.images.length) % this.images.length;
  }

  lightboxNext(): void {
    this.lightboxIndex = (this.lightboxIndex + 1) % this.images.length;
  }

  onLightboxOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('lightbox-overlay')) {
      this.closeLightbox();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (event.key === 'Escape') this.closeLightbox();
    if (event.key === 'ArrowLeft') this.lightboxPrev();
    if (event.key === 'ArrowRight') this.lightboxNext();
  }

  /**
   * Formatuje rozmiar pliku
   */
  formatFileSize(bytes: number): string {
    return this.imageUtils.formatFileSize(bytes);
  }

  // ============================================
  // TRANSPORT ZWROTNY
  // ============================================

  get hasReturnTransport(): boolean {
    return !!(this.transportAddress);
  }

  get isReturnDeliveryFormValid(): boolean {
    if (this.returnPickupMethod !== 'delivery') return true;
    return !!(this.returnDeliveryStreet.trim() && this.returnDeliveryBuilding.trim() && this.returnDeliveryCity.trim());
  }

  onReturnTabClick(): void {
    this.activeTab = 'return';
    if (!this.transportAddressLoaded) {
      this.loadTransportAddress();
    }
  }

  private loadTransportAddress(): void {
    this.isLoadingReturnTransport = true;
    this.calendarService.getTransportAddress(this.serviceId, this.fullOrder.id).subscribe({
      next: (data) => {
        this.transportAddress = data;
        this.isLoadingReturnTransport = false;
        this.transportAddressLoaded = true;
      },
      error: () => {
        // 404 lub brak transportu — po prostu brak danych
        this.transportAddress = null;
        this.isLoadingReturnTransport = false;
        this.transportAddressLoaded = true;
      }
    });
  }

  onSaveReturnTransport(): void {
    if (this.returnPickupMethod === 'self' || !this.isReturnDeliveryFormValid || this.isSavingReturnTransport) return;

    this.isSavingReturnTransport = true;
    const data: ReturnTransportRequestDto = {
      deliveryStreet: this.returnDeliveryStreet.trim(),
      deliveryBuilding: this.returnDeliveryBuilding.trim(),
      deliveryCity: this.returnDeliveryCity.trim(),
      transportNotes: this.returnTransportNotes.trim() || undefined
    };

    this.calendarService.createReturnTransport(this.serviceId, this.fullOrder.id, data).subscribe({
      next: () => {
        this.notificationService.success('Transport zwrotny został zlecony');
        this.isSavingReturnTransport = false;
        this.transportAddressLoaded = false;
        this.loadTransportAddress();
      },
      error: (err: any) => {
        this.notificationService.error('Nie udało się zlecić transportu zwrotnego');
        this.isSavingReturnTransport = false;
        console.error('Error creating return transport:', err);
      }
    });
  }

  // ============================================
  // EDYCJA DANYCH ROWERU
  // ============================================


  ngOnDestroy(): void {
    // Zwolnij URLe podgladow
    this.selectedPreviews.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
  }
}
