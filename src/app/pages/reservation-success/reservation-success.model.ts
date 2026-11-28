/** Dane rezerwacji pokazywane na stronie /sukces (przekazywane z formularza przez router state + sessionStorage). */
export interface ReservationSuccessData {
  serviceName: string;
  serviceAddress: string;
  logoUrl: string | null;
  suffix: string | null;
  /** Data wizyty w formacie YYYY-MM-DD (formularz nie zbiera godziny). */
  plannedDate: string | null;
  bikes: { brand: string; model: string }[];
  workDescription: string | null;
  email: string | null;
  /**
   * 'paid-express' — serwis ekspresowy po opłaceniu: rezerwacja jest potwierdzona, serwis nie jest jeszcze
   * znany (wybiera go CycloPick). Brak wartości — zwykła prośba o rezerwację czekająca na serwis.
   */
  variant?: 'paid-express';
  /** Rezerwacja z transportem (kurier odbiera rower) — zmienia treść ostatniego kroku „Co dalej?". */
  withTransport?: boolean;
  packageName?: string | null;
  /** Dzień odbioru roweru (YYYY-MM-DD) i miejsce odbioru — tylko wariant 'paid-express'. */
  pickupDate?: string | null;
  pickupPlace?: string | null;
}

export const RESERVATION_SUCCESS_STORAGE_KEY = 'reservation_success';
export const RESERVATION_SUCCESS_GA_KEY = 'reservation_success_ga_fired';

/**
 * Zapisuje dane rezerwacji, żeby odświeżenie /sukces (F5) nadal pokazało pełną kartę.
 * Zerujemy flagę GA4, bo to nowa rezerwacja (kolejna konwersja w tej samej karcie przeglądarki).
 */
export function storeReservationSuccess(data: ReservationSuccessData): void {
  try {
    sessionStorage.setItem(RESERVATION_SUCCESS_STORAGE_KEY, JSON.stringify(data));
    sessionStorage.removeItem(RESERVATION_SUCCESS_GA_KEY);
  } catch {
    // sessionStorage niedostępny (tryb prywatny / zablokowane dane) - strona działa bez tego
  }
}

export function loadReservationSuccess(): ReservationSuccessData | null {
  try {
    const raw = sessionStorage.getItem(RESERVATION_SUCCESS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReservationSuccessData) : null;
  } catch {
    return null;
  }
}
