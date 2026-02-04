import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../core/i18n.service';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { ServiceAdminBasicInfoComponent } from './service-admin-basic-info/service-admin-basic-info.component';
import { ServiceAdminCoveragesComponent } from './service-admin-coverages/service-admin-coverages.component';
import { ServiceAdminPricelistWrapperComponent } from './service-admin-pricelist/service-admin-pricelist-wrapper.component';
import { ServiceAdminOpeningHoursComponent } from './service-admin-opening-hours/service-admin-opening-hours.component';
import { ServiceAdminImagesComponent } from './service-admin-images/service-admin-images.component';
import {
  BikeServiceNameIdDto,
  BikeServiceRegisteredDto,
  } from '../../shared/models/bike-service-common.models';
import {
  AdminPanelTab,
  AdminPanelLoadingState,
  DEFAULT_LOADING_STATE,
  ADMIN_PANEL_TABS,
  getDefaultTab,
  formatErrorMessage
} from '../../shared/models/service-admin.models';

@Component({
  selector: 'app-service-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    ServiceAdminBasicInfoComponent,
    ServiceAdminCoveragesComponent,
    ServiceAdminPricelistWrapperComponent,
    ServiceAdminOpeningHoursComponent,
    ServiceAdminImagesComponent
  ],
  templateUrl: './service-admin-panel.component.html',
  styleUrls: ['./service-admin-panel.component.css']
})
export class ServiceAdminPanelComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(BikeServiceVerificationService);
  private i18nService = inject(I18nService);

  // Suffix z URL
  private currentSuffix: string = '';

  // Data
  myServices: BikeServiceNameIdDto[] = [];
  selectedServiceId: number | null = null;
  serviceDetails: BikeServiceRegisteredDto | null = null;
  
  // Loading state
  loadingState: AdminPanelLoadingState = { ...DEFAULT_LOADING_STATE };
  
  // Active tab
  activeTab: AdminPanelTab = getDefaultTab();
  
  // Tabs configuration (accessible in template)
  tabs = ADMIN_PANEL_TABS;

  // Getters for template convenience
  get isLoadingServices(): boolean {
    return this.loadingState.isLoadingServices;
  }

  get isLoadingDetails(): boolean {
    return this.loadingState.isLoadingDetails;
  }

  get servicesError(): string {
    return this.loadingState.servicesError;
  }

  get detailsError(): string {
    return this.loadingState.detailsError;
  }

  /**
   * Metoda tłumaczenia dla template
   */
  t(key: string, params?: Record<string, any>): string {
    return this.i18nService.translate(key, params);
  }

  ngOnInit(): void {
    this.currentSuffix = this.route.snapshot.paramMap.get('suffix') || '';
    this.loadMyServices();
  }

  /**
   * Nawigacja do kalendarza
   */
  goToCalendar(): void {
    if (this.currentSuffix) {
      this.router.navigate([`/${this.currentSuffix}/panel-administratora`]);
    }
  }

  /**
   * Ładuje listę serwisów użytkownika
   */
  loadMyServices(): void {
    this.loadingState.isLoadingServices = true;
    this.loadingState.servicesError = '';

    this.verificationService.getMyServices().subscribe({
      next: (services: BikeServiceNameIdDto[]) => {
        this.myServices = services;
        this.loadingState.isLoadingServices = false;
        
        if (services.length > 0) {
          this.selectedServiceId = services[0].id;
          this.loadServiceDetails();
        }
      },
      error: (err: any) => {
        this.loadingState.servicesError = formatErrorMessage(err) || this.t('service_admin.errors.load_services_failed');
        this.loadingState.isLoadingServices = false;
        console.error('Error loading services:', err);
      }
    });
  }

  /**
   * Obsługuje zmianę wybranego serwisu
   */
  onServiceChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedServiceId = Number(select.value);
    this.loadServiceDetails();
  }

  /**
   * Ładuje szczegóły wybranego serwisu
   */
  loadServiceDetails(): void {
    if (!this.selectedServiceId) return;

    this.loadingState.isLoadingDetails = true;
    this.loadingState.detailsError = '';

    this.verificationService.getMyServiceDetails(this.selectedServiceId).subscribe({
      next: (response: BikeServiceRegisteredDto) => {
        this.serviceDetails = response;
        this.loadingState.isLoadingDetails = false;
      },
      error: (err: any) => {
        this.loadingState.detailsError = formatErrorMessage(err) || this.t('service_admin.errors.load_details_failed');
        this.loadingState.isLoadingDetails = false;
        console.error('Error loading service details:', err);
      }
    });
  }

  /**
   * Ustawia aktywną zakładkę
   */
  setActiveTab(tab: AdminPanelTab): void {
    this.activeTab = tab;
  }

  /**
   * Sprawdza czy zakładka jest aktywna
   */
  isTabActive(tab: AdminPanelTab): boolean {
    return this.activeTab === tab;
  }
}