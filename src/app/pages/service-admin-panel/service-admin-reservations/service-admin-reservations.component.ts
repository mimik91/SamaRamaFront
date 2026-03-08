import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { BikeServiceRegisteredDto } from '../../../shared/models/bike-service-common.models';

interface DayConfigDto {
  fromTime: string | null;
  toTime: string | null;
}

interface ReservationSettingsDto {
  acceptedDays: string[];
  formSchedule: { [key: string]: DayConfigDto };
  estimatedReservationDay?: string | null;
}

interface DayScheduleState {
  active: boolean;
  fromTime: string;
  toTime: string;
}

@Component({
  selector: 'app-service-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-admin-reservations.component.html',
  styleUrls: ['./service-admin-reservations.component.css']
})
export class ServiceAdminReservationsComponent implements OnInit {
  @Input() serviceDetails!: BikeServiceRegisteredDto;
  @Input() serviceId!: number;

  private apiUrl = `${environment.apiUrl}/bike-services-registered`;

  // Reservation available toggle
  reservationAvailable: boolean = false;
  isSavingAvailability: boolean = false;
  availabilitySuccess: boolean = false;
  availabilityError: string = '';

  // Reservation settings
  isLoadingSettings: boolean = true;
  settingsLoadError: string = '';
  isSavingSettings: boolean = false;
  settingsSuccess: boolean = false;
  settingsError: string = '';
  isEditMode: boolean = false;

  readonly daysOfWeek = [
    { key: 'MONDAY', label: 'Poniedziałek' },
    { key: 'TUESDAY', label: 'Wtorek' },
    { key: 'WEDNESDAY', label: 'Środa' },
    { key: 'THURSDAY', label: 'Czwartek' },
    { key: 'FRIDAY', label: 'Piątek' },
    { key: 'SATURDAY', label: 'Sobota' },
    { key: 'SUNDAY', label: 'Niedziela' }
  ];

