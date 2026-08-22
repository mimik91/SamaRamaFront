/**
 * Czas realizacji w dniach: zawsze minimum 1 dzień, drugi dzień dopiero po przekroczeniu 36h,
 * każdy kolejny dzień co pełne 24h od tego progu.
 */
function hoursToDays(hours: number): number {
  return hours <= 36 ? 1 : 1 + Math.ceil((hours - 36) / 24);
}

/** Dokładny czas pojedynczego zlecenia (np. historia klienta/serwisu) — "3 dni". */
export function formatServiceDurationDays(hours: number | null | undefined): string {
  if (hours == null) return '';
  const days = hoursToDays(hours);
  return `${days} ${days === 1 ? 'dzień' : 'dni'}`;
}

/**
 * Zbiorczy czas oczekiwania na wykonanie serwisu w przedziałach — używany na kartach listy
 * serwisów i profilu serwisu (mediana z RegisteredServiceInfo), w odróżnieniu od
 * formatServiceDurationDays (dokładny czas jednego zlecenia).
 */
export function formatServiceDurationBucket(hours: number | null | undefined): string {
  if (hours == null) return 'N/A';
  const days = hoursToDays(hours);
  if (days <= 3) return '1-3 dni';
  if (days <= 13) return '4-13 dni';
  if (days <= 27) return '2-4 tygodnie';
  return 'miesiąc+';
}
