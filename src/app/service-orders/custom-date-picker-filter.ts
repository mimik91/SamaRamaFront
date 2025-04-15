import { DateFilterFn } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS } from '@angular/material/core';

// Class for styling the calendar
export class CustomDatePickerFilter {
  // Filter for days (Sunday-Thursday allowed, Friday-Saturday not allowed)
  static dateFilter: DateFilterFn<Date | null> = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    // 0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday
    return day <= 4; // Allow only days from Sunday to Thursday
  }
}

// Custom date format
export const CUSTOM_DATE_FORMATS: any = {
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