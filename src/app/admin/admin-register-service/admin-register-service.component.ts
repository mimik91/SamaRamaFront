import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, debounceTime, distinctUntilChanged, map, of, switchMap, timer, catchError } from 'rxjs';
import {
  AdminOpeningHoursPayload,
  AdminPackageItemPayload,
  AdminPackageLevel,
  AdminPackagesPayload,
  AdminServiceRegistrationRequest,
  AdminServiceRegistrationResponse,
  AdminServiceRegistrationService
} from '../admin-service-registration.service';

interface DayDef {
  key: string;
  label: string;
}

type LogoStatus = 'none' | 'uploading' | 'uploaded' | 'error';

const SUFFIX_PATTERN = /^[A-Za-z0-9]+(?:[.-]?[A-Za-z0-9]+)*$/;
const COORDS_PATTERN = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const LOGO_MAX_BYTES = 1024 * 1024;

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function urlValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString().trim();
  return !value || isValidUrl(value) ? null : { invalidUrl: true };
}

function coordinatesValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) return null;
  const match = COORDS_PATTERN.exec(raw);
  if (!match) return { coordsFormat: true };
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (!(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180)) return { coordsRange: true };
  return null;
}

function bikeTypesRequired(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string[] | null;
  return value && value.length > 0 ? null : { bikeTypesRequired: true };
}

function dayHoursValidator(group: AbstractControl): ValidationErrors | null {
  const enabled = group.get('enabled')?.value as boolean;
  const open = group.get('openTime')?.value as string;
  const close = group.get('closeTime')?.value as string;
  if (!enabled) return null;
  if (!open || !close || close <= open) return { invalidRange: true };
  return null;
}

/**
 * Kreator „Zarejestruj serwis” dla admina: jedna strona, jeden przycisk. Serwis powstaje po stronie backendu
 * w jednej transakcji (konto z losowym hasłem, mail powitalny jutro o 10:00). Logo wysyłane jest dopiero
 * po utworzeniu (potrzebne jest id serwisu) — błąd logo nie cofa rejestracji.
 */
