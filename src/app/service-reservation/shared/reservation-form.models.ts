import { Observable } from 'rxjs';

/** Ustawienia rezerwacji serwisu (dni przyjęć, zajęte terminy, limity). */
export interface ReservationSettings {
  acceptedDays: string[];
  estimatedReservationDay?: string | null;
  maxBikesPerDay?: number | null;
  fullyBookedDates?: string[];
}

export type DeliveryType = 'SELF' | 'DOOR_TO_DOOR' | 'OFFICE';

/** Dostępność jednego dnia (wspólny kształt odpowiedzi serwisu i serwisu ekspresowego). */
export interface DayAvailability {
  date: string;
  available: boolean;
  availableSlots?: number;
}

/** Pobiera dostępność dnia — inna dla zwykłego serwisu (po serviceId) i ekspresowego. */
export type AvailabilityFetcher = (dateStr: string) => Observable<DayAvailability[]>;

/** Różnice zachowania między formularzem zwykłej rezerwacji i ekspresowej. */
export interface ReservationFormConfig {
  allowedDeliveryTypes: DeliveryType[];
  defaultDelivery: DeliveryType;
  /** Opis problemu/usług wymagany (guest) albo opcjonalny (express — jest wybrany pakiet). */
  additionalInfoRequired: boolean;
  /** Weekendy zablokowane zawsze (express) albo tylko przy transporcie (guest). */
  weekendsAlwaysBlocked: boolean;
  /** Odbiór spod domu wypada dzień przed terminem; nie może być w przeszłości (express). */
  clampPickupToToday: boolean;
}

export interface ReservationDraftBike {
  selectedBicycleId: number | null;
  brand: string;
  model: string;
  additionalInfo: string;
}

/**
 * Wypełniony formularz zapamiętany przy przejściu do płatności — pozwala wrócić z podsumowania
 * (np. po kupon) bez ponownego wpisywania danych. Trzymany w sessionStorage, odczytywany jednorazowo.
 */
export interface ReservationDraft {
  contact: { firstName: string; lastName: string; email: string; phone: string };
  plannedDate: string;
  deliveryType: DeliveryType;
  bikes: ReservationDraftBike[];
  transport: { pickupStreet: string; pickupBuildingNumber: string; pickupCity: string; pickupPostalCode: string; transportNotes: string };
  officeName: string;
  coupon: string;
  termsAccepted: boolean;
  /** Dane specyficzne dla formularza (np. id pakietu w ekspresie). */
  extra?: Record<string, unknown>;
}

export interface SummaryRowView {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface SummaryCardView {
  title: string;
  /** 'person' | 'bike' | 'calendar' | 'truck' | 'package' — wybór ikony. */
  icon: 'person' | 'bike' | 'calendar' | 'truck' | 'package';
  rows: SummaryRowView[];
  /** Karta na całą szerokość (np. transport). */
  wide?: boolean;
}

export interface CostLineView {
  label: string;
  value: string;
  /** Cena przed rabatem (przekreślona). */
  original?: string;
  neutral?: boolean;
  total?: boolean;
}

export interface AsideRowView {
  label: string;
  values: string[];
  placeholder?: string;
  note?: string;
}
