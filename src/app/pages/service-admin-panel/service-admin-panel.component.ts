import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BikeServiceVerificationService } from '../../auth/bike-service-verification.service';
import { ServiceAdminBasicInfoComponent } from './service-admin-basic-info/service-admin-basic-info.component';
import { ServiceAdminCoveragesComponent } from './service-admin-coverages/service-admin-coverages.component';
import { ServiceAdminPricelistComponent } from './service-admin-pricelist/service-admin-pricelist.component';
import { ServiceAdminOpeningHoursComponent } from './service-admin-opening-hours/service-admin-opening-hours.component';


interface BikeServiceNameIdDto {
  id: number;
  name: string;
}

interface BikeServiceRegisteredDto {
  id: number;
  name: string;
  email?: string;
  street?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  suffix?: string;
  contactPerson?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  description?: string;
  isRegistered: boolean;
  openingHours?: any;
  openingHoursInfo?: string;
  openingHoursNote?: string;
  pricelistInfo?: string;
  pricelistNote?: string;
}

@Component({
  selector: 'app-service-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    ServiceAdminBasicInfoComponent,
    ServiceAdminCoveragesComponent,
    ServiceAdminPricelistComponent,
    ServiceAdminOpeningHoursComponent
  ],
  templateUrl: './service-admin-panel.component.html',
  styleUrls: ['./service-admin-panel.component.css']
})
export class ServiceAdminPanelComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private verificationService = inject(BikeServiceVerificationService);

  myServices: BikeServiceNameIdDto[] = [];
  selectedServiceId: number | null = null;
  serviceDetails: BikeServiceRegisteredDto | null = null;
  
  isLoadingServices: boolean = true;
  isLoadingDetails: boolean = false;
  servicesError: string = '';
  detailsError: string = '';
  
  // Active tab
  activeTab: 'basic' | 'services' | 'pricelist' | 'hours' = 'basic';

  ngOnInit(): void {
    this.loadMyServices();
  }

  loadMyServices(): void {
    this.isLoadingServices = true;
    this.servicesError = '';

    this.verificationService.getMyServices().subscribe({
      next: (services: BikeServiceNameIdDto[]) => {
        this.myServices = services;
        this.isLoadingServices = false;
        
        if (services.length > 0) {
          this.selectedServiceId = services[0].id;
          this.loadServiceDetails();
        }
      },
      error: (err: any) => {
        this.servicesError = 'Nie udało się załadować listy serwisów. Spróbuj ponownie.';
        this.isLoadingServices = false;
        console.error('Error loading services:', err);
      }
    });
  }

  onServiceChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedServiceId = Number(select.value);
    this.loadServiceDetails();
  }

  loadServiceDetails(): void {
    if (!this.selectedServiceId) return;

    this.isLoadingDetails = true;
    this.detailsError = '';

    this.verificationService.getMyServiceDetails(this.selectedServiceId).subscribe({
      next: (response: BikeServiceRegisteredDto) => {
        this.serviceDetails = response;
        this.isLoadingDetails = false;
      },
      error: (err: any) => {
        this.detailsError = 'Nie udało się załadować danych serwisu. Spróbuj ponownie.';
        this.isLoadingDetails = false;
        console.error('Error loading service details:', err);
      }
    });
  }

  setActiveTab(tab: 'basic' | 'services' | 'pricelist' | 'hours'): void {
    this.activeTab = tab;
  }
}