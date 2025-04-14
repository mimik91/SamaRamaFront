import { DateFilterFn, MatDateFormats } from '@angular/material/core';

// Klasa do stylowania kalendarza
export class CustomDatePickerFilter {
  // Filtr dla dni (niedziela-czwartek dozwolone, piątek-sobota niedozwolone)
  static dateFilter: DateFilterFn<Date> = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    // 0 = niedziela, 4 = czwartek, 5 = piątek, 6 = sobota
    return day <= 4; // Pozwól tylko na dni od niedzieli do czwartku
  }
}

// Niestandardowy format daty
export const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};