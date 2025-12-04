import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ServiceProfileService,
  BikeServicePublicInfo,
  ServiceActiveStatus,
  OpeningHours,
  ServicePricelist,
  CategoryWithItems
} from './service-profile.service';

@Component({
  selector: 'app-service-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-profile.component.html',
  styleUrls: ['./service-profile.component.css']
})
export class ServiceProfilePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ServiceProfileService);

  // Stan ładowania
  isLoading = true;
  error: string = '';
  
  // Dane serwisu
  serviceId: number | null = null;
  suffix: string = '';
  publicInfo: BikeServicePublicInfo | null = null;
  activeStatus: ServiceActiveStatus | null = null;
  
  // Dane opcjonalne (ładowane warunkowo)
  openingHours: OpeningHours | null = null;
  pricelist: ServicePricelist | null = null;
  availableItems: CategoryWithItems[] = [];
  
  // Aktywna zakładka
  activeTab: 'info' | 'hours' | 'pricelist' = 'info';
  
  // Dni tygodnia w języku polskim
  daysOfWeek = [
    { key: 'MONDAY', label: 'Poniedziałek' },
    { key: 'TUESDAY', label: 'Wtorek' },
    { key: 'WEDNESDAY', label: 'Środa' },
    { key: 'THURSDAY', label: 'Czwartek' },
    { key: 'FRIDAY', label: 'Piątek' },
    { key: 'SATURDAY', label: 'Sobota' },
    { key: 'SUNDAY', label: 'Niedziela' }
  ];

  ngOnInit(): void {
    // Pobierz suffix z URL
    this.suffix = this.route.snapshot.paramMap.get('suffix') || '';
    
    if (!this.suffix) {
      this.error = 'Nieprawidłowy adres URL';
      this.isLoading = false;
      return;
    }
    
    this.loadServiceProfile();
  }

  loadServiceProfile(): void {
    this.isLoading = true;
    this.error = '';

    // Krok 1: Pobierz ID serwisu na podstawie suffixu
    this.profileService.getServiceIdBySuffix(this.suffix).subscribe({
      next: (response) => {
        this.serviceId = response.id;
        this.loadServiceData();
      },
      error: (err) => {
        console.error('Service not found:', err);
        this.error = 'Serwis nie został znaleziony';
        this.isLoading = false;
        // Opcjonalnie przekieruj na stronę główną
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      }
    });
  }

  loadServiceData(): void {
    if (!this.serviceId) return;

    // Krok 2: Pobierz podstawowe dane i status
    Promise.all([
      this.profileService.getPublicInfo(this.serviceId).toPromise(),
      this.profileService.getActiveStatus(this.serviceId).toPromise()
    ])
      .then(([publicInfo, activeStatus]) => {
        this.publicInfo = publicInfo || null;
        this.activeStatus = activeStatus || null;
        
        // Krok 3: Warunkowo załaduj dodatkowe dane
        const promises: Promise<any>[] = [];
        
        if (activeStatus?.openingHoursActive) {
          promises.push(
            this.profileService.getOpeningHours(this.serviceId!).toPromise()
              .then(hours => { this.openingHours = hours || null; })
              .catch(() => { this.openingHours = null; })
          );
        }
        
        if (activeStatus?.pricelistActive) {
          promises.push(
            this.profileService.getPricelist(this.serviceId!).toPromise()
              .then(pricelist => { this.pricelist = pricelist || null; })
              .catch(() => { this.pricelist = null; })
          );
          
          promises.push(
            this.profileService.getAllAvailableItems().toPromise()
              .then(items => { this.availableItems = items || []; })
              .catch(() => { this.availableItems = []; })
          );
        }
        
        return Promise.all(promises);
      })
      .then(() => {
        this.isLoading = false;
      })
      .catch(err => {
        console.error('Error loading service data:', err);
        this.error = 'Nie udało się załadować danych serwisu';
        this.isLoading = false;
      });
  }

  // Metody pomocnicze dla zakładek
  setActiveTab(tab: 'info' | 'hours' | 'pricelist'): void {
    this.activeTab = tab;
  }

  // Pomocnicza metoda do formatowania cennika
  getPricelistByCategories(): Array<{category: string, items: Array<{name: string, price: number}>}> {
    if (!this.pricelist || !this.availableItems) return [];
    
    return this.availableItems
      .map(categoryData => {
        const items = categoryData.items
          .filter(item => this.pricelist!.items[item.id])
          .map(item => ({
            name: item.name,
            price: this.pricelist!.items[item.id]
          }));
        
        return {
          category: categoryData.category.name,
          items: items
        };
      })
      .filter(cat => cat.items.length > 0);
  }

  // Pomocnicze metody dla wyświetlania danych
  getFullAddress(): string {
    if (!this.publicInfo) return '';
    
    const parts = [
      this.publicInfo.street,
      this.publicInfo.building,
      this.publicInfo.flat,
      this.publicInfo.postalCode,
      this.publicInfo.city
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  hasContactInfo(): boolean {
    if (!this.publicInfo) return false;
    return !!(this.publicInfo.email || this.publicInfo.phoneNumber || this.publicInfo.website);
  }

  hasSocialMedia(): boolean {
    if (!this.publicInfo) return false;
    return !!(this.publicInfo.facebook || this.publicInfo.instagram || 
              this.publicInfo.tiktok || this.publicInfo.youtube);
  }

  getDayInterval(dayKey: string) {
    if (!this.openingHours?.intervals) return null;
    return this.openingHours.intervals[dayKey] || null;
  }


  getWebsiteUrl(url: string): string {
    if (!url) return '';
    // Jeśli URL nie ma protokołu, dodaj https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }
}