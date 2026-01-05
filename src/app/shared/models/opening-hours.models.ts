// ============================================
// OPENING HOURS MODELS
// ============================================

/**
 * Godziny otwarcia dla pojedynczego dnia
 */
export interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

/**
 * Interwał czasu dla dnia (alternatywny format)
 */
export interface DayInterval {
  openTime: string;
  closeTime: string;
}

/**
 * DTO godzin otwarcia serwisu
 */
export interface OpeningHoursDto {
  id?: number;
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

/**
 * Pełny DTO godzin otwarcia z dodatkowymi polami
 */
export interface OpeningHoursWithInfoDto extends OpeningHoursDto {
  info?: string;
  note?: string;
  active?: boolean;
  intervals?: { [key: string]: DayInterval };
  openingHoursInfo?: string;
  openingHoursNote?: string;
  openingHoursActive?: boolean;
}

/**
 * DTO do tworzenia/aktualizacji godzin otwarcia
 */
export interface OpeningHoursUpdateDto {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  info?: string;
  note?: string;
  active?: boolean;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Nazwy dni tygodnia
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Wszystkie dni tygodnia jako tablica
 */
export const ALL_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

/**
 * Polskie nazwy dni tygodnia
 */
export const DAY_NAMES_PL: Record<DayOfWeek, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela'
};

/**
 * Skrócone nazwy dni tygodnia (PL)
 */
export const DAY_NAMES_SHORT_PL: Record<DayOfWeek, string> = {
  monday: 'Pon',
  tuesday: 'Wt',
  wednesday: 'Śr',
  thursday: 'Czw',
  friday: 'Pt',
  saturday: 'Sob',
  sunday: 'Niedz'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sprawdza czy dzień jest zamknięty
 */
export function isDayClosed(dayHours?: DayHours): boolean {
  return dayHours?.closed === true || (!dayHours?.open && !dayHours?.close);
}

/**
 * Sprawdza czy dzień ma ustawione godziny
 */
export function hasDayHours(dayHours?: DayHours): boolean {
  return !!(dayHours?.open && dayHours?.close);
}

/**
 * Formatuje godziny dnia do wyświetlenia
 */
export function formatDayHours(dayHours?: DayHours): string {
  if (!dayHours || isDayClosed(dayHours)) {
    return 'Zamknięte';
  }
  
  if (hasDayHours(dayHours)) {
    return `${dayHours.open} - ${dayHours.close}`;
  }
  
  return 'Brak danych';
}

/**
 * Sprawdza czy serwis jest otwarty o danej godzinie w danym dniu
 */
export function isOpenAt(dayHours: DayHours | undefined, time: string): boolean {
  if (!dayHours || isDayClosed(dayHours) || !hasDayHours(dayHours)) {
    return false;
  }
  
  const timeMinutes = timeToMinutes(time);
  const openMinutes = timeToMinutes(dayHours.open!);
  const closeMinutes = timeToMinutes(dayHours.close!);
  
  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
}

/**
 * Konwertuje czas w formacie HH:MM na minuty
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Waliduje format czasu (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timePattern.test(time);
}

/**
 * Waliduje czy godziny otwarcia są poprawne (open < close)
 */
export function validateDayHours(dayHours: DayHours): boolean {
  if (isDayClosed(dayHours)) {
    return true;
  }
  
  if (!dayHours.open || !dayHours.close) {
    return false;
  }
  
  if (!isValidTimeFormat(dayHours.open) || !isValidTimeFormat(dayHours.close)) {
    return false;
  }
  
  return timeToMinutes(dayHours.open) < timeToMinutes(dayHours.close);
}

/**
 * Sprawdza czy jakikolwiek dzień ma ustawione godziny
 */
export function hasAnyOpeningHours(hours: OpeningHoursDto): boolean {
  return ALL_DAYS.some(day => hasDayHours(hours[day]));
}

/**
 * Zwraca dzień tygodnia dla dzisiejszej daty
 */
export function getCurrentDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date().getDay();
  return days[today];
}

/**
 * Sprawdza czy serwis jest obecnie otwarty
 */
export function isCurrentlyOpen(hours: OpeningHoursDto): boolean {
  const currentDay = getCurrentDayOfWeek();
  const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM
  
  return isOpenAt(hours[currentDay], currentTime);
}