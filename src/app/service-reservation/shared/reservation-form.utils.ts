import { DeliveryType } from './reservation-form.models';

export const DAY_KEYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'poniedziałek', TUESDAY: 'wtorek', WEDNESDAY: 'środa',
  THURSDAY: 'czwartek', FRIDAY: 'piątek', SATURDAY: 'sobota', SUNDAY: 'niedziela'
};

export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Przyjmuje Date albo 'YYYY-MM-DD'; zwraca null dla pustych/niepoprawnych wartości. */
export function toDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

/** Wartość daty z formularza (Date | 'YYYY-MM-DD' | null) jako 'YYYY-MM-DD'. */
export function plannedDateToStr(val: string | Date | null | undefined): string {
  const d = toDate(val);
  return d ? dateToStr(d) : '';
}

export function formatDatePL(val: string | Date | null | undefined): string {
  const d = toDate(val);
  if (!d) return '';
  return d.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/** "czwartek, 29.10.2026" (withYear) lub "środa, 28.10" */
export function formatWeekdayDate(val: string | Date | null | undefined, withYear: boolean): string {
  const d = toDate(val);
  if (!d) return '';
  const weekday = d.toLocaleDateString('pl-PL', { weekday: 'long' });
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${weekday}, ${dd}.${mm}${withYear ? '.' + d.getFullYear() : ''}`;
}

/** "śr. 28.10" */
export function formatWeekdayShort(val: string | Date | null | undefined): string {
  const d = toDate(val);
  if (!d) return '';
  const weekday = d.toLocaleDateString('pl-PL', { weekday: 'short' });
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${weekday} ${dd}.${mm}`;
}

/** Polska odmiana „rower/rowery/rowerów". */
export function bikesNoun(count: number): string {
  return count === 1 ? 'rower' : count < 5 ? 'rowery' : 'rowerów';
}

export function isTransport(type: DeliveryType): boolean {
  return type !== 'SELF';
}

/**
 * Najwcześniejszy dzień serwisu przy danym sposobie dostawy. Backend wymaga, by dzień odbioru był
 * PO dzisiejszym: spod biurowca odbiór jest w dniu serwisu (termin może być jutro), spod domu dzień
 * wcześniej (najwcześniej pojutrze); bez transportu — pojutrze.
 */
export function earliestServiceDate(delivery: DeliveryType): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (delivery === 'OFFICE' ? 1 : 2));
  return d;
}

/** Godziny, w których kurier odbiera i zwraca rower — jedno miejsce dla opisów kart, podpowiedzi i panelu bocznego. */
export const PICKUP_WINDOWS = {
  DOOR_TO_DOOR: '18:00–22:00',
  OFFICE: '10:00–16:00'
} as const;