  acceptedDays: { [key: string]: boolean } = {};
  daySchedules: { [key: string]: DayScheduleState } = {};
  displayedSettings: ReservationSettingsDto | null = null;
  estimatedReservationDay: string = '';
  todayDate: string = new Date().toISOString().split('T')[0];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.reservationAvailable = this.serviceDetails?.reservationAvailable ?? false;
    this.initDayStates();
    this.loadSettings();
  }

  private initDayStates(): void {
    this.daysOfWeek.forEach(day => {
      this.acceptedDays[day.key] = false;
      this.daySchedules[day.key] = { active: false, fromTime: '', toTime: '' };
    });
  }

  loadSettings(): void {
    this.isLoadingSettings = true;
    this.settingsLoadError = '';

    this.http.get<ReservationSettingsDto>(`${this.apiUrl}/my-service/reservation-settings`, {
      params: { serviceId: this.serviceId.toString() }
    }).subscribe({
      next: (data) => {
        this.displayedSettings = data;
        this.populateFromSettings(data);
        this.isLoadingSettings = false;
      },
      error: (err) => {
        this.settingsLoadError = 'Nie udało się załadować ustawień rezerwacji.';
        this.isLoadingSettings = false;
        console.error('Error loading reservation settings:', err);
      }
    });
  }

  private populateFromSettings(data: ReservationSettingsDto): void {
    this.daysOfWeek.forEach(day => {
      this.acceptedDays[day.key] = false;
    });

    if (data.acceptedDays && data.acceptedDays.length > 0) {
      data.acceptedDays.forEach(d => {
        if (Object.prototype.hasOwnProperty.call(this.acceptedDays, d)) {
          this.acceptedDays[d] = true;
        }
      });
    }

    this.daysOfWeek.forEach(day => {
      const config = data.formSchedule ? data.formSchedule[day.key] : null;
      if (config !== undefined && config !== null) {
        this.daySchedules[day.key] = {
          active: true,
          fromTime: config.fromTime ? this.toInputTime(config.fromTime) : '',
          toTime: config.toTime ? this.toInputTime(config.toTime) : ''
        };
      } else {
        this.daySchedules[day.key] = { active: false, fromTime: '', toTime: '' };
      }
    });

    this.estimatedReservationDay = data.estimatedReservationDay ?? '';
  }

  private toInputTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5);
  }

  enterEditMode(): void {
    this.isEditMode = true;
  }

  cancelEdit(): void {
    if (this.displayedSettings) {
      this.populateFromSettings(this.displayedSettings);
    } else {
      this.initDayStates();
    }
    this.isEditMode = false;
    this.settingsError = '';
  }

  saveAvailability(): void {
    this.isSavingAvailability = true;
    this.availabilityError = '';
    this.availabilitySuccess = false;

    this.http.patch(`${this.apiUrl}/my-service/reservation-available?serviceId=${this.serviceId}`, {
      reservationAvailable: this.reservationAvailable
    }).subscribe({
      next: () => {
        this.isSavingAvailability = false;
        this.availabilitySuccess = true;
        this.serviceDetails.reservationAvailable = this.reservationAvailable;
        setTimeout(() => this.availabilitySuccess = false, 3000);
      },
      error: (err) => {
        this.isSavingAvailability = false;
        this.availabilityError = 'Nie udało się zapisać zmian. Spróbuj ponownie.';
        console.error('Error saving availability:', err);
      }
    });
  }

  saveSettings(): void {
    this.isSavingSettings = true;
    this.settingsError = '';
    this.settingsSuccess = false;

    const selectedDays = this.daysOfWeek
      .filter(d => this.acceptedDays[d.key])
      .map(d => d.key);

    const formSchedule: { [key: string]: DayConfigDto } = {};
    this.daysOfWeek.forEach(day => {
      const s = this.daySchedules[day.key];
      if (s.active) {
        formSchedule[day.key] = {
          fromTime: s.fromTime || null,
          toTime: s.toTime || null
        };
      }
    });

    const payload: ReservationSettingsDto = {
      acceptedDays: selectedDays,
      formSchedule: formSchedule,
      estimatedReservationDay: this.estimatedReservationDay || null
    };

    this.http.put(`${this.apiUrl}/my-service/reservation-settings?serviceId=${this.serviceId}`, payload)
      .subscribe({
        next: () => {
          this.isSavingSettings = false;
          this.settingsSuccess = true;
          this.displayedSettings = payload;
          this.isEditMode = false;
          setTimeout(() => this.settingsSuccess = false, 3000);
        },
        error: (err) => {
          this.isSavingSettings = false;
          this.settingsError = 'Nie udało się zapisać ustawień. Spróbuj ponownie.';
          console.error('Error saving reservation settings:', err);
        }
      });
  }

  getDisplayDays(): string {
    if (!this.displayedSettings?.acceptedDays || this.displayedSettings.acceptedDays.length === 0) {
      return 'Wszystkie dni';
    }
    return this.displayedSettings.acceptedDays
      .map(d => this.daysOfWeek.find(day => day.key === d)?.label || d)
      .join(', ');
  }

  getScheduleDisplay(dayKey: string): string {
    if (!this.displayedSettings?.formSchedule) return 'Nieaktywny';
    const config = this.displayedSettings.formSchedule[dayKey];
    if (!config) return 'Nieaktywny';
    const from = config.fromTime ? config.fromTime.substring(0, 5) : 'początku dnia';
    const to = config.toTime ? config.toTime.substring(0, 5) : 'końca dnia';
    return `Od ${from} do ${to}`;
  }

  copyToAllDays(sourceDayKey: string): void {
    const source = this.daySchedules[sourceDayKey];
    this.daysOfWeek.forEach(day => {
      if (day.key !== sourceDayKey) {
        this.daySchedules[day.key] = {
          active: source.active,
          fromTime: source.fromTime,
          toTime: source.toTime
        };
      }
    });
  }

  isFormScheduleEmpty(): boolean {
    if (!this.displayedSettings?.formSchedule) return true;
    return Object.keys(this.displayedSettings.formSchedule).length === 0;
  }
}
