import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../../core/notification.service';
import { I18nService } from '../../../../core/i18n.service';
import { ServiceCalendarService, ServiceNotificationConfig } from '../../services/service-calendar.service';
import { CalendarConfig } from '../../../../shared/models/service-calendar.models';

interface TemplateEntry {
  name: string;
  text: string;
}

type NotificationSection = 'return' | 'pickup';

const POLISH_MAP: Record<string, string> = {
  'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
  'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z'
};

function sanitizeSms(value: string): string {
  return value
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => POLISH_MAP[ch])
    .replace(/[^\x20-\x7E\n\r]/g, '');
}

function smsValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  if (control.value.length > 150) return { smsTooLong: true };
  return null;
}

@Component({
  selector: 'app-calendar-settings-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './calendar-settings-modal.component.html',
  styleUrls: ['./calendar-settings-modal.component.css']
})
export class CalendarSettingsModalComponent implements OnInit, OnDestroy {
  @Input() serviceId!: number;
  @Input() config!: CalendarConfig;
  @Input() transportAvailable: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() configUpdated = new EventEmitter<CalendarConfig>();

  private fb = inject(FormBuilder);
  private calendarService = inject(ServiceCalendarService);
  private notificationService = inject(NotificationService);
  private i18nService = inject(I18nService);

  form!: FormGroup;
  saving = false;
  loadingNotificationConfig = false;

  activeSection: NotificationSection = 'return';
  returnTemplates: TemplateEntry[] = [];
  pickupTemplates: TemplateEntry[] = [];

  isDirty = false;
  showUnsavedDialog = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.form = this.fb.group({
      maxBikesPerDay: [
        this.config?.maxBikesPerDay ?? 10,
        [Validators.required, Validators.min(1)]
      ],
      emailTextReturn: [''],
      smsTextReturn: ['', smsValidator],
      emailTextPickup: [''],
      smsTextPickup: ['', smsValidator]
    });

    this.loadNotificationConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotificationConfig(): void {
    this.loadingNotificationConfig = true;
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => { this.isDirty = true; });
    this.calendarService.getNotificationConfig(this.serviceId).subscribe({
      next: (cfg) => {
        this.loadingNotificationConfig = false;
        this.form.patchValue({
          emailTextReturn: cfg.emailTextReturn ?? '',
          smsTextReturn: cfg.smsTextReturn ?? '',
          emailTextPickup: cfg.emailTextPickup ?? '',
          smsTextPickup: cfg.smsTextPickup ?? ''
        });
        this.returnTemplates = this.recordToEntries(cfg.contentTemplatesReturn);
        this.pickupTemplates = this.recordToEntries(cfg.contentTemplatesPickup);
        this.isDirty = false;
      },
      error: () => {
        this.loadingNotificationConfig = false;
      }
    });
  }

  private recordToEntries(record?: Record<string, string>): TemplateEntry[] {
    if (!record) return [];
    return Object.entries(record).map(([name, text]) => ({ name, text }));
  }

  private entriesToRecord(entries: TemplateEntry[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.name.trim()) {
        result[entry.name.trim()] = entry.text;
      }
    }
    return result;
  }

  get activeTemplates(): TemplateEntry[] {
    return this.activeSection === 'return' ? this.returnTemplates : this.pickupTemplates;
  }

  addTemplate(): void {
    const list = this.activeSection === 'return' ? this.returnTemplates : this.pickupTemplates;
    list.push({ name: '', text: '' });
    this.isDirty = true;
  }

  removeTemplate(index: number): void {
    const list = this.activeSection === 'return' ? this.returnTemplates : this.pickupTemplates;
    list.splice(index, 1);
    this.isDirty = true;
  }

  onTemplateChange(): void {
    this.isDirty = true;
  }

  onSave(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.showUnsavedDialog = false;
    const { maxBikesPerDay, emailTextReturn, smsTextReturn, emailTextPickup, smsTextPickup } = this.form.value;
    const viewMode = this.config?.viewMode ?? 'SIMPLE';

    const notificationData: ServiceNotificationConfig = {
      emailTextReturn: emailTextReturn || undefined,
      smsTextReturn: smsTextReturn || undefined,
      contentTemplatesReturn: this.entriesToRecord(this.returnTemplates),
      emailTextPickup: emailTextPickup || undefined,
      smsTextPickup: smsTextPickup || undefined,
      contentTemplatesPickup: this.entriesToRecord(this.pickupTemplates)
    };

    forkJoin({
      config: this.calendarService.updateConfig(this.serviceId, viewMode, maxBikesPerDay),
      notifications: this.calendarService.updateNotificationConfig(this.serviceId, notificationData)
    }).subscribe({
      next: ({ config }) => {
        this.saving = false;
        this.isDirty = false;
        this.notificationService.success(this.i18nService.translate('service_calendar.messages.settings_saved'));
        this.configUpdated.emit(config);
        this.close.emit();
      },
      error: () => {
        this.saving = false;
        this.notificationService.error('Nie udało się zapisać ustawień. Spróbuj ponownie.');
      }
    });
  }

  onClose(): void {
    if (this.isDirty) {
      this.showUnsavedDialog = true;
    } else {
      this.close.emit();
    }
  }

  discardAndClose(): void {
    this.isDirty = false;
    this.showUnsavedDialog = false;
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showUnsavedDialog) {
      this.showUnsavedDialog = false;
    } else {
      this.onClose();
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  templateNameInvalid(entry: TemplateEntry): boolean {
    return entry.name.length > 20;
  }

  templateTextInvalid(entry: TemplateEntry): boolean {
    return entry.text.length > 500;
  }

  get hasTemplateErrors(): boolean {
    return [...this.returnTemplates, ...this.pickupTemplates].some(
      e => this.templateNameInvalid(e) || this.templateTextInvalid(e)
    );
  }

  smsLength(field: string): number {
    return (this.form.get(field)?.value ?? '').length;
  }

  onSmsInput(field: string, event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const cursor = textarea.selectionStart ?? textarea.value.length;
    const original = textarea.value;
    const sanitized = sanitizeSms(original);
    if (sanitized !== original) {
      // Count removed chars before cursor to adjust position
      const before = original.substring(0, cursor);
      const sanitizedBefore = sanitizeSms(before);
      const newCursor = sanitizedBefore.length;
      this.form.get(field)?.setValue(sanitized, { emitEvent: true });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursor;
      });
    }
  }

  get saveBlockedReason(): string | null {
    if (this.loadingNotificationConfig) return 'Trwa ładowanie ustawień…';
    if (this.form.get('maxBikesPerDay')?.invalid) return 'Podaj prawidłową maksymalną liczbę rowerów (min. 1).';
    if (this.form.get('smsTextReturn')?.errors?.['smsTooLong']) return 'Treść SMS (wydanie) przekracza 150 znaków.';
    if (this.form.get('smsTextPickup')?.errors?.['smsTooLong']) return 'Treść SMS (odbiór) przekracza 150 znaków.';
    if (this.hasTemplateErrors) return 'Sprawdź szablony — nazwa max 20 znaków, tekst max 500 znaków.';
    return null;
  }

  insertInput(textarea: HTMLTextAreaElement, tpl: TemplateEntry): void {
    const tag = `[${tpl.name}]`;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    tpl.text = tpl.text.substring(0, start) + tag + tpl.text.substring(end);
    this.isDirty = true;
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;
      textarea.focus();
    });
  }
}
