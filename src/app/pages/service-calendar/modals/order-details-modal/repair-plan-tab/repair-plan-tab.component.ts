import { Component, Input, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PricelistService } from '../../../../service-admin-panel/service-admin-pricelist/pricelist.service';
import { ServicePackagesService } from '../../../../service-admin-panel/service-admin-pricelist/service-packages.service';
import { ServiceCalendarService } from '../../../services/service-calendar.service';
import { CalendarOrder } from '../../../../../shared/models/service-calendar.models';
import { ServicePackageDto, filterPackagesByBikeType } from '../../../../../shared/models/service-packages.models';
import { PricelistItemWithPrice } from '../../../../../shared/models/service-pricelist.models';
import { RepairPlanLineItem, RepairPlanResponse, SaveRepairPlanRequest } from '../../../../../shared/models/repair-plan.models';

@Component({
  selector: 'app-repair-plan-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './repair-plan-tab.component.html',
  styleUrls: ['./repair-plan-tab.component.css']
})
export class RepairPlanTabComponent implements OnInit, OnDestroy {
  private pricelistService = inject(PricelistService);
  private packagesService = inject(ServicePackagesService);
  private calendarService = inject(ServiceCalendarService);
  private platformId = inject(PLATFORM_ID);

  @Input() order!: CalendarOrder;
  @Input() serviceId!: number;

  isLoading = true;
  loadError = false;

  packagesForBikeType: ServicePackageDto[] = [];
  allPricelistItems: PricelistItemWithPrice[] = [];

  selectedPackage: ServicePackageDto | null = null;
  lineItems: RepairPlanLineItem[] = [];
  customTotalEnabled = false;
  customTotalValue: number | null = null;
  notes = '';

  newItemName = '';
  newItemPrice: number | null = null;
  private selectedAutocompleteItem: PricelistItemWithPrice | null = null;
  autocompleteResults: PricelistItemWithPrice[] = [];
  showAutocomplete = false;
  focusedAutocompleteIndex = -1;

  savedAt: Date | null = null;

  get packageCost(): number { return this.selectedPackage?.price ?? 0; }
  get itemsCost(): number { return this.lineItems.reduce((s, i) => s + i.price, 0); }
  get calculatedTotal(): number { return this.packageCost + this.itemsCost; }
  get finalTotal(): number { return this.customTotalEnabled ? (this.customTotalValue ?? 0) : this.calculatedTotal; }
  get bikeTypeLabel(): string { return this.order.bicycleType || 'Nieokreślony'; }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.loadError = false;

    forkJoin({
      config: this.packagesService.getMyPackagesConfig(this.serviceId),
      availableItems: this.pricelistService.getAllAvailableItems(),
      servicePricelist: this.pricelistService.getMyPricelist(this.serviceId),
      existingPlan: this.calendarService.getRepairPlan(this.serviceId, this.order.id)
    }).subscribe({
      next: ({ config, availableItems, servicePricelist, existingPlan }) => {
        const activePackages = config.packages.filter(p => p.active);
        const bikeType = this.order.bicycleType ?? null;
        this.packagesForBikeType = bikeType
          ? filterPackagesByBikeType(activePackages, bikeType)
          : activePackages;

        const categoriesWithPrices = this.pricelistService.mergeItemsWithPrices(
          availableItems,
          servicePricelist
        );
        this.allPricelistItems = categoriesWithPrices.flatMap(c => c.items);

        if (existingPlan) {
          this.applyPlanFromResponse(existingPlan);
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
      }
    });
  }

  private applyPlanFromResponse(plan: RepairPlanResponse): void {
    if (plan.packageId !== null) {
      this.selectedPackage = this.packagesForBikeType.find(p => p.id === plan.packageId) ?? null;
    }
    this.lineItems = plan.items.map(item => ({
      pricelistItemId: null,
      name: item.name,
      price: item.price
    }));
    if (plan.customTotal !== null) {
      this.customTotalEnabled = true;
      this.customTotalValue = plan.customTotal;
    }
    this.notes = plan.notes ?? '';
    this.savedAt = new Date(plan.updatedAt);
  }

  selectPackage(pkg: ServicePackageDto): void {
    this.selectedPackage = this.selectedPackage?.id === pkg.id ? null : pkg;
    this.resetCustomTotal();
  }

