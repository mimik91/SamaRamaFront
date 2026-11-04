import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';
import { BikeServiceRegisteredDto } from '../../../shared/models/bike-service-common.models';
import { CalendarConfig, Technician } from '../../../shared/models/service-calendar.models';
import { ServiceCalendarService } from '../../service-calendar/services/service-calendar.service';

interface ReservationSettingsDto {
  acceptedDays: string[];
  estimatedReservationDay?: string | null;
}

interface SettingsDraft {
  available: boolean;
  limit: number;
  acceptedDays: string[];
  estimatedReservationDay: string;
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

  private http = inject(HttpClient);
  private calendarService = inject(ServiceCalendarService);
  private apiUrl = `${environment.apiUrl}/bike-services-registered`;

  readonly daysOfWeek = [
    { key: 'MONDAY', short: 'Pn', label: 'pon.' },
    { key: 'TUESDAY', short: 'Wt', label: 'wt.' },
    { key: 'WEDNESDAY', short: 'Śr', label: 'śr.' },
    { key: 'THURSDAY', short: 'Cz', label: 'czw.' },
    { key: 'FRIDAY', short: 'Pt', label: 'pt.' },
    { key: 'SATURDAY', short: 'So', label: 'sob.' },
    { key: 'SUNDAY', short: 'Nd', label: 'niedz.' }
  ];

  isLoading = true;
  loadError = '';
  isSaving = false;
  saveError = '';
  saveSuccess = false;

  // Stan edytowany
  reservationAvailable = false;
  maxBikesPerDay = 10;
  acceptedDays: Record<string, boolean> = {};
  estimatedReservationDay = '';

  private calendarConfig: CalendarConfig | null = null;
  private snapshot = '';

  // Serwisanci (zapisywani od razu, poza paskiem niezapisanych zmian)
  technicians: Technician[] = [];
  technicianError = '';
  newTechnicianName = '';
  savingTechnician = false;
  technicianActionId: number | null = null;
  renamingId: number | null = null;
  renameValue = '';

  readonly todayDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.reservationAvailable = this.serviceDetails?.reservationAvailable ?? false;
    this.load();
    this.loadTechnicians();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';