@Component({
  selector: 'app-admin-register-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-register-service.component.html',
  styleUrls: ['./admin-register-service.component.css']
})
export class AdminRegisterServiceComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(AdminServiceRegistrationService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);

  readonly days: DayDef[] = [
    { key: 'MONDAY', label: 'Poniedziałek' },
    { key: 'TUESDAY', label: 'Wtorek' },
    { key: 'WEDNESDAY', label: 'Środa' },
    { key: 'THURSDAY', label: 'Czwartek' },
    { key: 'FRIDAY', label: 'Piątek' },
    { key: 'SATURDAY', label: 'Sobota' },
    { key: 'SUNDAY', label: 'Niedziela' }
  ];

  readonly packageLevels: Array<{ value: AdminPackageLevel; label: string }> = [
    { value: 'BASIC', label: 'Podstawowy' },
    { value: 'ADVANCED', label: 'Rozszerzony' },
    { value: 'FULL', label: 'Pełny' }
  ];

  readonly form: FormGroup = this.buildForm();

  bikeTypes: string[] = [];
  cities: string[] = [];
  districts: string[] = [];

  isSubmitting = false;
  errorMessage = '';

  result: AdminServiceRegistrationResponse | null = null;
  linkCopied = false;

  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  logoError = '';
  logoStatus: LogoStatus = 'none';
  logoUploadError = '';

  ngOnInit(): void {
    this.api.getBikeTypes().subscribe({
      next: types => (this.bikeTypes = [...types].sort((a, b) => a.localeCompare(b, 'pl'))),
      error: () => (this.bikeTypes = [])
    });
    this.api.getCities().subscribe({
      next: cities => (this.cities = cities),
      error: () => (this.cities = [])
    });

    // Suffix zawsze małymi literami
    this.ctrl('suffix').valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      if (typeof value === 'string' && value !== value.toLowerCase()) {
        this.ctrl('suffix').setValue(value.toLowerCase(), { emitEvent: false });
      }
    });

    // Dzielnice zależą od miasta
    this.ctrl('city').valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(city => {
          const trimmed = (city ?? '').toString().trim();
          return trimmed.length >= 2
            ? this.api.getDistricts(trimmed).pipe(catchError(() => of([] as string[])))
            : of([] as string[]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(districts => (this.districts = districts));
  }

  ngOnDestroy(): void {
    this.revokeLogoPreview();
  }

  // ===== budowa formularza =====

  private buildForm(): FormGroup {
    const hours: Record<string, FormGroup> = {};
    const accepted: Record<string, FormControl<boolean>> = {};
    this.days.forEach(day => {
      hours[day.key] = this.fb.nonNullable.group(
        { enabled: false, openTime: '09:00', closeTime: '17:00' },
        { validators: dayHoursValidator }
      );
      accepted[day.key] = this.fb.nonNullable.control(
        ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day.key)
      );
    });

    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)], [this.nameAsyncValidator()]],
      suffix: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(SUFFIX_PATTERN)],
        [this.suffixAsyncValidator()]
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(50)],
        [this.emailAsyncValidator()]
      ],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{9}$/)]],
      contactPerson: ['', [Validators.maxLength(100)]],
      shortName: ['', [Validators.maxLength(12), Validators.pattern(/^[A-Za-z0-9 -]*$/)]],
      displayEmail: [false],
      displayPhoneNumber: [true],

      street: ['', [Validators.required, Validators.maxLength(255)]],
      building: ['', [Validators.required, Validators.maxLength(20)]],
      flat: ['', [Validators.maxLength(20)]],
      postalCode: ['', [Validators.required, Validators.maxLength(10)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      district: ['', [Validators.maxLength(100)]],
      coordinates: ['', [Validators.required, coordinatesValidator]],

      description: ['', [Validators.maxLength(1500)]],
      website: ['', [Validators.maxLength(255), urlValidator]],
      facebook: ['', [Validators.maxLength(255), urlValidator]],

      pricelistActive: [true],
      openingHoursActive: [true],
      reservationAvailable: [true],

      hours: this.fb.group(hours),
      hoursInfo: ['', [Validators.maxLength(500)]],
      hoursNote: ['', [Validators.maxLength(500)]],

      acceptedDays: this.fb.group(accepted),

      packagesActive: [true],
      packagesGeneralDescription: ['', [Validators.maxLength(1000)]],
      packagesComment: ['', [Validators.maxLength(1000)]],
      packagesDefaultBikeType: [''],
      packages: this.fb.array([])
    });
  }

  // ===== walidatory asynchroniczne (debounce 500 ms, błąd API nie blokuje formularza) =====

  private nameAsyncValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value ?? '').toString().trim();
      if (!value) return of(null);
      return timer(500).pipe(
        switchMap(() => this.api.isServiceNameTaken(value)),
        map(taken => (taken ? { serviceNameTaken: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  private suffixAsyncValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value ?? '').toString().trim().toLowerCase();
      if (!value) return of(null);
      return timer(500).pipe(
        switchMap(() => this.api.isSuffixTaken(value)),
        map(taken => (taken ? { suffixTaken: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  private emailAsyncValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value ?? '').toString().trim();
      if (!value) return of(null);
      return timer(500).pipe(
        switchMap(() => this.api.emailExists(value)),
        map(response => {
          if (!response.exists) return null;
          return response.reason === 'SERVICE_PIN' ? { emailUsedByService: true } : { accountExists: true };
        }),
        catchError(() => of(null))
      );
    };
  }

  // ===== dostęp do kontrolek / stan =====

  ctrl(name: string): AbstractControl {
    return this.form.get(name) as AbstractControl;
  }

  get packagesArray(): FormArray {
    return this.form.get('packages') as FormArray;
  }

  packageGroup(index: number): FormGroup {
    return this.packagesArray.at(index) as FormGroup;
  }

  hoursGroup(key: string): FormGroup {
    return this.form.get(['hours', key]) as FormGroup;
  }

  isPending(name: string): boolean {
    return this.ctrl(name).pending;
  }

  showError(name: string): boolean {
    const c = this.ctrl(name);
    return c.invalid && (c.touched || c.dirty);
  }

  hasError(name: string, error: string): boolean {
    return this.showError(name) && this.ctrl(name).hasError(error);
  }

  isDayEnabled(key: string): boolean {
    return !!this.hoursGroup(key).get('enabled')?.value;
  }

  get anyDayEnabled(): boolean {
    return this.days.some(day => this.isDayEnabled(day.key));
  }

  get hoursWarning(): boolean {
    return !!this.ctrl('openingHoursActive').value && !this.anyDayEnabled;
  }

  get parsedCoordinates(): { lat: number; lon: number } | null {
    const raw = (this.ctrl('coordinates').value ?? '').toString();
    const match = COORDS_PATTERN.exec(raw);
    if (!match || this.ctrl('coordinates').invalid) return null;
    return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
  }

  get mapsUrl(): string | null {
    const coords = this.parsedCoordinates;
    return coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}` : null;
  }

  get profileUrl(): string {
    return `cyclopick.pl/${this.result?.suffix ?? ''}`;
  }

  // ===== akcje formularza =====

  suggestSuffix(): void {
    const name = (this.ctrl('name').value ?? '').toString();
    const suggestion = name
      .toLowerCase()
      .replace(/ł/g, 'l')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50)
      .replace(/-+$/g, '');
    this.ctrl('suffix').setValue(suggestion);
    this.ctrl('suffix').markAsTouched();
  }

  copyHoursToOtherDays(sourceKey: string): void {
    const source = this.hoursGroup(sourceKey).value as { enabled: boolean; openTime: string; closeTime: string };
    this.days.forEach(day => {
      if (day.key !== sourceKey) {
        this.hoursGroup(day.key).patchValue(source);
      }
    });
    this.form.markAsDirty();
  }

  addPackage(): void {
    this.packagesArray.push(
      this.fb.nonNullable.group({
        packageLevel: ['BASIC' as AdminPackageLevel],
        customName: ['', [Validators.maxLength(100)]],
        bikeTypes: [[] as string[], [bikeTypesRequired]],
        price: [null as number | null, [Validators.required, Validators.min(0.01)]],
        description: ['', [Validators.maxLength(2000)]],
        active: [true]
      })
    );
  }

  removePackage(index: number): void {
    this.packagesArray.removeAt(index);
  }

  isBikeTypeSelected(index: number, type: string): boolean {
    const selected = this.packageGroup(index).get('bikeTypes')?.value as string[];
    return selected.includes(type);
  }

  toggleBikeType(index: number, type: string): void {
    const control = this.packageGroup(index).get('bikeTypes') as AbstractControl;
    const selected = control.value as string[];
    control.setValue(selected.includes(type) ? selected.filter(t => t !== type) : [...selected, type]);
    control.markAsTouched();
  }

  packageControlInvalid(index: number, name: string): boolean {
    const c = this.packageGroup(index).get(name) as AbstractControl;
    return c.invalid && (c.touched || c.dirty);
  }

  // ===== logo =====

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.logoError = '';
    if (!file) return;

    if (!LOGO_TYPES.includes(file.type.toLowerCase())) {
      this.logoError = 'Dozwolone formaty: JPG, PNG, WEBP lub GIF.';
      input.value = '';
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      this.logoError = `Plik jest za duży (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksymalny rozmiar: 1 MB.`;
      input.value = '';
      return;
    }
    this.revokeLogoPreview();
    this.logoFile = file;
    this.logoPreviewUrl = URL.createObjectURL(file);
  }

  clearLogo(input: HTMLInputElement): void {
    this.revokeLogoPreview();
    this.logoFile = null;
    this.logoError = '';
    input.value = '';
  }

  private revokeLogoPreview(): void {
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
      this.logoPreviewUrl = null;
    }
  }

  // ===== wysyłka =====

  submit(): void {
    if (this.isSubmitting) return;
    this.errorMessage = '';

    if (this.form.pending) {
      this.errorMessage = 'Poczekaj na zakończenie sprawdzania nazwy, suffixu i e-maila.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Popraw zaznaczone pola formularza.';
      this.scrollToFirstError();
      return;
    }

    this.isSubmitting = true;
    this.api.registerService(this.buildPayload()).subscribe({
      next: response => {
        this.isSubmitting = false;
        this.result = response;
        this.scrollToTop();
        if (this.logoFile) {
          void this.uploadLogo();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = this.extractError(error);
        this.scrollToTop();
      }
    });
  }

  async uploadLogo(): Promise<void> {
    if (!this.result || !this.logoFile) return;
    this.logoStatus = 'uploading';
    this.logoUploadError = '';
    try {
      await this.api.uploadLogo(this.result.id, this.logoFile);
      this.logoStatus = 'uploaded';
    } catch (error) {
      this.logoStatus = 'error';
      this.logoUploadError = error instanceof Error ? error.message : 'Nie udało się wysłać logo.';
    }
  }

  private buildPayload(): AdminServiceRegistrationRequest {
    const v = this.form.getRawValue() as Record<string, unknown>;
    const text = (name: string): string | null => {
      const value = (v[name] as string | null | undefined)?.toString().trim();
      return value ? value : null;
    };
    const required = (name: string): string => (v[name] as string).toString().trim();
    const coords = this.parsedCoordinates as { lat: number; lon: number };

    return {
      name: required('name'),
      suffix: required('suffix').toLowerCase(),
      email: required('email'),
      phoneNumber: text('phoneNumber'),
      contactPerson: text('contactPerson'),
      shortName: text('shortName'),
      displayEmail: !!v['displayEmail'],
      displayPhoneNumber: !!v['displayPhoneNumber'],
      street: required('street'),
      building: required('building'),
      flat: text('flat'),
      postalCode: required('postalCode'),
      city: required('city'),
      district: text('district'),
      latitude: coords.lat,
      longitude: coords.lon,
      description: text('description'),
      website: text('website'),
      facebook: text('facebook'),
      pricelistActive: !!v['pricelistActive'],
      openingHoursActive: !!v['openingHoursActive'],
      reservationAvailable: !!v['reservationAvailable'],
      openingHours: this.buildOpeningHours(),
      acceptedDays: this.days.filter(day => this.form.get(['acceptedDays', day.key])?.value).map(day => day.key),
      packages: this.buildPackages()
    };
  }

  private buildOpeningHours(): AdminOpeningHoursPayload | null {
    const intervals: Record<string, { openTime: string; closeTime: string }> = {};
    this.days.forEach(day => {
      const group = this.hoursGroup(day.key).value as { enabled: boolean; openTime: string; closeTime: string };
      if (group.enabled) {
        intervals[day.key] = { openTime: group.openTime, closeTime: group.closeTime };
      }
    });
    const info = (this.ctrl('hoursInfo').value ?? '').toString().trim();
    const note = (this.ctrl('hoursNote').value ?? '').toString().trim();
    if (Object.keys(intervals).length === 0 && !info && !note) return null;
    return { intervals, openingHoursInfo: info, openingHoursNote: note };
  }

  private buildPackages(): AdminPackagesPayload | null {
    const general = (this.ctrl('packagesGeneralDescription').value ?? '').toString().trim();
    const comment = (this.ctrl('packagesComment').value ?? '').toString().trim();
    const defaultType = (this.ctrl('packagesDefaultBikeType').value ?? '').toString().trim();
    const items: AdminPackageItemPayload[] = this.packagesArray.controls.map(control => {
      const p = (control as FormGroup).getRawValue() as {
        packageLevel: AdminPackageLevel;
        customName: string;
        bikeTypes: string[];
        price: number;
        description: string;
        active: boolean;
      };
      return {
        packageLevel: p.packageLevel,
        customName: p.customName.trim() || null,
        bikeTypes: p.bikeTypes,
        price: Number(p.price),
        description: p.description.trim() || null,
        active: p.active
      };
    });
    if (items.length === 0 && !general && !comment && !defaultType) return null;
    return {
      generalDescription: general || null,
      comment: comment || null,
      defaultBikeType: defaultType || null,
      active: !!this.ctrl('packagesActive').value,
      items
    };
  }

  private extractError(error: HttpErrorResponse): string {
    const body = error.error as { message?: string; errors?: string[] } | string | null;
    if (body && typeof body === 'object') {
      if (Array.isArray(body.errors) && body.errors.length) return body.errors.join('\n');
      if (body.message) return body.message;
    }
    if (typeof body === 'string' && body) return body;
    if (error.status === 0) return 'Brak połączenia z serwerem.';
    return 'Nie udało się zarejestrować serwisu. Spróbuj ponownie.';
  }

  // ===== ekran sukcesu =====

  copyProfileLink(): void {
    if (!this.result || typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(`https://www.cyclopick.pl/${this.result.suffix}`).then(() => {
      this.linkCopied = true;
      setTimeout(() => (this.linkCopied = false), 2000);
    });
  }

  get welcomeDate(): string {
    if (!this.result?.welcomeEmailSendAt) return '';
    return new Date(this.result.welcomeEmailSendAt).toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  registerAnother(): void {
    this.revokeLogoPreview();
    this.form.reset({
      displayEmail: false,
      displayPhoneNumber: true,
      pricelistActive: true,
      openingHoursActive: true,
      reservationAvailable: true,
      packagesActive: true,
      hours: Object.fromEntries(
        this.days.map(day => [day.key, { enabled: false, openTime: '09:00', closeTime: '17:00' }])
      ),
      acceptedDays: Object.fromEntries(
        this.days.map(day => [day.key, ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day.key)])
      )
    });
    this.packagesArray.clear();
    this.result = null;
    this.logoFile = null;
    this.logoStatus = 'none';
    this.logoUploadError = '';
    this.logoError = '';
    this.errorMessage = '';
    this.scrollToTop();
  }

  goToDashboard(): void {
    this.router.navigate(['/admin-dashboard']);
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }

  private scrollToTop(): void {
    this.host.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector<HTMLElement>('.ars-invalid');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus?.();
    });
  }

  /** Walidator zwracający błąd tylko dla zadanych dni — pomocniczo dla szablonu. */
  dayInvalid(key: string): boolean {
    const group = this.hoursGroup(key);
    return group.invalid && (group.touched || group.dirty);
  }
}

