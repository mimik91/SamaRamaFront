import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationFormStore } from '../../reservation-form.store';
import { DeliveryType } from '../../reservation-form.models';
import { PICKUP_WINDOWS, formatWeekdayDate } from '../../reservation-form.utils';

export interface DeliveryOption {
  type: DeliveryType;
  title: string;
  description: string;
  /** Plakietka na krawędzi karty (np. „Polecane", „Biurowce"). */
  badge?: string;
  /** Kolor plakietki: pomarańczowy („Polecane", domyślny) albo niebieski (np. „Biurowce"). */
  badgeTone?: 'recommended' | 'info';
  /** Cena/informacja przy tytule (np. „29 zł", „wliczony"). */
  priceBadge?: string;
}

/**
 * Gotowe opcje dostawy (teksty, godziny, plakietki) — wspólne dla zwykłej rezerwacji i ekspresu.
 * `priceBadge` to cena/informacja przy opcjach z transportem (np. „29 zł", „w cenie").
 */
export function deliveryOptions(types: DeliveryType[], priceBadge: string): DeliveryOption[] {
  const all: DeliveryOption[] = [
    {
      type: 'SELF',
      title: 'Przywiozę rower sam',
      description: 'Dostarczam rower osobiście do serwisu'
    },
    {
      type: 'DOOR_TO_DOOR',
      title: 'Transport door-to-door',
      description: `Odbierzemy rower spod domu, ${PICKUP_WINDOWS.DOOR_TO_DOOR}`,
      badge: '★ Polecane',
      priceBadge
    },
    {
      type: 'OFFICE',
      title: 'Transport spod biurowca',
      description: `Odbierzemy rower spod pracy, ${PICKUP_WINDOWS.OFFICE}`,
      badge: 'Biurowce',
      badgeTone: 'info',
      priceBadge
    }
  ];
  return all.filter(o => types.includes(o.type));
}

/** Kafelki wyboru sposobu dostarczenia roweru (samodzielnie / spod domu / spod biurowca). */
@Component({
  selector: 'app-delivery-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivery-selector.component.html',
  styleUrls: ['../../reservation-form.shared.css', './delivery-selector.component.css']
})
export class DeliverySelectorComponent {
  @Input({ required: true }) store!: ReservationFormStore;
  @Input({ required: true }) options: DeliveryOption[] = [];
  /** Informacja o obszarze obsługi (inny tekst w ekspresie i w zwykłej rezerwacji). */
  @Input() areaNote: string | null = null;

  /** "niedziela, 29.11" — dzień odbioru wynikający z wybranego terminu. */
  get pickupDay(): string {
    return formatWeekdayDate(this.store.transportDate, false);
  }

  icon(type: DeliveryType): string {
    return type === 'SELF' ? '🚲' : type === 'OFFICE' ? '🏢' : '🏠';
  }

  select(type: DeliveryType): void {
    this.store.setDeliveryType(type);
  }
}