    this.calendarService.getConfig(this.serviceId).subscribe({
      next: (config) => {
        this.calendarConfig = config;
        this.maxBikesPerDay = config.maxBikesPerDay;
        this.loadReservationSettings();
      },
      error: () => {
        this.loadError = 'Nie udało się załadować ustawień kalendarza.';
        this.isLoading = false;
      }
    });
  }

  private loadReservationSettings(): void {
    this.http.get<ReservationSettingsDto>(`${this.apiUrl}/my-service/reservation-settings`, {
      params: { serviceId: this.serviceId.toString() }
    }).subscribe({
      next: (data) => {
        this.applySettings(data);
        this.snapshot = this.currentSnapshot();
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Nie udało się załadować ustawień rezerwacji.';
        this.isLoading = false;
      }
    });
  }

  private applySettings(data: ReservationSettingsDto): void {
    this.daysOfWeek.forEach(d => this.acceptedDays[d.key] = false);
    (data.acceptedDays ?? []).forEach(d => {
      if (d in this.acceptedDays) this.acceptedDays[d] = true;
    });
    this.estimatedReservationDay = data.estimatedReservationDay ?? '';
  }

  private currentDraft(): SettingsDraft {
    return {
      available: this.reservationAvailable,
      limit: this.maxBikesPerDay,
      acceptedDays: this.selectedDays,
      estimatedReservationDay: this.estimatedReservationDay
    };
  }

  private currentSnapshot(): string {
    return JSON.stringify(this.currentDraft());
  }

  get selectedDays(): string[] {
    return this.daysOfWeek.filter(d => this.acceptedDays[d.key]).map(d => d.key);
  }

  get isDirty(): boolean {
    if (this.isLoading || this.loadError) return false;
    return this.currentSnapshot() !== this.snapshot;
  }

  get summaryDays(): string {
    const selected = this.daysOfWeek.filter(d => this.acceptedDays[d.key]);
    if (selected.length === 0 || selected.length === 7) return 'codziennie';
    const keys = selected.map(d => d.key).join();
    if (keys === 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY') return 'pon.–pt.';
    return selected.map(d => d.label).join(', ');
  }

  get estimatedPassed(): boolean {
    return !!this.estimatedReservationDay && this.estimatedReservationDay < this.todayDate;
  }

  changeLimit(delta: number): void {
    this.maxBikesPerDay = Math.max(1, (Number(this.maxBikesPerDay) || 1) + delta);
  }

  toggleDay(key: string): void {
    this.acceptedDays[key] = !this.acceptedDays[key];
  }

  clearEstimatedDate(): void {
    this.estimatedReservationDay = '';
  }

  cancelEdit(): void {
    const saved = JSON.parse(this.snapshot) as SettingsDraft;
    this.reservationAvailable = saved.available;
    this.maxBikesPerDay = saved.limit;
    this.daysOfWeek.forEach(d => this.acceptedDays[d.key] = saved.acceptedDays.includes(d.key));
    this.estimatedReservationDay = saved.estimatedReservationDay;
    this.saveError = '';
  }

  saveAll(): void {
    if (this.isSaving || !this.calendarConfig || this.maxBikesPerDay < 1) return;
    const saved = JSON.parse(this.snapshot) as SettingsDraft;
    const draft = this.currentDraft();

    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = false;

    // Sekwencyjnie: dostępność → limit → ustawienia rezerwacji; każdy krok tylko gdy się zmienił
    const steps: Array<() => Promise<void>> = [];
    if (draft.available !== saved.available) {
      steps.push(() => this.toPromise(this.http.patch(
        `${this.apiUrl}/my-service/reservation-available?serviceId=${this.serviceId}`,
        { reservationAvailable: draft.available }
      ), () => { this.serviceDetails.reservationAvailable = draft.available; }));
    }
    if (draft.limit !== saved.limit) {
      steps.push(() => this.toPromise(
        this.calendarService.updateConfig(this.serviceId, this.calendarConfig!.viewMode, draft.limit),
        (config) => { this.calendarConfig = config; }
      ));
    }
    if (JSON.stringify(draft.acceptedDays) !== JSON.stringify(saved.acceptedDays)
      || draft.estimatedReservationDay !== saved.estimatedReservationDay) {
      const payload: ReservationSettingsDto = {
        acceptedDays: draft.acceptedDays,
        estimatedReservationDay: draft.estimatedReservationDay || null
      };
      steps.push(() => this.toPromise(this.http.put(
        `${this.apiUrl}/my-service/reservation-settings?serviceId=${this.serviceId}`, payload
      )));
    }

    steps.reduce((chain, step) => chain.then(step), Promise.resolve())
      .then(() => {
        this.snapshot = this.currentSnapshot();
        this.isSaving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      })
      .catch(() => {
        this.isSaving = false;
        this.saveError = 'Nie udało się zapisać zmian. Spróbuj ponownie.';
        // Część kroków mogła się powieść — pobierz stan z serwera
        this.load();
      });
  }

  private toPromise<T>(source: Observable<T>, onNext?: (value: T) => void): Promise<void> {
    return firstValueFrom(source).then(value => onNext?.(value));
  }

  // ===== Serwisanci =====

  get activeTechnicians(): Technician[] {
    return this.technicians.filter(t => t.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  initials(name: string): string {
    return name.trim().substring(0, 2).toUpperCase();
  }

  private loadTechnicians(): void {
    this.calendarService.getTechnicians(this.serviceId).subscribe({
      next: (list) => this.technicians = list,
      error: () => this.technicianError = 'Nie udało się załadować serwisantów.'
    });
  }

  addTechnician(): void {
    const name = this.newTechnicianName.trim();
    if (!name || this.savingTechnician) return;
    this.savingTechnician = true;
    this.technicianError = '';
    this.calendarService.createTechnician(this.serviceId, { nickname: name }).subscribe({
      next: () => {
        this.savingTechnician = false;
        this.newTechnicianName = '';
        this.loadTechnicians();
      },
      error: () => {
        this.savingTechnician = false;
        this.technicianError = 'Nie udało się dodać serwisanta.';
      }
    });
  }

  startRename(t: Technician): void {
    this.renamingId = t.id;
    this.renameValue = t.nickname;
  }

  cancelRename(): void {
    this.renamingId = null;
  }

  confirmRename(t: Technician): void {
    const nickname = this.renameValue.trim();
    if (!nickname || nickname === t.nickname) {
      this.renamingId = null;
      return;
    }
    this.technicianActionId = t.id;
    this.calendarService.updateTechnician(this.serviceId, t.id, { nickname }).subscribe({
      next: () => {
        this.technicianActionId = null;
        this.renamingId = null;
        this.loadTechnicians();
      },
      error: () => {
        this.technicianActionId = null;
        this.technicianError = 'Nie udało się zmienić nazwy.';
      }
    });
  }

  removeTechnician(t: Technician): void {
    this.technicianActionId = t.id;
    this.calendarService.deactivateTechnician(this.serviceId, t.id).subscribe({
      next: () => {
        this.technicianActionId = null;
        this.loadTechnicians();
      },
      error: () => {
        this.technicianActionId = null;
        this.technicianError = 'Nie udało się usunąć serwisanta.';
      }
    });
  }

  moveTechnician(t: Technician, direction: -1 | 1): void {
    const active = this.activeTechnicians;
    const index = active.findIndex(a => a.id === t.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= active.length) return;
    const ids = active.map(a => a.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.technicianActionId = t.id;
    this.calendarService.reorderTechnicians(this.serviceId, ids).subscribe({
      next: () => {
        this.technicianActionId = null;
        this.loadTechnicians();
      },
      error: () => {
        this.technicianActionId = null;
        this.technicianError = 'Nie udało się zmienić kolejności.';
      }
    });
  }
}