  onNewItemNameInput(): void {
    this.selectedAutocompleteItem = null;
    this.focusedAutocompleteIndex = -1;
    const q = this.newItemName.toLowerCase().trim();
    if (!q) {
      this.autocompleteResults = [];
      this.showAutocomplete = false;
      return;
    }
    this.autocompleteResults = this.allPricelistItems
      .filter(item => item.name.toLowerCase().includes(q))
      .slice(0, 8);
    this.showAutocomplete = this.autocompleteResults.length > 0;
  }

  selectAutocompleteItem(item: PricelistItemWithPrice): void {
    this.lineItems.push({
      pricelistItemId: item.id,
      name: item.name,
      price: item.price ?? 0
    });
    this.newItemName = '';
    this.selectedAutocompleteItem = null;
    this.autocompleteResults = [];
    this.showAutocomplete = false;
    this.focusedAutocompleteIndex = -1;
  }

  onAutocompleteBlur(): void {
    setTimeout(() => {
      this.showAutocomplete = false;
      this.focusedAutocompleteIndex = -1;
    }, 150);
  }

  onNewItemNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.showAutocomplete) return;
      this.focusedAutocompleteIndex = Math.min(
        this.focusedAutocompleteIndex + 1,
        this.autocompleteResults.length - 1
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.showAutocomplete) return;
      this.focusedAutocompleteIndex = Math.max(this.focusedAutocompleteIndex - 1, -1);
      return;
    }
    if (event.key === 'Escape') {
      this.showAutocomplete = false;
      this.focusedAutocompleteIndex = -1;
      return;
    }
    if (event.key === 'Enter') {
      if (this.showAutocomplete && this.focusedAutocompleteIndex >= 0) {
        event.preventDefault();
        this.selectAutocompleteItem(this.autocompleteResults[this.focusedAutocompleteIndex]);
        return;
      }
      const name = this.newItemName.trim();
      if (!name) return;
      this.lineItems.push({
        pricelistItemId: null,
        name,
        price: 0
      });
      this.newItemName = '';
      this.selectedAutocompleteItem = null;
      this.autocompleteResults = [];
      this.showAutocomplete = false;
      this.focusedAutocompleteIndex = -1;
    }
  }

  addLineItem(): void {
    const name = this.newItemName.trim();
    if (!name) return;
    this.lineItems.push({
      pricelistItemId: this.selectedAutocompleteItem?.id ?? null,
      name,
      price: 0
    });
    this.newItemName = '';
    this.selectedAutocompleteItem = null;
    this.autocompleteResults = [];
  }

  removeLineItem(index: number): void {
    this.lineItems.splice(index, 1);
  }

  updateLineItemPrice(index: number, value: number): void {
    this.lineItems[index].price = value ?? 0;
    this.resetCustomTotal();
  }

  private resetCustomTotal(): void {
    this.customTotalEnabled = false;
    this.customTotalValue = null;
  }

  onCustomTotalToggle(): void {
    if (this.customTotalEnabled) {
      this.customTotalValue = this.calculatedTotal;
    } else {
      this.customTotalValue = null;
    }
  }

  ngOnDestroy(): void {
    if (!this.isLoading && !this.loadError) {
      this.calendarService.saveRepairPlan(this.serviceId, this.order.id, this.buildRequest())
        .subscribe();
    }
  }

  private buildRequest(): SaveRepairPlanRequest {
    return {
      packageId: this.selectedPackage?.id ?? null,
      packagePriceSnapshot: this.selectedPackage?.price ?? null,
      items: this.lineItems.map(item => ({ name: item.name, price: item.price })),
      customTotal: this.customTotalEnabled ? (this.customTotalValue ?? null) : null,
      notes: this.notes || null
    };
  }

  printPlan(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const win = window.open('', '_blank', 'width=820,height=700');
    if (!win) return;
    win.document.write(this.buildPrintHtml());
    win.document.close();
    win.focus();
    win.print();
  }

  private esc(text: string | null | undefined): string {
    return (text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private buildPrintHtml(): string {
    const packageRows = this.selectedPackage
      ? this.buildPackageRows(this.selectedPackage)
      : '';

    const itemRows = this.lineItems.map(item => `
      <tr>
        <td class="cb-cell"><span class="cb"></span></td>
        <td>${this.esc(item.name)}</td>
        <td class="price">${item.price.toFixed(2)} zł</td>
      </tr>`).join('');

    const totalCell = this.customTotalEnabled
      ? `<del>${this.calculatedTotal.toFixed(2)} zł</del>&ensp;<strong>${(this.customTotalValue ?? 0).toFixed(2)} zł</strong>`
      : `<strong>${this.calculatedTotal.toFixed(2)} zł</strong>`;

    const notesHtml = this.notes
      ? `<div class="notes">
           <h2>Uwagi</h2>
           <p>${this.esc(this.notes).replace(/\n/g, '<br>')}</p>
         </div>`
      : '';

    const bikeInfo = [
      this.esc(this.order.bicycleBrand),
      this.esc(this.order.bicycleModel),
      this.order.bicycleType ? `(${this.esc(this.order.bicycleType)})` : ''
    ].filter(Boolean).join(' ');

    const printedAt = new Date().toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Plan naprawy – Zlecenie #${this.order.id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 32px 40px; }

    .meta { color: #444; font-size: 12px; line-height: 1.6; margin-bottom: 20px; }
    .meta span { margin-right: 24px; }

    h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
         color: #666; margin: 20px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }

    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #ececec; }
    tr:last-child { border-bottom: none; }
    td { padding: 6px 8px; vertical-align: middle; line-height: 1.3; }
    .cb-cell { width: 34px; }
    .cb { display: inline-block; width: 15px; height: 15px; border: 1.5px solid #333; border-radius: 2px; }
    .price { width: 100px; text-align: right; font-weight: 600; white-space: nowrap; }
    .price-empty { width: 100px; }

    .pkg-header td { background: #f5f5f5; font-weight: 700; padding: 7px 8px; }
    .pkg-item td { padding: 5px 8px 5px 28px; color: #333; font-size: 11px; }
    .pkg-item .cb-cell { padding-left: 18px; }

    .badge { display: inline-block; font-size: 9px; background: #e8f5e9; color: #2e7d32;
             border-radius: 3px; padding: 1px 5px; margin-left: 6px; font-weight: 700;
             vertical-align: middle; }

    .total-row td { padding-top: 12px; font-size: 14px; border-top: 2px solid #333; }
    del { color: #aaa; font-weight: 400; }

    .notes { margin-top: 20px; }
    .notes p { margin-top: 6px; line-height: 1.5; padding: 8px 12px;
               border: 1px dashed #ccc; border-radius: 3px; color: #333; }

    .footer { margin-top: 36px; padding-top: 8px; border-top: 1px solid #ddd;
              font-size: 10px; color: #999; display: flex; justify-content: space-between; }

    @media print {
      body { padding: 16px 24px; }
      @page { margin: 1.2cm; }
    }
  </style>
</head>
<body>
  <div class="meta">
    <span><strong>Klient:</strong> ${this.esc(this.order.clientName)}</span>
    <span><strong>Rower:</strong> ${bikeInfo}</span>
  </div>

  <h2>Do wykonania</h2>
  <table>
    ${packageRows}
    ${itemRows}
    ${(this.selectedPackage || this.lineItems.length > 0) ? `
    <tr class="total-row">
      <td></td>
      <td>Łączny koszt</td>
      <td class="price">${totalCell}</td>
    </tr>` : '<tr><td colspan="3" style="color:#999;padding:10px 8px">Brak pozycji</td></tr>'}
  </table>

  ${notesHtml}

  <div class="footer">
    <span>CycloPick &mdash; plan naprawy #${this.order.id}</span>
    <span>Wydrukowano: ${printedAt}</span>
  </div>

  <script>window.onafterprint = function() { window.close(); };<\/script>
</body>
</html>`;
  }

  private buildPackageRows(pkg: ServicePackageDto): string {
    const descItems = (pkg.description ?? '')
      .split('\n')
      .map(line => line.replace(/^[-–•]\s*/, '').trim())
      .filter(line => line.length > 0);

    const headerRow = `
      <tr class="pkg-header">
        <td class="cb-cell"><span class="cb"></span></td>
        <td>${this.esc(pkg.displayName)}<span class="badge">pakiet</span></td>
        <td class="price">${pkg.price.toFixed(2)} zł</td>
      </tr>`;

    const subRows = descItems.map(line => `
      <tr class="pkg-item">
        <td class="cb-cell"><span class="cb"></span></td>
        <td>${this.esc(line)}</td>
        <td class="price-empty"></td>
      </tr>`).join('');

    return headerRow + subRows;
  }

  sendToClient(): void {
    // TODO: POST /service-calendar/orders/:id/repair-plan/send
  }
}
