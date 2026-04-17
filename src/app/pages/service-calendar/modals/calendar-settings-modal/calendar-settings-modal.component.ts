import { Component, Input, Output, EventEmitter, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../../../core/notification.service';
import { ServiceCalendarService } from '../../services/service-calendar.service';
import { CalendarConfig } from '../../../../shared/models/service-calendar.models';

@Component({
  selector: 'app-calendar-settings-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './calendar-settings-modal.component.html',
  styleUrls: ['./calendar-settings-modal.component.css']
})
export class CalendarSettingsModalComponent implements OnInit {
  @Input() serviceId!: number;
  @Input() config!: CalendarConfig;
  @Output() close = new EventEmitter<void>();
  @Output() configUpdated = new EventEmitter<CalendarConfig>();

  private fb = inject(FormBuilder);
  private calendarService = inject(ServiceCalendarService);
  private notificationService = inject(NotificationService);

  form!: FormGroup;
  saving = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      maxBikesPerDay: [
        this.config?.maxBikesPerDay ?? 10,
        [Validators.required, Validators.min(1)]
      ]
    });
  }

  onSave(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const { maxBikesPerDay } = this.form.value;
    const viewMode = this.config?.viewMode ?? 'SIMPLE';

    this.calendarService.updateConfig(this.serviceId, viewMode, maxBikesPerDay).subscribe({
      next: (updated) => {
        this.saving = false;
        this.notificationService.success('Ustawienia kalendarza zostały zapisane.');
        this.configUpdated.emit(updated);
        this.close.emit();
      },
      error: () => {
        this.saving = false;
        this.notificationService.error('Nie udało się zapisać ustawień. Spróbuj ponownie.');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }
}
