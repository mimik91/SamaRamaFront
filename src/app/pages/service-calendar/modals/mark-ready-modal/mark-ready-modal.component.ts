import { Component, Input, Output, EventEmitter, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceCalendarService } from '../../services/service-calendar.service';
import { NotificationService } from '../../../../core/notification.service';
import { CalendarOrder, getStatusColor } from '../../../../shared/models/service-calendar.models';

interface KeyEntry {
  key: string;
  include: boolean;
  value: string;
}

type ModalStep = 'siblings' | 'loading' | 'keys' | 'error';

@Component({
  selector: 'app-mark-ready-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mark-ready-modal.component.html',
  styleUrls: ['./mark-ready-modal.component.css']
})
export class MarkReadyModalComponent implements OnInit {
  @Input() serviceId!: number;
  @Input() order!: CalendarOrder;
  @Input() siblingOrders: CalendarOrder[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<number[]>();

  private calendarService = inject(ServiceCalendarService);
  private notificationService = inject(NotificationService);

  step: ModalStep = 'loading';
  selectedIds = new Set<number>();
  keyEntries: KeyEntry[] = [];
  sending = false;
  hadSiblings = false;

  ngOnInit(): void {
    this.selectedIds.add(this.order.id);
    this.hadSiblings = this.siblingOrders.length > 0;

    if (this.hadSiblings) {
      this.step = 'siblings';
    } else {
      this.fetchKeys();
    }
  }

  toggleSibling(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  onConfirmSiblings(): void {
    this.step = 'loading';
    this.fetchKeys();
  }

  goBackToSiblings(): void {
    this.step = 'siblings';
  }

  private fetchKeys(): void {
    this.calendarService.getNotificationKeys(this.serviceId, Array.from(this.selectedIds)).subscribe({
      next: ({ keys }) => {
        if (keys.length === 0) {
          this.doSend({});
        } else {
          this.keyEntries = keys.map(key => ({ key, include: true, value: '' }));
          this.step = 'keys';
        }
      },
      error: () => {
        this.step = 'error';
      }
    });
  }

  onSend(): void {
    if (this.sending) return;
    const contentValues: Record<string, string | null> = {};
    for (const entry of this.keyEntries) {
      contentValues[entry.key] = entry.include ? entry.value : null;
    }
    this.doSend(contentValues);
  }

  doSend(contentValues: Record<string, string | null>): void {
    this.sending = true;
    const orderIds = Array.from(this.selectedIds);
    this.calendarService.sendReadyNotification(this.serviceId, orderIds, contentValues).subscribe({
      next: () => {
        this.sending = false;
        this.notificationService.success('Rower gotowy do odbioru. Powiadomienie wysłane.');
        this.completed.emit(orderIds);
      },
      error: () => {
        this.sending = false;
        this.notificationService.error('Nie udało się wysłać powiadomienia. Spróbuj ponownie.');
      }
    });
  }

  statusColor(order: CalendarOrder): string {
    return getStatusColor(order.status);
  }

  bikeSummary(order: CalendarOrder): string {
    return [order.bicycleBrand, order.bicycleModel].filter(Boolean).join(' ');
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.sending) this.close.emit();
  }
}
