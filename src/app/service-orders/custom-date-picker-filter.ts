import { DateFilterFn } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS } from '@angular/material/core';

// Class for styling the calendar
export class CustomDatePickerFilter {
  // Fixed polish holidays (month and day are 0-indexed, so January = 0)
  private static readonly FIXED_HOLIDAYS = [
    { month: 0, day: 1 },    // Nowy Rok (1 stycznia)
    { month: 0, day: 6 },    // Trzech Króli (6 stycznia)
    { month: 4, day: 1 },    // Święto Pracy (1 maja)
    { month: 4, day: 3 },    // Święto Konstytucji (3 maja)
    { month: 7, day: 15 },   // Wniebowzięcie NMP (15 sierpnia)
    { month: 10, day: 1 },   // Wszystkich Świętych (1 listopada)
    { month: 10, day: 11 },  // Święto Niepodległości (11 listopada)
    { month: 11, day: 25 },  // Boże Narodzenie (25 grudnia)
    { month: 11, day: 26 },  // Drugi dzień Bożego Narodzenia (26 grudnia)
  ];

  // Check if the next day is a fixed holiday
  private static isBeforeFixedHoliday(date: Date): boolean {
    // Create a new date object for the next day
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return this.FIXED_HOLIDAYS.some(
      holiday => nextDay.getMonth() === holiday.month && nextDay.getDate() === holiday.day
    );
  }

  // Filter for days (Sunday-Thursday allowed, Friday-Saturday not allowed)
  // Also filters out days before public holidays
  static dateFilter: DateFilterFn<Date | null> = (date: Date | null): boolean => {
    if (!date) return false;
    
    const day = date.getDay();
    
    // First check: day of week (0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday)
    if (day > 4) {
      // Add a class for styling when we click on a Friday or Saturday
      const dateElement = document.querySelector(`.mat-calendar-body-cell[aria-label="${date.getDate()}"]`);
      if (dateElement) {
        dateElement.classList.add('friday-saturday');
      }
      return false; // Don't allow Friday and Saturday
    }
    
    // Second check: is it a day before a fixed holiday
    if (CustomDatePickerFilter.isBeforeFixedHoliday(date)) {
      return false;
    }
    
    // Calculate Easter for the current year (used for movable holidays)
    const easterDate = CustomDatePickerFilter.getEasterDate(date.getFullYear());
    
    // Check if it's the day before Easter Sunday
    const dayBeforeEaster = new Date(easterDate);
    dayBeforeEaster.setDate(dayBeforeEaster.getDate() - 1);
    if (date.getDate() === dayBeforeEaster.getDate() && 
        date.getMonth() === dayBeforeEaster.getMonth() &&
        date.getFullYear() === dayBeforeEaster.getFullYear()) {
      return false;
    }
    
    // Check if it's the day before Easter Monday
    if (date.getDate() === easterDate.getDate() && 
        date.getMonth() === easterDate.getMonth() &&
        date.getFullYear() === easterDate.getFullYear()) {
      return false;
    }
    
    // Day before Corpus Christi (60 days after Easter)
    const dayBeforeCorpusChristi = new Date(easterDate);
    dayBeforeCorpusChristi.setDate(dayBeforeCorpusChristi.getDate() + 59); // 60-1
    if (date.getDate() === dayBeforeCorpusChristi.getDate() && 
        date.getMonth() === dayBeforeCorpusChristi.getMonth() &&
        date.getFullYear() === dayBeforeCorpusChristi.getFullYear()) {
      return false;
    }
    
    // If passes all checks, the date is available
    return true;
  }
  
  // Helper method to calculate Easter Sunday for a given year
  // Using the Meeus/Jones/Butcher algorithm
  private static getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month, day);
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