export type TransportOrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'ON_THE_WAY'
  | 'READY_FOR_RETURN' | 'RETURNING' | 'DELIVERED' | 'COMPLETED';

interface TransportStatusConfig {
  value: TransportOrderStatus;
  cssVar: string;
  fallbackColor: string;
}

const TRANSPORT_ORDER_STATUSES: TransportStatusConfig[] = [
  { value: 'PENDING', cssVar: '--color-navy', fallbackColor: '#1B3A5E' },
  { value: 'CONFIRMED', cssVar: '--color-info', fallbackColor: '#4299e1' },
  { value: 'PICKED_UP', cssVar: '--status-waiting-bike', fallbackColor: '#1E88E5' },
  { value: 'ON_THE_WAY', cssVar: '--status-in-progress', fallbackColor: '#A5D6A7' },
  { value: 'READY_FOR_RETURN', cssVar: '--status-awaiting-decision', fallbackColor: '#FF8A65' },
  { value: 'RETURNING', cssVar: '--status-in-progress', fallbackColor: '#A5D6A7' },
  { value: 'DELIVERED', cssVar: '--status-ready', fallbackColor: '#4CAF50' },
  { value: 'COMPLETED', cssVar: '--status-completed', fallbackColor: '#2E7D32' }
];

/** Kolor odznaki statusu transportu — analogicznie do getStatusColor() dla CalendarOrderStatus. */
export function getTransportStatusColor(status: string | undefined | null): string {
  const config = TRANSPORT_ORDER_STATUSES.find(s => s.value === status);
  if (!config) return 'var(--color-slate-400)';

  if (typeof document !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(config.cssVar).trim();
    if (value) return value;
  }

  return config.fallbackColor;
}
