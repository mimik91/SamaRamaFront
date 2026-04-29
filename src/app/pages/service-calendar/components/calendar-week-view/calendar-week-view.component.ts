import { Component, Input, Output, EventEmitter, inject, PLATFORM_ID, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n.service';
import { OrderBarComponent } from '../order-bar/order-bar.component';
import {
  CalendarWeekData,
  CalendarDayData,
  CalendarOrder,
  CalendarMode,
  Technician,
  parseCalendarDate,
  isToday,
  isSameDay,
  getDayNameKey,
  sortOrdersByStatus,
  countBikesForLimit,
  formatCalendarDate,
  getOrderClientKey
} from '../../../../shared/models/service-calendar.models';

const GROUP_THRESHOLD = 3;

interface OrderDisplayItem {
  type: 'single' | 'group';
  order?: CalendarOrder;
  clientName?: string;
  orders?: CalendarOrder[];
  key?: string;
}

@Component({
  selector: 'app-calendar-week-view',
  standalone: true,
  imports: [CommonModule, OrderBarComponent],
  templateUrl: './calendar-week-view.component.html',
  styleUrls: ['./calendar-week-view.component.css']
})
export class CalendarWeekViewComponent implements OnDestroy {
  private i18nService = inject(I18nService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  showStickyBar = false;
  expandedGroups = new Set<string>();
  private headerObserver?: IntersectionObserver;

  @Input() data!: CalendarWeekData;
  @Input() selectedDate: Date = new Date();
  @Input() calendarMode: CalendarMode = 'SIMPLE';
  @Input() technicians: Technician[] = [];
  @Input() maxBikesPerDay: number = 10;
  @Input() isMobile: boolean = false;
  @Input() mobileDays: CalendarDayData[] = [];

  @Output() orderClick = new EventEmitter<CalendarOrder>();
  @Output() dayClick = new EventEmitter<Date>();
  @Output() cancelOrder = new EventEmitter<CalendarOrder>();
  @Output() confirmOrder = new EventEmitter<CalendarOrder>();
  @Output() acceptBike = new EventEmitter<CalendarOrder>();
  @Output() startProgress = new EventEmitter<CalendarOrder>();
  @Output() markReadyForPickup = new EventEmitter<CalendarOrder>();
  @Output() markCompleted = new EventEmitter<CalendarOrder>();
  @Output() backToProgress = new EventEmitter<CalendarOrder>();
  @Output() loadPreviousDays = new EventEmitter<void>();
  @Output() loadNextDays = new EventEmitter<void>();

  private observer?: IntersectionObserver;

  @ViewChild('sentinel')
  set sentinelRef(el: ElementRef | undefined) {
    this.observer?.disconnect();
    this.observer = undefined;
    if (el && isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(
        entries => { if (entries[0].isIntersecting) this.loadNextDays.emit(); },
        { threshold: 0.1 }
      );
      this.observer.observe(el.nativeElement);
    }
  }

  @ViewChild('headerSentinel')
  set headerSentinelRef(el: ElementRef | undefined) {
    this.headerObserver?.disconnect();
    this.headerObserver = undefined;
    if (el && isPlatformBrowser(this.platformId)) {
      this.headerObserver = new IntersectionObserver(
        entries => {
          this.ngZone.run(() => { this.showStickyBar = !entries[0].isIntersecting; });
        },
        { threshold: 0 }
      );
      this.headerObserver.observe(el.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.headerObserver?.disconnect();
  }

  scrollToToday(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const todayStr = formatCalendarDate(new Date());
    const el = document.getElementById('day-' + todayStr);
    if (!el) return;
    const navHeight = 64;
    const fixedBarHeight = this.showStickyBar ? 52 : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight - fixedBarHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  get days(): CalendarDayData[] {
    if (!this.data?.ordersByDay) return [];
    const dates = Object.keys(this.data.ordersByDay).sort();
    return dates.map(date => {
      const orders = sortOrdersByStatus(this.data.ordersByDay[date] || []);
      return { date, orders, bikesCount: countBikesForLimit(orders), maxBikesPerDay: this.maxBikesPerDay };
    });
  }

  isDayToday(dayData: CalendarDayData): boolean {
    return isToday(parseCalendarDate(dayData.date));
  }

  isDaySelected(dayData: CalendarDayData): boolean {
    return isSameDay(parseCalendarDate(dayData.date), this.selectedDate);
  }

  getDayName(dayData: CalendarDayData): string {
    const date = parseCalendarDate(dayData.date);
    return this.t(getDayNameKey(date.getDay(), true));
  }

  getDayNumber(dayData: CalendarDayData): number {
    return parseCalendarDate(dayData.date).getDate();
  }

  getMobileDayDate(dayData: CalendarDayData): string {
    const date = parseCalendarDate(dayData.date);
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
  }

  getCapacityClass(dayData: CalendarDayData): string {
    if (!dayData.maxBikesPerDay) return 'low';
    const percent = (dayData.bikesCount / dayData.maxBikesPerDay) * 100;
    if (percent >= 100) return 'full';
    if (percent >= 75) return 'high';
    if (percent >= 50) return 'medium';
    return 'low';
  }

  onDayClick(dayData: CalendarDayData): void {
    this.dayClick.emit(parseCalendarDate(dayData.date));
  }

  // ============================================
  // GRUPOWANIE ZLECEŃ (3+ rowerów tego samego klienta w jednym dniu)
  // ============================================

  private displayCache = new WeakMap<CalendarOrder[], OrderDisplayItem[]>();

  getDisplayItems(dayData: CalendarDayData): OrderDisplayItem[] {
    if (this.displayCache.has(dayData.orders)) {
      return this.displayCache.get(dayData.orders)!;
    }
    const items = this.computeDisplayItems(dayData);
    this.displayCache.set(dayData.orders, items);
    return items;
  }

  private static readonly UNGROUPABLE_STATUSES = new Set<string>([
    'PENDING_CONFIRMATION', 'AWAITING_CLIENT_DATE_CONFIRMATION'
  ]);

  private computeDisplayItems(dayData: CalendarDayData): OrderDisplayItem[] {
    const orders = dayData.orders;
    const clientCounts = new Map<string, number>();
    for (const order of orders) {
      if (CalendarWeekViewComponent.UNGROUPABLE_STATUSES.has(order.status)) continue;
      const k = getOrderClientKey(order);
      clientCounts.set(k, (clientCounts.get(k) ?? 0) + 1);
    }

    const result: OrderDisplayItem[] = [];
    const addedGroups = new Set<string>();

    for (const order of orders) {
      if (CalendarWeekViewComponent.UNGROUPABLE_STATUSES.has(order.status)) {
        result.push({ type: 'single', order });
        continue;
      }
      const ck = getOrderClientKey(order);
      if ((clientCounts.get(ck) ?? 1) >= GROUP_THRESHOLD) {
        if (!addedGroups.has(ck)) {
          addedGroups.add(ck);
          result.push({
            type: 'group',
            clientName: order.clientName,
            orders: orders.filter(o => getOrderClientKey(o) === ck),
            key: `${dayData.date}-${ck}`
          });
        }
      } else {
        result.push({ type: 'single', order });
      }
    }
    return result;
  }

  isGroupExpanded(key: string): boolean {
    return this.expandedGroups.has(key);
  }

  toggleGroup(key: string): void {
    if (this.expandedGroups.has(key)) {
      this.expandedGroups.delete(key);
    } else {
      this.expandedGroups.add(key);
    }
  }

  groupBikesLabel(count: number): string {
    if (count === 1) return '1 rower';
    if (count <= 4) return `${count} rowery`;
    return `${count} rowerów`;
  }

  groupBrandsSummary(orders: CalendarOrder[]): string {
    return orders.map(o => o.bicycleBrand).filter(Boolean).join(', ');
  }

  onOrderClick(order: CalendarOrder): void { this.orderClick.emit(order); }
  onCancelOrder(order: CalendarOrder): void { this.cancelOrder.emit(order); }
  onConfirmOrder(order: CalendarOrder): void { this.confirmOrder.emit(order); }
  onAcceptBike(order: CalendarOrder): void { this.acceptBike.emit(order); }
  onStartProgress(order: CalendarOrder): void { this.startProgress.emit(order); }
  onMarkReadyForPickup(order: CalendarOrder): void { this.markReadyForPickup.emit(order); }
  onMarkCompleted(order: CalendarOrder): void { this.markCompleted.emit(order); }
  onBackToProgress(order: CalendarOrder): void { this.backToProgress.emit(order); }

}
