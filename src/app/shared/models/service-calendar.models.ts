/**
 * Modele dla kalendarza serwisu rowerowego
 */

// ============================================
// TYPY WIDOKU I TRYBU
// ============================================

export type CalendarViewMode = 'day' | 'week' | 'month';
export type CalendarMode = 'SIMPLE' | 'ADVANCED';

// ============================================
// KONFIGURACJA KALENDARZA
// ============================================

export interface CalendarConfig {
  id: number;
  viewMode: CalendarMode;
  viewModeDisplayName?: string;
  maxBikesPerDay: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarConfigResponse {
  config: CalendarConfig;
  message?: string;
}

// ============================================
// SERWISANCI
// ============================================

export interface Technician {
  id: number;
  nickname: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
}

export interface CreateTechnicianDto {
  nickname: string;
}

export interface UpdateTechnicianDto {
  nickname?: string;
  isActive?: boolean;
}

// ============================================
// STATUSY ZLECEN
// ============================================

export type CalendarOrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WAITING_FOR_BIKE'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'AWAITING_CLIENT_DECISION'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED';

export interface OrderStatusConfig {
  value: CalendarOrderStatus;
  i18nKey: string;
  cssVar: string;        // CSS variable name from colors.css
  fallbackColor: string; // Fallback hex color
}

/**
 * Konfiguracja statusow zlecen
 * Kolory sa zdefiniowane jako zmienne CSS z colors.css
 * Etykiety sa kluczami i18n do tlumaczenia
 */
export const CALENDAR_ORDER_STATUSES: OrderStatusConfig[] = [
  {
    value: 'PENDING_CONFIRMATION',
    i18nKey: 'service_calendar.statuses.pending_confirmation',
    cssVar: '--color-slate-400',
    fallbackColor: '#94a3b8'
  },
  {
    value: 'CONFIRMED',
    i18nKey: 'service_calendar.statuses.confirmed',
    cssVar: '--color-success',
    fallbackColor: '#27ae60'
  },
  {
    value: 'REJECTED',
    i18nKey: 'service_calendar.statuses.rejected',
    cssVar: '--color-danger',
    fallbackColor: '#e74c3c'
  },
  {
    value: 'CANCELLED',
    i18nKey: 'service_calendar.statuses.cancelled',
    cssVar: '--color-slate-500',
    fallbackColor: '#64748b'
  },
  {
    value: 'WAITING_FOR_BIKE',
    i18nKey: 'service_calendar.statuses.waiting_for_bike',
    cssVar: '--color-warning',
    fallbackColor: '#f59e0b'
  },
  {
    value: 'IN_PROGRESS',
    i18nKey: 'service_calendar.statuses.in_progress',
    cssVar: '--color-info',
    fallbackColor: '#4299e1'
  },
  {
    value: 'WAITING_FOR_PARTS',
    i18nKey: 'service_calendar.statuses.waiting_for_parts',
    cssVar: '--color-warning-orange',
    fallbackColor: '#e65100'
  },
  {
    value: 'AWAITING_CLIENT_DECISION',
    i18nKey: 'service_calendar.statuses.awaiting_client_decision',
    cssVar: '--color-warning',
    fallbackColor: '#f59e0b'
  },
  {
    value: 'READY_FOR_PICKUP',
    i18nKey: 'service_calendar.statuses.ready_for_pickup',
    cssVar: '--color-accent',
    fallbackColor: '#4CAF50'
  },
  {
    value: 'COMPLETED',
    i18nKey: 'service_calendar.statuses.completed',
    cssVar: '--color-slate-600',
    fallbackColor: '#475569'
  }
];

export function getStatusConfig(status: CalendarOrderStatus): OrderStatusConfig | undefined {
  return CALENDAR_ORDER_STATUSES.find(s => s.value === status);
}

/**
 * Mapa dozwolonych przejsc miedzy statusami
 * Zgodna z logiką backendowa isValidStatusTransition
 * UWAGA: CONFIRMED jest pomijany w UI - przejscie idzie bezposrednio do WAITING_FOR_BIKE
 */
export const STATUS_TRANSITIONS: Record<CalendarOrderStatus, CalendarOrderStatus[]> = {
  'PENDING_CONFIRMATION': ['WAITING_FOR_BIKE', 'REJECTED', 'CANCELLED'],
  'CONFIRMED': ['WAITING_FOR_BIKE', 'CANCELLED'],
  'WAITING_FOR_BIKE': ['CANCELLED'],
  'IN_PROGRESS': ['WAITING_FOR_PARTS', 'AWAITING_CLIENT_DECISION', 'READY_FOR_PICKUP', 'CANCELLED'],
  'WAITING_FOR_PARTS': ['IN_PROGRESS', 'AWAITING_CLIENT_DECISION', 'READY_FOR_PICKUP', 'CANCELLED'],
  'AWAITING_CLIENT_DECISION': ['IN_PROGRESS', 'WAITING_FOR_PARTS', 'READY_FOR_PICKUP', 'CANCELLED'],
  'READY_FOR_PICKUP': ['COMPLETED', 'IN_PROGRESS'],
  'COMPLETED': [],
  'REJECTED': [],
  'CANCELLED': []
};

/**
 * Zwraca dostepne statusy do ktorych mozna przejsc z danego statusu
 * @param currentStatus - aktualny status zlecenia
 * @returns tablica konfiguracji dostepnych statusow (wlacznie z aktualnym)
 */
export function getAvailableStatusTransitions(currentStatus: CalendarOrderStatus): OrderStatusConfig[] {
  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || [];

  // Zwroc aktualny status + dozwolone przejscia
  return CALENDAR_ORDER_STATUSES.filter(
    s => s.value === currentStatus || allowedStatuses.includes(s.value)
  );
}

/**
 * Zwraca kolor statusu (wartosc zmiennej CSS lub fallback)
 */
export function getStatusColor(status: CalendarOrderStatus): string {
  const config = getStatusConfig(status);
  if (!config) return '#9e9e9e';

  // Sprobuj pobrac wartosc zmiennej CSS
  if (typeof document !== 'undefined') {
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue(config.cssVar)
      .trim();
    if (cssValue) return cssValue;
  }

  return config.fallbackColor;
}

/**
 * Zwraca klucz i18n dla statusu
 */
export function getStatusI18nKey(status: CalendarOrderStatus): string {
  return getStatusConfig(status)?.i18nKey || `service_calendar.statuses.${status.toLowerCase()}`;
}

// ============================================
// ZDJECIA ZLECENIA
// ============================================

export type ImageUploader = 'SERVICE' | 'CLIENT';

export interface OrderImage {
  id: string;
  orderId: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: ImageUploader;
  uploadedAt: string;
}

// ============================================
// ZLECENIE SERWISOWE
// ============================================

/**
 * Zlecenie serwisowe - plaska struktura zgodna z backendem
 */
export interface CalendarOrder {
  id: number;

