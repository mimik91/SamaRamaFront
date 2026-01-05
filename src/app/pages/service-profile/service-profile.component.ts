import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { I18nService } from '../../core/i18n.service';  // ✅ Twój serwis
import {
  ServiceProfileService,
  ServiceImageResponse
} from './service-profile.service';
import {
  BikeServicePublicInfo,
  ServiceActiveStatus
} from '../../shared/models/bike-service-common.models';
import { OpeningHoursDto, OpeningHoursWithInfoDto, DAY_NAMES_PL, DayOfWeek, DayInterval } from '../../shared/models/opening-hours.models';
import { ServicePricelistDto, CategoryWithItemsDto } from '../../shared/models/service-pricelist.models';
import {
  ServicePackagesConfigDto,
  ServicePackageDto,
  PackageLevel,
  getPackageLevelDisplayName,
  filterPackagesByBikeType
} from '../../shared/models/service-packages.models';

type TabType = 'info' | 'hours' | 'pricelist' | 'packages';

@Component({
  selector: 'app-service-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],  // Bez TranslateModule
  templateUrl: './service-profile.component.html',
  styleUrls: ['./service-profile.component.css']
})
export class ServiceProfilePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ServiceProfileService);
  private i18n = inject(I18nService);  // ✅ Używamy I18nService

  // Stan ładowania
  isLoading = true;
  error: string = '';
  
  // Dane serwisu
  serviceId: number | null = null;
  suffix: string = '';
  publicInfo: BikeServicePublicInfo | null = null;
  activeStatus: ServiceActiveStatus | null = null;
  
  // Dane opcjonalne (ładowane warunkowo)
  openingHours: OpeningHoursWithInfoDto | null = null;
  pricelist: ServicePricelistDto | null = null;
  availableItems: CategoryWithItemsDto[] = [];
  
  // Pakiety serwisowe
  packagesConfig: ServicePackagesConfigDto | null = null;
  packages: ServicePackageDto[] = [];
  bikeTypes: string[] = [];
  selectedBikeType: string | null = null;
  filteredPackages: ServicePackageDto[] = [];
  
  // Obrazy serwisu
  logoUrl: string = 'assets/images/logo-cyclopick.png';
  aboutUsImageUrl: string = 'assets/images/pictures/vertical/vertical-1.jpg';
  openingHoursImageUrl: string = 'assets/images/pictures/vertical/vertical-2.jpg';
  
  // Aktywna zakładka
  activeTab: TabType = 'info';
  
  // Dni tygodnia
  daysOfWeek: Array<{key: DayOfWeek, label: string}> = [
    { key: 'monday', label: DAY_NAMES_PL.monday },
    { key: 'tuesday', label: DAY_NAMES_PL.tuesday },
    { key: 'wednesday', label: DAY_NAMES_PL.wednesday },
    { key: 'thursday', label: DAY_NAMES_PL.thursday },
    { key: 'friday', label: DAY_NAMES_PL.friday },
    { key: 'saturday', label: DAY_NAMES_PL.saturday },
    { key: 'sunday', label: DAY_NAMES_PL.sunday }
  ];

  // Poziomy pakietów do wyświetlenia
  packageLevels: PackageLevel[] = [
    PackageLevel.BASIC,
    PackageLevel.ADVANCED,
    PackageLevel.FULL
  ];

  ngOnInit(): void {
    // Pobierz suffix z URL
    this.suffix = this.route.snapshot.paramMap.get('suffix') || '';
    
    if (!this.suffix) {
      this.error = this.i18n.instant('service_profile.errors.invalid_url');
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
        this.error = this.i18n.instant('service_profile.errors.service_not_found');
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
      
      console.log('🔍 Active Status:', activeStatus); // DEBUG
      
      // Krok 3: Warunkowo załaduj dodatkowe dane
      const promises: Promise<any>[] = [];
      
      // Załaduj obrazy
      promises.push(this.loadServiceImages());
      
      if (activeStatus?.openingHoursActive) {
        console.log('⏰ Loading opening hours...'); // DEBUG
        promises.push(
          this.profileService.getOpeningHours(this.serviceId!).toPromise()
            .then(hours => { this.openingHours = hours || null; })
            .catch(() => { this.openingHours = null; })
        );
      }
      
      if (activeStatus?.pricelistActive) {
        console.log('📋 Pricelist is active, loading pricelist data...'); // DEBUG
        
        promises.push(
          this.profileService.getPricelist(this.serviceId!).toPromise()
            .then(pricelist => { 
              console.log('✅ Pricelist loaded:', pricelist);
              this.pricelist = pricelist || null; 
            })
            .catch(err => { 
              console.error('❌ Pricelist error:', err);
              this.pricelist = null; 
            })
        );
        
        promises.push(
          this.profileService.getAllAvailableItems().toPromise()
            .then(items => { 
              console.log('✅ Available items loaded:', items);
              this.availableItems = items || []; 
            })
            .catch(err => { 
              console.error('❌ Available items error:', err);
              this.availableItems = []; 
            })
        );

        // ✅ ZAWSZE ładuj pakiety gdy cennik jest aktywny
        // (pakiety są częścią cennika, więc ładujemy je razem)
        console.log('📦 Loading packages data...'); // DEBUG
        promises.push(
          this.loadPackagesData()
            .then(() => console.log('✅ Packages loaded successfully'))
            .catch(err => console.error('❌ Packages loading failed:', err))
        );
      }
      
      return Promise.all(promises);
    })
    .then(() => {
      this.isLoading = false;
      console.log('✅ All data loaded successfully'); // DEBUG
      console.log('📦 Final state:'); // DEBUG
      console.log('  - packagesConfig:', this.packagesConfig);
      console.log('  - packages:', this.packages);
      console.log('  - bikeTypes:', this.bikeTypes);
      console.log('  - selectedBikeType:', this.selectedBikeType);
      console.log('  - filteredPackages:', this.filteredPackages);
    })
    .catch(err => {
      console.error('❌ Error loading service data:', err);
      this.error = this.i18n.instant('service_profile.errors.load_failed');
      this.isLoading = false;
    });
}

  private async loadPackagesData(): Promise<void> {
  console.log('🎯 loadPackagesData() CALLED with serviceId:', this.serviceId);
  
  if (!this.serviceId) {
    console.error('❌ No serviceId in loadPackagesData!');
    return;
  }

  try {
    // ✅ TYLKO JEDEN REQUEST - config już zawiera packages!
    console.log('📦 Fetching packages config (with packages inside)...');
    this.packagesConfig = await this.profileService.getPackagesConfig(this.serviceId).toPromise() || null;
    console.log('📦 Packages Config received:', this.packagesConfig);
    
    // ✅ Wyciągnij packages z config
    if (this.packagesConfig && this.packagesConfig.packages) {
      this.packages = this.packagesConfig.packages;
      console.log('📦 Extracted packages from config:', this.packages);
    } else {
      this.packages = [];
      console.warn('⚠️ No packages in config!');
    }
    
    // Pobierz typy rowerów
    console.log('📦 Fetching bike types...');
    this.bikeTypes = await this.profileService.getBikeTypes(this.serviceId).toPromise() || [];
    console.log('📦 Bike Types received:', this.bikeTypes);
    
    // Ustaw domyślny typ roweru
    if (this.packagesConfig?.defaultBikeType && this.bikeTypes.includes(this.packagesConfig.defaultBikeType)) {
      this.selectedBikeType = this.packagesConfig.defaultBikeType;
      console.log('📦 Selected default bike type:', this.selectedBikeType);
    } else if (this.bikeTypes.length > 0) {
      this.selectedBikeType = this.bikeTypes[0];
      console.log('📦 Selected first bike type:', this.selectedBikeType);
    } else {
      console.warn('⚠️ No bike types available!');
    }
    
    // Filtruj pakiety według wybranego typu
    this.updateFilteredPackages();
    console.log('📦 Filtered packages:', this.filteredPackages);
    console.log('📦 Selected bike type:', this.selectedBikeType);
    
    console.log('✅ loadPackagesData() COMPLETED');
  } catch (err) {
    console.error('❌ Error in loadPackagesData():', err);
    console.error('❌ Error details:', err);
    this.packagesConfig = null;
    this.packages = [];
  }
}

  private async loadServiceImages(): Promise<void> {
    if (!this.serviceId) return;

    // Załaduj LOGO
    try {
      const logoResponse = await this.profileService.getServiceImage(this.serviceId, 'LOGO').toPromise();
      if (logoResponse?.url) {
        this.logoUrl = logoResponse.url;
      }
    } catch (err) {
      console.log('No custom logo, using default');
    }

    // Załaduj ABOUT_US
    try {
      const aboutUsResponse = await this.profileService.getServiceImage(this.serviceId, 'ABOUT_US').toPromise();
      if (aboutUsResponse?.url) {
        this.aboutUsImageUrl = aboutUsResponse.url;
      }
    } catch (err) {
      console.log('No ABOUT_US image, using default');
    }

    // Załaduj OPENING_HOURS
    try {
      const openingHoursResponse = await this.profileService.getServiceImage(this.serviceId, 'OPENING_HOURS').toPromise();
      if (openingHoursResponse?.url) {
        this.openingHoursImageUrl = openingHoursResponse.url;
      }
    } catch (err) {
      console.log('No OPENING_HOURS image, using default');
    }
  }

  // Metody pomocnicze dla zakładek
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  // Metoda do zmiany typu roweru w pakietach
  onBikeTypeChange(bikeType: string): void {
    this.selectedBikeType = bikeType;
    this.updateFilteredPackages();
  }

  private updateFilteredPackages(): void {
    this.filteredPackages = filterPackagesByBikeType(this.packages, this.selectedBikeType);
  }

  // Pobiera pakiet dla danego poziomu
  getPackageForLevel(level: PackageLevel): ServicePackageDto | null {
    return this.filteredPackages.find(p => p.packageLevel === level) || null;
  }

  // Zwraca nazwę wyświetlaną pakietu
  getPackageDisplayName(pkg: ServicePackageDto): string {
    return pkg.customName || pkg.packageLevelDisplayName;
  }

  // Pomocnicza metoda do formatowania cennika
  getPricelistByCategories(): Array<{category: string, items: Array<{name: string, price: number}>}> {
    if (!this.pricelist || !this.availableItems) return [];
    
    return this.availableItems
      .map(categoryData => {
        const items = categoryData.items
          .filter((item: any) => this.pricelist!.items[item.id])
          .map((item: any) => ({
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
              this.publicInfo.tiktok || this.publicInfo.youtube || this.publicInfo.website);
  }

  getDayInterval(dayKey: DayOfWeek): DayInterval | null {
    if (!this.openingHours) return null;
    
    // Sprawdź czy są intervals (format z intervals object)
    if (this.openingHours.intervals) {
      const upperKey = dayKey.toUpperCase();
      if (this.openingHours.intervals[upperKey]) {
        return this.openingHours.intervals[upperKey];
      }
    }
    
    // Sprawdź czy są bezpośrednie pola (format: monday, tuesday, etc.)
    const dayHours = this.openingHours[dayKey];
    if (dayHours && !dayHours.closed && dayHours.open && dayHours.close) {
      return {
        openTime: dayHours.open,
        closeTime: dayHours.close
      };
    }
    
    return null;
  }

  getWebsiteUrl(url: string): string {
    if (!url) return '';
    // Jeśli URL nie ma protokołu, dodaj https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }

  // Metoda pomocnicza do tłumaczeń (dla template)
  t(key: string): string {
    return this.i18n.instant(key);
  }
}