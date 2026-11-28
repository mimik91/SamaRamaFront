import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { EnumerationService } from '../../core/enumeration.service';
import { BicycleService } from '../../pages/client-panel/bicycle.service';
import { Bicycle } from '../../shared/models/bicycle.model';
import { OfficeAddressDto } from '../../shared/models/office-address.model';
import { environment } from '../../environments/environments';
import { ReservationApiService } from './reservation-api.service';
import {
  AvailabilityFetcher,
  DeliveryType,
  ReservationDraft,
  ReservationDraftBike,
  ReservationFormConfig,
  ReservationSettings,
  SummaryCardView
} from './reservation-form.models';
import { DAY_KEYS, DAY_LABELS, PICKUP_WINDOWS, dateToStr, earliestServiceDate, plannedDateToStr, toDate } from './reservation-form.utils';
import { PaymentSummaryDetails } from '../../shared/models/payment.models';
import { ReservationSuccessData } from '../../pages/reservation-success/reservation-success.model';

export interface ReservationFormStoreDeps {
  fb: FormBuilder;
  api: ReservationApiService;
  bicycleService: BicycleService;
  enumerationService: EnumerationService;
  config: ReservationFormConfig;
  clientMode: boolean;
  /** Limit rowerów, gdy brak informacji o wolnych miejscach i o limicie dziennym (0 = bez limitu). */
  defaultMaxBikes: number;
}

export interface CouponState {
  applying: boolean;
  message: string | null;
  invalid: boolean;
}

/**
 * Wspólny stan formularza rezerwacji (zwykłej i ekspresowej): formularze, rowery, dostawa,
 * adres odbioru, kalendarz i dostępność, kupon, zapamiętywanie wersji roboczej.
 * Zwykła klasa tworzona przez powłokę (komponent-stronę) — nie singleton.
 */
export class ReservationFormStore {
  readonly config: ReservationFormConfig;
  readonly clientMode: boolean;

  currentStep = 1;
  submitting = false;

  readonly reservationForm: FormGroup;
  readonly bikesArray: FormArray;
  readonly transportForm: FormGroup;
  readonly termsControl = new FormControl(false, [Validators.requiredTrue]);
  readonly couponControl = new FormControl('');
  readonly officeNameControl = new FormControl('');
  readonly coupon: CouponState = { applying: false, message: null, invalid: false };

  reservationSettings: ReservationSettings | null = null;

  minDate = '';
  maxDate = '';
  minDateObj: Date;
  maxDateObj: Date;

  brands: string[] = [];
  officeAddresses: OfficeAddressDto[] = [];
  selectedOffice: OfficeAddressDto | null = null;
  myBicycles: Bicycle[] = [];
  loadingMyBicycles = false;

  availableSlotsForDate: number | null = null;
  checkingAvailability = false;
  availabilityError: string | null = null;
  weekendTransportError: string | null = null;

  availabilityFetcher: AvailabilityFetcher | null = null;

  /** Nowa referencja wymusza przerysowanie dni w kalendarzu (np. po zmianie typu transportu). */
  calendarFilter: (date: Date | null) => boolean = (d) => this.dateFilter(d);

  private draftBikes: ReservationDraftBike[] | null = null;
  private draftOfficeName: string | null = null;
  private subs = new Subscription();

  private readonly fb: FormBuilder;
  private readonly api: ReservationApiService;
  private readonly bicycleService: BicycleService;
  private readonly enumerationService: EnumerationService;
  private readonly defaultMaxBikes: number;

  constructor(deps: ReservationFormStoreDeps) {
    this.fb = deps.fb;
    this.api = deps.api;
    this.bicycleService = deps.bicycleService;
    this.enumerationService = deps.enumerationService;
    this.config = deps.config;
    this.clientMode = deps.clientMode;
    this.defaultMaxBikes = deps.defaultMaxBikes;

    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 30);
    this.maxDateObj = maxD;
    this.maxDate = dateToStr(maxD);

    this.minDateObj = earliestServiceDate(this.config.defaultDelivery);
    this.minDate = dateToStr(this.minDateObj);

    this.bikesArray = this.fb.array([this.createBikeGroup()]);

