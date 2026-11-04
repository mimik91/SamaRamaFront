import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarOrder,
  countBikesForLimit,
  formatCalendarDate,
  getMonthGridStart
} from '../../../../shared/models/service-calendar.models';

interface GridDay {
  date: Date;
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  count: number;
  needsReply: boolean;
}

/** Siatka miesiąca (mobile): numer dnia, licznik rowerów kolorowany obciążeniem i kropka „do odpowiedzi" */
@Component({
  selector: 'app-calendar-month-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-month-grid.component.html',
  styleUrls: ['./calendar-month-grid.component.css']
})
export class CalendarMonthGridComponent {
  @Input() month: Date = new Date();
  @Input() selected: Date = new Date();
  @Input() maxBikesPerDay = 10;
  @Input() set ordersByDay(value: Record<string, CalendarOrder[]>) {
    this.byDay = value ?? {};
    this.build();
  }
  @Output() dayClick = new EventEmitter<Date>();

  readonly weekdays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  weeks: GridDay[][] = [];
  private byDay: Record<string, CalendarOrder[]> = {};

  ngOnChanges(): void {
    this.build();
  }

  isSelected(day: GridDay): boolean {
    return day.key === formatCalendarDate(this.selected);
  }

  /** Obciążenie: zielony < połowy limitu, pomarańczowy poniżej limitu, czerwony od limitu */
  load(day: GridDay): 'low' | 'mid' | 'full' {
    if (day.count >= this.maxBikesPerDay) return 'full';
    if (day.count * 2 > this.maxBikesPerDay) return 'mid';
    return 'low';
  }

  private build(): void {
    const start = getMonthGridStart(this.month);
    const lastOfMonth = new Date(this.month.getFullYear(), this.month.getMonth() + 1, 0);
    const todayKey = formatCalendarDate(new Date());
    const weeks: GridDay[][] = [];
    const cursor = new Date(start);
    while (cursor <= lastOfMonth || weeks.length === 0 || weeks[weeks.length - 1].length < 7) {
      if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
      const key = formatCalendarDate(cursor);
      const orders = this.byDay[key] ?? [];
      weeks[weeks.length - 1].push({
        date: new Date(cursor),
        key,
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === this.month.getMonth(),
        isToday: key === todayKey,
        count: countBikesForLimit(orders),
        needsReply: orders.some(o => o.status === 'PENDING_CONFIRMATION' || o.status === 'AWAITING_CLIENT_DATE_CONFIRMATION')
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    this.weeks = weeks;
  }
}
