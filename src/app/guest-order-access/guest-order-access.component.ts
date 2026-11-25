import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GuestOrderAccessService } from '../shared/services/guest-order-access.service';
import { RepairPlanPaymentService } from '../shared/services/repair-plan-payment.service';
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
  private router = inject(Router);
  private guestOrderAccessService = inject(GuestOrderAccessService);
  private notificationService = inject(NotificationService);
  private repairPlanPayment = inject(RepairPlanPaymentService);

  state: GuestOrderAccessPageState = 'loading';
  access: GuestOrderAccess | null = null;
  newMessageContent = '';
  isSendingMessage = false;
  isDecidingPlan = false;
  isPayingDue = false;
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

  /** Plan serwisu ekspresowego: pakiet jest opłacony przy rezerwacji, klient płaci tylko za dodatki. */
  get isExpressPlan(): boolean {
    return !!this.repairPlan?.expressPlan;
  }

  /** Dodatki (bez pakietu) po wyborze klienta — to ich dotyczy dopłata. */
  get extrasPreview(): number {
    const plan = this.repairPlan;
    if (!plan) return 0;
    if (this.isEditingItems) {
      const sum = plan.items
        .filter(item => !this.excludedItemIds.has(item.id))
        .reduce((acc, item) => acc + item.price, 0);
      return Math.round(sum * 100) / 100;
    }
    const total = (plan.customTotal ?? plan.calculatedTotal) - (plan.packagePriceSnapshot ?? 0);
    return Math.max(0, Math.round(total * 100) / 100);
  }

  /** Klient ma do wyboru „zapłać teraz / później" tylko, gdy po potwierdzeniu są dodatki do opłacenia. */
  get needsPayment(): boolean {
    return this.isExpressPlan && this.repairPlanAwaitingDecision && this.extrasPreview > 0;
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
        if (this.route.snapshot.queryParamMap.get('doplata') === 'ok') {
          // dane powyżej są świeże (backend księguje wpłatę przed powrotem z płatności); parametr zdejmujemy, by odświeżenie strony nie powtarzało komunikatu
          this.notificationService.success('Dziękujemy! Wpłata została przyjęta.');
          this.router.navigate([], { relativeTo: this.route, queryParams: { doplata: null }, queryParamsHandling: 'merge', replaceUrl: true });
        }
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

  /**
   * mode: 'plain' — zwykłe potwierdzenie; 'now' — plan ekspresowy: potwierdź i przejdź od razu do płatności dopłaty;
   * 'later' — potwierdź, dopłatę opłacisz później (z tej strony — link z maila).
   */
  confirmRepairPlan(mode: 'plain' | 'now' | 'later' = 'plain'): void {
    if (!this.token || this.isDecidingPlan) return;

    this.isDecidingPlan = true;
    const excludedItemIds = Array.from(this.excludedItemIds);
    const excludePackage = this.packageExcluded;
    this.guestOrderAccessService.confirmRepairPlan(this.token, excludedItemIds, excludePackage, mode === 'later').subscribe({
      next: (response) => {
        const plan = this.repairPlan;
        if (response?.plan && this.access) {
          // odpowiedź serwera ma aktualne flagi wykreśleń, sumy i kwotę „do zapłaty"
          this.access.repairPlan = response.plan;
        } else if (plan) {
          plan.status = 'ACCEPTED';
          if (excludedItemIds.length > 0 || excludePackage) {
            plan.items.forEach(item => { item.excluded = excludedItemIds.includes(item.id); });
            plan.packageExcluded = excludePackage;
            plan.customTotal = null;
          }
        }
        this.isDecidingPlan = false;
        const amountDue = response?.amountDue ?? 0;
        if (mode === 'now' && amountDue > 0) {
          this.notificationService.success('Plan naprawy potwierdzony. Przechodzimy do płatności…');
          this.payDue(true);
        } else if (mode === 'later' && amountDue > 0) {
          this.notificationService.success('Plan naprawy potwierdzony. Dopłatę możesz opłacić później z tej strony.');
        } else {
          this.notificationService.success('Plan naprawy potwierdzony.');
        }
      },
      error: (err) => {
        this.isDecidingPlan = false;
        this.notificationService.error(err.error?.message || 'Nie udało się potwierdzić planu naprawy.');
      }
    });
  }

  /** Przekierowanie do PayU z dopłatą do planu naprawy; kwotę wylicza backend z bazy, zlecenie wskazuje token z linku. */
  payDue(afterConfirm = false): void {
    if (!this.token || this.isPayingDue) return;

    this.isPayingDue = true;
    const returnUrl = `/moje-zlecenie?token=${encodeURIComponent(this.token)}`;
    this.repairPlanPayment.pay({ guestToken: this.token }, returnUrl).subscribe({
      // po sukcesie przeglądarka przechodzi do PayU (strona się przeładowuje)
      error: (err) => {
        this.isPayingDue = false;
        const reason = err.error?.message || 'Nie udało się uruchomić płatności.';
        this.notificationService.error(afterConfirm
          ? `Plan został potwierdzony, ale płatność się nie rozpoczęła: ${reason} Użyj przycisku „Zapłać teraz" poniżej.`
          : `${reason} Spróbuj ponownie lub skontaktuj się z nami.`);
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
