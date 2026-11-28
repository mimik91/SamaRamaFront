import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReservationDraft } from './reservation-form.models';

const KEY_PREFIX = 'reservationDraft:';

/**
 * Zapamiętuje wypełniony formularz rezerwacji (sessionStorage) na czas wizyty na ekranie płatności,
 * żeby można było wrócić i np. wpisać kupon. Klucz odróżnia formularze ('express', 'guest:<suffix>').
 */
@Injectable({ providedIn: 'root' })
export class ReservationDraftService {
  private platformId = inject(PLATFORM_ID);

  save(draftKey: string, draft: ReservationDraft): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      sessionStorage.setItem(KEY_PREFIX + draftKey, JSON.stringify(draft));
    } catch {
      // brak miejsca/zablokowany storage — wtedy po prostu nie da się wrócić z wypełnionymi polami
    }
  }

  /**
   * Odczyt jednorazowy i tylko po wejściu z ekranu płatności (state.restoreDraft) —
   * świeże wejście zawsze startuje z pustym formularzem.
   */
  consume(draftKey: string): ReservationDraft | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const wantsRestore = window.history.state?.restoreDraft === true;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(KEY_PREFIX + draftKey);
      sessionStorage.removeItem(KEY_PREFIX + draftKey);
    } catch {
      return null;
    }
    if (!wantsRestore || !raw) return null;
    try {
      return JSON.parse(raw) as ReservationDraft;
    } catch {
      return null;
    }
  }
}
