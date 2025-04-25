import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/** Adapter dziedziczący po NativeDateAdapter, który ustawia pierwszy dzień tygodnia na poniedziałek */
@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  /**
   * Nadpisuje metodę getFirstDayOfWeek, aby zwracała 1 (poniedziałek) zamiast 0 (niedziela)
   * @returns 1 (poniedziałek)
   */
  override getFirstDayOfWeek(): number {
    return 1; // 1 = poniedziałek, 0 = niedziela
  }
}