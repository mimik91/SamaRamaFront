import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../core/i18n.service';
import { ServiceAdminPricelistComponent } from './service-admin-pricelist.component';
import { ServiceAdminPackagesComponent } from './service-admin-packages.component';

type TabType = 'services' | 'packages';

@Component({
  selector: 'app-service-admin-pricelist-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    ServiceAdminPricelistComponent,
    ServiceAdminPackagesComponent
  ],
  templateUrl: './service-admin-pricelist-wrapper.component.html',
  styleUrls: ['./service-admin-pricelist-wrapper.component.css']
})
export class ServiceAdminPricelistWrapperComponent {
  private i18nService = inject(I18nService);
  
  @Input() serviceId!: number;

  activeTab: TabType = 'services';

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  isActiveTab(tab: TabType): boolean {
    return this.activeTab === tab;
  }

  /**
   * Metoda tłumaczenia dla template
   */
  t(key: string): string {
    return this.i18nService.translate(key);
  }
}