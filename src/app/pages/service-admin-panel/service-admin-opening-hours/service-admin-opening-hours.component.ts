import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environments';
import { DayInterval } from '../../../shared/models/opening-hours.models';

interface OpeningHoursData {
  intervals: { [key: string]: DayInterval };
  openingHoursInfo: string;
  openingHoursNote: string;
  openingHoursActive: boolean;
}

@Component({
  selector: 'app-service-admin-opening-hours',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-admin-opening-hours.component.html',
  styleUrls: ['./service-admin-opening-hours.component.css']
})
export class ServiceAdminOpeningHoursComponent implements OnInit {
  @Input() serviceId!: number;

  private apiUrl = `${environment.apiUrl}${environment.endpoints.bikeServicesRegistered.base}`;

  openingHoursForm!: FormGroup;
  isEditMode = false;
  isLoading = true;
  isSaving = false;
  hasExistingHours = false;

  daysOfWeek = [
    { key: 'MONDAY', label: 'Poniedziałek' },
    { key: 'TUESDAY', label: 'Wtorek' },
    { key: 'WEDNESDAY', label: 'Środa' },
    { key: 'THURSDAY', label: 'Czwartek' },
    { key: 'FRIDAY', label: 'Piątek' },
    { key: 'SATURDAY', label: 'Sobota' },
    { key: 'SUNDAY', label: 'Niedziela' }
  ];

  displayedData: OpeningHoursData | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadOpeningHours();
  }

  private initForm(): void {
    const dayControls: any = {};
    
    this.daysOfWeek.forEach(day => {
      dayControls[day.key] = this.fb.group({
        enabled: [false],
        openTime: ['09:00'],
        closeTime: ['17:00']
      });
    });

    this.openingHoursForm = this.fb.group({
      days: this.fb.group(dayControls),
      openingHoursInfo: ['', [Validators.maxLength(500)]],
      openingHoursNote: ['', [Validators.maxLength(500)]],
      openingHoursActive: [false]
    });
  }

  private loadOpeningHours(): void {
    this.http.get<OpeningHoursData>(`${this.apiUrl}/my-service/opening-hours`, {
      params: { serviceId: this.serviceId.toString() }
    }).subscribe({
      next: (data: OpeningHoursData) => {
        // Jeśli są intervals - mamy dane
        this.hasExistingHours = data.intervals && Object.keys(data.intervals).length > 0;
        this.displayedData = data;
        
        if (this.hasExistingHours) {
          this.populateForm(data);
          this.isEditMode = false; // Są dane - tryb wyświetlania
        } else {
          this.isEditMode = true; // Brak danych - tryb edycji (formularz)
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading opening hours:', error);
        // Nawet jak błąd, pokaż formularz do wypełnienia
        this.hasExistingHours = false;
        this.isEditMode = true;
        this.isLoading = false;
      }
    });
  }

  private populateForm(data: OpeningHoursData): void {
    const daysControl = this.openingHoursForm.get('days') as FormGroup;

    this.daysOfWeek.forEach(day => {
      const dayData = data.intervals[day.key];
      const dayControl = daysControl.get(day.key) as FormGroup;
      
      if (dayData) {
        dayControl.patchValue({
          enabled: true,
          openTime: dayData.openTime,
          closeTime: dayData.closeTime
        });
      } else {
        dayControl.patchValue({
          enabled: false,
          openTime: '09:00',
          closeTime: '17:00'
        });
      }
    });

    this.openingHoursForm.patchValue({
      openingHoursInfo: data.openingHoursInfo || '',
      openingHoursNote: data.openingHoursNote || '',
      openingHoursActive: data.openingHoursActive || false
    });
  }

  enterEditMode(): void {
    this.isEditMode = true;
  }

  cancelEdit(): void {
    if (this.hasExistingHours && this.displayedData) {
      this.populateForm(this.displayedData);
      this.isEditMode = false;
    } else {
      // Jeśli nie ma danych, zresetuj formularz
      this.openingHoursForm.reset();
      this.initForm();
    }
  }

  saveOpeningHours(): void {
    if (this.openingHoursForm.invalid) {
      this.showError('Formularz zawiera błędy');
      return;
    }

    this.isSaving = true;
    const formValue = this.openingHoursForm.value;
    const daysValue = formValue.days;

    // Przygotuj dane do wysłania
    const intervals: { [key: string]: DayInterval } = {};
    
    this.daysOfWeek.forEach(day => {
      const dayValue = daysValue[day.key];
      if (dayValue.enabled) {
        intervals[day.key] = {
          openTime: dayValue.openTime,
          closeTime: dayValue.closeTime
        };
      }
    });

    const payload: OpeningHoursData = {
      intervals: intervals,
      openingHoursInfo: formValue.openingHoursInfo || '',
      openingHoursNote: formValue.openingHoursNote || '',
      openingHoursActive: formValue.openingHoursActive || false
    };

    // Użyj POST jeśli nie ma danych, PUT jeśli już istnieją
    const method = this.hasExistingHours ? 'put' : 'post';
    const url = `${this.apiUrl}/my-service/opening-hours`;

    this.http.request<OpeningHoursData>(method, url, {
      body: payload,
      params: { serviceId: this.serviceId.toString() }
    }).subscribe({
      next: (response) => {
        this.showSuccess('Godziny otwarcia zostały zapisane');
        this.hasExistingHours = true;
        this.displayedData = response;
        this.isEditMode = false;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving opening hours:', error);
        this.showError('Nie udało się zapisać godzin otwarcia');
        this.isSaving = false;
      }
    });
  }

  getDayControl(dayKey: string): FormGroup {
    return (this.openingHoursForm.get('days') as FormGroup).get(dayKey) as FormGroup;
  }

  isDayEnabled(dayKey: string): boolean {
    return this.getDayControl(dayKey).get('enabled')?.value || false;
  }

  getDisplayInterval(dayKey: string): DayInterval | null {
    if (!this.displayedData?.intervals) return null;
    return this.displayedData.intervals[dayKey] || null;
  }

  copyToAllDays(dayKey: string): void {
    const sourceDayControl = this.getDayControl(dayKey);
    const sourceValue = sourceDayControl.value;

    const daysControl = this.openingHoursForm.get('days') as FormGroup;
    
    this.daysOfWeek.forEach(day => {
      if (day.key !== dayKey) {
        const targetControl = daysControl.get(day.key) as FormGroup;
        targetControl.patchValue({
          enabled: sourceValue.enabled,
          openTime: sourceValue.openTime,
          closeTime: sourceValue.closeTime
        });
      }
    });

    this.showSuccess('Godziny skopiowane do wszystkich dni');
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}