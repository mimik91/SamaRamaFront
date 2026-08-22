import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GuestOrderAccessService } from '../shared/services/guest-order-access.service';
import { NotificationService } from '../core/notification.service';
import { GuestOrderAccess, GuestRepairPlan } from '../shared/models/guest-order-access.model';

type GuestOrderAccessPageState = 'loading' | 'content' | 'invalid';

@Component({
  selector: 'app-guest-order-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guest-order-access.component.html',
  styleUrls: ['./guest-order-access.component.css']
})
export class GuestOrderAccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private guestOrderAccessService = inject(GuestOrderAccessService);
  private notificationService = inject(NotificationService);

  state: GuestOrderAccessPageState = 'loading';
  access: GuestOrderAccess | null = null;
  newMessageContent = '';
  isSendingMessage = false;
  isDecidingPlan = false;
  excludedItemIds = new Set<number>();
  packageExcluded = false;
  showRejectReasonModal = false;
  rejectReason = '';
  private token: string | null = null;

  get repairPlan(): GuestRepairPlan | null {
    const plan = this.access?.repairPlan;
    return plan && 'id' in plan ? plan as GuestRepairPlan : null;
  }

  get repairPlanAwaitingDecision(): boolean {
    const plan = this.repairPlan;
    return !!plan && plan.status === 'SENT_TO_CLIENT' && plan.requiresConfirmation;
  }

  get isEditingItems(): boolean {
    return this.excludedItemIds.size > 0 || this.packageExcluded;
  }

  get repairPlanHasDiscount(): boolean {
    const plan = this.repairPlan;
    return !this.isEditingItems && !!plan && plan.customTotal != null && plan.customTotal < plan.calculatedTotal;
  }

  get previewTotal(): number {
    const plan = this.repairPlan;
    if (!plan) return 0;
    if (!this.isEditingItems) {
      return plan.customTotal ?? plan.calculatedTotal;
    }
    const packagePrice = this.packageExcluded ? 0 : (plan.packagePriceSnapshot ?? 0);
    const itemsSum = plan.items
      .filter(item => !this.excludedItemIds.has(item.id))
      .reduce((sum, item) => sum + item.price, 0);
    return packagePrice + itemsSum;
  }

  parsePackageItems(description: string | null): string[] {
    return (description ?? '')
      .split('\n')
      .map(line => line.replace(/^[-–•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  isItemExcluded(itemId: number): boolean {
    return this.excludedItemIds.has(itemId);
  }

  toggleItemExclusion(itemId: number): void {
    if (!this.repairPlanAwaitingDecision) return;
    if (this.excludedItemIds.has(itemId)) {
      this.excludedItemIds.delete(itemId);
    } else {
      this.excludedItemIds.add(itemId);
    }
  }

  togglePackageExclusion(): void {
    if (!this.repairPlanAwaitingDecision) return;
    this.packageExcluded = !this.packageExcluded;
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.state = 'invalid';
      return;
    }

    this.guestOrderAccessService.getAccess(this.token).subscribe({
      next: (access) => {
        this.access = access;
        this.state = 'content';
        this.markAsRead();
      },
      error: () => {
        this.state = 'invalid';
      }
    });
  }

  private markAsRead(): void {
    if (!this.token || !this.access || this.access.unreadCount === 0) {
      return;
    }
    this.guestOrderAccessService.markAsRead(this.token).subscribe();
  }

  sendMessage(): void {
    if (!this.token || !this.newMessageContent.trim() || this.isSendingMessage || !this.access) {
      return;
    }

    this.isSendingMessage = true;
    this.guestOrderAccessService.sendMessage(this.token, this.newMessageContent.trim()).subscribe({
      next: (message) => {
        this.access!.messages.push(message);
        this.newMessageContent = '';
        this.isSendingMessage = false;
      },
      error: () => {
        this.isSendingMessage = false;
        this.notificationService.error('Nie udało się wysłać wiadomości. Spróbuj ponownie.');
      }
    });
  }

  confirmRepairPlan(): void {
    if (!this.token || this.isDecidingPlan) return;

    this.isDecidingPlan = true;
    const excludedItemIds = Array.from(this.excludedItemIds);
    const excludePackage = this.packageExcluded;
    this.guestOrderAccessService.confirmRepairPlan(this.token, excludedItemIds, excludePackage).subscribe({
      next: () => {
        const plan = this.repairPlan;
        if (plan) {
          plan.status = 'ACCEPTED';
          if (excludedItemIds.length > 0 || excludePackage) {
            plan.items.forEach(item => { item.excluded = excludedItemIds.includes(item.id); });
            plan.packageExcluded = excludePackage;
            plan.customTotal = null;
          }
        }
        this.isDecidingPlan = false;
        this.notificationService.success('Plan naprawy potwierdzony.');
      },
      error: (err) => {
        this.isDecidingPlan = false;
        this.notificationService.error(err.error?.message || 'Nie udało się potwierdzić planu naprawy.');
      }
    });
  }

  openRejectReasonModal(): void {
    if (!this.repairPlanAwaitingDecision) return;
    this.rejectReason = '';
    this.showRejectReasonModal = true;
  }

  cancelRejectReasonModal(): void {
    this.showRejectReasonModal = false;
    this.rejectReason = '';
  }

  confirmRejectWithReason(): void {
    const reason = this.rejectReason.trim();
    this.showRejectReasonModal = false;

    if (!reason || !this.token) {
      this.rejectRepairPlan();
      return;
    }

    this.guestOrderAccessService.sendMessage(this.token, `Powód odrzucenia planu naprawy: ${reason}`).subscribe({
      next: (message) => {
        this.access!.messages.push(message);
        this.rejectRepairPlan();
      },
      error: () => {
        this.notificationService.error('Nie udało się wysłać powodu odrzucenia, ale plan zostanie odrzucony.');
        this.rejectRepairPlan();
      }
    });
  }

  private rejectRepairPlan(): void {
    if (!this.token || this.isDecidingPlan) return;

    this.isDecidingPlan = true;
    this.guestOrderAccessService.rejectRepairPlan(this.token).subscribe({
      next: () => {
        if (this.repairPlan) this.repairPlan.status = 'REJECTED';
        this.isDecidingPlan = false;
        this.notificationService.success('Plan naprawy odrzucony.');
      },
      error: (err) => {
        this.isDecidingPlan = false;
        this.notificationService.error(err.error?.message || 'Nie udało się odrzucić planu naprawy.');
      }
    });
  }
}
