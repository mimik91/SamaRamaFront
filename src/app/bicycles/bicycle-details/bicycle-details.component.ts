import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BicycleService } from '../bicycle.service';
import { Bicycle } from '../bicycle.model';
import { NotificationService } from '../../core/notification.service';
import { ServiceRecord } from '../../service-records/service-record.model';
import { ServiceRecordService } from '../../service-records/service-record.service';

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
  private http = inject(HttpClient);

  bicycle: Bicycle | null = null;
  bicycleForm: FormGroup;
  serviceRecords: ServiceRecord[] = [];
  loading = true;
  isEditing = false;
  isSubmitting = false;
  isPhotoDeleting = false;
  errorMessage = '';
  timestamp = Date.now();
  
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBicycle(+id);
    } else {
      this.router.navigate(['/bicycles']);
    }
  }

  loadBicycle(id: number): void {
    this.loading = true;
    this.bicycleService.getBicycle(id).subscribe({
      next: (bicycle) => {
        this.bicycle = bicycle;
        this.initForm();
        this.loadServiceRecords(id);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bicycle:', error);
        this.notificationService.error('Nie udało się załadować danych roweru');
        this.loading = false;
      }
    });
  }

  loadServiceRecords(bicycleId: number): void {
    this.serviceRecordService.getBicycleServiceRecords(bicycleId).subscribe({
      next: (records) => {
        this.serviceRecords = records;
      },
      error: (error) => {
        console.error('Error loading service records:', error);
        this.errorMessage = 'Nie udało się załadować historii serwisowej';
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
        productionDate: this.bicycle.productionDate
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
    
    // Po renderowaniu formularza, przewiń do niego
    setTimeout(() => {
      if (this.editFormElement) {
        this.editFormElement.nativeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Mały delay, aby poczekać na renderowanie DOM
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

  // Obsługa uploadowania zdjęcia bezpośrednio (bez edycji innych pól)
  openPhotoUpload(): void {
    this.photoInput.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        this.notificationService.error('Zdjęcie nie może przekraczać 1MB');
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        this.notificationService.error('Wybierz plik graficzny');
        return;
      }
      
      // Dodaj zdjęcie
      if (this.bicycle) {
        this.bicycleService.uploadBicyclePhoto(this.bicycle.id, file).subscribe({
          next: () => {
            this.notificationService.success('Zdjęcie zostało dodane');
            this.timestamp = Date.now(); // Odśwież timestamp dla zdjęcia
            if (this.bicycle) {
              this.bicycle.hasPhoto = true;
            }
          },
          error: (error) => {
            console.error('Error uploading photo:', error);
            this.notificationService.error('Nie udało się dodać zdjęcia');
          }
        });
      }
    }
  }

  deletePhoto(): void {
    if (!this.bicycle || !this.bicycle.hasPhoto || this.isPhotoDeleting) {
      return;
    }
    
    this.isPhotoDeleting = true;
    
    this.bicycleService.deleteBicyclePhoto(this.bicycle.id).subscribe({
      next: () => {
        this.notificationService.success('Zdjęcie zostało usunięte');
        if (this.bicycle) {
          this.bicycle.hasPhoto = false;
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
    
    // Tworzymy nowy obiekt zawierający TYLKO te pola, które są w BicycleDto
    const bicycleData = {
      brand: this.bicycleForm.value.brand,
      model: this.bicycleForm.value.model,
      type: this.bicycleForm.value.type,
      frameMaterial: this.bicycleForm.value.frameMaterial,
      productionDate: this.bicycleForm.value.productionDate,
      frameNumber: this.bicycle.frameNumber // Zachowujemy oryginalny numer ramy
    };
    
    // Użyj HttpClient do wywołania PUT
    this.http.put<any>(`${this.bicycleService['apiUrl']}/${this.bicycle!.id}`, bicycleData).subscribe({
      next: () => {
        // Jeśli mamy nowe zdjęcie, załaduj je
        if (this.selectedFile) {
          this.bicycleService.uploadBicyclePhoto(this.bicycle!.id, this.selectedFile).subscribe({
            next: () => {
              this.timestamp = Date.now(); // Odśwież timestamp dla zdjęcia
              if (this.bicycle) {
                this.bicycle.hasPhoto = true;
              }
              this.notificationService.success('Dane roweru zostały zaktualizowane, wraz ze zdjęciem');
              this.finishUpdate();
            },
            error: (errorMsg: any) => {
              console.error('Error uploading photo:', errorMsg);
              this.notificationService.warning('Dane roweru zostały zaktualizowane, ale nie udało się dodać zdjęcia');
              this.finishUpdate();
            }
          });
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

  finishUpdate(): void {
    // Odśwież dane roweru
    if (this.bicycle) {
      this.loadBicycle(this.bicycle.id);
    }
    this.isEditing = false;
    this.isSubmitting = false;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  getBicyclePhotoUrl(bicycleId: number): string {
    return `${this.bicycleService.getBicyclePhotoUrl(bicycleId)}?t=${this.timestamp}`;
  }
  
  handleImageError(): void {
    if (this.bicycle) {
      this.bicycle.hasPhoto = false;
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
    
    // For bicycle details, we determine if it's complete based on the existence of frameNumber
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

  getTranslatedType(type: string): string {
    const types: Record<string, string> = {
      'MOUNTAIN': 'Górski',
      'ROAD': 'Szosowy',
      'CITY': 'Miejski',
      'TREKKING': 'Trekkingowy',
      'BMX': 'BMX',
      'KIDS': 'Dziecięcy',
      'ELECTRIC': 'Elektryczny',
      'OTHER': 'Inny'
    };
    return types[type] || type;
  }

  getTranslatedMaterial(material: string): string {
    const materials: Record<string, string> = {
      'ALUMINUM': 'Aluminium',
      'CARBON': 'Karbon',
      'STEEL': 'Stal',
      'TITANIUM': 'Tytan',
      'OTHER': 'Inny'
    };
    return materials[material] || material;
  }
}