  // Dane klienta (plaska struktura z backendu)
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;

  // Dane roweru (plaska struktura z backendu)
  bicycleBrand: string;
  bicycleModel?: string;
  bicycleFrameNumber?: string;

  // Dane zlecenia
  plannedDate: string; // YYYY-MM-DD
  status: CalendarOrderStatus;
  statusDisplayName?: string;
  description?: string;
  serviceNotes?: string;

  // Serwisant
  assignedTechnicianId?: number | null;
  assignedTechnicianNickname?: string;

  // Zdjecia (opcjonalne - ladowane osobno)
  images?: OrderImage[];

  // Metadane
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO do tworzenia zlecenia - plaska struktura zgodna z backendem
 */
export interface CreateCalendarOrderDto {
  // Dane klienta (wymagane: firstName, email lub phone)
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;

  // Dane roweru - istniejący
  existingBicycleId?: number;

  // Dane roweru - nowy
  brand: string;
  model?: string;
  type?: string;
  frameNumber?: string;

  // Dane zlecenia
  plannedDate: string; // YYYY-MM-DD
  description?: string;
  assignedTechnicianId?: number;
  initialStatus?: CalendarOrderStatus;
}

export interface UpdateCalendarOrderDto {
  plannedDate?: string;
  description?: string;
  serviceNotes?: string;
  assignedTechnicianId?: number | null;
  // Dane roweru
  brand?: string;
  model?: string;
  frameNumber?: string;
  // Dane klienta
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// ============================================
// DANE WIDOKOW KALENDARZA
// ============================================

export interface CalendarDayData {
  date: string;
  orders: CalendarOrder[];
  bikesCount: number;
  maxBikesPerDay: number;
  // Dla trybu zaawansowanego - zlecenia pogrupowane po serwisantach
  technicianOrders?: Record<number, CalendarOrder[]>;
  // Zlecenia nieprzypisane do serwisanta
  unassignedOrders?: CalendarOrder[];
}

export interface CalendarWeekData {
  startDate: string;
  endDate: string;
  viewMode: CalendarMode;
  maxBikesPerDay: number;
  technicians: Technician[];
  ordersByDay: Record<string, CalendarOrder[]>;
}

// ============================================
// STAN LADOWANIA
// ============================================

export interface CalendarLoadingState {
  isLoadingConfig: boolean;
  isLoadingTechnicians: boolean;
  isLoadingOrders: boolean;
  isSaving: boolean;
  isUploadingImage: boolean;
}

export const DEFAULT_CALENDAR_LOADING_STATE: CalendarLoadingState = {
  isLoadingConfig: false,
  isLoadingTechnicians: false,
  isLoadingOrders: false,
  isSaving: false,
  isUploadingImage: false
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formatuje date do formatu YYYY-MM-DD
 */
export function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parsuje date z formatu YYYY-MM-DD
 */
export function parseCalendarDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Zwraca poczatek tygodnia (poniedzialek)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Zwraca koniec tygodnia (niedziela)
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Zwraca tablice dat dla tygodnia
 */
export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Zwraca nazwe dnia tygodnia (klucz i18n)
 */
export function getDayNameKey(dayIndex: number, short: boolean = false): string {
  const prefix = short ? 'service_calendar.days_short' : 'service_calendar.days';
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return `${prefix}.${days[dayIndex]}`;
}

/**
 * Zwraca nazwe miesiaca (klucz i18n)
 */
export function getMonthNameKey(month: number, short: boolean = false): string {
  const prefix = short ? 'service_calendar.months_short' : 'service_calendar.months';
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return `${prefix}.${months[month]}`;
}

/**
 * Sprawdza czy dwie daty sa tym samym dniem
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Sprawdza czy data to dzisiaj
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