    const c = this.clientMode;
    this.reservationForm = this.fb.group({
      firstName: [{ value: '', disabled: c }, c ? [] : [Validators.required, Validators.minLength(2)]],
      lastName: [{ value: '', disabled: c }, c ? [] : [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: c }, c ? [] : [Validators.required, Validators.email]],
      phone: [{ value: '', disabled: c }, c ? [] : [Validators.required, Validators.pattern(/^\d{9}$/)]],
      plannedDate: ['', [Validators.required, this.acceptedDayValidator.bind(this)]],
      deliveryType: [this.config.defaultDelivery as DeliveryType]
    });

    this.transportForm = this.fb.group({
      pickupStreet: ['', Validators.required],
      pickupBuildingNumber: ['', Validators.required],
      pickupCity: ['', Validators.required],
      pickupPostalCode: ['', [Validators.pattern(/^\d{2}-\d{3}$/)]],
      transportNotes: ['']
    });
  }

  // ===== Cykl życia =====

  /** Podpina nasłuchiwanie daty i typu dostawy. Wołane z ngOnInit powłoki. */
  start(): void {
    this.subs.add(
      this.reservationForm.get('plannedDate')!.valueChanges.pipe(
        distinctUntilChanged((a, b) => plannedDateToStr(a) === plannedDateToStr(b))
      ).subscribe((val) => {
        this.availableSlotsForDate = null;
        this.availabilityError = null;
        const date = toDate(val);
        if (!date) return;
        const day = date.getDay();
        if (day !== 0 && day !== 6) this.weekendTransportError = null;
        this.checkDateAvailability(date);
      })
    );

    this.subs.add(
      this.reservationForm.get('deliveryType')!.valueChanges.subscribe((val: DeliveryType) => {
        if (val !== 'SELF') {
          this.transportForm.enable();
        } else {
          this.transportForm.disable();
          this.resetCoupon();
        }
      })
    );

    this.transportForm.enable();
  }

  destroy(): void {
    this.subs.unsubscribe();
  }

  // ===== Dane słownikowe =====

  loadBrands(): void {
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => { this.brands = brands; },
      error: () => { this.brands = environment.settings.fallback.brands; }
    });
  }

  loadOffices(): void {
    this.api.getOfficeAddresses().subscribe({
      next: (offices) => {
        this.officeAddresses = offices;
        // powrót z płatności: odtwórz wybrane biuro (pola adresu są już uzupełnione z wersji roboczej)
        if (this.draftOfficeName) {
          this.selectedOffice = offices.find(o => o.name === this.draftOfficeName) ?? null;
        }
      },
      error: () => { this.officeAddresses = []; }
    });
  }

  /** Tryb klienta: lista własnych rowerów + ewentualny rower z modala „Umów serwis". */
  loadMyBicycles(originatingBicycleId: number | null): void {
    this.loadingMyBicycles = true;
    this.bicycleService.getUserBicycles().subscribe({
      next: (bikes) => {
        this.myBicycles = bikes;
        this.loadingMyBicycles = false;
        if (this.draftBikes) {
          this.applyDraftBikes(this.draftBikes);
        } else if (originatingBicycleId && bikes.some(b => b.id === originatingBicycleId)) {
          this.onBicycleSelected(0, originatingBicycleId);
        }
      },
      error: () => {
        this.myBicycles = [];
        this.loadingMyBicycles = false;
      }
    });
  }

  // ===== Rowery =====

  createBikeGroup(): FormGroup {
    return this.fb.group({
      selectedBicycleId: [null as number | null],
      brand: ['', Validators.required],
      model: [''],
      additionalInfo: ['', this.config.additionalInfoRequired ? Validators.required : []]
    });
  }

  get bikeControls(): FormGroup[] {
    return this.bikesArray.controls as FormGroup[];
  }

  get maxBikes(): number {
    if (this.availableSlotsForDate !== null) return this.availableSlotsForDate;
    const perDay = this.reservationSettings?.maxBikesPerDay;
    if (perDay && perDay > 0) return Math.ceil(perDay / 2);
    return this.defaultMaxBikes;
  }

  get canAddBike(): boolean {
    const limit = this.maxBikes;
    return limit === 0 || this.bikesArray.length < limit;
  }

  addBike(): void {
    if (!this.canAddBike) return;
    this.bikesArray.push(this.createBikeGroup());
  }

  removeBike(index: number): void {
    if (this.bikesArray.length <= 1) return;
    this.bikesArray.removeAt(index);
  }

  availableBicyclesFor(index: number): Bicycle[] {
    const chosenElsewhere = new Set(
      this.bikesArray.controls
        .filter((_, i) => i !== index)
        .map(c => c.get('selectedBicycleId')?.value)
        .filter((id): id is number => id != null)
    );
    return this.myBicycles.filter(b => !chosenElsewhere.has(b.id));
  }

  onBicycleSelected(index: number, bicycleId: number | 'OTHER'): void {
    const group = this.bikesArray.at(index) as FormGroup;
    if (bicycleId === 'OTHER') {
      group.get('selectedBicycleId')?.setValue(null);
      group.get('brand')?.enable();
      group.get('model')?.enable();
      group.get('brand')?.setValue('');
      group.get('model')?.setValue('');
      return;
    }
    const bike = this.myBicycles.find(b => b.id === bicycleId);
    if (!bike) return;
    group.get('selectedBicycleId')?.setValue(bicycleId);
    group.get('brand')?.setValue(bike.brand);
    group.get('model')?.setValue(bike.model ?? '');
    group.get('brand')?.disable();
    group.get('model')?.disable();
  }

  /** Rowery do wysyłki: `emptyModel` — czym zastąpić pusty model (null dla rezerwacji, '' dla transportu). */
  bikesPayload(emptyModel: null | ''): {
    brand: string; model: string | null; additionalInfo: string | null; bicycleId?: number
  }[] {
    return this.bikesArray.getRawValue().map(
      (b: { brand: string; model: string; additionalInfo: string; selectedBicycleId: number | null }) => ({
        brand: b.brand.trim(),
        model: b.model?.trim() || emptyModel,
        additionalInfo: b.additionalInfo?.trim() || emptyModel,
        bicycleId: b.selectedBicycleId ?? undefined
      })
    );
  }

  /** Rowery do panelu bocznego „Twoja rezerwacja" (marka + model). */
  get summaryBikes(): string[] {
    return this.bikesArray.getRawValue()
      .map((b: { brand: string | null; model: string | null }) =>
        [b.brand?.trim(), b.model?.trim()].filter(Boolean).join(' '))
      .filter((s: string) => !!s);
  }

  get summaryContactName(): string {
    const v = this.reservationForm.getRawValue();
    return [v.firstName?.trim(), v.lastName?.trim()].filter(Boolean).join(' ');
  }

  // ===== Data, dni, dostępność =====

  readonly dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    if (this.reservationSettings?.fullyBookedDates?.includes(dateToStr(date))) return false;
    const day = date.getDay();
    if ((this.config.weekendsAlwaysBlocked || this.withTransport) && (day === 0 || day === 6)) return false;
    const accepted = this.reservationSettings?.acceptedDays;
    if (accepted && accepted.length > 0) return accepted.includes(DAY_KEYS[day]);
    return true;
  };

  refreshCalendarFilter(): void {
    this.calendarFilter = (d) => this.dateFilter(d);
  }

  acceptedDayValidator(control: AbstractControl): ValidationErrors | null {
    const date = toDate(control.value);
    if (!date) return null;
    const accepted = this.reservationSettings?.acceptedDays;
    if (accepted && accepted.length > 0 && !accepted.includes(DAY_KEYS[date.getDay()])) {
      return { notAcceptedDay: true };
    }
    return null;
  }

  get acceptedDaysHint(): string {
    const accepted = this.reservationSettings?.acceptedDays;
    if (!accepted || accepted.length === 0) return 'Dostępne terminy: wszystkie dni tygodnia';
    return 'Dostępne dni: ' + accepted.map(d => DAY_LABELS[d] || d).join(', ');
  }

  get selectedDateObj(): Date | null {
    return toDate(this.reservationForm.get('plannedDate')?.value);
  }

  get plannedDateStr(): string {
    return plannedDateToStr(this.reservationForm.get('plannedDate')?.value);
  }

  updateMinDate(): void {
    const defaultMin = earliestServiceDate(this.deliveryType);
    const estimated = this.reservationSettings?.estimatedReservationDay ?? '';
    if (estimated && estimated > dateToStr(defaultMin)) {
      this.minDate = estimated;
      this.minDateObj = new Date(estimated + 'T00:00:00');
    } else {
      this.minDate = dateToStr(defaultMin);
      this.minDateObj = defaultMin;
    }
  }

  /** Ustawienia terminów wczytane z serwera — odświeża zakres kalendarza i walidację daty. */
  applySettings(settings: ReservationSettings): void {
    this.reservationSettings = settings;
    this.updateMinDate();
    this.refreshCalendarFilter();
    this.reservationForm.get('plannedDate')?.updateValueAndValidity();
  }

  /** Zaznacza najbliższy dostępny dzień (o ile klient nie wybrał jeszcze żadnego). */
  preselectNearestAvailableDate(): Date | null {
    const ctrl = this.reservationForm.get('plannedDate');
    if (!ctrl || ctrl.value) return null;
    const d = new Date(this.minDateObj);
    d.setHours(0, 0, 0, 0);
    const max = new Date(this.maxDateObj);
    max.setHours(0, 0, 0, 0);
    while (d <= max) {
      if (this.dateFilter(d)) {
        const picked = new Date(d);
        ctrl.setValue(picked);
        return picked;
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  selectDate(date: Date | null): void {
    if (!date) return;
    const ctrl = this.reservationForm.get('plannedDate');
    ctrl?.setValue(date);
    ctrl?.markAsDirty();
    ctrl?.markAsTouched();
  }

  private checkDateAvailability(date: Date): void {
    if (!this.availabilityFetcher) return;
    this.checkingAvailability = true;
    this.availabilityError = null;
    this.availableSlotsForDate = null;
    this.availabilityFetcher(dateToStr(date)).subscribe({
      next: (days) => {
        this.checkingAvailability = false;
        const day = days[0];
        if (!day) return;
        const slots = day.availableSlots ?? 0;
        if (!day.available || slots <= 0) {
          this.availabilityError = 'Ten dzień jest już w pełni zarezerwowany. Wybierz inną datę.';
          this.reservationForm.get('plannedDate')?.setValue(null);
          this.availableSlotsForDate = null;
          return;
        }
        this.availableSlotsForDate = slots;
        if (this.bikesArray.length > slots) {
          this.availabilityError = `Na ten dzień pozostało ${slots} wolne${slots === 1 ? '' : slots < 5 ? ' miejsca' : ' miejsc'}. Usuń rower lub wybierz inną datę.`;
          this.reservationForm.get('plannedDate')?.setValue(null);
          this.availableSlotsForDate = null;
        }
      },
      error: () => { this.checkingAvailability = false; }
    });
  }

  // ===== Dostawa i adres odbioru =====

  get deliveryType(): DeliveryType {
    return this.reservationForm.get('deliveryType')?.value as DeliveryType;
  }

  get withTransport(): boolean {
    return this.deliveryType !== 'SELF';
  }

  get isOfficePick(): boolean {
    return this.deliveryType === 'OFFICE';
  }

  /** Zmienia typ dostawy; zwraca false, gdy zmiana jest niemożliwa (transport w weekend). */
  setDeliveryType(type: DeliveryType): boolean {
    if (type !== 'SELF') {
      const planned = this.selectedDateObj;
      if (planned && (planned.getDay() === 0 || planned.getDay() === 6)) {
        this.weekendTransportError = 'Transport możliwy tylko do rezerwacji od poniedziałku do piątku.';
        return false;
      }
    }
    this.weekendTransportError = null;
    this.reservationForm.get('deliveryType')?.setValue(type);
    this.updateMinDate();
    const planned = this.selectedDateObj;
    if (planned && planned < this.minDateObj) {
      this.reservationForm.get('plannedDate')?.setValue(null);
    }
    this.refreshCalendarFilter();
    this.selectedOffice = null;
    this.officeNameControl.setValue('');
    this.clearAddressFields();
    return true;
  }

  /** Data odbioru: dom — dzień przed terminem serwisu, biuro — w dniu terminu. */
  get transportDate(): string {
    const d = this.selectedDateObj;
    if (!d) return '';
    const pickup = new Date(d);
    if (!this.isOfficePick) pickup.setDate(pickup.getDate() - 1);
    if (this.config.clampPickupToToday) {
      // Odbiór spod domu nie może wypaść w przeszłości (rezerwacja na dziś).
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (pickup < today) return dateToStr(today);
    }
    return dateToStr(pickup);
  }

  /** Godziny odbioru i zwrotu dla wybranego sposobu odbioru. */
  get pickupWindow(): string {
    return this.isOfficePick ? PICKUP_WINDOWS.OFFICE : PICKUP_WINDOWS.DOOR_TO_DOOR;
  }

  /** Nazwa biurowca (tylko przy odbiorze spod biura), inaczej null. */
  get officeLabel(): string | null {
    return this.isOfficePick ? (this.officeNameControl.value?.trim() || null) : null;
  }

  /** „Biurowiec, ul. Kwiatowa 5, Kraków" — miejsce odbioru do podsumowań. */
  get pickupPlace(): string {
    const tv = this.transportForm.getRawValue();
    const street = [tv.pickupStreet, tv.pickupBuildingNumber].filter(Boolean).join(' ');
    const address = [street, tv.pickupCity].filter(Boolean).join(', ');
    return this.officeLabel ? `${this.officeLabel}, ${address}` : address;
  }

  /** Uwagi dla kuriera; przy odbiorze z biura z nazwą biurowca w pierwszej linii (format czytany przez kurierów). */
  get courierNotes(): string {
    const officePrefix = this.officeLabel ? `***** ${this.officeLabel.toUpperCase()} *****` : '';
    const userNotes = this.transportForm.value.transportNotes?.trim() || '';
    return [officePrefix, userNotes].filter(Boolean).join('\n');
  }

  // ===== Modele widoków podsumowania =====

  /** Karta „Dane kontaktowe" (null dla zalogowanego klienta — dane bierze się z konta). */
  contactSummaryCard(): SummaryCardView | null {
    if (this.clientMode) return null;
    const rv = this.reservationForm.getRawValue();
    const rows = [
      { label: 'Imię i nazwisko:', value: `${rv.firstName ?? ''} ${rv.lastName ?? ''}`.trim() },
      { label: 'Email:', value: rv.email ?? '' }
    ];
    if (rv.phone) rows.push({ label: 'Telefon:', value: rv.phone });
    return { title: 'Dane kontaktowe', icon: 'person', rows };
  }

  /** Karta „Rowery (n)" z uwagami do każdego roweru. */
  bikesSummaryCard(): SummaryCardView {
    const rows = this.bikesArray.getRawValue().flatMap(
      (b: { brand: string; model: string; additionalInfo: string }, i: number) => {
        const bikeRows = [{ label: `Rower ${i + 1}:`, value: [b.brand, b.model].filter(Boolean).join(' ') }];
        if (b.additionalInfo) bikeRows.push({ label: 'Uwagi:', value: b.additionalInfo });
        return bikeRows;
      }
    );
    return { title: `Rowery (${this.bikesArray.length})`, icon: 'bike', rows };
  }

  /** Wspólna część podsumowania na ekranie płatności (powłoka dokłada serwis/pakiet/kupon). */
  paymentDetailsBase(): PaymentSummaryDetails {
    return {
      plannedDate: this.plannedDateStr,
      pickupDate: this.transportDate,
      pickupPlace: this.pickupPlace,
      bikes: this.summaryBikes
    };
  }

  /** Wspólna część danych ekranu /sukces (powłoka dokłada serwis, pakiet, wariant). */
  successBase(authEmail: string | null): Pick<ReservationSuccessData, 'plannedDate' | 'bikes' | 'workDescription' | 'email'> {
    const bikes = this.bikesArray.getRawValue() as { brand: string; model: string; additionalInfo: string }[];
    // zalogowany klient ma pole e-mail wyłączone — bierzemy adres z sesji
    const typedEmail = (this.reservationForm.get('email')?.value ?? '').trim();
    return {
      plannedDate: this.plannedDateStr || null,
      bikes: bikes.map(b => ({ brand: (b.brand ?? '').trim(), model: (b.model ?? '').trim() })),
      workDescription: bikes[0]?.additionalInfo?.trim() || null,
      email: typedEmail || authEmail || null
    };
  }

  clearAddressFields(): void {
    this.transportForm.patchValue({
      pickupStreet: '', pickupBuildingNumber: '', pickupCity: '', pickupPostalCode: ''
    });
  }

  selectOffice(office: OfficeAddressDto): void {
    this.selectedOffice = office;
    this.officeNameControl.setValue(office.name);
    this.transportForm.patchValue({
      pickupStreet: office.street,
      pickupBuildingNumber: office.building,
      pickupCity: office.city,
      pickupPostalCode: office.postalCode || ''
    });
  }

  clearOfficeSelection(): void {
    this.selectedOffice = null;
    this.officeNameControl.setValue('');
    this.clearAddressFields();
  }

  // ===== Kupon =====

  resetCoupon(): void {
    this.couponControl.setValue('');
    this.coupon.message = null;
    this.coupon.invalid = false;
    this.coupon.applying = false;
  }

  // ===== Kroki i walidacja =====

  isStep1Valid(): boolean {
    const officeNameFilled = !this.isOfficePick || !!this.officeNameControl.value?.trim();
    const transportValid = !this.withTransport || (this.transportForm.valid && officeNameFilled);
    return this.reservationForm.valid && this.bikesArray.valid && transportValid;
  }

  markStep1Touched(): void {
    this.markAllTouched(this.reservationForm);
    this.bikesArray.controls.forEach(c => this.markAllTouched(c as FormGroup));
    if (this.withTransport) this.markAllTouched(this.transportForm);
    this.officeNameControl.markAsDirty();
  }

  isFieldInvalid(fieldName: string, form: FormGroup = this.reservationForm): boolean {
    const f = form.get(fieldName);
    return !!(f?.invalid && (f.dirty || f.touched));
  }

  private markAllTouched(group: FormGroup): void {
    Object.values(group.controls).forEach(c => c.markAsTouched());
  }

  // ===== Wersja robocza (powrót z płatności) =====

  toDraft(extra?: Record<string, unknown>): ReservationDraft {
    const rv = this.reservationForm.getRawValue();
    return {
      contact: { firstName: rv.firstName ?? '', lastName: rv.lastName ?? '', email: rv.email ?? '', phone: rv.phone ?? '' },
      plannedDate: plannedDateToStr(rv.plannedDate),
      deliveryType: this.deliveryType,
      bikes: this.bikesArray.getRawValue().map(
        (b: { selectedBicycleId: number | null; brand: string; model: string; additionalInfo: string }) => ({
          selectedBicycleId: b.selectedBicycleId ?? null,
          brand: b.brand ?? '',
          model: b.model ?? '',
          additionalInfo: b.additionalInfo ?? ''
        })
      ),
      transport: this.transportForm.getRawValue(),
      officeName: this.officeNameControl.value ?? '',
      coupon: this.couponControl.value ?? '',
      termsAccepted: !!this.termsControl.value,
      extra
    };
  }

  applyDraft(draft: ReservationDraft): void {
    if (!this.clientMode) {
      this.reservationForm.patchValue(draft.contact);
    }

    this.reservationForm.get('deliveryType')?.setValue(draft.deliveryType);
    this.updateMinDate();
    this.refreshCalendarFilter();
    this.reservationForm.get('plannedDate')?.setValue(draft.plannedDate || '');

    this.transportForm.patchValue(draft.transport);
    this.officeNameControl.setValue(draft.officeName);
    this.draftOfficeName = draft.officeName || null;
    if (this.draftOfficeName) {
      this.selectedOffice = this.officeAddresses.find(o => o.name === this.draftOfficeName) ?? null;
    }
    this.couponControl.setValue(draft.coupon);
    this.termsControl.setValue(draft.termsAccepted);

    // tryb klienta wybiera rowery z listy — uzupełniamy je dopiero po jej załadowaniu (loadMyBicycles)
    this.draftBikes = draft.bikes;
    if (!this.clientMode) {
      this.applyDraftBikes(draft.bikes);
    }

    // wracamy od razu do kroku z kuponem i regulaminem
    this.currentStep = 2;
  }

  private applyDraftBikes(bikes: ReservationDraftBike[]): void {
    while (this.bikesArray.length < bikes.length) {
      this.bikesArray.push(this.createBikeGroup());
    }
    bikes.forEach((bike, i) => {
      const group = this.bikesArray.at(i) as FormGroup;
      if (this.clientMode && bike.selectedBicycleId) {
        this.onBicycleSelected(i, bike.selectedBicycleId);
      } else {
        group.patchValue({ brand: bike.brand, model: bike.model });
      }
      group.patchValue({ additionalInfo: bike.additionalInfo });
    });
  }
}
